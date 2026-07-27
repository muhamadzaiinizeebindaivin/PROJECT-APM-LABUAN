import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { KEWANGAN_BUDGET } from '../../data';

// TEMPORAIRE : pointe vers "sandbox" pour tester avant de migrer vers "public".
const SCHEMA = 'sandbox';

export function useKewanganBudget() {
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchBudget = useCallback(async () => {
    if (!hasLoadedOnce) setLoading(true);
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
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_budget').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_budget').insert([payload]);
        if (error) throw error;
      }
      await fetchBudget();
      return true;
    } catch (error) {
      console.error('Error saving kewangan_budget:', error);
      return false;
    }
  };

  const deleteBudgetItem = async (item) => {
    if (!item || item.id === undefined) return false;
    try {
      const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_budget').delete().eq('id', item.id);
      if (error) throw error;
      await fetchBudget();
      return true;
    } catch (error) {
      console.error('Error deleting kewangan_budget item:', error);
      return false;
    }
  };

  // Supprime TOUS les éléments d'une catégorie d'un coup — la catégorie elle-même n'est qu'un regroupement, pas une entité en base
  const deleteCategory = async (kategori) => {
    try {
      const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_budget').delete().eq('kategori', kategori);
      if (error) throw error;
      await fetchBudget();
      return true;
    } catch (error) {
      console.error('Error deleting kewangan_budget category:', error);
      return false;
    }
  };

  // Renomme une catégorie : met à jour `kategori` sur toutes les lignes qui lui appartiennent d'un coup
  const renameCategory = async (oldName, newName) => {
    try {
      const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_budget').update({ kategori: newName }).eq('kategori', oldName);
      if (error) throw error;
      await fetchBudget();
      return true;
    } catch (error) {
      console.error('Error renaming kewangan_budget category:', error);
      return false;
    }
  };

  const budgetUpdatedAt = budgetData.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { budgetData, loading, saveBudgetItem, deleteBudgetItem, deleteCategory, renameCategory, budgetUpdatedAt };
}