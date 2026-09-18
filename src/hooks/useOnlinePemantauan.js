// src/hooks/useOnlinePemantauan.js
import { useState, useEffect } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Sessions Pemantauan actuellement en ligne (position live sur la carte).
 */
export function useOnlinePemantauan() {
  const [onlinePemantauan, setOnlinePemantauan] = useState([]);
  const [loadingPemantauan, setLoadingPemantauan] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchOnlinePemantauan = async () => {
    if (!hasLoadedOnce) setLoadingPemantauan(true);

    const { data, error } = await supabaseSandbox
      .from('pemantauan_trackers')
      .select('id, member_name, latitude, longitude, tracking_status, last_updated')
      .eq('tracking_status', 'Online')
      .not('latitude', 'is', null);

    if (!error) setOnlinePemantauan(data || []);
    else console.error(error);

    setLoadingPemantauan(false);
    setHasLoadedOnce(true);
  };

  useEffect(() => {
    fetchOnlinePemantauan();
    const subscription = supabaseSandbox
      .channel(`pemantauan_trackers_changes_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'pemantauan_trackers' }, () => {
        fetchOnlinePemantauan();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { onlinePemantauan, loadingPemantauan };
}