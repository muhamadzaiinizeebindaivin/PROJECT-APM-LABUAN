import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const SCHEMA = 'sandbox';

export function useLatihanBudget() {
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchBudget = useCallback(async () => {
    if (!hasLoadedOnce) setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('latihan_budget')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      setBudgetData(data || []);
    } catch (error) {
      console.error('Error fetching latihan_budget:', error);
      setBudgetData([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce]);

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
        const { error } = await supabaseSandbox.schema(SCHEMA).from('latihan_budget').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('latihan_budget').insert([payload]);
        if (error) throw error;
      }
      await fetchBudget();
      return true;
    } catch (error) {
      console.error('Error saving latihan_budget:', error);
      return false;
    }
  };

  const deleteBudgetItem = async (item) => {
    if (!item || item.id === undefined) return false;
    try {
      const { error } = await supabaseSandbox.schema(SCHEMA).from('latihan_budget').delete().eq('id', item.id);
      if (error) throw error;
      await fetchBudget();
      return true;
    } catch (error) {
      console.error('Error deleting latihan_budget item:', error);
      return false;
    }
  };

  const deleteCategory = async (kategori) => {
    try {
      const { error } = await supabaseSandbox.schema(SCHEMA).from('latihan_budget').delete().eq('kategori', kategori);
      if (error) throw error;
      await fetchBudget();
      return true;
    } catch (error) {
      console.error('Error deleting latihan_budget category:', error);
      return false;
    }
  };

  const renameCategory = async (oldName, newName) => {
    try {
      const { error } = await supabaseSandbox.schema(SCHEMA).from('latihan_budget').update({ kategori: newName }).eq('kategori', oldName);
      if (error) throw error;
      await fetchBudget();
      return true;
    } catch (error) {
      console.error('Error renaming latihan_budget category:', error);
      return false;
    }
  };

  const budgetUpdatedAt = budgetData.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { budgetData, loading, saveBudgetItem, deleteBudgetItem, deleteCategory, renameCategory, budgetUpdatedAt };
}