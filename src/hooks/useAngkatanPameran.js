import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useAngkatanPameran() {
  const [pameranList, setPameranList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchPameran = useCallback(async () => {
    if (!hasLoadedOnce) setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .from('angkatan_pameran')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setPameranList(data || []);
    } catch (error) {
      console.error('Error fetching angkatan_pameran:', error);
      setPameranList([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce]);

  useEffect(() => { fetchPameran(); }, [fetchPameran]);

  const savePameranItem = async (form) => {
    try {
      const payload = {
        agensi: form.agensi?.trim() || '',
        tajuk: form.tajuk?.trim() || '',
        bilangan_pengunjung: parseInt(form.bilangan_pengunjung, 10) || 0,
      };
      const { error } = form.id
        ? await supabaseSandbox.from('angkatan_pameran').update(payload).eq('id', form.id)
        : await supabaseSandbox.from('angkatan_pameran').insert([{ ...payload, display_order: pameranList.length }]);
      if (error) throw error;
      await fetchPameran();
      return true;
    } catch (error) {
      console.error('Error saving angkatan_pameran:', error);
      return false;
    }
  };

  const deletePameranItem = async (id) => {
    try {
      const { error } = await supabaseSandbox.from('angkatan_pameran').delete().eq('id', id);
      if (error) throw error;
      await fetchPameran();
      return true;
    } catch (error) {
      console.error('Error deleting angkatan_pameran:', error);
      return false;
    }
  };

  const pameranUpdatedAt = pameranList.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { pameranList, loading, fetchPameran, savePameranItem, deletePameranItem, pameranUpdatedAt };
}