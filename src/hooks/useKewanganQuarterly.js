import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { parseCurrency } from '../utils/currency';
import { BULAN_MS } from '../constants/bulan';

const SCHEMA = 'sandbox';

// Déduit l'ordre chronologique à partir du mois de début (ex. "Januari" → 0, "April" → 3)
const monthOrderFromLabel = (bulanMula) => {
  const index = BULAN_MS.findIndex((m) => m === bulanMula);
  return index >= 0 ? index : 999; // 999 = mois inconnu/non renseigné, relégué à la fin
};

export function useKewanganQuarterly(totalAllocation) {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuarterly = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('kewangan_breakdown')
        .select('*')
        .order('display_order', { ascending: true }); // ordre chronologique explicite, pas l'ordre d'insertion
      if (error) throw error;
      if (data) setDataList(data);
    } catch (error) {
      console.error('Error fetching kewangan_breakdown:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuarterly(); }, [fetchQuarterly]);

  // Le seuil ("had") d'un sukuan est cumulatif selon son rang : Sukuan 1 = 25%, 2 = 50%, 3 = 75%, 4 = 100%
  const quarterThreshold = (q) => {
    const match = String(q || '').match(/\d+/);
    const num = match ? parseInt(match[0], 10) : 1;
    return Math.min(100, Math.max(25, num * 25));
  };

  // dataList est déjà trié par display_order (ordre chronologique) — la somme jusqu'à l'index i
  // donne le vrai cumulatif réel dépensé depuis le début de l'année jusqu'à ce sukuan inclus
  const processedData = dataList.map((item, index) => {
    const discreteSpend = parseCurrency(item.spend); // saisi directement par l'utilisateur, déjà propre au trimestre
    const percentOfTotal = totalAllocation > 0 ? (discreteSpend / totalAllocation) * 100 : 0;
    const threshold = quarterThreshold(item.q);

    const cumulativeSpend = dataList.slice(0, index + 1).reduce((sum, it) => sum + parseCurrency(it.spend), 0);
    const cumulativePercent = totalAllocation > 0 ? (cumulativeSpend / totalAllocation) * 100 : 0;

    let barColor = '#d97706';
    let statusText = 'Underspend';
    if (percentOfTotal > 25) { barColor = '#dc2626'; statusText = 'Melebihi Had'; }
    else if (percentOfTotal >= 25 * 0.85) { barColor = '#16a34a'; statusText = 'Optimum'; }

    let cumulativeBarColor = '#d97706';
    if (cumulativePercent > threshold) cumulativeBarColor = '#dc2626';
    else if (cumulativePercent >= threshold * 0.85) cumulativeBarColor = '#16a34a';

    return { ...item, discreteSpend, percentOfTotal, threshold, barColor, statusText, cumulativeSpend, cumulativePercent, cumulativeBarColor };
  });

  const saveQuarterlyItem = async (draft, editItem) => {
    const payload = {
      q: draft.q,
      months: draft.months,
      spend: draft.spend,
      color: '#3b82f6',
      display_order: monthOrderFromLabel(draft.bulanMula),
    };
    try {
      if (editItem) {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_breakdown').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_breakdown').insert([payload]);
        if (error) throw error;
      }
      await fetchQuarterly();
      return true;
    } catch (error) {
      console.error('Error saving kewangan_breakdown:', error);
      return false;
    }
  };

  const deleteQuarterlyItem = async (item) => {
    if (!item || item.id === undefined) return false;
    try {
      const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_breakdown').delete().eq('id', item.id);
      if (error) throw error;
      await fetchQuarterly();
      return true;
    } catch (error) {
      console.error('Error deleting kewangan_breakdown item:', error);
      return false;
    }
  };

  const quarterlyUpdatedAt = dataList.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { loading, processedData, saveQuarterlyItem, deleteQuarterlyItem, quarterlyUpdatedAt };
}