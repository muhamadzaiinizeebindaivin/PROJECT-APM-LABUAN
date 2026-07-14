// src/hooks/useCalamityPoints.js
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useCalamityPoints() {
  const [calamityPoints, setCalamityPoints] = useState([]);

  const fetchCalamityPoints = useCallback(async () => {
    const { data, error } = await supabaseSandbox
      .from('laporan_ng999')
      .select('id, category, description, latitude, longitude, status, created_at, tarikh, jumlah_kes, kategori_kes')
      .eq('status', 'active')
      .not('latitude', 'is', null);
    if (data) setCalamityPoints(data);
    if (error) console.error('fetchCalamityPoints error:', error);
  }, []);

  useEffect(() => {
    fetchCalamityPoints();
    const sub = supabaseSandbox
      .channel('operasi_calamity_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'laporan_ng999' }, fetchCalamityPoints)
      .subscribe();
    return () => supabaseSandbox.removeChannel(sub);
  }, [fetchCalamityPoints]);

  const saveCalamity = async ({ category, description, latitude, longitude }) => {
    if (!category) return { error: true };
    const { error } = await supabaseSandbox.from('laporan_ng999').insert([{
      category,
      kategori_kes: category,
      description: description?.trim() || null,
      latitude,
      longitude,
      tarikh: new Date().toISOString().split('T')[0],
      jumlah_kes: 1,
    }]);
    if (!error) fetchCalamityPoints();
    return { error: !!error };
  };

  const deleteCalamity = async (id) => {
    const confirmed = Platform.OS === 'web' ? window.confirm('Padam titik bencana ini?') : true;
    if (!confirmed) return;
    const { error } = await supabaseSandbox.from('laporan_ng999').delete().eq('id', id);
    if (!error) fetchCalamityPoints();
  };

  const resolveCalamity = async (id, status) => {
    const { error } = await supabaseSandbox.from('laporan_ng999').update({ status }).eq('id', id);
    if (!error) fetchCalamityPoints();
  };

  return { calamityPoints, saveCalamity, deleteCalamity, resolveCalamity };
}
