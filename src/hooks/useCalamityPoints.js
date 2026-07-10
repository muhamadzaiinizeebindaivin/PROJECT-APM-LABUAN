// src/hooks/useCalamityPoints.js
import { Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { useSandboxTable } from './useSandboxTable';

/**
 * Points de sinistre (calamity_points) : données + CRUD (ajout, Selesai,
 * Padam). Extrait de OperasiScreen.js.
 */
export function useCalamityPoints() {
  const { data: calamityPoints, refetch: refetchCalamityPoints } = useSandboxTable({
    table: 'calamity_points',
    channelName: 'operasi_calamity_changes',
  });

  const saveCalamity = async ({ category, description, latitude, longitude }) => {
    if (!category) return { error: true };
    const { error } = await supabaseSandbox.from('calamity_points').insert([{
      category,
      description: description?.trim() || null,
      latitude,
      longitude,
    }]);
    if (!error) refetchCalamityPoints();
    return { error: !!error };
  };

  const deleteCalamity = async (id) => {
    const confirmed = Platform.OS === 'web' ? window.confirm('Padam titik bencana ini?') : true;
    if (!confirmed) return;
    const { error } = await supabaseSandbox.from('calamity_points').delete().eq('id', id);
    if (!error) refetchCalamityPoints();
  };

  const resolveCalamity = async (id) => {
    const confirmed = Platform.OS === 'web' ? window.confirm('Tandakan titik ini sebagai selesai?') : true;
    if (!confirmed) return;
    const { error } = await supabaseSandbox.from('calamity_points').update({ status: 'resolved' }).eq('id', id);
    if (!error) refetchCalamityPoints();
  };

  return { calamityPoints, saveCalamity, deleteCalamity, resolveCalamity };
}