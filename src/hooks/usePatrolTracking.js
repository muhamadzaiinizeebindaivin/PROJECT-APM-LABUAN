// src/hooks/usePatrolTracking.js
import { useState, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { haversineDistanceKm } from '../utils/geo';

// Sur web (notamment Safari iOS), on contourne expo-location et on utilise
// directement l'API native du navigateur — plus fiable, évite les bugs du
// shim web d'expo-location qui peut ne jamais déclencher le callback.
const requestPermissionCompat = async () => {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return { status: 'unavailable' };
    }
    // navigator.geolocation n'a pas d'API de permission séparée fiable sur Safari —
    // on considère "granted" ici ; un refus réel remonte via l'erreur de watchPosition.
    return { status: 'granted' };
  }
  return Location.requestForegroundPermissionsAsync();
};

const watchPositionCompat = (callback, onError) => {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onError?.(new Error('Geolocation tidak disokong pada pelayar ini.'));
      return Promise.resolve(null);
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => callback({ coords: pos.coords }),
      (err) => onError?.(err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
    return Promise.resolve({ remove: () => navigator.geolocation.clearWatch(watchId) });
  }
  return Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 2 },
    callback
  );
};

/**
 * Drives GPS tracking for the currently-selected vehicle: watches
 * position, persists the running job (start time / accumulated
 * distance) directly on `logistik` (job_started_at / job_distance_km),
 * lets the driver mark intermediate waypoints via `markPoint` (segment
 * distance/duration computed between consecutive points), and records a
 * `vehicle_patrol_history` row + resets tracking fields when tracking
 * stops. Waypoints marked during the trip are linked to that history
 * row once it's created.
 *
 * `onPermissionDenied` is called if location permission isn't granted,
 * so the caller can flip `isTracking` back off (mirrors the original
 * `setIsTracking(false)` call).
 */
