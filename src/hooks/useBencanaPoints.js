// src/hooks/useBencanaPoints.js
import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Points bencana : chargement + CRUD (ajout, Selesai, Padam).
 * Table indépendante de calamity_points (exclusive à Operasi).
 */
export function useBencanaPoints() {
  const [bencanaPoints, setBencanaPoints] = useState([]);

  const fetchBencanaPoints = async () => {
    const { data, error } = await supabaseSandbox.from('sekretariat_bencana_points').select('*');
    if (!error) setBencanaPoints(data || []);
    else console.error(error);
  };

  useEffect(() => {
    fetchBencanaPoints();
    const channelName = `sekretariat_bencana_points_changes_${Math.random().toString(36).slice(2)}`;
    const subscription = supabaseSandbox
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'sekretariat_bencana_points' }, () => {
        fetchBencanaPoints();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveBencana = async ({ category, description, latitude, longitude, hotspot_id, jenis_bencana, lokasi, pps }) => {
    if (!category?.trim()) return { error: true };
    const { error } = await supabaseSandbox.from('sekretariat_bencana_points').insert([{
      category: category.trim(),
      description: description?.trim() || null,
      latitude, longitude,
      hotspot_id: hotspot_id || null,
      tarikh: new Date().toISOString().split('T')[0],
      jenis_bencana: jenis_bencana?.trim() || null,
      lokasi: lokasi?.trim() || null,
      pps: pps?.trim() || null,
    }]);
    if (error) {
      Alert.alert('Ralat', 'Gagal menyimpan titik bencana.');
      return { error: true };
    }
    fetchBencanaPoints();
    return { error: false };
  };

  // Modifie un point actif sans le clôturer — accessible via "Kemaskini" sur la carte.
  const updateBencana = async (id, { category, lokasi, pps, description }) => {
    if (!category?.trim()) return { error: true };
    const { error } = await supabaseSandbox
      .from('sekretariat_bencana_points')
      .update({
        category: category.trim(),
        lokasi: lokasi?.trim() || null,
        pps: pps?.trim() || null,
        description: description?.trim() || null,
      })
      .eq('id', id);
    if (error) {
      Alert.alert('Ralat', 'Gagal mengemaskini titik bencana.');
      return { error: true };
    }
    fetchBencanaPoints();
    return { error: false };
  };

  // Rempli à l'étape "Selesai" — clôture le point avec les détails complets.
  const completeBencana = async (id, { jenis_bencana, lokasi, jumlah_kir, jumlah_mangsa, pps, description }) => {
    const { error } = await supabaseSandbox
      .from('sekretariat_bencana_points')
      .update({
        jenis_bencana: jenis_bencana?.trim() || null,
        lokasi: lokasi?.trim() || null,
        jumlah_kir: jumlah_kir === '' || jumlah_kir == null ? null : parseInt(jumlah_kir, 10),
        jumlah_mangsa: jumlah_mangsa === '' || jumlah_mangsa == null ? null : parseInt(jumlah_mangsa, 10),
        pps: pps?.trim() || null,
        description: description?.trim() || null,
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) {
      Alert.alert('Ralat', 'Gagal mengemaskini titik bencana.');
      return { error: true };
    }
    fetchBencanaPoints();
    return { error: false };
  };

  const deleteBencana = async (id, opts = {}) => {
    const confirmed = opts.skipConfirm
      ? true
      : (Platform.OS === 'web' ? window.confirm('Padam titik bencana ini?') : true);
    if (!confirmed) return { cancelled: true };
    const { error } = await supabaseSandbox.from('sekretariat_bencana_points').delete().eq('id', id);
    if (!error) fetchBencanaPoints();
    return { error: !!error };
  };

  return { bencanaPoints, saveBencana, completeBencana, updateBencana, deleteBencana };
}