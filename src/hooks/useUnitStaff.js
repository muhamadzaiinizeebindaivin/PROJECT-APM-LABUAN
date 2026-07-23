import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

const SCHEMA = 'sandbox';

export function useUnitStaff(page, onChange) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('unit_staff')
        .select('*')
        .eq('page', page)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setStaffList(data || []);
    } catch (error) {
      console.error(`Error fetching unit_staff (${page}):`, error);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const saveStaffItem = async (draft, editItem) => {
    const payload = {
      page,
      name: draft.name,
      role: draft.role,
      display_order: editItem ? editItem.display_order : staffList.length,
    };
    try {
      if (editItem?.id) {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('unit_staff').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('unit_staff').insert([payload]);
        if (error) throw error;
      }
      await fetchStaff();
      onChange?.();
      return true;
    } catch (error) {
      Alert.alert('Ralat', 'Gagal menyimpan kakitangan: ' + error.message);
      return false;
    }
  };

  const deleteStaffItem = (item) => {
    if (!item || item.id === undefined) return;
    const executeDelete = async () => {
      try {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('unit_staff').delete().eq('id', item.id);
        if (error) throw error;
        await fetchStaff();
        onChange?.();
      } catch (error) {
        Alert.alert('Ralat', error.message);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Padam kakitangan ini?')) executeDelete();
    } else {
      Alert.alert('Pengesahan', 'Padam kakitangan ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  const reorderStaff = async (reorderedList) => {
    setStaffList(reorderedList);
    try {
      for (let i = 0; i < reorderedList.length; i++) {
        const item = reorderedList[i];
        if (item.display_order !== i) {
          await supabaseSandbox.schema(SCHEMA).from('unit_staff').update({ display_order: i }).eq('id', item.id);
        }
      }
      await fetchStaff();
      onChange?.();
    } catch (error) {
      Alert.alert('Ralat', 'Gagal menyusun semula: ' + error.message);
      await fetchStaff();
    }
  };

  const staffUpdatedAt = staffList.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { staffList, loading, saveStaffItem, deleteStaffItem, reorderStaff, staffUpdatedAt };
}