// src/hooks/useCalamitySummaryPanel.js
import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { CALAMITY_CATEGORIES } from '../constants/operasiConstants';
import { BULAN_MS } from '../constants/bulanMonths';
import { generateCalamitySummaryPdf } from '../utils/patrolHistoryPdf';

/**
 * Panneau "Ringkasan Kecemasan" : filtre Tahun/Bulan, pivot mois×catégorie
 * (avec ligne "Kumulatif" quand "Semua Bulan" est choisi), et export PDF.
 * Indépendant du filtre du panneau Sejarah. Extrait de OperasiScreen.js.
 */
export function useCalamitySummaryPanel(calamityPoints) {
  const now = new Date();
  const [summaryYear, setSummaryYear] = useState(now.getFullYear());
  const [summaryYearOpen, setSummaryYearOpen] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState(null); // null = Semua Bulan (défaut)
  const [summaryMonthOpen, setSummaryMonthOpen] = useState(false);

  const availableSummaryYears = useMemo(() => {
    const years = new Set(calamityPoints.filter(c => c.created_at).map(c => new Date(c.created_at).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a).map(String);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calamityPoints]);

  const calamityYearRows = useMemo(() => {
    return calamityPoints.filter(c => c.created_at && new Date(c.created_at).getFullYear() === summaryYear);
  }, [calamityPoints, summaryYear]);

  const calamityMonthlyBreakdown = useMemo(() => {
    return BULAN_MS.map((label, monthIndex) => {
      const counts = {};
      let total = 0;
      CALAMITY_CATEGORIES.forEach(cat => { counts[cat.key] = 0; });
      calamityYearRows.forEach(c => {
        const d = new Date(c.created_at);
        if (d.getMonth() !== monthIndex) return;
        if (counts[c.category] !== undefined) {
          counts[c.category] += 1;
          total += 1;
        }
      });
      return { month: label, counts, total };
    });
  }, [calamityYearRows]);

  const calamitySummaryRows = useMemo(() => {
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
  }, [calamityMonthlyBreakdown, summaryMonth]);

  const summaryPeriodLabel = summaryMonth === null
    ? `Tahun ${summaryYear}`
    : `${BULAN_MS[summaryMonth]} ${summaryYear}`;

  const [exportingSummaryPdf, setExportingSummaryPdf] = useState(false);

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
    availableSummaryYears, calamitySummaryRows,
    exportingSummaryPdf, handleExportSummaryPdf,
  };
}