// src/hooks/usePatrolHistoryPanel.js
import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { useSandboxTable } from './useSandboxTable';
import { CALAMITY_CATEGORIES } from '../constants/operasiConstants';
import { BULAN_MS } from '../constants/bulan';
import { generatePatrolHistoryPdf } from '../utils/patrolHistoryPdf';

const HISTORY_PAGE_SIZE = 15;

/**
 * Panneau "Sejarah Patrol Kenderaan" : filtre Tahun/Bulan, pagination,
 * points intermédiaires (waypoints) par patrouille dépliée, et export PDF
 * (qui inclut aussi la page Kes Kecemasan de la même année/mois).
 * Extrait de OperasiScreen.js.
 */
export function usePatrolHistoryPanel(calamityPoints) {
  const now = new Date();
  const [historyYear, setHistoryYear] = useState(now.getFullYear());
  const [historyMonth, setHistoryMonth] = useState(now.getMonth());
  const [historyYearOpen, setHistoryYearOpen] = useState(false);
  const [historyMonthOpen, setHistoryMonthOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);

  const { data: historyDates } = useSandboxTable({
    table: 'vehicle_patrol_history',
    channelName: 'vehicle_patrol_history_years',
    columns: 'ended_at',
    orderBy: 'ended_at',
    ascending: false,
  });

  const availableHistoryYears = useMemo(() => {
    const years = new Set(historyDates.map(row => new Date(row.ended_at).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a).map(String);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyDates]);

  const historyMonthFilters = useMemo(() => {
    const start = historyMonth === null
      ? new Date(historyYear, 0, 1).toISOString()
      : new Date(historyYear, historyMonth, 1).toISOString();
    const end = historyMonth === null
      ? new Date(historyYear + 1, 0, 1).toISOString()
      : new Date(historyYear, historyMonth + 1, 1).toISOString();
    return [
      { method: 'gte', column: 'ended_at', value: start },
      { method: 'lt', column: 'ended_at', value: end },
    ];
  }, [historyYear, historyMonth]);

  const { data: patrolHistory, loading: loadingHistory } = useSandboxTable({
    table: 'vehicle_patrol_history',
    channelName: 'vehicle_patrol_history_detail',
    orderBy: 'ended_at',
    ascending: false,
    filters: historyMonthFilters,
  });

  useEffect(() => {
    setHistoryPage(0);
  }, [historyYear, historyMonth]);

  const historyTotalPages = Math.max(1, Math.ceil(patrolHistory.length / HISTORY_PAGE_SIZE));
  const pagedHistory = useMemo(() => {
    const start = historyPage * HISTORY_PAGE_SIZE;
    return patrolHistory.slice(start, start + HISTORY_PAGE_SIZE);
  }, [patrolHistory, historyPage]);

  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [historyWaypoints, setHistoryWaypoints] = useState({});
  const [loadingWaypointsId, setLoadingWaypointsId] = useState(null);

  const toggleHistoryRow = async (historyId) => {
    if (expandedHistoryId === historyId) {
      setExpandedHistoryId(null);
      return;
    }
    setExpandedHistoryId(historyId);
    if (!historyWaypoints[historyId]) {
      setLoadingWaypointsId(historyId);
      const { data } = await supabaseSandbox
        .from('vehicle_patrol_waypoints')
        .select('*')
        .eq('patrol_history_id', historyId)
        .order('sequence', { ascending: true });
      setHistoryWaypoints(prev => ({ ...prev, [historyId]: data || [] }));
      setLoadingWaypointsId(null);
    }
  };

  // Pivot mois × catégorie recalculé pour l'année/mois du panneau Sejarah
  // (indépendant du panneau Ringkasan), pour que la page Kes Kecemasan du
  // PDF suive le même filtre que le bouton PDF de ce panneau.
  const historyCalamityRows = useMemo(() => {
    const yearRows = calamityPoints.filter(c => c.created_at && new Date(c.created_at).getFullYear() === historyYear);
    const fullBreakdown = BULAN_MS.map((label, monthIndex) => {
      const counts = {};
      let total = 0;
      CALAMITY_CATEGORIES.forEach(cat => { counts[cat.key] = 0; });
      yearRows.forEach(c => {
        const d = new Date(c.created_at);
        if (d.getMonth() !== monthIndex) return;
        if (counts[c.category] !== undefined) {
          counts[c.category] += 1;
          total += 1;
        }
      });
      return { month: label, counts, total };
    });
    if (historyMonth !== null) {
      return fullBreakdown.filter((_, idx) => idx === historyMonth);
    }
    const cumulativeCounts = {};
    let cumulativeTotal = 0;
    CALAMITY_CATEGORIES.forEach(cat => { cumulativeCounts[cat.key] = 0; });
    fullBreakdown.forEach(row => {
      CALAMITY_CATEGORIES.forEach(cat => { cumulativeCounts[cat.key] += row.counts[cat.key]; });
      cumulativeTotal += row.total;
    });
    return [
      ...fullBreakdown,
      { month: 'Kumulatif', counts: cumulativeCounts, total: cumulativeTotal, isCumulative: true },
    ];
  }, [calamityPoints, historyYear, historyMonth]);

  const historyPeriodLabel = historyMonth === null
    ? `Tahun ${historyYear}`
    : `${BULAN_MS[historyMonth]} ${historyYear}`;

  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportHistoryPdf = async () => {
    setExportingPdf(true);
    try {
      let waypointsByPatrol = {};
      if (patrolHistory.length > 0) {
        const patrolIds = patrolHistory.map(h => h.id);
        const { data: allWaypoints } = await supabaseSandbox
          .from('vehicle_patrol_waypoints')
          .select('*')
          .in('patrol_history_id', patrolIds)
          .order('sequence', { ascending: true });
        (allWaypoints || []).forEach(wp => {
          if (!waypointsByPatrol[wp.patrol_history_id]) waypointsByPatrol[wp.patrol_history_id] = [];
          waypointsByPatrol[wp.patrol_history_id].push(wp);
        });
      }

      await generatePatrolHistoryPdf({
        rows: patrolHistory,
        waypointsByPatrol,
        periodLabel: historyPeriodLabel,
        calamityBreakdown: {
          year: historyYear,
          categories: CALAMITY_CATEGORIES,
          rows: historyCalamityRows,
        },
      });
    } catch (e) {
      console.error('Gagal menjana PDF:', e);
      Alert.alert('Ralat', 'Gagal menjana PDF. Sila cuba lagi.');
    } finally {
      setExportingPdf(false);
    }
  };

  return {
    historyYear, setHistoryYear, historyMonth, setHistoryMonth,
    historyYearOpen, setHistoryYearOpen, historyMonthOpen, setHistoryMonthOpen,
    availableHistoryYears,
    patrolHistory, loadingHistory,
    historyPage, setHistoryPage, historyTotalPages, pagedHistory,
    expandedHistoryId, toggleHistoryRow, historyWaypoints, loadingWaypointsId,
    exportingPdf, handleExportHistoryPdf,
  };
}