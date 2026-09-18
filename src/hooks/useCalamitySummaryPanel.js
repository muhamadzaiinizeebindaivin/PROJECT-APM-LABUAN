// src/hooks/useCalamitySummaryPanel.js
import { useState, useMemo, useEffect, useCallback } from 'react';
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

  // Rendue appelable manuellement (pas seulement via useEffect/realtime) — utile quand un
  // AUTRE composant (ex. Ng999HistoriqueModal, qui a sa propre instance de ce hook) sauvegarde
  // une nouvelle année et doit signaler à CETTE instance-ci de se mettre à jour.
  const refreshHistoriqueYears = useCallback(async () => {
    const { data } = await supabaseSandbox
      .from('ng999_historique')
      .select('tahun');
    if (data) setHistoriqueYears([...new Set(data.map(d => d.tahun))]);
  }, []);

  useEffect(() => {
    refreshHistoriqueYears();

    const sub = supabaseSandbox
      .channel(`historique_years_changes_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'ng999_historique' }, refreshHistoriqueYears)
      .subscribe();
    return () => supabaseSandbox.removeChannel(sub);
  }, [refreshHistoriqueYears]);

  useEffect(() => {
    const fetchAllRows = async () => {
      setLoadingSummary(true);

      // Fetch données réelles + données historiques en parallèle
      const [ngRes, histRes, statusRes] = await Promise.all([
        supabaseSandbox
          .from('laporan_ng999')
          .select('id, category, tarikh, status, created_at')
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
      .channel(`summary_panel_${summaryYear}_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'laporan_ng999' }, fetchAllRows)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'ng999_historique' }, fetchAllRows)
      .subscribe();
    return () => supabaseSandbox.removeChannel(sub);
  }, [summaryYear]);

  const calamityYearRows = allYearRows;

  // Indique juste si de vraies lignes datées existent cette année (utile pour activer la vue
  // "par jour" seulement) — n'a plus aucun rôle dans le calcul du tableau, qui reste toujours modifiable.
  const hasRealDailyData = useMemo(
    () => calamityYearRows.length > 0,
    [calamityYearRows]
  );

  // Nombre de vrais rekod harian (laporan_ng999) déjà enregistrés par mois/catégorie pour l'année
  // sélectionnée — sert de plancher : impossible de descendre en dessous via la grille manuelle.
  const dailyMinCounts = useMemo(() => {
    const mins = {};
    calamityYearRows.forEach((c) => {
      const b = new Date(c.tarikh).getMonth() + 1;
      if (!mins[b]) mins[b] = {};
      mins[b][c.category] = (mins[b][c.category] || 0) + 1;
    });
    return mins;
  }, [calamityYearRows]);

  // ng999_historique est désormais la source unique de vérité pour le tableau récapitulatif —
  // saveCalamity (ajout d'un point sur la carte) incrémente déjà cette grille de +1 au bon endroit,
  // donc elle reste toujours modifiable manuellement, plus de verrouillage "données réelles".
  const calamityMonthlyBreakdown = useMemo(() => {
    return BULAN_MS.map((label, monthIndex) => {
      const bulan = monthIndex + 1;
      const counts = {};
      let total = 0;
      // null = jamais disimpan (aucun rekod di ng999_historique untuk sel ini) -> "–"
      // number (termasuk 0) = nilai sebenar yang disimpan -> dipaparkan seperti biasa
      CALAMITY_CATEGORIES.forEach(cat => { counts[cat.key] = null; });

      if (historiqueGrid[bulan]) {
        CALAMITY_CATEGORIES.forEach(cat => {
          const val = historiqueGrid[bulan][cat.key];
          if (val !== undefined) {
            counts[cat.key] = val;
            total += val;
          }
        });
      }

      return { month: label, counts, total };
    });
  }, [historiqueGrid]);

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
          counts[cat] += 1;
          total += 1;
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
      await generateLaporanKecemasamPdf({ historiqueGrid });
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

  const saveHistoriqueGrid = async (tahun, entries) => {
    const rows = entries.map(e => ({
      tahun, bulan: e.bulan, category: e.category, jumlah_kes: parseInt(e.jumlah_kes) || 0,
    }));
    const { error } = await supabaseSandbox
      .from('ng999_historique')
      .upsert(rows, { onConflict: 'tahun,bulan,category' });
    if (!error) {
      setHistoriqueGrid((prev) => {
        const next = { ...prev };
        rows.forEach((r) => {
          next[r.bulan] = { ...(next[r.bulan] || {}), [r.category]: r.jumlah_kes };
        });
        return next;
      });
      // Mise à jour immédiate, sans dépendre du realtime (qui peut avoir un délai ou être mal configuré)
      setHistoriqueYears((prev) => (prev.includes(tahun) ? prev : [...prev, tahun]));
    }
    return !error;
  };

  // Case vidée volontairement par l'utilisateur -> supprime la ligne en base (redevient null/"–"),
  // au lieu d'un upsert qui laisserait une valeur figée.
  const deleteHistoriqueCells = async (tahun, cells) => {
    let hadError = false;
    for (const { bulan, category } of cells) {
      const { error } = await supabaseSandbox
        .from('ng999_historique')
        .delete()
        .eq('tahun', tahun)
        .eq('bulan', bulan)
        .eq('category', category);
      if (error) hadError = true;
    }
    if (!hadError) {
      setHistoriqueGrid((prev) => {
        const next = { ...prev };
        cells.forEach(({ bulan, category }) => {
          if (next[bulan]) {
            const { [category]: _omit, ...rest } = next[bulan];
            next[bulan] = rest;
          }
        });
        return next;
      });
    }
    return !hadError;
  };

  return {
    summaryYear, setSummaryYear, summaryYearOpen, setSummaryYearOpen,
    summaryMonth, setSummaryMonth, summaryMonthOpen, setSummaryMonthOpen,
    summaryDay, setSummaryDay, summaryDayOpen, setSummaryDayOpen, summaryDayOptions,
    availableSummaryYears, calamitySummaryRows, calamityMonthlyBreakdown, hasRealDailyData, dailyMinCounts,
    statusBreakdown, saveHistoriqueStatus, saveHistoriqueGrid, deleteHistoriqueCells, refreshHistoriqueYears,
    exportingLaporanPdf, handleExportLaporanPdf,
  };
}
