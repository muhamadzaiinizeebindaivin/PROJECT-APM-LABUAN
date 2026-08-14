import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useSekretariatPetugas() {
  const [petugasList, setPetugasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchPetugas = useCallback(async () => {
    if (!hasLoadedOnce) setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .from('sekretariat_petugas')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setPetugasList(data || []);
    } catch (error) {
      console.error('Error fetching sekretariat_petugas:', error);
      setPetugasList([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce]);

  useEffect(() => { fetchPetugas(); }, [fetchPetugas]);

  // Pasukan/Anggota sont des entrées fixes (créées par la migration) — seule la
  // modification (bilangan/nama/icon) est utilisée en pratique, jamais l'ajout,
  // mais la fonction reste générique comme useSekretariatAssets.js.
  const savePetugasItem = async (form) => {
    try {
      const payload = {
        nama: form.nama?.trim() || '',
        bilangan: parseInt(form.bilangan, 10) || 0,
        icon_key: form.icon_key || 'Users',
      };
      if (form.id) {
        const { error } = await supabaseSandbox.from('sekretariat_petugas').update(payload).eq('id', form.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseSandbox.from('sekretariat_petugas').insert([{ ...payload, color: '#1D4E89', display_order: petugasList.length }]);
        if (error) throw error;
      }
      await fetchPetugas();
      return true;
    } catch (error) {
      console.error('Error saving sekretariat_petugas:', error);
      return false;
    }
  };

  const deletePetugasItem = async (id) => {
    try {
      const { error } = await supabaseSandbox.from('sekretariat_petugas').delete().eq('id', id);
      if (error) throw error;
      await fetchPetugas();
      return true;
    } catch (error) {
      console.error('Error deleting sekretariat_petugas:', error);
      return false;
    }
  };

  return { petugasList, loading, fetchPetugas, savePetugasItem, deletePetugasItem };
}
