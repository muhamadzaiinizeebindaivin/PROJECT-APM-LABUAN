// src/hooks/useCalamityPoints.js
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useCalamityPoints() {
  const [calamityPoints, setCalamityPoints] = useState([]);

  const fetchCalamityPoints = useCallback(async () => {
    const { data, error } = await supabaseSandbox
      .from('laporan_ng999')
      .select('id, category, description, latitude, longitude, status, created_at, tarikh')
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

  // Crée un point sur la carte (actif). N'incrémente plus ng999_historique ici — le compteur
  // ne bouge qu'à la clôture (resolveCalamity / resolveTreatedCalamity), pas au pinpoint.
  const saveCalamity = async ({ category, description, latitude, longitude }) => {
    if (!category) return { error: true };
    const now = new Date();
    const { error } = await supabaseSandbox.from('laporan_ng999').insert([{
      category,
      description: description?.trim() || null,
      latitude,
      longitude,
      tarikh: now.toISOString().split('T')[0],
    }]);
    if (!error) fetchCalamityPoints();
    return { error: !!error };
  };

  // Clôture un point existant (créé via saveCalamity) avec un statut final.
  // C'est ICI que ng999_historique s'incrémente de +1 — un cas ne compte
  // dans les statistiques qu'une fois réellement traité.
  const resolveTreatedCalamity = async (point, { status, description }) => {
    if (!point?.id || !status) return { error: true };

    const { error } = await supabaseSandbox
      .from('laporan_ng999')
      .update({
        status,
        description: description?.trim() || null,
      })
      .eq('id', point.id);

    if (!error) {
      fetchCalamityPoints();
      const d = new Date(point.tarikh);
      const { error: incError } = await supabaseSandbox.rpc('increment_ng999_historique', {
        p_tahun: d.getFullYear(),
        p_bulan: d.getMonth() + 1,
        p_category: point.category,
        p_jumlah: 1,
      });
      if (incError) console.error('increment_ng999_historique error:', incError);
    }
    return { error: !!error };
  };

  const deleteCalamity = async (id) => {
    const confirmed = Platform.OS === 'web' ? window.confirm('Padam titik bencana ini?') : true;
    if (!confirmed) return;
    // Suppression d'un point mal saisi — ne touche jamais ng999_historique
    // (le point n'a jamais été compté puisqu'il n'a pas été clôturé).
    const { error } = await supabaseSandbox.from('laporan_ng999').delete().eq('id', id);
    if (!error) fetchCalamityPoints();
  };

  // Clôture directement depuis la carte (LiveMapTab) — même logique que
  // resolveTreatedCalamity : +1 sur ng999_historique au moment de la clôture.
  const resolveCalamity = async (id, status) => {
    const point = calamityPoints.find(c => c.id === id);
    const { error } = await supabaseSandbox.from('laporan_ng999').update({ status }).eq('id', id);
    if (!error) {
      fetchCalamityPoints();
      if (point) {
        const d = new Date(point.tarikh);
        const { error: incError } = await supabaseSandbox.rpc('increment_ng999_historique', {
          p_tahun: d.getFullYear(),
          p_bulan: d.getMonth() + 1,
          p_category: point.category,
          p_jumlah: 1,
        });
        if (incError) console.error('increment_ng999_historique error:', incError);
      } else {
        console.error('resolveCalamity: point introuvable localement pour id=', id, '— historique non incrémenté.');
      }
    }
  };

  return { calamityPoints, saveCalamity, deleteCalamity, resolveCalamity, resolveTreatedCalamity };
}
