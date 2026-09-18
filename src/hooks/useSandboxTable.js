// src/hooks/useSandboxTable.js
import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Fetches rows from a `sandbox` schema table and keeps them in sync via
 * a realtime channel. This is the pattern that was previously duplicated
 * for `calamity_points` (fetchCalamityPoints) and `vehicle_patrol_history`
 * (fetchPatrolHistory) in OperasiScreen.js.
 *
 * `columns` (defaults to '*'), `filters` (array of
 * { method: 'gte'|'lt'|'eq'..., column, value }, applied in order), and
 * `enabled` (skip fetching entirely until true — used for folder-style
 * views where nothing should load until the user opens a folder).
 */
export function useSandboxTable({ table, channelName, orderBy, ascending = true, limit, columns = '*', filters = [], enabled = true }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const filtersKey = JSON.stringify(filters);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabaseSandbox.from(table).select(columns);
    filters.forEach(f => { query = query[f.method](f.column, f.value); });
    if (orderBy) query = query.order(orderBy, { ascending });
    if (limit) query = query.limit(limit);
    const { data: rows, error } = await query;
    if (!error) setData(rows || []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, orderBy, ascending, limit, columns, filtersKey, enabled]);

  useEffect(() => {
    let isMounted = true;
    fetchData();

    const subscription = supabaseSandbox
      .channel(`${channelName}_${Math.random().toString(36).slice(2)}`)
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