// src/hooks/useAngkatanUnit.js
import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useAngkatanUnit() {
  const [unitList, setUnitList] = useState([]);
  const [loadingUnit, setLoadingUnit] = useState(true);

  const fetchUnit = async () => {
    setLoadingUnit(true);
    const { data, error } = await supabaseSandbox
      .from('angkatan_unit')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error) setUnitList(data || []);
    setLoadingUnit(false);
  };

  useEffect(() => { fetchUnit(); }, []);

  const saveUnitItem = async (draft, editItem) => {
    const payload = { name: draft.name.trim(), role: draft.role?.trim() || '' };
    const { error } = editItem
      ? await supabaseSandbox.from('angkatan_unit').update(payload).eq('id', editItem.id)
      : await supabaseSandbox.from('angkatan_unit').insert([{ ...payload, display_order: unitList.length }]);
    if (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      return false;
    }
    await fetchUnit();
    return true;
  };

  const deleteUnitItem = async (item) => {
    const doDelete = async () => {
      await supabaseSandbox.from('angkatan_unit').delete().eq('id', item.id);
      fetchUnit();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Padam "${item.name}"?`)) doDelete();
    } else {
      Alert.alert('Pengesahan Padam', `Padam "${item.name}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const reorderUnit = async (reordered) => {
    setUnitList(reordered);
    await Promise.all(
      reordered.map((item, index) =>
        supabaseSandbox.from('angkatan_unit').update({ display_order: index }).eq('id', item.id)
      )
    );
  };

  return { unitList, loadingUnit, saveUnitItem, deleteUnitItem, reorderUnit };
}