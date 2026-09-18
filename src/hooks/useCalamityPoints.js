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
      .channel(`operasi_calamity_changes_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'laporan_ng999' }, fetchCalamityPoints)
      .subscribe();
    return () => supabaseSandbox.removeChannel(sub);
  }, [fetchCalamityPoints]);

  // Crée un point sur la carte (actif). N'incrémente plus ng999_historique ici — le compteur
  // ne bouge qu'à la clôture (resolveCalamity / resolveTreatedCalamity), pas au pinpoint.
  const saveCalamity = async ({ category, description, latitude, longitude }) => {
    if (!category) return { error: { message: 'Kategori tiada.' } };
    const now = new Date();
    const { error } = await supabaseSandbox.from('laporan_ng999').insert([{
      category,
      description: description?.trim() || null,
      latitude,
      longitude,
      tarikh: now.toISOString().split('T')[0],
    }]);
    if (!error) fetchCalamityPoints();
    return { error };
  };

  // Clôture un point existant (créé via saveCalamity) avec un statut final.
  // C'est ICI que ng999_historique s'incrémente de +1 — un cas ne compte
  // dans les statistiques qu'une fois réellement traité.
  const resolveTreatedCalamity = async (point, { status, description }) => {
    if (!point?.id || !status) return { error: true };

    // Écrit dans `keterangan` (raison de clôture), pas `description` — évite
    // d'écraser la description originale du signalement, cohérent avec
    // resolveCalamity ci-dessus.
    // ng999_historique se met à jour tout seul via le trigger sandbox.sync_ng999_historique
    // (déclenché sur ce même UPDATE) — plus d'appel RPC manuel ici.
    const { error } = await supabaseSandbox
      .from('laporan_ng999')
      .update({
        status,
        keterangan: description?.trim() || null,
      })
      .eq('id', point.id);

    if (!error) fetchCalamityPoints();
    return { error };
  };

  const deleteCalamity = async (id) => {
    // Suppression d'un point mal saisi — ne touche jamais ng999_historique
    // (le point n'a jamais été compté puisqu'il n'a pas été clôturé).
    // La confirmation est gérée côté écran (popup stylé), plus par window.confirm ici.
    const { error } = await supabaseSandbox.from('laporan_ng999').delete().eq('id', id);
    if (!error) fetchCalamityPoints();
    return !error;
  };

  // Clôture directement depuis la carte (LiveMapTab) — même logique que
  // resolveTreatedCalamity : +1 sur ng999_historique au moment de la clôture.
  // ng999_historique se met à jour tout seul via le trigger sandbox.sync_ng999_historique
  // (déclenché sur ce même UPDATE) — plus besoin de retrouver le point localement ni d'appel RPC manuel.
  const resolveCalamity = async (id, status, reason) => {
    const payload = { status };
    if (reason && reason.trim()) payload.keterangan = reason.trim();
    const { error } = await supabaseSandbox.from('laporan_ng999').update(payload).eq('id', id);
    if (!error) fetchCalamityPoints();
  };

  return { calamityPoints, saveCalamity, deleteCalamity, resolveCalamity, resolveTreatedCalamity };
}
