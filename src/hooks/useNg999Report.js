// src/hooks/useNg999Report.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { CATEGORY_OPTIONS, getCategoryColor } from '../constants/operasiConstants';
import { BULAN_MS } from '../constants/bulan';

/**
 * Encapsulates fetching, CRUD, and derived statistics for the
 * `laporan_ng999` table (now on sandbox, with a real `tarikh` date
 * column instead of a free-text `month`). Supports viewing trends either
 * by month (12 points across a year) or by day (within a chosen month),
 * via `getTrend(year, month)` — pass `month = null` for the monthly view.
 */
export function useNg999Report() {
  const [ngData, setNgData] = useState([]);
  const [loadingNg, setLoadingNg] = useState(false);

  const fetchNgData = useCallback(async () => {
    setLoadingNg(true);
    const { data, error } = await supabaseSandbox
      .from('laporan_ng999')
      .select('*')
      .order('tarikh', { ascending: false });

    if (data) setNgData(data);
    if (error) console.error("Error fetching NG999 data:", error);
    setLoadingNg(false);
  }, []);

  useEffect(() => {
    fetchNgData();
    const subscription = supabaseSandbox
      .channel('laporan_ng999_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'laporan_ng999' }, () => {
        fetchNgData();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
  }, [fetchNgData]);

  const saveRecord = useCallback(async ({ id, kategori_kes, tarikh, jumlah_kes }) => {
    setLoadingNg(true);
    let error;
    if (id) {
      ({ error } = await supabaseSandbox
        .from('laporan_ng999')
        .update({ kategori_kes, tarikh, jumlah_kes })
        .eq('id', id));
    } else {
      ({ error } = await supabaseSandbox
        .from('laporan_ng999')
        .insert([{ kategori_kes, tarikh, jumlah_kes }]));
    }
    if (!error) await fetchNgData();
    setLoadingNg(false);
    return { error };
  }, [fetchNgData]);

  const deleteRecord = useCallback(async (id) => {
    setLoadingNg(true);
    const { error } = await supabaseSandbox.from('laporan_ng999').delete().eq('id', id);
    if (!error) await fetchNgData();
    setLoadingNg(false);
    return { error };
  }, [fetchNgData]);

  const categories = useMemo(() => CATEGORY_OPTIONS.map(opt => {
    const [id, ...labelArr] = opt.split(" - ");
    return { id, label: labelArr.join(" - "), color: getCategoryColor(id), fullOption: opt };
  }), []);

  const availableYears = useMemo(() => {
    const years = new Set(ngData.map(item => new Date(item.tarikh).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [ngData]);

  const { totalMersCases, topCaseData } = useMemo(() => {
    const total = ngData.reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);

    let maxCount = 0;
    let topLabel = 'No Data Available';
    categories.forEach(cat => {
      const count = ngData
        .filter(item => item.kategori_kes === cat.fullOption)
        .reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);
      if (count > maxCount) {
        maxCount = count;
        topLabel = cat.label;
      }
    });

    return { totalMersCases: total, topCaseData: { label: topLabel, total: maxCount } };
  }, [ngData, categories]);

  /**
   * Returns an array of { label, counts: { [categoryId]: number }, total }.
   * - month === null -> 12 points, one per month of `year`.
   * - month !== null -> one point per day of that month (28-31 points).
   */
  const getTrend = useCallback((year, month) => {
    if (month === null) {
      return BULAN_MS.map((label, m) => {
        const counts = {};
        let total = 0;
        categories.forEach(cat => { counts[cat.id] = 0; });
        ngData.forEach(item => {
          const d = new Date(item.tarikh);
          if (d.getFullYear() !== year || d.getMonth() !== m) return;
          const cat = categories.find(c => c.fullOption === item.kategori_kes);
          if (cat) {
            counts[cat.id] += (item.jumlah_kes || 1);
            total += (item.jumlah_kes || 1);
          }
        });
        return { label, counts, total };
      });
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const counts = {};
      let total = 0;
      categories.forEach(cat => { counts[cat.id] = 0; });
      ngData.forEach(item => {
        const d = new Date(item.tarikh);
        if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return;
        const cat = categories.find(c => c.fullOption === item.kategori_kes);
        if (cat) {
          counts[cat.id] += (item.jumlah_kes || 1);
          total += (item.jumlah_kes || 1);
        }
      });
      return { label: String(day), counts, total };
    });
  }, [ngData, categories]);

  return {
    ngData, loadingNg, saveRecord, deleteRecord,
    categories, availableYears, totalMersCases, topCaseData, getTrend,
  };
}