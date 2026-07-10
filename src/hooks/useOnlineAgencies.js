// src/hooks/useOnlineAgencies.js
import { useState, useEffect } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Agences actuellement en ligne (position live sur la carte Peta).
 */
export function useOnlineAgencies() {
  const [onlineAgencies, setOnlineAgencies] = useState([]);
  const [loadingPeta, setLoadingPeta] = useState(true);
  const [hasLoadedPetaOnce, setHasLoadedPetaOnce] = useState(false);

  const fetchOnlineAgencies = async () => {
    if (!hasLoadedPetaOnce) setLoadingPeta(true);

    const { data, error } = await supabaseSandbox
      .from('agency_trackers')
      .select('id, member_name, latitude, longitude, tracking_status, last_updated, jpbd_directory(agency)')
      .eq('tracking_status', 'Online')
      .not('latitude', 'is', null);

    if (!error) setOnlineAgencies(data || []);
    else console.error(error);

    setLoadingPeta(false);
    setHasLoadedPetaOnce(true);
  };

  useEffect(() => {
    fetchOnlineAgencies();
    const subscription = supabaseSandbox
      .channel('agency_trackers_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'agency_trackers' }, () => {
        fetchOnlineAgencies();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { onlineAgencies, loadingPeta };
}