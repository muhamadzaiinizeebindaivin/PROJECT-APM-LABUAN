// src/hooks/useSandboxTable.js
import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Fetches rows from a `sandbox` schema table and keeps them in sync via
 * a realtime channel. This is the pattern that was previously duplicated
 * for `calamity_points` (fetchCalamityPoints) and `vehicle_patrol_history`
 * (fetchPatrolHistory) in OperasiScreen.js.
 */
export function useSandboxTable({ table, channelName, orderBy, ascending = true, limit }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabaseSandbox.from(table).select('*');
    if (orderBy) query = query.order(orderBy, { ascending });
    if (limit) query = query.limit(limit);
    const { data: rows, error } = await query;
    if (!error) setData(rows || []);
    setLoading(false);
  }, [table, orderBy, ascending, limit]);

  useEffect(() => {
    let isMounted = true;
    fetchData();

    const subscription = supabaseSandbox
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table }, () => {
        if (isMounted) fetchData();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabaseSandbox.removeChannel(subscription);
    };
  }, [fetchData, channelName, table]);

  return { data, loading, refetch: fetchData };
}
