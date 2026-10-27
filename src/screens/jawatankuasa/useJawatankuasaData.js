// src/screens/jawatankuasa/useJawatankuasaData.js
//
// Toutes les données du tableau de bord Jawatankuasa (lecture seule, temps réel).
// Monté uniquement après validation du code d'accès (RLS : rôle jawatankuasa).
import { useState, useEffect, useMemo } from 'react';
import { supabaseSandbox } from '../../supabaseSandboxClient';
import { useOnlineAgencies } from '../../hooks/useOnlineAgencies';
import { useOnlinePemantauan } from '../../hooks/useOnlinePemantauan';
import { useBencanaPoints } from '../../hooks/useBencanaPoints';
import { usePemantauanPoints } from '../../hooks/usePemantauanPoints';
import { useHotspotCategories } from '../../hooks/useHotspotCategories';
import { useAgencyDirectory } from '../sekretariat/peta/useAgencyDirectory';
import { ONLINE_FRESHNESS_MS } from './commandPalette';

// pps_list et hotspots : chargement + mise à jour en temps réel
function useLiveTable(table, columns, orderBy) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const fetchRows = async () => {
      let query = supabaseSandbox.from(table).select(columns);
      if (orderBy) query = query.order(orderBy, { ascending: true });
      const { data, error } = await query;
      if (!error) setRows(data || []);
    };
    fetchRows();
    const channel = supabaseSandbox
      .channel(`jk_${table}_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table }, fetchRows)
      .subscribe();
    return () => { supabaseSandbox.removeChannel(channel); };
  }, [table, columns, orderBy]);
  return rows;
}

const tarikhOf = (b) => b.tarikh || b.created_at;
const isActive = (b) => b.status !== 'resolved' && b.latitude != null && b.longitude != null;

export function useJawatankuasaData() {
  const { onlineAgencies } = useOnlineAgencies();
  const { onlinePemantauan } = useOnlinePemantauan();
  const { bencanaPoints } = useBencanaPoints();
  const { pemantauanPoints } = usePemantauanPoints();
  const { categories: hotspotCategories } = useHotspotCategories();
  const { agencyNames, getAgencyColor, getAgencyLogo } = useAgencyDirectory();
  const ppsList = useLiveTable('pps_list', 'id, name, zone, status', 'name');
  const hotspotList = useLiveTable('hotspots', 'id, category, ref_no, river, area', null);

  // Recalcule la fraîcheur des positions chaque minute, même sans nouvelle donnée
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const isFresh = (t) => !!t && now - new Date(t).getTime() < ONLINE_FRESHNESS_MS;
  const activeAgencies = useMemo(() => onlineAgencies.filter((a) => isFresh(a.last_updated)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onlineAgencies, now]);
  const activePemantauan = useMemo(() => onlinePemantauan.filter((p) => isFresh(p.last_updated)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onlinePemantauan, now]);

  const categoryLabel = (key) => hotspotCategories.find((c) => c.key === key)?.label || key || '-';

  const stats = useMemo(() => {
    const active = bencanaPoints.filter(isActive);
    const kawasan = new Set(active.map((b) => (b.lokasi || '').trim().toLowerCase()).filter(Boolean));
    return {
      bencanaAktif: active.length,
      mangsa: active.reduce((s, b) => s + (Number(b.jumlah_mangsa) || 0), 0),
      keluarga: active.reduce((s, b) => s + (Number(b.jumlah_kir) || 0), 0),
      ppsOk: ppsList.filter((p) => p.status === 'OK').length,
      ppsTotal: ppsList.length,
      kawasanTerjejas: kawasan.size,
      agensiDiLapangan: activeAgencies.length,
    };
  }, [bencanaPoints, ppsList, activeAgencies]);

  // Mangsa / KIR par mois, toutes les données (points actifs, clôturés et rekod kejadian)
  const availableYears = useMemo(() => {
    const years = new Set(bencanaPoints.map((b) => new Date(tarikhOf(b)).getFullYear()).filter((y) => !Number.isNaN(y)));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [bencanaPoints]);

  const monthlyTrend = (year) => {
    const months = Array.from({ length: 12 }, () => ({ mangsa: 0, keluarga: 0 }));
    bencanaPoints.forEach((b) => {
      const d = new Date(tarikhOf(b));
      if (d.getFullYear() !== year) return;
      months[d.getMonth()].mangsa += Number(b.jumlah_mangsa) || 0;
      months[d.getMonth()].keluarga += Number(b.jumlah_kir) || 0;
    });
    return months;
  };

  const laporanTerkini = useMemo(() => bencanaPoints
    .slice()
    .sort((a, b) => new Date(tarikhOf(b)) - new Date(tarikhOf(a)))
    .slice(0, 8)
    .map((b) => ({
      id: b.id,
      tajuk: [b.jenis_bencana || categoryLabel(b.category), b.lokasi].filter(Boolean).join(' di '),
      kategori: categoryLabel(b.category),
      aktif: isActive(b),
      tarikh: tarikhOf(b),
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [bencanaPoints, hotspotCategories]);

  return {
    // carte
    activeAgencies, activePemantauan, bencanaPoints, pemantauanPoints,
    hotspotCategories, agencyNames, getAgencyColor, getAgencyLogo,
    // blocs
    stats, availableYears, monthlyTrend, ppsList, hotspotList, laporanTerkini,
  };
}