export function usePatrolTracking(selectedVehicle, isTracking, onPermissionDenied, onKicked) {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('Idle');

  const jobStartTimeRef = useRef(null);
  const lastCoordsRef = useRef(null);
  const distanceAccumRef = useRef(0);
  const wasTrackingRef = useRef(false); // pour ne réagir qu'à un vrai arrêt, pas à une simple sélection

  // --- Waypoints ("Tanda Point") ---
  const segmentDistanceRef = useRef(0);
  const lastWaypointTimeRef = useRef(null);
  const waypointSeqRef = useRef(0);

  // Bug connu du portage web d'expo-location : subscription.remove() y appelle
  // une fonction interne inexistante (LocationEventEmitter.removeSubscription).
  // On avale l'erreur silencieusement — inoffensive, ça ne concerne que le nettoyage.
  const safeRemoveSubscription = (subscription) => {
    try {
      subscription?.remove?.();
    } catch (err) {
      // Bug connu du portage web d'expo-location — ignoré volontairement, sans log.
    }
  };

  useEffect(() => {
    let subscriptionPromise = null;
    let isMounted = true;

    const startWatching = async () => {
      if (!selectedVehicle) return;

      let permStatus;
      try {
        const result = await requestPermissionCompat();
        permStatus = result.status;
      } catch (permErr) {
        console.error('requestForegroundPermissionsAsync error:', permErr);
        if (isMounted) setStatus('Ralat Kebenaran: ' + (permErr?.message || String(permErr)));
        return;
      }
      if (permStatus !== 'granted') {
        if (isMounted) {
          setStatus(`Akses lokasi ditolak (status: ${permStatus}).`);
          Alert.alert('Akses Ditolak', 'Sila benarkan akses lokasi untuk menjejak kenderaan.');
          if (onPermissionDenied) onPermissionDenied();
        }
        return;
      }

      const STALE_JOB_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 jam

      // Récupère l'état persisté (survit à un rechargement de page)
      const { data: existingVehicle } = await supabaseSandbox
        .from('logistik')
        .select('job_started_at, job_distance_km, last_updated, reg, model')
        .eq('id', selectedVehicle.id)
        .maybeSingle();

      const existingJobAgeMs = existingVehicle?.job_started_at
        ? Date.now() - new Date(existingVehicle.job_started_at).getTime()
        : null;
      const existingJobIsStale = existingJobAgeMs !== null && existingJobAgeMs > STALE_JOB_THRESHOLD_MS;

      console.log('DEBUG STALE CHECK:', {
        job_started_at: existingVehicle?.job_started_at,
        clientNow: new Date().toISOString(),
        existingJobAgeMs,
        existingJobAgeHours: existingJobAgeMs ? (existingJobAgeMs / 3600000).toFixed(2) : null,
        STALE_JOB_THRESHOLD_MS,
        existingJobIsStale,
      });

      if (existingVehicle?.job_started_at && !existingJobIsStale) {
        // Reprise légitime (ex: rechargement de page pendant la même session)
        jobStartTimeRef.current = new Date(existingVehicle.job_started_at).getTime();
        distanceAccumRef.current = existingVehicle.job_distance_km || 0;
      } else {
        // Nouvelle session propre — soit rien n'existait, soit l'ancienne
        // session est trop vieille (jamais terminée proprement par un
        // précédent chauffeur) et ne doit pas être héritée.
        if (existingJobIsStale) {
          console.warn(`Job en cours pour ce véhicule ignoré (démarré il y a plus de 12h, jamais terminé) : ${existingVehicle.job_started_at}`);

          // Ferme proprement l'ancienne session abandonnée : crée une ligne
          // "abandoned" dans l'historique pour que ses points intermédiaires
          // (déjà en base, orphelins) puissent y être rattachés au lieu de
          // rester invisibles pour toujours.
          const staleStartedAt = new Date(existingVehicle.job_started_at);
          const staleEndedAt = existingVehicle.last_updated
            ? new Date(existingVehicle.last_updated)
            : staleStartedAt;
          const staleDurationSeconds = Math.max(
            0,
            Math.round((staleEndedAt.getTime() - staleStartedAt.getTime()) / 1000)
          );

          const { data: abandonedHistory } = await supabaseSandbox
            .from('vehicle_patrol_history')
            .insert([{
              vehicle_id: selectedVehicle.id,
              vehicle_reg: existingVehicle.reg || selectedVehicle.reg || 'TIADA PLAT',
              vehicle_model: existingVehicle.model || selectedVehicle.model,
              started_at: staleStartedAt.toISOString(),
              ended_at: staleEndedAt.toISOString(),
              duration_seconds: staleDurationSeconds,
              distance_km: Number((existingVehicle.job_distance_km || 0).toFixed(2)),
              status: 'abandoned',
            }])
            .select()
            .single();

          if (abandonedHistory?.id) {
            await supabaseSandbox
              .from('vehicle_patrol_waypoints')
              .update({ patrol_history_id: abandonedHistory.id })
              .eq('vehicle_id', selectedVehicle.id)
              .eq('job_started_at', staleStartedAt.toISOString());
          }
        }
        jobStartTimeRef.current = Date.now();
        distanceAccumRef.current = 0;
      }
      lastCoordsRef.current = null;
      segmentDistanceRef.current = 0;
      lastWaypointTimeRef.current = jobStartTimeRef.current;
      waypointSeqRef.current = 0;

      await supabaseSandbox
        .from('logistik')
        .update({
          tracking_status: 'Patrol',
          job_started_at: new Date(jobStartTimeRef.current).toISOString(),
          job_distance_km: distanceAccumRef.current,
        })
        .eq('id', selectedVehicle.id);

      try {
        subscriptionPromise = watchPositionCompat(
          async (loc) => {
            if (!isMounted) return;

            setLocation(loc.coords);
            setStatus('Mengemaskini Pangkalan Data...');

            if (lastCoordsRef.current) {
              const delta = haversineDistanceKm(
                lastCoordsRef.current.latitude, lastCoordsRef.current.longitude,
                loc.coords.latitude, loc.coords.longitude
              );
              distanceAccumRef.current += delta;
              segmentDistanceRef.current += delta;
            }
            lastCoordsRef.current = loc.coords;

            const { error } = await supabaseSandbox
              .from('logistik')
              .update({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                last_updated: new Date().toISOString(),
                job_distance_km: Number(distanceAccumRef.current.toFixed(3)),
              })
              .eq('id', selectedVehicle.id);

            if (error) {
              console.error("Supabase update error:", error);
              if (isMounted) setStatus(`Ralat: ${error.message || 'Gagal kemaskini DB'}`);
            } else if (isMounted) {
              setStatus(`Terakhir dihantar: ${new Date().toLocaleTimeString()}`);
            }
          },
          (geoErr) => {
            console.error('Geolocation error:', geoErr);
            if (isMounted) {
              const code = geoErr?.code;
              const msg = code === 1 ? 'Akses lokasi ditolak oleh pelayar.'
                : code === 2 ? 'Lokasi tidak dapat dikesan (isyarat lemah).'
                : code === 3 ? 'Tamat masa menunggu isyarat GPS.'
                : (geoErr?.message || 'Ralat lokasi tidak diketahui.');
              setStatus('Ralat GPS: ' + msg);
            }
          }
        );
      } catch (watchErr) {
        console.error('watchPositionAsync error:', watchErr);
        if (isMounted) setStatus('Ralat GPS: ' + (watchErr?.message || String(watchErr)));
      }
    };

    const recordHistoryAndStop = async () => {
      if (!selectedVehicle) return;

      const { data: existingVehicle } = await supabaseSandbox
        .from('logistik')
        .select('job_started_at, job_distance_km')
        .eq('id', selectedVehicle.id)
        .maybeSingle();

      if (existingVehicle?.job_started_at) {
        const startedAt = new Date(existingVehicle.job_started_at);
        const endedAt = new Date();
        const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);

        const { data: insertedHistory } = await supabaseSandbox.from('vehicle_patrol_history').insert([{
          vehicle_id: selectedVehicle.id,
          vehicle_reg: selectedVehicle.reg || 'TIADA PLAT',
          vehicle_model: selectedVehicle.model,
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          duration_seconds: durationSeconds,
          distance_km: Number((existingVehicle.job_distance_km || 0).toFixed(2)),
        }]).select().single();

        // Rattache les points marqués pendant ce trajet à la patrouille définitive.
        // On filtre par égalité stricte sur job_started_at (l'identifiant exact de
        // cette session), pas par une comparaison de dates : ça évite qu'une
        // ancienne session jamais proprement terminée pour ce même véhicule ne
        // contamine par erreur les points de la nouvelle patrouille.
        if (insertedHistory?.id) {
          await supabaseSandbox
            .from('vehicle_patrol_waypoints')
            .update({ patrol_history_id: insertedHistory.id })
            .eq('vehicle_id', selectedVehicle.id)
            .eq('job_started_at', startedAt.toISOString());
        }
      }

      jobStartTimeRef.current = null;
      lastCoordsRef.current = null;
      distanceAccumRef.current = 0;
      segmentDistanceRef.current = 0;
      lastWaypointTimeRef.current = null;
      waypointSeqRef.current = 0;
      // Empêche une position périmée de fuiter dans une future session —
      // sans ce reset, un redémarrage rapide (MULA SYIF) pouvait envoyer
      // l'ancienne position au lieu d'attendre une vraie nouvelle localisation.
      if (isMounted) setLocation(null);

      await supabaseSandbox
        .from('logistik')
        .update({ tracking_status: 'Idle', job_started_at: null, job_distance_km: 0, latitude: null, longitude: null })
        .eq('id', selectedVehicle.id);
    };

    if (isTracking) {
      setStatus('Mendapatkan isyarat GPS...');
      startWatching();
    } else if (selectedVehicle && wasTrackingRef.current) {
      setStatus('Sedia');
      recordHistoryAndStop().catch((err) => console.error(err));
    }
    wasTrackingRef.current = isTracking;

    return () => {
      isMounted = false;
      subscriptionPromise?.then(safeRemoveSubscription).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking, selectedVehicle]);

  /**
   * Marks an intermediate waypoint ("Tanda Point"). Records the segment
   * distance/duration since the previous waypoint (or since the trip
   * started, if this is the first one), then resets the segment counters.
   */
  // Détecte en temps réel si un admin remet ce véhicule en "Idle" depuis la carte —
  // arrête immédiatement le suivi local sans attendre un rechargement de page.
  useEffect(() => {
    if (!isTracking || !selectedVehicle) return;
    const channel = supabaseSandbox
      .channel(`vehicle_self_${selectedVehicle.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'sandbox', table: 'logistik', filter: `id=eq.${selectedVehicle.id}` }, (payload) => {
        if (payload.new?.tracking_status !== 'Patrol') {
          onKicked?.();
        }
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(channel); };
  }, [isTracking, selectedVehicle]);

  const markPoint = async () => {
    if (!selectedVehicle || !isTracking) return;
    if (!lastCoordsRef.current) {
      Alert.alert('Tunggu Sebentar', 'Isyarat GPS belum sedia lagi.');
      return;
    }

    const now = Date.now();
    const durationSeconds = Math.round((now - (lastWaypointTimeRef.current || now)) / 1000);
    waypointSeqRef.current += 1;

    const { error } = await supabaseSandbox.from('vehicle_patrol_waypoints').insert([{
      vehicle_id: selectedVehicle.id,
      job_started_at: new Date(jobStartTimeRef.current).toISOString(),
      sequence: waypointSeqRef.current,
      latitude: lastCoordsRef.current.latitude,
      longitude: lastCoordsRef.current.longitude,
      marked_at: new Date(now).toISOString(),
      distance_from_previous_km: Number(segmentDistanceRef.current.toFixed(3)),
      duration_from_previous_seconds: durationSeconds,
    }]);

    if (error) {
      console.error('Gagal menanda titik:', error);
      Alert.alert('Ralat', 'Gagal menanda titik. Sila cuba lagi.');
      return;
    }

    segmentDistanceRef.current = 0;
    lastWaypointTimeRef.current = now;

    if (Platform.OS === 'web') {
      window.alert('Titik berjaya ditanda!');
    } else {
      Alert.alert('Berjaya', 'Titik berjaya ditanda!');
    }
  };

  return { location, status, markPoint };
}