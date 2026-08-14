// src/hooks/useAvailableVehicles.js
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

const STALE_JOB_THRESHOLD_MS = 12 * 60 * 60 * 1000; // même seuil que usePatrolTracking.js

/**
 * Fetches land ("Darat") vehicles that are in good condition ("Baik") for
 * the driver's vehicle-selection screen, kept in sync via realtime so the
 * list reflects other drivers starting/stopping a patrol on the same
 * vehicle. Each vehicle also carries a computed `isBusy` flag (true when
 * it's genuinely in an active — not stale — patrol right now).
 */
export function useAvailableVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabaseSandbox
          .from('logistik')
          .select('id, category, model, reg, type, color, icon_key, tracking_status, job_started_at, status')
          .order('model', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          if (isMounted) setVehicles(data);
        } else {
          throw new Error("Tiada kenderaan dijumpai.");
        }
      } catch (error) {
        console.error("Gagal mengambil data kenderaan:", error.message);
        if (isMounted) {
          Alert.alert(
            'Ralat Pangkalan Data',
            'Gagal memuat turun senarai kenderaan. Sila hubungi admin atau semak sambungan internet.'
          );
          setVehicles([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVehicles();

    const subscription = supabaseSandbox
      .channel('available_vehicles_channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'sandbox', table: 'logistik' }, (payload) => {
        const updated = payload.new;
        if (isMounted) {
          setVehicles(current => current.map(v => v.id === updated.id ? { ...v, ...updated } : v));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabaseSandbox.removeChannel(subscription);
    };
  }, []);

  const vehiclesWithBusyFlag = vehicles.map(v => {
    const jobAgeMs = v.job_started_at ? Date.now() - new Date(v.job_started_at).getTime() : null;
    const jobIsStale = jobAgeMs !== null && jobAgeMs > STALE_JOB_THRESHOLD_MS;
    const isBusy = v.tracking_status === 'Patrol' && !jobIsStale;
    return { ...v, isBusy };
  });

  return { vehicles: vehiclesWithBusyFlag, loading };
}