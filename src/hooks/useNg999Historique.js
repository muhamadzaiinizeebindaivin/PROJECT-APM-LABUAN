// src/hooks/useNg999Historique.js
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useNg999Historique() {
  const [historiqueData, setHistoriqueData] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(true);
  const [availableYears, setAvailableYears] = useState([]);

  const fetchHistorique = async () => {
    setLoadingHistorique(true);
    const { data, error } = await supabaseSandbox
      .from('ng999_historique')
      .select('*')
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: true });
    if (!error && data) {
      setHistoriqueData(data);
      const years = [...new Set(data.map(d => d.tahun))].sort((a, b) => b - a);
      setAvailableYears(years.length > 0 ? years : [new Date().getFullYear()]);
    }
    setLoadingHistorique(false);
  };

  useEffect(() => { fetchHistorique(); }, []);

  const saveHistoriqueRow = async (tahun, bulan, category, jumlah_kes) => {
    const { error } = await supabaseSandbox
      .from('ng999_historique')
      .upsert({ tahun, bulan, category, jumlah_kes }, { onConflict: 'tahun,bulan,category' });
    if (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      return false;
    }
    await fetchHistorique();
    return true;
  };

  const deleteHistoriqueYear = async (tahun) => {
    const doDelete = async () => {
      await supabaseSandbox.from('ng999_historique').delete().eq('tahun', tahun);
      fetchHistorique();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Padam semua data tahun ${tahun}?`)) doDelete();
    } else {
      Alert.alert('Pengesahan', `Padam semua data tahun ${tahun}?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // Retourne les données sous forme de tableau [bulan][category] = jumlah
  const getGridForYear = (tahun) => {
    const rows = historiqueData.filter(d => d.tahun === tahun);
    const grid = {};
    rows.forEach(r => {
      if (!grid[r.bulan]) grid[r.bulan] = {};
      grid[r.bulan][r.category] = r.jumlah_kes;
    });
    return grid;
  };

  return { historiqueData, loadingHistorique, availableYears, saveHistoriqueRow, deleteHistoriqueYear, getGridForYear };
}