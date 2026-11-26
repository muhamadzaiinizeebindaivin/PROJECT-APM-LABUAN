// src/hooks/useSectionBudget.js
//
// Logique commune des "Kategori Perbelanjaan" (kewangan_budget, angkatan_budget,
// operasi_budget, latihan_budget) : lecture, ajout, modification, suppression.
//
// Chaque écriture demande les lignes touchées (`.select('id')`) : si la base
// refuse silencieusement (RLS → 0 ligne, sans erreur), on renvoie `false` pour
// que l'écran affiche une erreur au lieu de "berjaya".
import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const SCHEMA = 'sandbox';
// Référence stable : un `[]` en valeur par défaut changerait à chaque rendu et relancerait le fetch en boucle
const NO_FALLBACK = [];

// Lève une erreur si la requête a échoué OU n'a touché aucune ligne
const assertAffected = ({ data, error }, action) => {
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`${action} : aucune ligne modifiée (permission refusée ou ligne introuvable)`);
  }
};

export function useSectionBudget(table, { fallback = NO_FALLBACK } = {}) {
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const from = () => supabaseSandbox.schema(SCHEMA).from(table);

  const fetchBudget = useCallback(async () => {
    if (!hasLoadedOnce) setLoading(true);
    try {
      const { data, error } = await supabaseSandbox.schema(SCHEMA).from(table).select('*').order('id', { ascending: true });
      if (error) throw error;
      setBudgetData(data && data.length > 0 ? data : fallback);
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      setBudgetData(fallback);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce, table, fallback]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  // Exécute une écriture, recharge la liste, renvoie true/false pour l'écran
  const run = async (action, query) => {
    try {
      assertAffected(await query.select('id'), action);
      await fetchBudget();
      return true;
    } catch (error) {
      console.error(`Error ${action} ${table}:`, error);
      return false;
    }
  };

  const saveBudgetItem = (draft, editItem) => {
    const payload = {
      kategori: draft.kategori,
      perihal: draft.perihal,
      agihan: draft.agihan,
      belanja: draft.belanja || '0',
    };
    return editItem?.id
      ? run('updating', from().update(payload).eq('id', editItem.id))
      : run('inserting', from().insert([payload]));
  };

  const deleteBudgetItem = (item) => {
    if (!item || item.id === undefined) return Promise.resolve(false);
    return run('deleting item', from().delete().eq('id', item.id));
  };

  // Supprime TOUS les éléments d'une catégorie d'un coup — la catégorie n'est qu'un regroupement, pas une entité en base
  const deleteCategory = (kategori) => run('deleting category', from().delete().eq('kategori', kategori));

  // Renomme une catégorie : met à jour `kategori` sur toutes ses lignes d'un coup
  const renameCategory = (oldName, newName) => run('renaming category', from().update({ kategori: newName }).eq('kategori', oldName));

  const budgetUpdatedAt = budgetData.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { budgetData, loading, saveBudgetItem, deleteBudgetItem, deleteCategory, renameCategory, budgetUpdatedAt };
}
