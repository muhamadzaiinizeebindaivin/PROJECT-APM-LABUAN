// src/hooks/usePpsCategories.js
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function usePpsCategories() {
  const [ppsCategories, setPpsCategories] = useState([]);
  const [loadingPpsCategories, setLoadingPpsCategories] = useState(true);

  const fetchPpsCategories = async () => {
    setLoadingPpsCategories(true);
    const { data, error } = await supabaseSandbox
      .from('pps_categories')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error) setPpsCategories(data || []);
    setLoadingPpsCategories(false);
  };

  useEffect(() => { fetchPpsCategories(); }, []);

  const addPpsCategory = async ({ label, color, icon }) => {
    const key = (label || '').trim() || 'Tanpa Nama'; // key = valeur stockée dans pps_list.type
    const { error } = await supabaseSandbox.from('pps_categories').insert([{
      key,
      label: key,
      color,
      icon: icon || 'Building',
      display_order: ppsCategories.length + 1,
    }]);
    if (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      return false;
    }
    await fetchPpsCategories();
    return true;
  };

  const updatePpsCategory = async (id, { label, color, icon }) => {
    const key = (label || '').trim() || 'Tanpa Nama';
    const { error } = await supabaseSandbox.from('pps_categories').update({
      key,
      label: key,
      color,
      icon: icon || 'Building',
    }).eq('id', id);
    if (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      return false;
    }
    await fetchPpsCategories();
    return true;
  };

  const deletePpsCategory = async (cat) => {
    if (cat.key === 'Lain-Lain') {
      const msg = 'Kategori "Lain-Lain" tidak boleh dipadam (kategori lalai).';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Tidak boleh padam', msg);
      return false;
    }
    const { count } = await supabaseSandbox
      .from('pps_list')
      .select('id', { count: 'exact', head: true })
      .eq('type', cat.key);
    if (count > 0) {
      const msg = `Kategori ini masih mempunyai ${count} rekod PPS. Padam atau tukar kategori rekod tersebut dahulu.`;
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Tidak boleh padam', msg);
      return false;
    }
    const { error } = await supabaseSandbox.from('pps_categories').delete().eq('id', cat.id);
    if (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      return false;
    }
    await fetchPpsCategories();
    return true;
  };

  return { ppsCategories, loadingPpsCategories, addPpsCategory, updatePpsCategory, deletePpsCategory };
}