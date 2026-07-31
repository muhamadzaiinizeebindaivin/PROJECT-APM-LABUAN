import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useAngkatanCommunity() {
  const [communityProgs, setCommunityProgs] = useState([]);

  const fetchCommunity = useCallback(async () => {
    try {
      const { data, error } = await supabaseSandbox.from('angkatan_community').select('*').order('id');
      if (error) throw error;
      setCommunityProgs(data || []);
    } catch (error) {
      console.error('Error fetching community:', error);
    }
  }, []);

  useEffect(() => { fetchCommunity(); }, [fetchCommunity]);

  const saveCommunityItem = async (form) => {
    const payload = { category: form.category, tempat: form.tempat, detail: form.detail };
    try {
      const { error } = form.id
        ? await supabaseSandbox.from('angkatan_community').update(payload).eq('id', form.id)
        : await supabaseSandbox.from('angkatan_community').insert([payload]);
      if (error) throw error;
      await fetchCommunity();
      return true;
    } catch (error) {
      console.error('Error saving community item:', error);
      return false;
    }
  };
  const deleteCommunityItem = async (id) => {
    try {
      const { error } = await supabaseSandbox.from('angkatan_community').delete().eq('id', id);
      if (error) throw error;
      await fetchCommunity();
      return true;
    } catch (error) {
      console.error('Error deleting community item:', error);
      return false;
    }
  };

  const communityUpdatedAt = communityProgs.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { communityProgs, saveCommunityItem, deleteCommunityItem, communityUpdatedAt };
}