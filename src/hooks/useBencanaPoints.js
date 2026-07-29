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
    const subscription = supabaseSandbox
      .channel('sekretariat_bencana_points_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'sekretariat_bencana_points' }, () => {
        fetchBencanaPoints();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveBencana = async ({ category, description, latitude, longitude }) => {
    if (!category?.trim()) return { error: true };
    const { error } = await supabaseSandbox.from('sekretariat_bencana_points').insert([{
      category: category.trim(),
      description: description?.trim() || null,
      latitude, longitude,
    }]);
    if (error) {
      Alert.alert('Ralat', 'Gagal menyimpan titik bencana.');
      return { error: true };
    }
    fetchBencanaPoints();
    return { error: false };
  };

  const resolveBencana = async (id) => {
    const confirmed = Platform.OS === 'web' ? window.confirm('Tandakan titik ini sebagai selesai?') : true;
    if (!confirmed) return;
    const { error } = await supabaseSandbox
      .from('sekretariat_bencana_points')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) fetchBencanaPoints();
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

  return { bencanaPoints, saveBencana, resolveBencana, deleteBencana };
}