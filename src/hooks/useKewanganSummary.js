import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { parseCurrency } from '../utils/currency';
import { KEWANGAN_SUMMARY } from '../../data';

// TEMPORAIRE : pointe vers "sandbox" pour tester avant de migrer vers "public".
const SCHEMA = 'sandbox';

// Fixé en dur — non modifiable depuis l'interface (nom de l'organisation, affiché au-dessus du titre)
const ORG_NAME = KEWANGAN_SUMMARY.title;

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
      const payload = { id: 1, title: ORG_NAME, year: title, total_allocation: parseCurrency(total) };
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('kewangan_summary')
        .upsert(payload)
        .select('*')
        .single();
      if (error) throw error;
      setSummaryData(data);
      return true;
    } catch (error) {
      console.error('Error saving kewangan_summary:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading, saving, orgName: ORG_NAME, title, totalAllocation,
    updatedAt: summaryData?.updated_at || null,
    saveSummary,
  };
}