// src/hooks/useCalamitySummaryPanel.js
import { useState, useMemo, useEffect } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { Alert } from 'react-native';
import { CALAMITY_CATEGORIES } from '../constants/operasiConstants';
import { BULAN_MS } from '../constants/bulan';
import { generateLaporanKecemasamPdf } from '../utils/laporanKecemasanPdf';

export function useCalamitySummaryPanel(calamityPoints) {
  const now = new Date();
  const [summaryYear, setSummaryYear] = useState(now.getFullYear());
  const [summaryYearOpen, setSummaryYearOpen] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState(null);
  const [summaryMonthOpen, setSummaryMonthOpen] = useState(false);
  const [summaryDay, setSummaryDay] = useState(null);
  const [summaryDayOpen, setSummaryDayOpen] = useState(false);

  const [historiqueYears, setHistoriqueYears] = useState([]);

  const availableSummaryYears = useMemo(() => {
    const years = new Set(calamityPoints.filter(c => c.tarikh).map(c => new Date(c.tarikh).getFullYear()));
    historiqueYears.forEach(y => years.add(y));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [calamityPoints, historiqueYears]);

  const [allYearRows, setAllYearRows] = useState([]);
  const [historiqueGrid, setHistoriqueGrid] = useState({});
  const [historiqueStatus, setHistoriqueStatus] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const fetchHistoriqueYears = async () => {
      const { data } = await supabaseSandbox
        .from('ng999_historique')
        .select('tahun');
      if (data) setHistoriqueYears([...new Set(data.map(d => d.tahun))]);
    };
    fetchHistoriqueYears();

    const sub = supabaseSandbox
      .channel('historique_years_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'ng999_historique' }, fetchHistoriqueYears)
      .subscribe();
    return () => supabaseSandbox.removeChannel(sub);
  }, []);

  useEffect(() => {
    const fetchAllRows = async () => {
      setLoadingSummary(true);

      // Fetch données réelles + données historiques en parallèle
      const [ngRes, histRes, statusRes] = await Promise.all([
        supabaseSandbox
          .from('laporan_ng999')
          .select('id, category, tarikh, jumlah_kes, status, created_at')
          .gte('tarikh', `${summaryYear}-01-01`)
          .lte('tarikh', `${summaryYear}-12-31`)
          .limit(5000),
        supabaseSandbox
          .from('ng999_historique')
          .select('bulan, category, jumlah_kes')
          .eq('tahun', summaryYear),
        supabaseSandbox
          .from('ng999_historique_status')
          .select('status, jumlah')
          .eq('tahun', summaryYear),
      ]);

      if (ngRes.data) setAllYearRows(ngRes.data);

      // Construire la grille historique [bulan][category] = jumlah
      const grid = {};
      if (histRes.data) {
        histRes.data.forEach(r => {
          if (!grid[r.bulan]) grid[r.bulan] = {};
          grid[r.bulan][r.category] = r.jumlah_kes;
        });
      }
      setHistoriqueGrid(grid);

      const st = {};
      if (statusRes.data) statusRes.data.forEach(r => { st[r.status] = r.jumlah; });
      setHistoriqueStatus(st);

      setLoadingSummary(false);
    };
    fetchAllRows();

    const sub = supabaseSandbox
      .channel(`summary_panel_${summaryYear}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'laporan_ng999' }, fetchAllRows)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'ng999_historique' }, fetchAllRows)
      .subscribe();
    return () => supabaseSandbox.removeChannel(sub);
  }, [summaryYear]);

  const calamityYearRows = allYearRows;

  const calamityMonthlyBreakdown = useMemo(() => {
    return BULAN_MS.map((label, monthIndex) => {
      const bulan = monthIndex + 1;
      const counts = {};
      let total = 0;
      CALAMITY_CATEGORIES.forEach(cat => { counts[cat.key] = 0; });

      // Données réelles depuis laporan_ng999
      let hasRealData = false;
      calamityYearRows.forEach(c => {
        const d = new Date(c.tarikh);
        if (d.getMonth() !== monthIndex) return;
        const cat = c.category;
        if (counts[cat] !== undefined) {
          counts[cat] += (c.jumlah_kes || 1);
          total += (c.jumlah_kes || 1);
          hasRealData = true;
        }
      });

      // Si pas de données réelles, utiliser les données historiques
      if (!hasRealData && historiqueGrid[bulan]) {
        CALAMITY_CATEGORIES.forEach(cat => {
          const val = historiqueGrid[bulan][cat.key] || 0;
          counts[cat.key] = val;
          total += val;
        });
      }

      return { month: label, counts, total, fromHistorique: !hasRealData && !!historiqueGrid[bulan] };
    });
  }, [calamityYearRows, historiqueGrid]);

  const hasDailyRows = useMemo(
    () => calamityMonthlyBreakdown.some(r => r.total > 0 && !r.fromHistorique),
    [calamityMonthlyBreakdown]
  );

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
        const cat = c.category;
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
    if (calamityYearRows.length > 0) {
      calamityYearRows.forEach(c => {
        const s = c.status || 'active';
        if (counts[s] !== undefined) counts[s]++;
      });
    } else {
      statuses.forEach(s => { counts[s] = historiqueStatus[s] || 0; });
    }
    return counts;
  }, [calamityYearRows, historiqueStatus]);

  const summaryPeriodLabel = summaryMonth === null
    ? `Tahun ${summaryYear}`
    : summaryDay === null
      ? `${BULAN_MS[summaryMonth]} ${summaryYear}`
      : `${summaryDay} ${BULAN_MS[summaryMonth]} ${summaryYear}`;

  const [exportingLaporanPdf, setExportingLaporanPdf] = useState(false);

  const handleExportLaporanPdf = async () => {
    setExportingLaporanPdf(true);
    try {
      await generateLaporanKecemasamPdf({ allYearRows });
    } catch (e) {
      console.error('Gagal menjana PDF:', e);
    } finally {
      setExportingLaporanPdf(false);
    }
  };

  const saveHistoriqueStatus = async (tahun, statusCounts) => {
    const rows = Object.entries(statusCounts).map(([status, jumlah]) => ({ tahun, status, jumlah: parseInt(jumlah) || 0 }));
    const { error } = await supabaseSandbox
      .from('ng999_historique_status')
      .upsert(rows, { onConflict: 'tahun,status' });
    if (!error) setHistoriqueStatus(Object.fromEntries(rows.map(r => [r.status, r.jumlah])));
    return !error;
  };

  return {
    summaryYear, setSummaryYear, summaryYearOpen, setSummaryYearOpen,
    summaryMonth, setSummaryMonth, summaryMonthOpen, setSummaryMonthOpen,
    summaryDay, setSummaryDay, summaryDayOpen, setSummaryDayOpen, summaryDayOptions,
    availableSummaryYears, calamitySummaryRows, calamityMonthlyBreakdown, hasDailyRows,
    statusBreakdown, saveHistoriqueStatus, exportingLaporanPdf, handleExportLaporanPdf,
  };
}
