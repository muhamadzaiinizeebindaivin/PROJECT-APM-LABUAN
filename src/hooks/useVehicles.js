// src/hooks/useVehicles.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Fetches "Darat" category vehicles and keeps them in sync via realtime
 * UPDATE events. `onUpdate` is called with the raw updated row on every
 * realtime event (OperasiScreen uses this to also push the change into
 * the Leaflet iframe via postMessage).
 */
export function useVehicles(onUpdate) {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchVehicles = async () => {
      const { data } = await supabase
        .from('logistik')
        .select('*')
        .eq('category', 'Darat');

      if (data && isMounted) {
        setVehicles(data);
      }
    };

    fetchVehicles();

    const subscription = supabase
      .channel('vehicles_channel_web')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'logistik' }, (payload) => {
        const updatedVehicle = payload.new;

        if (isMounted) {
          setVehicles(current => current.map(v => v.id === updatedVehicle.id ? { ...v, ...updatedVehicle } : v));
        }

        if (onUpdate) onUpdate(updatedVehicle);
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(subscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return vehicles;
}
