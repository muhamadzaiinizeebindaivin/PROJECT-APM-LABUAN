// src/hooks/usePatrolTracking.js
import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { haversineDistanceKm } from '../utils/geo';

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
export function usePatrolTracking(selectedVehicle, isTracking, onPermissionDenied) {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('Idle');

  const jobStartTimeRef = useRef(null);
  const lastCoordsRef = useRef(null);
  const distanceAccumRef = useRef(0);

  // --- Waypoints ("Tanda Point") ---
  const segmentDistanceRef = useRef(0);
  const lastWaypointTimeRef = useRef(null);
  const waypointSeqRef = useRef(0);

  useEffect(() => {
    let subscriptionPromise = null;
    let isMounted = true;

    const startWatching = async () => {
      if (!selectedVehicle) return;

      let { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        if (isMounted) {
          Alert.alert('Akses Ditolak', 'Sila benarkan akses lokasi untuk menjejak kenderaan.');
          if (onPermissionDenied) onPermissionDenied();
        }
        return;
      }

      // Récupère l'état persisté (survit à un rechargement de page)
      const { data: existingVehicle } = await supabaseSandbox
        .from('logistik')
        .select('job_started_at, job_distance_km')
        .eq('id', selectedVehicle.id)
        .maybeSingle();

      if (existingVehicle?.job_started_at) {
        jobStartTimeRef.current = new Date(existingVehicle.job_started_at).getTime();
        distanceAccumRef.current = existingVehicle.job_distance_km || 0;
      } else {
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

      subscriptionPromise = Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 2 },
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
        }
      );
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

        // Rattache les points marqués pendant ce trajet à la patrouille définitive
        if (insertedHistory?.id) {
          await supabaseSandbox
            .from('vehicle_patrol_waypoints')
            .update({ patrol_history_id: insertedHistory.id })
            .eq('vehicle_id', selectedVehicle.id)
            .is('patrol_history_id', null)
            .gte('marked_at', startedAt.toISOString());
        }
      }

      jobStartTimeRef.current = null;
      lastCoordsRef.current = null;
      distanceAccumRef.current = 0;
      segmentDistanceRef.current = 0;
      lastWaypointTimeRef.current = null;
      waypointSeqRef.current = 0;

      await supabaseSandbox
        .from('logistik')
        .update({ tracking_status: 'Idle', job_started_at: null, job_distance_km: 0 })
        .eq('id', selectedVehicle.id);
    };

    if (isTracking) {
      setStatus('Mendapatkan isyarat GPS...');
      startWatching();
    } else if (selectedVehicle) {
      setStatus('Sedia');
      recordHistoryAndStop().catch((err) => console.error(err));
    }

    return () => {
      isMounted = false;
      if (subscriptionPromise) {
        subscriptionPromise.then(subscription => {
          if (subscription) subscription.remove();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking, selectedVehicle]);

  /**
   * Marks an intermediate waypoint ("Tanda Point"). Records the segment
   * distance/duration since the previous waypoint (or since the trip
   * started, if this is the first one), then resets the segment counters.
   */
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
  };

  return { location, status, markPoint };
}