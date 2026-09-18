// src/hooks/usePemantauanPoints.js
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Titik Pemantauan (Laporan Awal Pemantauan Hotspot Banjir) : chargement + CRUD.
 * Table indépendante de sekretariat_bencana_points.
 */
export function usePemantauanPoints() {
  const [pemantauanPoints, setPemantauanPoints] = useState([]);

  const fetchPemantauanPoints = async () => {
    const { data, error } = await supabaseSandbox.from('sekretariat_pemantauan_points').select('*');
    if (!error) setPemantauanPoints(data || []);
    else console.error(error);
  };

  useEffect(() => {
    fetchPemantauanPoints();
    const channelName = `sekretariat_pemantauan_points_changes_${Math.random().toString(36).slice(2)}`;
    const subscription = supabaseSandbox
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'sekretariat_pemantauan_points' }, () => {
        fetchPemantauanPoints();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePemantauanPoint = async ({ latitude, longitude, lokasi, jumlah_rumah_terjejas, pps, agensi_di_lapangan, bacaan_air }) => {
    const { error } = await supabaseSandbox.from('sekretariat_pemantauan_points').insert([{
      latitude, longitude,
      lokasi: lokasi?.trim() || null,
      jumlah_rumah_terjejas: jumlah_rumah_terjejas === '' || jumlah_rumah_terjejas == null ? 0 : parseInt(jumlah_rumah_terjejas, 10),
      pps: pps?.trim() || null,
      agensi_di_lapangan: agensi_di_lapangan?.trim() || null,
      bacaan_air: bacaan_air?.trim() || null,
    }]);
    if (error) return { error: true };
    fetchPemantauanPoints();
    return { error: false };
  };

  const updatePemantauanPoint = async (id, { lokasi, jumlah_rumah_terjejas, pps, agensi_di_lapangan, bacaan_air }) => {
    const { error } = await supabaseSandbox
      .from('sekretariat_pemantauan_points')
      .update({
        lokasi: lokasi?.trim() || null,
        jumlah_rumah_terjejas: jumlah_rumah_terjejas === '' || jumlah_rumah_terjejas == null ? 0 : parseInt(jumlah_rumah_terjejas, 10),
        pps: pps?.trim() || null,
        agensi_di_lapangan: agensi_di_lapangan?.trim() || null,
        bacaan_air: bacaan_air?.trim() || null,
      })
      .eq('id', id);
    if (error) return { error: true };
    fetchPemantauanPoints();
    return { error: false };
  };

  const completePemantauanPoint = async (id, { lokasi, jumlah_rumah_terjejas, pps, agensi_di_lapangan, bacaan_air }) => {
    const { error } = await supabaseSandbox
      .from('sekretariat_pemantauan_points')
      .update({
        lokasi: lokasi?.trim() || null,
        jumlah_rumah_terjejas: jumlah_rumah_terjejas === '' || jumlah_rumah_terjejas == null ? 0 : parseInt(jumlah_rumah_terjejas, 10),
        pps: pps?.trim() || null,
        agensi_di_lapangan: agensi_di_lapangan?.trim() || null,
        bacaan_air: bacaan_air?.trim() || null,
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) return { error: true };
    fetchPemantauanPoints();
    return { error: false };
  };

  const deletePemantauanPoint = async (id, opts = {}) => {
    const confirmed = opts.skipConfirm
      ? true
      : (Platform.OS === 'web' ? window.confirm('Padam titik pemantauan ini?') : true);
    if (!confirmed) return { cancelled: true };
    const { error } = await supabaseSandbox.from('sekretariat_pemantauan_points').delete().eq('id', id);
    if (!error) fetchPemantauanPoints();
    return { error: !!error };
  };

  return { pemantauanPoints, savePemantauanPoint, updatePemantauanPoint, completePemantauanPoint, deletePemantauanPoint };
}