// src/hooks/useAgencyTrackingHistory.js
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Historique des patrouilles d'agences (Sejarah Patrol Agensi).
 */
export function useAgencyTrackingHistory() {
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchTrackingHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabaseSandbox
      .from('agency_tracking_history')
      .select('*, jpbd_directory(agency)')
      .order('ended_at', { ascending: false });
    if (!error) setTrackingHistory(data || []);
    else console.error(error);
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchTrackingHistory();
    const subscription = supabaseSandbox
      .channel('agency_tracking_history_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'agency_tracking_history' }, () => {
        fetchTrackingHistory();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteTrackingHistory = async (id, opts = {}) => {
    const confirmed = opts.skipConfirm
      ? true
      : (Platform.OS === 'web' ? window.confirm('Padam rekod patrol agensi ini?') : true);
    if (!confirmed) return { cancelled: true };
    const { error } = await supabaseSandbox.from('agency_tracking_history').delete().eq('id', id);
    if (!error) fetchTrackingHistory();
    return { error: !!error };
  };

  return { trackingHistory, loadingHistory, deleteTrackingHistory };
}