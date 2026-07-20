import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
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
      Alert.alert('Ralat', 'Gagal mengambil data dari pangkalan data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuarterly(); }, [fetchQuarterly]);

  const processedData = dataList.map((item, index) => {
    const currentCumulative = parseCurrency(item.spend);
    const prevCumulative = index > 0 ? parseCurrency(dataList[index - 1].spend) : 0;
    const discreteSpend = currentCumulative - prevCumulative;
    const percentOfTotal = totalAllocation > 0 ? (discreteSpend / totalAllocation) * 100 : 0;

    let barColor = '#d97706';
    let statusText = 'Underspend';
    if (percentOfTotal > 25) { barColor = '#dc2626'; statusText = 'Melebihi Had'; }
    else if (percentOfTotal >= 25 * 0.85) { barColor = '#16a34a'; statusText = 'Optimum'; }

    return { ...item, discreteSpend, percentOfTotal, barColor, statusText };
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
      Alert.alert('Ralat', 'Gagal menyimpan data: ' + error.message);
      return false;
    }
  };

  const deleteQuarterlyItem = (item) => {
    if (!item || item.id === undefined) return;
    const executeDelete = async () => {
      try {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('kewangan_breakdown').delete().eq('id', item.id);
        if (error) throw error;
        await fetchQuarterly();
      } catch (error) {
        Platform.OS === 'web' ? window.alert(error.message) : Alert.alert('Ralat', error.message);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Padam rekod ini?')) executeDelete();
    } else {
      Alert.alert('Pengesahan', 'Padam rekod ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  return { loading, processedData, saveQuarterlyItem, deleteQuarterlyItem };
}