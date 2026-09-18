import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const TABLES = [
  { table: 'jpbd_directory' },
  { table: 'hotspots' },
  { table: 'hotspot_categories' },
  { table: 'pps_list' },
  { table: 'pps_categories' },
  { table: 'unit_staff', filterCol: 'page', filterVal: 'sekretariat' },
  { table: 'kpi', filterCol: 'section', filterVal: 'sekretariat' },
];

export function useSekretariatMeta() {
  const [dikemaskiniRaw, setDikemaskiniRaw] = useState(null);

  const fetchMeta = useCallback(async () => {
    const results = await Promise.all(
      TABLES.map(async ({ table, filterCol, filterVal }) => {
        let query = supabaseSandbox.from(table).select('updated_at').order('updated_at', { ascending: false }).limit(1);
        if (filterCol) query = query.eq(filterCol, filterVal);
        const { data } = await query;
        return data?.[0]?.updated_at || null;
      })
    );
    setDikemaskiniRaw(results.filter(Boolean).sort().slice(-1)[0] || null);
  }, []);

  useEffect(() => {
    fetchMeta();

    // S'abonne aux changements de chaque table pour rafraîchir automatiquement
    const channel = supabaseSandbox.channel(`sekretariat_meta_changes_${Math.random().toString(36).slice(2)}`);
    TABLES.forEach(({ table, filterCol, filterVal }) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'sandbox',
          table,
          ...(filterCol ? { filter: `${filterCol}=eq.${filterVal}` } : {}),
        },
        () => fetchMeta()
      );
    });
    channel.subscribe();

    return () => { supabaseSandbox.removeChannel(channel); };
  }, [fetchMeta]);

  return { dikemaskiniRaw };
}