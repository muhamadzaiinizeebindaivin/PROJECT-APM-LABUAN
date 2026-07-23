import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const TABLES = [
  { table: 'pertolongan_cemas' },
  { table: 'pertolongan_cemas_photos' },
  { table: 'laporan_ng999' },
  { table: 'ng999_photos' },
  { table: 'ng999_historique' },
  { table: 'unit_staff', filterCol: 'page', filterVal: 'operasi' },
  { table: 'kpi', filterCol: 'section', filterVal: 'operasi' },
];

export function useOperasiMeta() {
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
    console.log('[OperasiMeta] fetch results:', results);
    setDikemaskiniRaw(results.filter(Boolean).sort().slice(-1)[0] || null);
  }, []);

  useEffect(() => {
    fetchMeta();

    const channel = supabaseSandbox.channel('operasi_meta_changes');
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
    channel.subscribe((status) => {
      console.log('[OperasiMeta] channel status:', status);
    });

    return () => { supabaseSandbox.removeChannel(channel); };
  }, [fetchMeta]);

  return { dikemaskiniRaw };
}