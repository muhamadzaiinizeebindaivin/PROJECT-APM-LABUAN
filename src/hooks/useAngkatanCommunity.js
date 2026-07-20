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
    const payload = { category: form.category, label: form.label, detail: form.detail, color: form.color };
    if (form.id) await supabaseSandbox.from('angkatan_community').update(payload).eq('id', form.id);
    else await supabaseSandbox.from('angkatan_community').insert([payload]);
    await fetchCommunity();
  };
  const deleteCommunityItem = async (id) => {
    await supabaseSandbox.from('angkatan_community').delete().eq('id', id);
    await fetchCommunity();
  };

  return { communityProgs, saveCommunityItem, deleteCommunityItem };
}