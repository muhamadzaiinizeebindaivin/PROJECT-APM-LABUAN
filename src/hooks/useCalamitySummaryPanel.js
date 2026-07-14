// src/hooks/useCalamitySummaryPanel.js
import { useState, useMemo, useEffect } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { Alert } from 'react-native';
import { CALAMITY_CATEGORIES } from '../constants/operasiConstants';
import { BULAN_MS } from '../constants/bulan';
import { generateCalamitySummaryPdf } from '../utils/patrolHistoryPdf';
import { generateLaporanKecemasamPdf } from '../utils/laporanKecemasanPdf';

export function useCalamitySummaryPanel(calamityPoints) {
  const now = new Date();
  const [summaryYear, setSummaryYear] = useState(now.getFullYear());
  const [summaryYearOpen, setSummaryYearOpen] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState(null);
  const [summaryMonthOpen, setSummaryMonthOpen] = useState(false);
  const [summaryDay, setSummaryDay] = useState(null);
  const [summaryDayOpen, setSummaryDayOpen] = useState(false);

  const availableSummaryYears = useMemo(() => {
    const years = new Set(calamityPoints.filter(c => c.tarikh).map(c => new Date(c.tarikh).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [calamityPoints]);

  const [allYearRows, setAllYearRows] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const fetchAllRows = async () => {
      setLoadingSummary(true);
      const { data } = await supabaseSandbox
        .from('laporan_ng999')
        .select('id, category, kategori_kes, tarikh, jumlah_kes, status, created_at')
        .gte('tarikh', `${summaryYear}-01-01`)
        .lte('tarikh', `${summaryYear}-12-31`)
        .limit(5000);
      if (data) setAllYearRows(data);
      setLoadingSummary(false);
    };
    fetchAllRows();

    const sub = supabaseSandbox
      .channel(`summary_panel_${summaryYear}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'laporan_ng999' }, fetchAllRows)
      .subscribe();
    return () => supabaseSandbox.removeChannel(sub);
  }, [summaryYear]);

  const calamityYearRows = allYearRows;

  const calamityMonthlyBreakdown = useMemo(() => {
    return BULAN_MS.map((label, monthIndex) => {
      const counts = {};
      let total = 0;
      CALAMITY_CATEGORIES.forEach(cat => { counts[cat.key] = 0; });
      calamityYearRows.forEach(c => {
        const d = new Date(c.tarikh);
        if (d.getMonth() !== monthIndex) return;
        // Supporte à la fois category (carte) et kategori_kes (rapport)
        const cat = c.category || c.kategori_kes;
        if (counts[cat] !== undefined) {
          counts[cat] += (c.jumlah_kes || 1);
          total += (c.jumlah_kes || 1);
        }
      });
      return { month: label, counts, total };
    });
  }, [calamityYearRows]);

  const summaryDayOptions = useMemo(() => {
    if (summaryMonth === null) return ['Semua Hari'];
    const daysInMonth = new Date(summaryYear, summaryMonth + 1, 0).getDate();
    return ['Semua Hari', ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1))];
  }, [summaryMonth, summaryYear]);

  const calamityDailyBreakdownForMonth = useMemo(() => {
    if (summaryMonth === null) return [];
    const daysInMonth = new Date(summaryYear, summaryMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const counts = {};
      let total = 0;
      CALAMITY_CATEGORIES.forEach(cat => { counts[cat.key] = 0; });
      calamityYearRows.forEach(c => {
        const d = new Date(c.tarikh);
        if (d.getMonth() !== summaryMonth || d.getDate() !== day) return;
        const cat = c.category || c.kategori_kes;
        if (counts[cat] !== undefined) {
          counts[cat] += (c.jumlah_kes || 1);
          total += (c.jumlah_kes || 1);
        }
      });
      return { day, label: `${day} ${BULAN_MS[summaryMonth]}`, counts, total };
    });
  }, [calamityYearRows, summaryMonth, summaryYear]);

  const calamitySummaryRows = useMemo(() => {
    if (summaryMonth !== null && summaryDay !== null) {
      const dayRow = calamityDailyBreakdownForMonth.find(r => r.day === summaryDay);
      return dayRow ? [{ month: dayRow.label, counts: dayRow.counts, total: dayRow.total }] : [];
    }
    if (summaryMonth !== null) {
      return calamityMonthlyBreakdown.filter((_, idx) => idx === summaryMonth);
    }
    const cumulativeCounts = {};
    let cumulativeTotal = 0;
    CALAMITY_CATEGORIES.forEach(cat => { cumulativeCounts[cat.key] = 0; });
    calamityMonthlyBreakdown.forEach(row => {
      CALAMITY_CATEGORIES.forEach(cat => { cumulativeCounts[cat.key] += row.counts[cat.key]; });
      cumulativeTotal += row.total;
    });
    return [
      ...calamityMonthlyBreakdown,
      { month: 'Kumulatif', counts: cumulativeCounts, total: cumulativeTotal, isCumulative: true },
    ];
  }, [calamityMonthlyBreakdown, summaryMonth, summaryDay, calamityDailyBreakdownForMonth]);

  const statusBreakdown = useMemo(() => {
    const statuses = ['active', 'berjaya', 'gagal', 'batal', 'tunda', 'diambil agensi lain', 'diserah ke agensi lain'];
    const counts = {};
    statuses.forEach(s => { counts[s] = 0; });
    calamityYearRows.forEach(c => {
      const s = c.status || 'active';
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [calamityYearRows]);

  const summaryPeriodLabel = summaryMonth === null
    ? `Tahun ${summaryYear}`
    : summaryDay === null
      ? `${BULAN_MS[summaryMonth]} ${summaryYear}`
      : `${summaryDay} ${BULAN_MS[summaryMonth]} ${summaryYear}`;

  const [exportingSummaryPdf, setExportingSummaryPdf] = useState(false);

  const handleExportLaporanPdf = async () => {
    await generateLaporanKecemasamPdf({ allYearRows });
  };

  const handleExportSummaryPdf = async () => {
    setExportingSummaryPdf(true);
    try {
      await generateCalamitySummaryPdf({
        rows: calamitySummaryRows,
        categories: CALAMITY_CATEGORIES,
        periodLabel: summaryPeriodLabel,
      });
    } catch (e) {
      console.error('Gagal menjana PDF:', e);
      Alert.alert('Ralat', 'Gagal menjana PDF. Sila cuba lagi.');
    } finally {
      setExportingSummaryPdf(false);
    }
  };

  return {
    summaryYear, setSummaryYear, summaryYearOpen, setSummaryYearOpen,
    summaryMonth, setSummaryMonth, summaryMonthOpen, setSummaryMonthOpen,
    summaryDay, setSummaryDay, summaryDayOpen, setSummaryDayOpen, summaryDayOptions,
    availableSummaryYears, calamitySummaryRows, calamityMonthlyBreakdown,
    statusBreakdown, exportingSummaryPdf, handleExportSummaryPdf, handleExportLaporanPdf,
  };
}
