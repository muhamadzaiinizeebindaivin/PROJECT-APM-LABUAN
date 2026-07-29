// src/hooks/useCalamityPoints.js
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useCalamityPoints() {
  const [calamityPoints, setCalamityPoints] = useState([]);

  const fetchCalamityPoints = useCallback(async () => {
    const { data, error } = await supabaseSandbox
      .from('laporan_ng999')
      .select('id, category, description, latitude, longitude, status, created_at, tarikh, jumlah_kes')
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
    const now = new Date();
    const { error } = await supabaseSandbox.from('laporan_ng999').insert([{
      category,
      description: description?.trim() || null,
      latitude,
      longitude,
      tarikh: now.toISOString().split('T')[0],
      jumlah_kes: 1,
    }]);
    if (!error) {
      fetchCalamityPoints();
      // Incrémente aussi la grille historique (mois/catégorie courants), pour qu'elle reste
      // la source unique de vérité utilisée par le tableau récapitulatif — toujours modifiable.
      const { error: incError } = await supabaseSandbox.rpc('increment_ng999_historique', {
        p_tahun: now.getFullYear(),
        p_bulan: now.getMonth() + 1,
        p_category: category,
      });
      if (incError) console.error('increment_ng999_historique error:', incError);
    }
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
