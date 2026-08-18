// src/hooks/useHotspotCategories.js
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useHotspotCategories(onNotify) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    const { data, error } = await supabaseSandbox
      .from('hotspot_categories')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error) setCategories(data || []);
    setLoadingCategories(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async ({ label, sub, color, prefix, icon }) => {
    const key = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const { error } = await supabaseSandbox.from('hotspot_categories').insert([{
      key,
      label: label.trim().toUpperCase(),
      sub: sub.trim(),
      color,
      prefix: prefix.trim() || 'ID',
      icon: icon || 'MapPin',
      display_order: categories.length + 1,
    }]);
    if (error) {
      onNotify?.('error', error.message);
      return false;
    }
    onNotify?.('success', 'Kategori ditambah.');
    await fetchCategories();
    return true;
  };

  const updateCategory = async (id, { label, sub, color, prefix, icon }) => {
    // La "key" (utilisée pour lier les hotspots existants à cette catégorie)
    // reste inchangée — seul le libellé affiché change, pas l'identifiant.
    const { error } = await supabaseSandbox.from('hotspot_categories').update({
      label: label.trim().toUpperCase(),
      sub: sub.trim(),
      color,
      prefix: prefix.trim() || 'ID',
      icon: icon || 'MapPin',
    }).eq('id', id);
    if (error) {
      onNotify?.('error', error.message);
      return false;
    }
    onNotify?.('success', 'Kategori dikemaskini.');
    await fetchCategories();
    return true;
  };

  const updateCategoryPhoto = async (id, photo_url) => {
    const { error } = await supabaseSandbox.from('hotspot_categories').update({ photo_url }).eq('id', id);
    if (error) {
      onNotify?.('error', error.message);
      return false;
    }
    await fetchCategories();
    return true;
  };

  const deleteCategory = async (cat) => {
    // Bloque la suppression si des hotspots utilisent encore cette catégorie
    const { count } = await supabaseSandbox
      .from('hotspots')
      .select('id', { count: 'exact', head: true })
      .eq('category', cat.key);
    if (count > 0) {
      onNotify?.('error', `Kategori ini masih mempunyai ${count} rekod hotspot. Padam rekod tersebut dahulu.`);
      return false;
    }
    const { error } = await supabaseSandbox.from('hotspot_categories').delete().eq('id', cat.id);
    if (error) {
      onNotify?.('error', error.message);
      return false;
    }
    onNotify?.('success', 'Kategori dipadam.');
    await fetchCategories();
    return true;
  };

  return { categories, loadingCategories, addCategory, updateCategory, deleteCategory, updateCategoryPhoto, fetchCategories };
}