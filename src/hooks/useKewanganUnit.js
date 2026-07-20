import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

const SCHEMA = 'sandbox';

export function useKewanganUnit() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('kewangan_unit_staff')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setStaffList(data || []);
    } catch (error) {
      console.error('Error fetching kewangan_unit_staff:', error);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const saveStaffItem = async (draft, editItem) => {
    const payload = {
      name: draft.name,
      role: draft.role,
      display_order: editItem ? editItem.display_order : staffList.length,
    };
    try {
      if (editItem?.id) {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_unit_staff').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_unit_staff').insert([payload]);
        if (error) throw error;
      }
      await fetchStaff();
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
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_unit_staff').delete().eq('id', item.id);
        if (error) throw error;
        await fetchStaff();
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
    setStaffList(reorderedList); // mise à jour immédiate de l'affichage
    try {
      // Sauvegarde chaque display_order mis à jour selon la nouvelle position
      for (let i = 0; i < reorderedList.length; i++) {
        const item = reorderedList[i];
        if (item.display_order !== i) {
          await supabaseSandbox.schema(SCHEMA).from('kewangan_unit_staff').update({ display_order: i }).eq('id', item.id);
        }
      }
      await fetchStaff();
    } catch (error) {
      Alert.alert('Ralat', 'Gagal menyusun semula: ' + error.message);
      await fetchStaff(); // revert vers l'état réel en base en cas d'échec
    }
  };

  return { staffList, loading, saveStaffItem, deleteStaffItem, reorderStaff };
}