// src/hooks/useNg999Report.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { CATEGORY_OPTIONS, MONTH_OPTIONS, getCategoryColor } from '../constants/operasiConstants';

/**
 * Encapsulates fetching, CRUD, and the derived statistics (monthly trend,
 * category breakdown, top case, total cases) for the `laporan_ng999`
 * table. All computation logic is unchanged from the original
 * OperasiScreen.js `useMemo` block — just moved here.
 */
export function useNg999Report() {
  const [ngData, setNgData] = useState([]);
  const [loadingNg, setLoadingNg] = useState(false);

  const fetchNgData = useCallback(async () => {
    setLoadingNg(true);
    const { data, error } = await supabase
      .from('laporan_ng999')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setNgData(data);
    if (error) console.error("Error fetching NG999 data:", error);
    setLoadingNg(false);
  }, []);

  useEffect(() => {
    fetchNgData();
  }, [fetchNgData]);

  const saveRecord = useCallback(async ({ id, kategori_kes, month, jumlah_kes }) => {
    setLoadingNg(true);
    let error;
    if (id) {
      ({ error } = await supabase
        .from('laporan_ng999')
        .update({ kategori_kes, month, jumlah_kes })
        .eq('id', id));
    } else {
      ({ error } = await supabase
        .from('laporan_ng999')
        .insert([{ kategori_kes, month, jumlah_kes }]));
    }
    if (!error) await fetchNgData();
    setLoadingNg(false);
    return { error };
  }, [fetchNgData]);

  const deleteRecord = useCallback(async (id) => {
    setLoadingNg(true);
    const { error } = await supabase.from('laporan_ng999').delete().eq('id', id);
    if (!error) await fetchNgData();
    setLoadingNg(false);
    return { error };
  }, [fetchNgData]);

  const stats = useMemo(() => {
    const totalMersCases = ngData.reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);

    const dynamicMonthlyTrend = MONTH_OPTIONS.map(month => ({
      month,
      total: ngData.filter(item => item.month === month).reduce((sum, item) => sum + (item.jumlah_kes || 1), 0)
    })).filter(m => m.total > 0);

    const dynamicCaseBreakdown = CATEGORY_OPTIONS.map(opt => {
      const [id, ...labelArr] = opt.split(" - ");
      const label = labelArr.join(" - ");
      const color = getCategoryColor(id);

      let monthData = {};
      MONTH_OPTIONS.forEach(m => {
        monthData[m] = ngData
          .filter(item => item.kategori_kes === opt && item.month === m)
          .reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);
      });

      return { id, label, color, ...monthData };
    });

    let maxCount = 0;
    let topLabel = 'No Data Available';
    CATEGORY_OPTIONS.forEach(opt => {
      const count = ngData
        .filter(item => item.kategori_kes === opt)
        .reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);
      if (count > maxCount) {
        maxCount = count;
        topLabel = opt.split(" - ")[1];
      }
    });

    return {
      dynamicMonthlyTrend,
      dynamicCaseBreakdown,
      topCaseData: { label: topLabel, total: maxCount },
      totalMersCases
    };
  }, [ngData]);

  return { ngData, loadingNg, fetchNgData, saveRecord, deleteRecord, stats };
}
