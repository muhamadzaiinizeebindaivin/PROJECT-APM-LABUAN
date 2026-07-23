import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { KEWANGAN_BUDGET } from '../../data';

// TEMPORAIRE : pointe vers "sandbox" pour tester avant de migrer vers "public".
const SCHEMA = 'sandbox';

export function useKewanganBudget(onChange) {
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('kewangan_budget')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      setBudgetData(data && data.length > 0 ? data : KEWANGAN_BUDGET);
    } catch (error) {
      setBudgetData(KEWANGAN_BUDGET);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const saveBudgetItem = async (draft, editItem) => {
    const payload = {
      kategori: draft.kategori,
      perihal: draft.perihal,
      agihan: draft.agihan,
      belanja: draft.belanja || '0',
    };
    try {
      if (editItem?.id) {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_budget').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_budget').insert([payload]);
        if (error) throw error;
      }
      await fetchBudget();
      onChange?.();
      return true;
    } catch (error) {
      Alert.alert('Makluman', "Gagal menyimpan ke Supabase. Sila pastikan table 'kewangan_budget' telah wujud. Ralat: " + error.message);
      return false;
    }
  };

  const deleteBudgetItem = (item) => {
    if (!item || item.id === undefined) return;
    const executeDelete = async () => {
      try {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_budget').delete().eq('id', item.id);
        if (error) throw error;
        await fetchBudget();
        onChange?.();
      } catch (error) {
        Alert.alert('Ralat', error.message);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Padam bajet ini?')) executeDelete();
    } else {
      Alert.alert('Pengesahan', 'Padam bajet ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  // Supprime TOUS les éléments d'une catégorie d'un coup — la catégorie elle-même n'est qu'un regroupement, pas une entité en base
  const deleteCategory = (kategori) => {
    const itemCount = budgetData.filter((item) => item.kategori === kategori).length;
    const executeDelete = async () => {
      try {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_budget').delete().eq('kategori', kategori);
        if (error) throw error;
        await fetchBudget();
        onChange?.();
      } catch (error) {
        Alert.alert('Ralat', error.message);
      }
    };
    const message = `Padam kategori "${kategori}" beserta ${itemCount} perkara di dalamnya? Tindakan ini tidak boleh dibatalkan.`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) executeDelete();
    } else {
      Alert.alert('Pengesahan', message, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  return { budgetData, loading, saveBudgetItem, deleteBudgetItem, deleteCategory };
}