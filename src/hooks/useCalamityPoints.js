// src/hooks/useCalamityPoints.js
import { Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { useSandboxTable } from './useSandboxTable';

/**
 * Points de sinistre — lit depuis laporan_ng999 (source unifiée).
 * Les champs utilisés par la carte : id, category, description, latitude, longitude, status, created_at.
 */
export function useCalamityPoints() {
  const { data: calamityPoints, refetch: refetchCalamityPoints } = useSandboxTable({
    table: 'laporan_ng999',
    channelName: 'operasi_calamity_changes',
    select: 'id, category, description, latitude, longitude, status, created_at, tarikh, jumlah_kes, kategori_kes',
  });

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
    if (!error) refetchCalamityPoints();
    return { error: !!error };
  };

  const deleteCalamity = async (id) => {
    const confirmed = Platform.OS === 'web' ? window.confirm('Padam titik bencana ini?') : true;
    if (!confirmed) return;
    const { error } = await supabaseSandbox.from('laporan_ng999').delete().eq('id', id);
    if (!error) refetchCalamityPoints();
  };

  const resolveCalamity = async (id, status) => {
    const { error } = await supabaseSandbox.from('laporan_ng999').update({ status }).eq('id', id);
    if (!error) refetchCalamityPoints();
  };

  return { calamityPoints, saveCalamity, deleteCalamity, resolveCalamity };
}
