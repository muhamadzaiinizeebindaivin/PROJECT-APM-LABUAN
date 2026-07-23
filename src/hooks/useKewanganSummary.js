import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { parseCurrency } from '../utils/currency';
import { KEWANGAN_SUMMARY } from '../../data';

// TEMPORAIRE : pointe vers "sandbox" pour tester avant de migrer vers "public".
const SCHEMA = 'sandbox';

// Fixé en dur — non modifiable depuis l'interface (nom de l'organisation, affiché au-dessus du titre)
const ORG_NAME = KEWANGAN_SUMMARY.title;

const formatDikemaskini = () => {
  const now = new Date();
  const date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${date} ${hours}:${minutes}`;
};

export function useKewanganSummary() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('kewangan_summary')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      setSummaryData(data || null);
    } catch (error) {
      console.error('Error fetching kewangan_summary:', error);
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const totalAllocation = summaryData
    ? parseCurrency(summaryData.total_allocation)
    : parseCurrency(KEWANGAN_SUMMARY.totalAllocation);

  // "title" contient le texte complet éditable, ex. "Tahun Kewangan 2026"
  const title = summaryData?.year || `Tahun Kewangan ${KEWANGAN_SUMMARY.year}`;

  const saveSummary = async ({ title, total }) => {
    setSaving(true);
    try {
      const payload = { id: 1, title: ORG_NAME, year: title, total_allocation: parseCurrency(total), dikemaskini: formatDikemaskini() };
      const { error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('kewangan_summary')
        .upsert(payload);
      if (error) throw error;
      setSummaryData(payload);
      return true;
    } catch (error) {
      Alert.alert('Ralat', 'Gagal menyimpan peruntukan: ' + error.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Met à jour uniquement le timestamp DIKEMASKINI, appelé après une sauvegarde réussie dans n'importe quelle autre section de la page
  const touchDikemaskini = async () => {
    const value = formatDikemaskini();
    try {
      const { error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('kewangan_summary')
        .update({ dikemaskini: value })
        .eq('id', 1);
      if (error) throw error;
      setSummaryData((prev) => (prev ? { ...prev, dikemaskini: value } : prev));
    } catch (error) {
      console.error('Error updating dikemaskini:', error);
    }
  };

  return {
    loading, saving, orgName: ORG_NAME, title, totalAllocation,
    dikemaskini: summaryData?.dikemaskini || null,
    saveSummary, touchDikemaskini,
  };
}