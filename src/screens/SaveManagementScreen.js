import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { ChevronLeft, FileDown, Trash2 } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../supabaseClient'; // ajuste le chemin si besoin
import LogoAsset from '../../assets/logo.png'; // place le fichier logo.png dans le dossier assets/ à la racine du projet
import PentadbiranArchiveView from '../components/archive/PentadbiranArchiveView';
import KewanganArchiveView from '../components/archive/KewanganArchiveView';
import LogistikArchiveView from '../components/archive/LogistikArchiveView';
import AngkatanArchiveView from '../components/archive/AngkatanArchiveView';
import SekretariatArchiveView from '../components/archive/SekretariatArchiveView';
import LatihanArchiveView from '../components/archive/LatihanArchiveView';
import OperasiArchiveView from '../components/archive/OperasiArchiveView';

// ============================================================
// LABELS
// ============================================================

const SECTION_LABELS = {
  angkatan_summary: 'Angkatan - Ringkasan',
  angkatan_categories: 'Angkatan - Penjawatan Utama',
  angkatan_community: 'Angkatan - Program Komuniti',
  angkatan_pyramid: 'Angkatan - Struktur Pangkat',
  angkatan_ranks: 'Angkatan - Rekod Kenaikan Pangkat',
  kewangan_budget: 'Kewangan - Agihan & Perbelanjaan',
  kewangan_breakdown: 'Kewangan - Prestasi Mengikut Sukuan',
  logistik: 'Logistik',
  home_data: 'Halaman Utama',
  hotspots: 'Sekretariat - Hotspot Bencana',
  jpbd_directory: 'Sekretariat - Direktori Agensi (JPBD)',
  laporan_ng999: 'Operasi - Laporan NG999',
  latihan: 'Latihan',
  pentadbiran_data: 'Pentadbiran',
  pps_list: 'Sekretariat - Pusat Pemindahan (PPS)',
  vehicles: 'Kenderaan',
};

const FIELD_LABELS = {
  angkatan_summary: {
    total_anggota: 'Jumlah Anggota', aktif_anggota: 'Anggota Aktif',
    male_count: 'Lelaki', female_count: 'Wanita',
    status_lulus: 'Lulus Ujian', status_lantikan: 'Lantikan Baru',
    status_simpanan: 'Simpanan', status_aktif: 'Aktif Penugasan',
  },
  angkatan_categories: { name: 'Kategori', count: 'Bilangan' },
  angkatan_ranks: {
    rank: 'Peringkat', lulus: 'Lulus', kenaikan: 'Naik Pangkat',
    kbp: 'KBP', ptb: 'PTB', aktif: 'Aktif', simpanan: 'Simpanan',
  },
  angkatan_community: { category: 'Kategori', label: 'Nama', detail: 'Butiran' },
  angkatan_pyramid: { rank: 'Pangkat', total: 'Jumlah' },
  kewangan_budget: { kategori: 'Kategori', perihal: 'Perihal', agihan: 'Agihan (RM)', belanja: 'Belanja (RM)', baki: 'Baki (RM)' },
  kewangan_breakdown: { q: 'Sukuan', months: 'Tempoh', spend: 'Belanja Kumulatif (RM)' },
  logistik: {
    category: 'Kategori', type: 'Jenis', model: 'Model', reg: 'No. Pendaftaran',
    qty: 'Kuantiti', status: 'Status', nota_selenggara: 'Catatan Penyelenggaraan',
  },
  latihan: { title: 'Tajuk', pax: 'Peserta', status: 'Status', note: 'Kumpulan Sasaran' },
  laporan_ng999: { kategori_kes: 'Kategori Kes', month: 'Bulan', jumlah_kes: 'Jumlah Kes' },
  jpbd_directory: {
    agency: 'Agensi', officer: 'Pegawai', position: 'Jawatan', grade: 'Gred', email: 'E-mel',
    address: 'Alamat', office_phone: 'Tel Pejabat', mobile_phone: 'Tel Bimbit', fax: 'Fax',
    officers_count: 'Bil. Pegawai', members_count: 'Bil. Anggota', logistics_assets: 'Logistik & Aset',
  },
  hotspots: { category: 'Kategori', river: 'Sungai / Lokasi', area: 'Kawasan Terjejas', ref_no: 'No. Rujukan' },
  pps_list: { name: 'Nama PPS', zone: 'Zon', type: 'Jenis', capacity: 'Kapasiti (Pax)', status: 'Status' },
  vehicles: { name: 'Nama', type: 'Jenis', status: 'Status', color: 'Warna' },
};

const HOTSPOT_CATEGORY_LABELS = { banjir: 'Hotspot Banjir', cerun: 'Hotspot Tanah Runtuh', pantai: 'Hotspot Pantai' };
const MONTHS_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HIDDEN_COLUMNS = ['id'];

// Regroupement des sections par département, pour l'aperçu écran
const DEPARTMENTS = [
  { key: 'pentadbiran', label: 'Pentadbiran', color: '#2563eb', keys: ['pentadbiran_data'] },
  { key: 'kewangan', label: 'Kewangan', color: '#1e40af', keys: ['kewangan_budget', 'kewangan_breakdown'] },
  { key: 'logistik', label: 'Logistik', color: '#0ea5e9', keys: ['logistik'] },
  { key: 'angkatan', label: 'Angkatan', color: '#f97316', keys: ['angkatan_summary', 'angkatan_categories', 'angkatan_ranks', 'angkatan_community', 'angkatan_pyramid'] },
  { key: 'sekretariat', label: 'Sekretariat', color: '#8b5cf6', keys: ['jpbd_directory', 'hotspots', 'pps_list'] },
  { key: 'latihan', label: 'Latihan', color: '#14b8a6', keys: ['latihan'] },
  { key: 'operasi', label: 'Operasi', color: '#ef4444', keys: ['laporan_ng999', 'vehicles'] },
];

const statusColorHex = (status) => {
  const s = String(status || '').toLowerCase();
  if (['baik', 'berjaya', 'ok', 'aktif'].includes(s)) return { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' };
  if (['selenggara', 'akan diadakan'].includes(s)) return { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' };
  if (['rosak', 'tidak berjaya'].includes(s)) return { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' };
  return { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' };
};

const humanizeLabel = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const getFieldLabel = (section, col) => FIELD_LABELS[section]?.[col] || humanizeLabel(col);

const formatValue = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    const d = new Date(val);
    if (!isNaN(d)) return d.toLocaleString();
  }
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const d = new Date(val + 'T00:00:00');
    if (!isNaN(d)) return d.toLocaleDateString();
  }
  return String(val);
};

const parseNum = (v) => {
  const n = parseFloat(String(v ?? '0').replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [59, 130, 246];
};

// Convertit assets/logo.png en data URI base64 au moment de l'export PDF (mis en cache après le premier appel)
let cachedLogoBase64 = null;
const getLogoBase64 = async () => {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const asset = Asset.fromModule(LogoAsset);
    await asset.downloadAsync();

    if (Platform.OS === 'web') {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      cachedLogoBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      const base64 = await FileSystem.readAsStringAsync(asset.localUri || asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      cachedLogoBase64 = `data:image/png;base64,${base64}`;
    }
  } catch (err) {
    console.error('Erreur chargement logo pour le PDF:', err);
    cachedLogoBase64 = null;
  }
  return cachedLogoBase64;
};

const getVisibleColumns = (row) => Object.keys(row).filter((k) => !HIDDEN_COLUMNS.includes(k));

// ============================================================
// DATA PREP (pure helpers shared between screen, web PDF, native PDF)
// ============================================================

const groupBy = (rows, field) => {
  const map = {};
  (rows || []).forEach((r) => {
    const key = r[field] || 'Lain-Lain';
    if (!map[key]) map[key] = [];
    map[key].push(r);
  });
  return map;
};

const prepKewanganBudget = (rows) => {
  const grouped = groupBy(rows, 'kategori');
  const categories = Object.keys(grouped).map((kategori) => {
    const items = grouped[kategori].map((item) => {
      const agihan = parseNum(item.agihan);
      const belanja = parseNum(item.belanja);
      return { ...item, agihan, belanja, baki: agihan - belanja };
    });
    const subtotal = items.reduce((acc, it) => ({
      agihan: acc.agihan + it.agihan, belanja: acc.belanja + it.belanja, baki: acc.baki + it.baki,
    }), { agihan: 0, belanja: 0, baki: 0 });
    return { kategori, items, subtotal };
  });
  const grandTotal = categories.reduce((acc, c) => ({
    agihan: acc.agihan + c.subtotal.agihan, belanja: acc.belanja + c.subtotal.belanja, baki: acc.baki + c.subtotal.baki,
  }), { agihan: 0, belanja: 0, baki: 0 });
  return { categories, grandTotal };
};

const prepLogistik = (rows) => ({
  laut: (rows || []).filter((r) => r.category === 'Laut'),
  darat: (rows || []).filter((r) => r.category === 'Darat'),
});

const prepPyramid = (rows) =>
  [...(rows || [])].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

const prepHotspots = (rows) => groupBy(rows, 'category');

const prepPpsStats = (rows) => {
  const stats = {};
  (rows || []).forEach((item) => {
    const type = item.type || 'Lain-Lain';
    if (!stats[type]) stats[type] = { qty: 0, capacity: 0 };
    stats[type].qty += 1;
    stats[type].capacity += parseNum(item.capacity);
  });
  const total = Object.values(stats).reduce((acc, s) => ({ qty: acc.qty + s.qty, capacity: acc.capacity + s.capacity }), { qty: 0, capacity: 0 });
  return { byType: stats, total };
};

const prepNg999Matrix = (rows) => {
  const categories = [...new Set((rows || []).map((r) => r.kategori_kes))];
  const monthsPresent = [...new Set((rows || []).map((r) => r.month))];
  const months = MONTHS_ORDER.filter((m) => monthsPresent.includes(m));
  const grid = {};
  categories.forEach((cat) => {
    grid[cat] = {};
    months.forEach((m) => {
      grid[cat][m] = (rows || [])
        .filter((r) => r.kategori_kes === cat && r.month === m)
        .reduce((sum, r) => sum + (r.jumlah_kes || 1), 0);
    });
  });
  return { categories, months, grid };
};

// ============================================================
// COMPONENT
// ============================================================

export default function SaveManagementScreen({ theme }) {
  const [saves, setSaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSaveName, setNewSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [selectedSave, setSelectedSave] = useState(null);
  const [snapshotData, setSnapshotData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Pour la navigation rapide entre départements dans l'aperçu détail
  const departmentScrollRef = useRef(null);
  const sectionOffsets = useRef({});
  const scrollToDepartment = (key) => {
    const y = sectionOffsets.current[key];
    if (departmentScrollRef.current && typeof y === 'number') {
      departmentScrollRef.current.scrollTo({ y: Math.max(y - 10, 0), animated: true });
    }
  };

  const fetchSaves = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('sandbox')
      .from('saves')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur fetchSaves:', error);
      Alert.alert('Ralat', "Gagal memuat senarai simpanan.");
    } else {
      setSaves(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSaves();
  }, [fetchSaves]);

  const handleCreateSave = async () => {
    if (!newSaveName.trim()) {
      Alert.alert('Nama Diperlukan', 'Sila masukkan nama untuk simpanan ini.');
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase
      .schema('sandbox')
      .rpc('create_save', { p_name: newSaveName.trim() });

    setIsSaving(false);

    if (error) {
      console.error('Erreur handleCreateSave:', error);
      Alert.alert('Ralat', "Gagal mencipta simpanan.");
      return;
    }

    setNewSaveName('');
    Alert.alert('Berjaya', 'Simpanan telah dicipta.');
    fetchSaves();
  };

  const openSaveDetail = async (save) => {
    setSelectedSave(save);
    setLoadingDetail(true);
    setSnapshotData(null);

    const { data, error } = await supabase
      .schema('sandbox')
      .from('save_snapshots')
      .select('data_json')
      .eq('save_id', save.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    setLoadingDetail(false);

    if (error) {
      console.error('Erreur openSaveDetail:', error);
      Alert.alert('Ralat', "Gagal memuat butiran simpanan ini.");
      return;
    }

    setSnapshotData(data.data_json);
  };

  const closeSaveDetail = () => {
    setSelectedSave(null);
    setSnapshotData(null);
  };

  const performDeleteSave = async (saveId) => {
    setDeletingId(saveId);
    const { error } = await supabase
      .schema('sandbox')
      .from('saves')
      .delete()
      .eq('id', saveId);

    setDeletingId(null);

    if (error) {
      console.error('Erreur performDeleteSave:', error);
      Alert.alert('Ralat', "Gagal memadam simpanan.");
      return;
    }

    if (selectedSave?.id === saveId) {
      closeSaveDetail();
    }

    fetchSaves();
  };

  const confirmDeleteSave = (save) => {
    const doDelete = () => performDeleteSave(save.id);

    if (Platform.OS === 'web') {
      if (window.confirm(`Padam "${save.name}" secara kekal? Tindakan ini tidak boleh dibatalkan.`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Padam Simpanan',
        `Padam "${save.name}" secara kekal? Tindakan ini tidak boleh dibatalkan.`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Padam', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const renderItem = ({ item }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
      <TouchableOpacity onPress={() => openSaveDetail(item)} style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontWeight: '700', fontSize: 18, color: theme?.text || '#000' }}>{item.name}</Text>
        <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
          Disimpan pada {new Date(item.created_at).toLocaleString()}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => confirmDeleteSave(item)}
        disabled={deletingId === item.id}
        style={{ padding: 12, marginRight: 8, opacity: deletingId === item.id ? 0.4 : 1 }}
      >
        {deletingId === item.id ? (
          <ActivityIndicator size="small" color="#ef4444" />
        ) : (
          <Trash2 size={18} color="#ef4444" />
        )}
      </TouchableOpacity>
    </View>
  );

  // ============================================================
  // Sous-composants visuels pour l'aperçu écran (cartes modernes)
  // ============================================================

  const Badge = ({ text, colors }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.dot, marginRight: 6 }} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>{text}</Text>
    </View>
  );

  const KpiGrid = ({ items }) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
      {items.map((item, i) => (
        <View key={i} style={{ width: '48%', margin: '1%', backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#1e40af' }}>{formatValue(item.value)}</Text>
          <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );

  const BarList = ({ items }) => {
    const maxVal = Math.max(...items.map((i) => i.value || 0), 1);
    return (
      <View style={{ gap: 10 }}>
        {items.map((item, i) => (
          <View key={i}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e293b' }}>{item.label}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>{item.value}</Text>
            </View>
            <View style={{ height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${(item.value / maxVal) * 100}%`, backgroundColor: '#3b82f6', borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const InfoCard = ({ title, rows: infoRows, statusField, children }) => (
    <View style={{ backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
      {title ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a', flex: 1 }}>{title}</Text>
          {statusField ? <Badge text={statusField} colors={statusColorHex(statusField)} /> : null}
        </View>
      ) : null}
      {infoRows?.map(([label, value], i) => (
        <Text key={i} style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
          <Text style={{ fontWeight: '700', color: '#334155' }}>{label}: </Text>{formatValue(value)}
        </Text>
      ))}
      {children}
    </View>
  );

  const SectionBlock = ({ title, children }) => (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1e293b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>{title}</Text>
      {children}
    </View>
  );

  const EmptyNote = () => <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Tiada data.</Text>;

  // Rend une section (une table du snapshot) avec un style adapté à son type
  const renderKeySection = (key, rows) => {
    const title = SECTION_LABELS[key] || humanizeLabel(key);

    if (!rows || rows.length === 0) {
      return <SectionBlock key={key} title={title}><EmptyNote /></SectionBlock>;
    }

    switch (key) {
      case 'angkatan_summary': {
        const s = rows[0];
        return (
          <SectionBlock key={key} title={title}>
            <KpiGrid items={[
              { label: 'Jumlah Anggota', value: s.total_anggota }, { label: 'Anggota Aktif', value: s.aktif_anggota },
              { label: 'Lelaki', value: s.male_count }, { label: 'Wanita', value: s.female_count },
              { label: 'Lulus Ujian', value: s.status_lulus }, { label: 'Lantikan Baru', value: s.status_lantikan },
              { label: 'Simpanan', value: s.status_simpanan }, { label: 'Aktif Penugasan', value: s.status_aktif },
            ]} />
          </SectionBlock>
        );
      }

      case 'angkatan_categories':
        return (
          <SectionBlock key={key} title={title}>
            {rows.map((r, i) => (
              <InfoCard key={i} title={r.name} rows={[['Bilangan', r.count]]} />
            ))}
          </SectionBlock>
        );

      case 'angkatan_ranks':
        return (
          <SectionBlock key={key} title={title}>
            {rows.map((r, i) => (
              <InfoCard key={i} title={r.rank} rows={[
                ['Lulus', r.lulus], ['Naik Pangkat', r.kenaikan], ['KBP', r.kbp],
                ['PTB', r.ptb], ['Aktif', r.aktif], ['Simpanan', r.simpanan],
              ]} />
            ))}
          </SectionBlock>
        );

      case 'angkatan_pyramid':
        return (
          <SectionBlock key={key} title={title}>
            <BarList items={prepPyramid(rows).map((r) => ({ label: r.rank, value: r.total }))} />
          </SectionBlock>
        );

      case 'angkatan_community':
        return (
          <SectionBlock key={key} title={title}>
            {rows.map((r, i) => (
              <InfoCard key={i} title={r.label} rows={[['Kategori', r.category], ['Butiran', r.detail]]} />
            ))}
          </SectionBlock>
        );

      case 'kewangan_budget': {
        const prepped = prepKewanganBudget(rows);
        return (
          <SectionBlock key={key} title={title}>
            {prepped.categories.map((cat, i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#1e40af', marginBottom: 6 }}>{cat.kategori}</Text>
                {cat.items.map((it, j) => (
                  <InfoCard key={j} title={it.perihal} rows={[
                    ['Agihan', `RM ${it.agihan.toFixed(2)}`], ['Belanja', `RM ${it.belanja.toFixed(2)}`], ['Baki', `RM ${it.baki.toFixed(2)}`],
                  ]} />
                ))}
              </View>
            ))}
            <View style={{ backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, marginTop: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#1e3a8a' }}>
                Jumlah — Agihan RM {prepped.grandTotal.agihan.toFixed(2)} · Belanja RM {prepped.grandTotal.belanja.toFixed(2)} · Baki RM {prepped.grandTotal.baki.toFixed(2)}
              </Text>
            </View>
          </SectionBlock>
        );
      }

      case 'kewangan_breakdown':
        return (
          <SectionBlock key={key} title={title}>
            {rows.map((r, i) => (
              <InfoCard key={i} title={`${r.q} (${r.months})`} rows={[['Belanja Kumulatif', `RM ${parseNum(r.spend).toFixed(2)}`]]} />
            ))}
          </SectionBlock>
        );

      case 'logistik': {
        const { laut, darat } = prepLogistik(rows);
        return (
          <SectionBlock key={key} title={title}>
            {laut.length ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0ea5e9', marginBottom: 6 }}>Logistik Laut</Text>
                {laut.map((r, i) => (
                  <InfoCard key={i} title={r.model} statusField={r.status} rows={[['Jenis', r.type], ['Kuantiti', r.qty]]} />
                ))}
              </View>
            ) : null}
            {darat.length ? (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#f97316', marginBottom: 6 }}>Logistik Darat</Text>
                {darat.map((r, i) => (
                  <InfoCard key={i} title={r.model} statusField={r.status} rows={[['Jenis', r.type], ['No. Pendaftaran', r.reg]]} />
                ))}
              </View>
            ) : null}
          </SectionBlock>
        );
      }

      case 'vehicles':
        return (
          <SectionBlock key={key} title={title}>
            {rows.map((r, i) => (
              <InfoCard key={i} title={r.name} statusField={r.status} rows={[['Jenis', r.type]]} />
            ))}
          </SectionBlock>
        );

      case 'latihan':
        return (
          <SectionBlock key={key} title={title}>
            {rows.map((r, i) => (
              <InfoCard key={i} title={r.title} statusField={r.status} rows={[
                ['Tarikh', `${formatValue(r.start_date)} — ${formatValue(r.end_date)}`],
                ['Peserta', r.pax], ['Kumpulan Sasaran', r.note],
              ]} />
            ))}
          </SectionBlock>
        );

      case 'laporan_ng999': {
        const { categories, months, grid } = prepNg999Matrix(rows);
        if (!categories.length) return <SectionBlock key={key} title={title}><EmptyNote /></SectionBlock>;
        return (
          <SectionBlock key={key} title={title}>
            {categories.map((cat, i) => {
              const total = months.reduce((sum, m) => sum + (grid[cat][m] || 0), 0);
              return (
                <InfoCard key={i} title={cat} rows={[['Jumlah Kes', total]]}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {months.filter((m) => grid[cat][m] > 0).map((m) => (
                      <View key={m} style={{ backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#b91c1c' }}>{m.slice(0, 3)}: {grid[cat][m]}</Text>
                      </View>
                    ))}
                  </View>
                </InfoCard>
              );
            })}
          </SectionBlock>
        );
      }

      case 'jpbd_directory':
        return (
          <SectionBlock key={key} title={title}>
            {rows.map((r, i) => (
              <InfoCard key={i} title={r.agency} rows={[
                ['Pegawai', r.officer], ['Jawatan', r.position], ['Gred', r.grade], ['E-mel', r.email],
                ['Tel Pejabat', r.office_phone], ['Tel Bimbit', r.mobile_phone],
                ['Bil. Pegawai', r.officers_count], ['Bil. Anggota', r.members_count],
                ['Logistik & Aset', r.logistics_assets],
              ]} />
            ))}
          </SectionBlock>
        );

      case 'hotspots': {
        const grouped = prepHotspots(rows);
        return (
          <SectionBlock key={key} title={title}>
            {Object.keys(grouped).map((cat) => (
              <View key={cat} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#1d4ed8', marginBottom: 6 }}>
                  {HOTSPOT_CATEGORY_LABELS[cat] || humanizeLabel(cat)}
                </Text>
                {grouped[cat].map((r, i) => (
                  <InfoCard key={i} title={`No. ${formatValue(r.ref_no)} — ${r.river}`} rows={[['Kawasan', r.area]]} />
                ))}
              </View>
            ))}
          </SectionBlock>
        );
      }

      case 'pps_list': {
        const { byType, total } = prepPpsStats(rows);
        return (
          <SectionBlock key={key} title={title}>
            <KpiGrid items={[
              ...Object.keys(byType).map((t) => ({ label: t, value: `${byType[t].qty} (${byType[t].capacity} pax)` })),
              { label: 'JUMLAH', value: `${total.qty} (${total.capacity} pax)` },
            ]} />
            <View style={{ height: 8 }} />
            {rows.map((r, i) => (
              <InfoCard key={i} title={r.name} statusField={r.status} rows={[['Zon', r.zone], ['Jenis', r.type], ['Kapasiti', `${r.capacity} pax`]]} />
            ))}
          </SectionBlock>
        );
      }

      case 'home_data': {
        const d = rows[0]?.data_json || {};
        return (
          <SectionBlock key={key} title={title}>
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>{d.welcomeTitle}</Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{d.welcomeSubtitle}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e40af' }}>Peranan Utama</Text>
              <Text style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>{d.visiText}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#16a34a' }}>Kemanusiaan</Text>
              <Text style={{ fontSize: 12, color: '#475569' }}>{d.misiText}</Text>
            </View>
          </SectionBlock>
        );
      }

      case 'pentadbiran_data': {
        const d = rows[0]?.data_json || {};
        return (
          <View key={key} style={{ marginBottom: 18 }}>
            <PentadbiranArchiveView data={d} />
          </View>
        );
      }

      default: {
        const columns = getVisibleColumns(rows[0]);
        return (
          <SectionBlock key={key} title={title}>
            {rows.map((row, i) => (
              <InfoCard key={i} rows={columns.map((c) => [getFieldLabel(key, c), row[c]])} />
            ))}
          </SectionBlock>
        );
      }
    }
  };

  // Regroupe l'aperçu par département, en cartes modernes
  const renderDepartmentView = () => {
    const presentDepartments = DEPARTMENTS.filter(
      (dept) => dept.keys.filter((k) => snapshotData && k in snapshotData).length > 0
    );

    return (
      <View style={{ flex: 1 }}>
        {/* Barre de navigation rapide entre départements */}
        {presentDepartments.length > 1 ? (
          <View style={{ borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
              {presentDepartments.map((dept) => (
                <TouchableOpacity
                  key={dept.key}
                  onPress={() => scrollToDepartment(dept.key)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dept.color, marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>{dept.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <ScrollView
          ref={departmentScrollRef}
          style={{ paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
        >
          {presentDepartments.map((dept) => (
            <View
              key={dept.key}
              style={{ marginBottom: 24 }}
              onLayout={(e) => { sectionOffsets.current[dept.key] = e.nativeEvent.layout.y; }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 4, height: 20, backgroundColor: dept.color, borderRadius: 2, marginRight: 8 }} />
                <Text style={{ fontSize: 17, fontWeight: '900', color: theme?.text || '#0f172a' }}>{dept.label}</Text>
              </View>
              <View style={{ backgroundColor: theme?.card || '#fff', borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
                {dept.key === 'kewangan' ? (
                  <KewanganArchiveView
                    budgetData={snapshotData.kewangan_budget || []}
                    breakdownData={snapshotData.kewangan_breakdown || []}
                    summary={snapshotData.kewangan_summary?.[0] || null}
                  />
                ) : dept.key === 'logistik' ? (
                  <LogistikArchiveView rows={snapshotData.logistik || []} theme={theme} />
                ) : dept.key === 'angkatan' ? (
                  <AngkatanArchiveView
                    summary={snapshotData.angkatan_summary?.[0] || null}
                    categories={snapshotData.angkatan_categories || []}
                    ranks={snapshotData.angkatan_ranks || []}
                    community={snapshotData.angkatan_community || []}
                    pyramid={snapshotData.angkatan_pyramid || []}
                  />
                ) : dept.key === 'sekretariat' ? (
                  <SekretariatArchiveView
                    jpbdList={snapshotData.jpbd_directory || []}
                    hotspotList={snapshotData.hotspots || []}
                    ppsList={snapshotData.pps_list || []}
                  />
                ) : dept.key === 'latihan' ? (
                  <LatihanArchiveView rows={snapshotData.latihan || []} />
                ) : dept.key === 'operasi' ? (
                  <OperasiArchiveView ngRows={snapshotData.laporan_ng999 || []} />
                ) : (
                  dept.keys.filter((k) => k in snapshotData).map((k) => renderKeySection(k, snapshotData[k]))
                )}
              </View>
            </View>
          ))}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    );
  };

  // ============================================================
  // PDF — WEB (jsPDF + autoTable), style adapté par section
  // ============================================================

  const exportPdfWeb = (save, data, logoBase64) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 40;
    const marginRight = 40;
    const contentWidth = pageWidth - marginLeft - marginRight;
    let y = 50;

    const ensureSpace = (needed) => {
      if (y + needed > pageHeight - 40) {
        doc.addPage();
        y = 50;
      }
    };

    const sectionTitle = (text) => {
      ensureSpace(30);
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(text, marginLeft, y);
      y += 8;
      doc.setDrawColor(226, 232, 240);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 16;
    };

    const emptyNote = () => {
      doc.setFontSize(9);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text('Aucune donnée.', marginLeft, y);
      y += 20;
    };

    const runTable = (head, body, opts = {}) => {
      autoTable(doc, {
        head, body,
        startY: y,
        margin: { left: marginLeft, right: marginRight },
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        ...opts,
      });
      y = doc.lastAutoTable.finalY + 20;
    };

    // ---- KPI grid helper (used for angkatan_summary, pentadbiran kpi/pematuhan) ----
    const drawKpiGrid = (items, perRow = 4) => {
      const gap = 10;
      const boxW = (contentWidth - gap * (perRow - 1)) / perRow;
      const boxH = 54;
      items.forEach((item, i) => {
        const col = i % perRow;
        if (col === 0) ensureSpace(boxH + 10);
        const x = marginLeft + col * (boxW + gap);
        const boxY = y;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, boxY, boxW, boxH, 4, 4, 'FD');
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text(String(item.value), x + 10, boxY + 26);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(item.label, x + 10, boxY + 40, { maxWidth: boxW - 20 });
        if (col === perRow - 1 || i === items.length - 1) y = boxY + boxH + gap;
      });
      y += 6;
    };

    // ---- Horizontal bar list (used for angkatan_pyramid) ----
    const drawBarList = (items, maxVal) => {
      const barMaxWidth = contentWidth - 140;
      items.forEach((item) => {
        ensureSpace(24);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(String(item.label), marginLeft, y + 10);
        const barW = maxVal > 0 ? (item.value / maxVal) * barMaxWidth : 0;
        doc.setFillColor(59, 130, 246);
        doc.roundedRect(marginLeft + 100, y, Math.max(barW, 2), 14, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(String(item.value), marginLeft + 100 + barW + 6, y + 10);
        y += 22;
      });
      y += 6;
    };

    // ---- Text block (used for home_data) ----
    const drawTextBlock = (title, body, opts = {}) => {
      ensureSpace(40);
      if (title) {
        doc.setFontSize(opts.titleSize || 11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(title, marginLeft, y);
        y += 14;
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(body || '-', contentWidth);
      lines.forEach((line) => {
        ensureSpace(12);
        doc.text(line, marginLeft, y);
        y += 12;
      });
      y += 10;
    };

    // ---- Progress bar row (used for pdpa) ----
    const drawProgressRow = (label, percent) => {
      ensureSpace(28);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(label, contentWidth - 50);
      doc.text(lines, marginLeft, y);
      y += lines.length * 11 + 2;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(marginLeft, y, contentWidth, 8, 3, 3, 'F');
      const p = Math.min(parseNum(percent), 100);
      doc.setFillColor(249, 115, 22);
      doc.roundedRect(marginLeft, y, Math.max((contentWidth * p) / 100, 2), 8, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${percent}%`, marginLeft + contentWidth - 24, y + 7);
      y += 20;
    };

    // ---- Status color helper ----
    const statusColor = (status) => {
      const s = String(status || '').toLowerCase();
      if (['baik', 'berjaya', 'ok', 'aktif'].includes(s)) return [22, 163, 74];
      if (['selenggara', 'akan diadakan'].includes(s)) return [217, 119, 6];
      if (['rosak', 'tidak berjaya'].includes(s)) return [220, 38, 38];
      return [71, 85, 105];
    };

    const statusCellHook = (statusColIndex) => (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === statusColIndex) {
        const [r, g, b] = statusColor(hookData.cell.raw);
        hookData.cell.styles.textColor = [r, g, b];
        hookData.cell.styles.fontStyle = 'bold';
      }
    };

    // Logo, centré tout en haut (si disponible)
    if (logoBase64) {
      const logoSize = 85;
      try {
        doc.addImage(logoBase64, 'PNG', pageWidth / 2 - logoSize / 2, y, logoSize, logoSize);
        y += logoSize + 28;
      } catch (e) {
        console.error('Erreur logo PDF:', e);
      }
    }

    // Header du document — titre centré, assez grand
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(save.name, pageWidth / 2, y, { align: 'center' });
    y += 22;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Disimpan pada ${new Date(save.created_at).toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
    y += 32;

    const departmentHeader = (dept) => {
      ensureSpace(26);
      const [r, g, b] = hexToRgb(dept.color);
      doc.setFillColor(r, g, b);
      doc.rect(marginLeft, y - 10, 3, 14, 'F');
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(dept.label, marginLeft + 10, y);
      y += 20;
    };

    // Regroupement par département, dans le même ordre que l'aperçu (historique)
    DEPARTMENTS.forEach((dept) => {
      const presentKeys = dept.keys.filter((k) => k !== 'kewangan_summary' && k in data);
      if (presentKeys.length === 0) return;

      departmentHeader(dept);

      // Kewangan : carte d'en-tête (Peruntukan Tahunan) avant les sections, comme dans l'historique
      if (dept.key === 'kewangan' && data.kewangan_summary?.[0]) {
        const sm = data.kewangan_summary[0];
        ensureSpace(40);
        doc.setFillColor(30, 64, 175);
        doc.roundedRect(marginLeft, y, contentWidth, 40, 6, 6, 'F');
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(219, 234, 254);
        doc.text(sm.title || '', marginLeft + 12, y + 14);
        doc.setFontSize(8);
        doc.text(`Tahun Kewangan ${sm.year || ''}`, marginLeft + 12, y + 26);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`Jumlah Peruntukan: RM ${parseNum(sm.total_allocation).toFixed(2)}`, marginLeft + 12, y + 36);
        y += 50;
      }

      presentKeys.forEach((key) => renderSectionPdf(key, data[key]));
    });

    function renderSectionPdf(key, rows) {
      sectionTitle(SECTION_LABELS[key] || humanizeLabel(key));

      if (!rows || rows.length === 0) {
        emptyNote();
        return;
      }

      switch (key) {
        case 'angkatan_summary': {
          const s = rows[0];
          drawKpiGrid([
            { label: 'Jumlah Anggota', value: s.total_anggota ?? '-' },
            { label: 'Anggota Aktif', value: s.aktif_anggota ?? '-' },
          ], 2);
          drawBarList([
            { label: 'Lelaki', value: s.male_count || 0 },
            { label: 'Wanita', value: s.female_count || 0 },
          ], Math.max((s.male_count || 0), (s.female_count || 0), 1));
          ensureSpace(16);
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(51, 65, 85);
          doc.text('Status Anggota', marginLeft, y);
          y += 12;
          drawKpiGrid([
            { label: 'Lulus Ujian', value: s.status_lulus ?? '-' },
            { label: 'Lantikan Baru', value: s.status_lantikan ?? '-' },
            { label: 'Simpanan', value: s.status_simpanan ?? '-' },
            { label: 'Aktif Penugasan', value: s.status_aktif ?? '-' },
          ]);
          break;
        }

        case 'angkatan_categories': {
          runTable(
            [['Kategori', 'Bilangan']],
            rows.map((r) => [r.name, formatValue(r.count)])
          );
          break;
        }

        case 'angkatan_ranks': {
          runTable(
            [['Peringkat', 'Lulus', 'Naik', 'KBP', 'PTB', 'Aktif', 'Simpanan']],
            rows.map((r) => [r.rank, r.lulus, r.kenaikan, r.kbp, r.ptb, r.aktif, r.simpanan].map(formatValue))
          );
          break;
        }

        case 'angkatan_pyramid': {
          const sorted = prepPyramid(rows);
          const maxVal = Math.max(...sorted.map((r) => r.total || 0), 1);
          drawBarList(sorted.map((r) => ({ label: r.rank, value: r.total })), maxVal);
          break;
        }

        case 'angkatan_community': {
          runTable(
            [['Kategori', 'Nama', 'Butiran']],
            rows.map((r) => [r.category, r.label, r.detail].map(formatValue))
          );
          break;
        }

        case 'kewangan_budget': {
          const prepped = prepKewanganBudget(rows);
          prepped.categories.forEach((cat) => {
            ensureSpace(20);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text(cat.kategori, marginLeft, y);
            y += 12;
            runTable(
              [['Perihal', 'Agihan (RM)', 'Belanja (RM)', 'Baki (RM)']],
              [
                ...cat.items.map((it) => [it.perihal, it.agihan.toFixed(2), it.belanja.toFixed(2), it.baki.toFixed(2)]),
                [{ content: 'Subtotal', styles: { fontStyle: 'bold' } },
                  { content: cat.subtotal.agihan.toFixed(2), styles: { fontStyle: 'bold' } },
                  { content: cat.subtotal.belanja.toFixed(2), styles: { fontStyle: 'bold' } },
                  { content: cat.subtotal.baki.toFixed(2), styles: { fontStyle: 'bold' } }],
              ],
              { headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' } }
            );
          });
          ensureSpace(20);
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(
            `JUMLAH KESELURUHAN — Agihan: RM ${prepped.grandTotal.agihan.toFixed(2)}  |  Belanja: RM ${prepped.grandTotal.belanja.toFixed(2)}  |  Baki: RM ${prepped.grandTotal.baki.toFixed(2)}`,
            marginLeft, y
          );
          y += 20;
          break;
        }

        case 'kewangan_breakdown': {
          const totalAllocation = parseNum(data.kewangan_summary?.[0]?.total_allocation);
          if (totalAllocation > 0) {
            const processed = rows.map((item, index) => {
              const current = parseNum(item.spend);
              const prev = index > 0 ? parseNum(rows[index - 1].spend) : 0;
              const discrete = current - prev;
              const percent = (discrete / totalAllocation) * 100;
              let statusText = 'Underspend';
              if (percent > 25) statusText = 'Melebihi Had';
              else if (percent >= 25 * 0.85) statusText = 'Optimum';
              return [item.q, item.months, current.toFixed(2), `${percent.toFixed(2)}%`, statusText];
            });
            const breakdownStatusHook = (hookData) => {
              if (hookData.section === 'body' && hookData.column.index === 4) {
                const val = String(hookData.cell.raw);
                let rgb = [217, 119, 6]; // Underspend — orange
                if (val === 'Melebihi Had') rgb = [220, 38, 38];
                else if (val === 'Optimum') rgb = [22, 163, 74];
                hookData.cell.styles.textColor = rgb;
                hookData.cell.styles.fontStyle = 'bold';
              }
            };
            runTable(
              [['Sukuan', 'Tempoh', 'Belanja Kumulatif (RM)', '% drp Peruntukan', 'Status']],
              processed,
              { didParseCell: breakdownStatusHook }
            );
          } else {
            runTable(
              [['Sukuan', 'Tempoh', 'Belanja Kumulatif (RM)']],
              rows.map((r) => [r.q, r.months, parseNum(r.spend).toFixed(2)])
            );
          }
          break;
        }

        case 'logistik': {
          const { laut, darat } = prepLogistik(rows);
          const totalSea = laut.reduce((sum, r) => sum + (Number(r.qty) || 1), 0);
          const totalLand = darat.length;
          const totalAssets = totalSea + totalLand;
          const activeSea = laut.reduce((sum, r) => (r.status === 'Baik' ? sum + (Number(r.qty) || 1) : sum), 0);
          const activeLand = darat.filter((r) => r.status === 'Baik').length;
          const readiness = totalAssets > 0 ? Math.round(((activeSea + activeLand) / totalAssets) * 100) : 0;
          drawKpiGrid([
            { label: 'Total Aset', value: totalAssets },
            { label: 'Siap Siaga', value: `${readiness}%` },
          ], 2);

          if (laut.length) {
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(14, 165, 233);
            doc.text('Logistik Laut', marginLeft, y); y += 12;
            runTable(
              [['Model', 'Jenis', 'Kuantiti', 'Status']],
              laut.map((r) => [r.model, r.type, formatValue(r.qty), r.status]),
              { didParseCell: statusCellHook(3) }
            );
          }
          if (darat.length) {
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(249, 115, 22);
            doc.text('Logistik Darat', marginLeft, y); y += 12;
            runTable(
              [['Model', 'Jenis', 'No. Pendaftaran', 'Status']],
              darat.map((r) => [r.model, r.type, formatValue(r.reg), r.status]),
              { didParseCell: statusCellHook(3) }
            );
          }
          break;
        }

        case 'vehicles': {
          runTable(
            [['Nama', 'Jenis', 'Status']],
            rows.map((r) => [r.name, r.type, r.status].map(formatValue)),
            { didParseCell: statusCellHook(2) }
          );
          break;
        }

        case 'latihan': {
          const totalPax = rows.reduce((sum, r) => sum + (parseInt(r.pax) || 0), 0);
          const completed = rows.filter((r) => r.status === 'Berjaya').length;
          const completionRate = rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0;

          drawKpiGrid([
            { label: 'Total Peserta', value: totalPax },
            { label: 'Bil. Latihan', value: rows.length },
            { label: 'Prestasi', value: `${completionRate}% (${completed} Berjaya)` },
          ], 3);

          const monthsShort = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
          const monthlyCounts = new Array(12).fill(0);
          rows.forEach((r) => {
            if (r.start_date) {
              const m = new Date(r.start_date).getMonth();
              if (m >= 0 && m <= 11) monthlyCounts[m]++;
            }
          });
          if (monthlyCounts.some((c) => c > 0)) {
            ensureSpace(16);
            doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(51, 65, 85);
            doc.text('Statistik Bulanan', marginLeft, y); y += 12;
            drawBarList(
              monthsShort.map((m, i) => ({ label: m, value: monthlyCounts[i] })).filter((m) => m.value > 0),
              Math.max(...monthlyCounts, 1)
            );
          }

          const audienceGroups = {};
          rows.forEach((r) => {
            const sasarans = (r.note || 'Tiada Kumpulan Sasaran').split(',').map((s) => s.trim()).filter(Boolean);
            (sasarans.length ? sasarans : ['Tiada Kumpulan Sasaran']).forEach((k) => { audienceGroups[k] = (audienceGroups[k] || 0) + 1; });
          });
          const audienceList = Object.keys(audienceGroups)
            .map((k) => ({ label: k, value: audienceGroups[k] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
          if (audienceList.length) {
            ensureSpace(16);
            doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(51, 65, 85);
            doc.text('Kumpulan Sasaran', marginLeft, y); y += 12;
            drawBarList(audienceList, Math.max(...audienceList.map((a) => a.value), 1));
          }

          ensureSpace(16);
          doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(51, 65, 85);
          doc.text('Senarai Latihan', marginLeft, y); y += 12;
          runTable(
            [['Tajuk', 'Tarikh Mula', 'Tarikh Tamat', 'Peserta', 'Status', 'Kumpulan Sasaran']],
            rows.map((r) => [r.title, formatValue(r.start_date), formatValue(r.end_date), formatValue(r.pax), r.status, formatValue(r.note)]),
            { didParseCell: statusCellHook(4) }
          );
          break;
        }

        case 'laporan_ng999': {
          const { categories, months, grid } = prepNg999Matrix(rows);
          if (categories.length === 0 || months.length === 0) {
            emptyNote();
            break;
          }

          const monthlyTrend = months.map((m) => ({
            month: m,
            total: categories.reduce((sum, cat) => sum + (grid[cat][m] || 0), 0),
          }));
          const totalCases = monthlyTrend.reduce((sum, m) => sum + m.total, 0);

          const kpiItems = monthlyTrend.slice(-2).map((m) => ({ label: m.month, value: m.total }));
          if (monthlyTrend.length >= 2) {
            const diff = monthlyTrend[monthlyTrend.length - 1].total - monthlyTrend[monthlyTrend.length - 2].total;
            kpiItems.push({ label: 'Trend', value: diff > 0 ? `+${diff}` : String(diff) });
          }
          if (kpiItems.length) drawKpiGrid(kpiItems, 3);

          let topLabel = '-'; let topTotal = 0;
          categories.forEach((cat) => {
            const t = months.reduce((sum, m) => sum + (grid[cat][m] || 0), 0);
            if (t > topTotal) { topTotal = t; topLabel = cat; }
          });
          if (topTotal > 0) {
            ensureSpace(36);
            doc.setFillColor(255, 247, 237);
            doc.setDrawColor(249, 115, 22);
            doc.roundedRect(marginLeft, y, contentWidth, 36, 6, 6, 'FD');
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(154, 52, 18);
            doc.text('KES TERTINGGI KESELURUHAN', marginLeft + 10, y + 12);
            doc.setFontSize(11);
            doc.setTextColor(234, 88, 12);
            doc.text(String(topLabel), marginLeft + 10, y + 26);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(194, 65, 12);
            doc.text(`Menyumbang ${topTotal} daripada ${totalCases} jumlah panggilan`, marginLeft + 100, y + 26);
            y += 46;
          }

          months.forEach((month) => {
            const monthTotal = categories.reduce((sum, cat) => sum + (grid[cat][month] || 0), 0);
            if (monthTotal === 0) return;

            ensureSpace(20);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(29, 78, 216);
            doc.text(`Pecahan Kes — Bulan ${month} (Jumlah: ${monthTotal})`, marginLeft, y);
            y += 12;

            const monthRows = categories
              .filter((cat) => grid[cat][month] > 0)
              .map((cat) => {
                const val = grid[cat][month];
                const percent = monthTotal > 0 ? ((val / monthTotal) * 100).toFixed(1) : '0.0';
                return [cat, String(val), `${percent}%`];
              });

            runTable([['Kategori Kes', 'Jumlah Kes', '% drp Bulan']], monthRows);
          });
          break;
        }

        case 'jpbd_directory': {
          rows.forEach((r) => {
            const cardLines = [
              `Pegawai: ${formatValue(r.officer)}  |  Jawatan: ${formatValue(r.position)}  |  Gred: ${formatValue(r.grade)}`,
              `E-mel: ${formatValue(r.email)}`,
              `Alamat: ${formatValue(r.address)}`,
              `Tel Pejabat: ${formatValue(r.office_phone)}  |  Tel Bimbit: ${formatValue(r.mobile_phone)}  |  Fax: ${formatValue(r.fax)}`,
              `Bil. Pegawai: ${formatValue(r.officers_count)}  |  Bil. Anggota: ${formatValue(r.members_count)}`,
              `Logistik & Aset: ${formatValue(r.logistics_assets)}`,
            ];
            const wrapped = cardLines.flatMap((l) => doc.splitTextToSize(l, contentWidth - 20));
            const cardH = 18 + wrapped.length * 11;
            ensureSpace(cardH + 8);
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(marginLeft, y, contentWidth, cardH, 4, 4, 'FD');
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 58, 138);
            doc.text(r.agency, marginLeft + 10, y + 14);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(71, 85, 105);
            let ly = y + 28;
            wrapped.forEach((line) => { doc.text(line, marginLeft + 10, ly); ly += 11; });
            y += cardH + 8;
          });
          break;
        }

        case 'hotspots': {
          const grouped = prepHotspots(rows);
          Object.keys(grouped).forEach((cat) => {
            ensureSpace(18);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(29, 78, 216);
            doc.text(HOTSPOT_CATEGORY_LABELS[cat] || humanizeLabel(cat), marginLeft, y);
            y += 12;
            runTable(
              [['No. Rujukan', 'Sungai / Lokasi', 'Kawasan Terjejas']],
              grouped[cat].map((r) => [r.ref_no, r.river, r.area].map(formatValue))
            );
          });
          break;
        }

        case 'pps_list': {
          const { byType, total } = prepPpsStats(rows);
          runTable(
            [['Jenis', 'Bilangan', 'Jumlah Kapasiti (Pax)']],
            [
              ...Object.keys(byType).map((t) => [t, String(byType[t].qty), String(byType[t].capacity)]),
              [{ content: 'JUMLAH', styles: { fontStyle: 'bold' } },
                { content: String(total.qty), styles: { fontStyle: 'bold' } },
                { content: String(total.capacity), styles: { fontStyle: 'bold' } }],
            ]
          );
          runTable(
            [['Nama PPS', 'Zon', 'Jenis', 'Kapasiti', 'Status']],
            rows.map((r) => [r.name, r.zone, r.type, formatValue(r.capacity), r.status].map(formatValue)),
            { didParseCell: statusCellHook(4) }
          );
          break;
        }

        case 'home_data': {
          const d = rows[0]?.data_json || {};
          drawTextBlock(d.welcomeTitle, d.welcomeSubtitle, { titleSize: 13 });
          drawTextBlock('Peranan Utama', d.visiText);
          drawTextBlock('Kemanusiaan', d.misiText);
          break;
        }

        case 'pentadbiran_data': {
          const d = rows[0]?.data_json || {};

          if (d.dikemaskini) {
            ensureSpace(20);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(44, 62, 80);
            doc.text(`DIKEMASKINI ${d.dikemaskini}`, pageWidth / 2, y, { align: 'center' });
            y += 22;
          }

          if (d.pematuhan?.length) {
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(41, 128, 185);
            doc.text('Inspektorat Pematuhan', marginLeft, y); y += 12;
            const gap = 8;
            const boxW = (contentWidth - gap) / 2;
            const boxH = 46;
            d.pematuhan.forEach((p, i) => {
              const col = i % 2;
              if (col === 0) ensureSpace(boxH + 8);
              const x = marginLeft + col * (boxW + gap);
              const boxY = y;
              doc.setFillColor(232, 246, 243);
              doc.roundedRect(x, boxY, boxW, boxH, 5, 5, 'F');
              doc.setFontSize(15); doc.setFont(undefined, 'bold'); doc.setTextColor(26, 188, 156);
              doc.text(`${p.score}%`, x + boxW / 2, boxY + 18, { align: 'center' });
              doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(22, 160, 133);
              doc.text(String(p.title), x + boxW / 2, boxY + 29, { align: 'center', maxWidth: boxW - 12 });
              doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(127, 140, 141);
              doc.text(String(p.desc), x + boxW / 2, boxY + 39, { align: 'center', maxWidth: boxW - 12 });
              if (col === 1 || i === d.pematuhan.length - 1) y = boxY + boxH + gap;
            });
            y += 6;
          }

          if (d.waran?.length) {
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(41, 128, 185);
            doc.text('Waran Perjawatan', marginLeft, y); y += 12;
            runTable(
              [['Gred', 'KP9', 'KP5', 'KP2', 'N2', 'KP1', 'N1', 'H1', 'Jumlah']],
              d.waran.map((r) => [r.label, r.kp9, r.kp5, r.kp2, r.n2, r.kp1, r.n1, r.h1, r.jumlah].map(formatValue)),
              { headStyles: { fillColor: [236, 240, 241], textColor: [44, 62, 80], fontStyle: 'bold' } }
            );
          }

          if (d.pdpa?.length) {
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(41, 128, 185);
            doc.text('Projek PDPA Wilayah Persekutuan Labuan', marginLeft, y); y += 14;
            d.pdpa.forEach((p) => {
              const pct = parseInt(p.percent) || 0;
              ensureSpace(28);
              doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(52, 73, 94);
              const lines = doc.splitTextToSize(p.label, contentWidth - 50);
              doc.text(lines, marginLeft, y);
              y += lines.length * 11 + 2;
              doc.setFillColor(236, 240, 241);
              doc.roundedRect(marginLeft, y, contentWidth, 7, 3, 3, 'F');
              doc.setFillColor(...(pct > 10 ? [243, 156, 18] : [231, 76, 60]));
              doc.roundedRect(marginLeft, y, Math.max((contentWidth * pct) / 100, 2), 7, 3, 3, 'F');
              doc.setFontSize(8); doc.setTextColor(127, 140, 141);
              doc.text(`${pct}%`, marginLeft + contentWidth - 20, y + 6);
              y += 18;
            });
          }

          if (d.kpi?.length) {
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(41, 128, 185);
            doc.text('Key Performance Indicator (KPI)', marginLeft, y); y += 12;
            const gap = 8;
            const boxW = (contentWidth - gap) / 2;
            const boxH = 44;
            d.kpi.forEach((k, i) => {
              const col = i % 2;
              if (col === 0) ensureSpace(boxH + 8);
              const x = marginLeft + col * (boxW + gap);
              const boxY = y;
              doc.setFillColor(248, 249, 249);
              doc.setDrawColor(229, 232, 232);
              doc.roundedRect(x, boxY, boxW, boxH, 5, 5, 'FD');
              doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(52, 152, 219);
              doc.text(`0${i + 1}`, x + boxW / 2, boxY + 15, { align: 'center' });
              doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(127, 140, 141);
              doc.text(String(k.title), x + boxW / 2, boxY + 25, { align: 'center', maxWidth: boxW - 12 });
              doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.setTextColor(46, 204, 113);
              doc.text(String(k.score), x + boxW / 2, boxY + 37, { align: 'center' });
              if (col === 1 || i === d.kpi.length - 1) y = boxY + boxH + gap;
            });
            y += 6;
          }

          if (d.tanggungjawab?.length) {
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(41, 128, 185);
            doc.text('Tanggungjawab', marginLeft, y); y += 12;
            runTable(
              [['Kakitangan', 'Kehadiran Kursus', 'Tapisan Keselamatan']],
              d.tanggungjawab.map((r) => [r.name, r.kursus, r.tapisan].map(formatValue)),
              { headStyles: { fillColor: [236, 240, 241], textColor: [44, 62, 80], fontStyle: 'bold' } }
            );
          }

          if (d.unitPentadbiran?.length || d.pecahanUnit?.length) {
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(41, 128, 185);
            doc.text('Bahagian Khidmat Pengurusan', marginLeft, y); y += 14;
            (d.pecahanUnit || []).forEach((item) => {
              ensureSpace(12);
              doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(44, 62, 80);
              doc.text(`• ${item}`, marginLeft, y); y += 12;
            });
            (d.unitPentadbiran || []).forEach((item) => {
              ensureSpace(22);
              doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(44, 62, 80);
              doc.text(item.name, marginLeft, y); y += 11;
              doc.setFont(undefined, 'normal'); doc.setTextColor(127, 140, 141);
              doc.text(item.role, marginLeft, y); y += 14;
            });
          }
          break;
        }

        default: {
          const columns = getVisibleColumns(rows[0]);
          runTable(
            [columns.map((c) => getFieldLabel(key, c))],
            rows.map((r) => columns.map((c) => formatValue(r[c])))
          );
        }
      }
    }

    doc.save(`${save.name.replace(/[^a-z0-9]+/gi, '_')}.pdf`);
  };

  // ============================================================
  // PDF — MOBILE (HTML → expo-print), même logique de style par section
  // ============================================================

  const buildSaveHtml = (save, data, logoBase64) => {
    const escape = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

    const table = (headers, rows2d) => `
      <table>
        <thead><tr>${headers.map((h) => `<th>${escape(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows2d.map((r) => `<tr>${r.map((c) => `<td>${escape(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;

    // Tableau à en-tête grise, reproduisant le style des tableaux Waran/Tanggungjawab de PentadbiranArchiveView
    const ptTable = (headers, rows2d) => `
      <table class="pt-table">
        <thead><tr>${headers.map((h) => `<th>${escape(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows2d.map((r) => `<tr>${r.map((c) => `<td>${escape(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;

    const kpiGrid = (items) => `
      <div class="kpi-grid">${items.map((i) => `
        <div class="kpi-box"><div class="kpi-value">${escape(i.value)}</div><div class="kpi-label">${escape(i.label)}</div></div>
      `).join('')}</div>`;

    const barList = (items, maxVal) => `
      <div class="bar-list">${items.map((i) => `
        <div class="bar-row">
          <span class="bar-label">${escape(i.label)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${maxVal > 0 ? (i.value / maxVal) * 100 : 0}%"></div></div>
          <span class="bar-value">${escape(i.value)}</span>
        </div>`).join('')}</div>`;

    const progressRow = (label, percent) => `
      <div class="progress-row">
        <div class="progress-label">${escape(label)}</div>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.min(parseNum(percent), 100)}%"></div></div>
        <div class="progress-percent">${escape(percent)}%</div>
      </div>`;

    const sectionHtml = (key, rows) => {
      const title = `<h2>${escape(SECTION_LABELS[key] || humanizeLabel(key))}</h2>`;
      if (!rows || rows.length === 0) return `${title}<p class="empty">Aucune donnée.</p>`;

      switch (key) {
        case 'angkatan_summary': {
          const s = rows[0];
          const genderMax = Math.max(s.male_count || 0, s.female_count || 0, 1);
          return title +
            kpiGrid([{ label: 'Jumlah Anggota', value: s.total_anggota }, { label: 'Anggota Aktif', value: s.aktif_anggota }]) +
            barList([{ label: 'Lelaki', value: s.male_count || 0 }, { label: 'Wanita', value: s.female_count || 0 }], genderMax) +
            `<h3>Status Anggota</h3>` +
            kpiGrid([
              { label: 'Lulus Ujian', value: s.status_lulus }, { label: 'Lantikan Baru', value: s.status_lantikan },
              { label: 'Simpanan', value: s.status_simpanan }, { label: 'Aktif Penugasan', value: s.status_aktif },
            ]);
        }
        case 'angkatan_categories':
          return title + table(['Kategori', 'Bilangan'], rows.map((r) => [r.name, r.count]));
        case 'angkatan_ranks':
          return title + table(['Peringkat', 'Lulus', 'Naik', 'KBP', 'PTB', 'Aktif', 'Simpanan'],
            rows.map((r) => [r.rank, r.lulus, r.kenaikan, r.kbp, r.ptb, r.aktif, r.simpanan]));
        case 'angkatan_pyramid': {
          const sorted = prepPyramid(rows);
          const maxVal = Math.max(...sorted.map((r) => r.total || 0), 1);
          return title + barList(sorted.map((r) => ({ label: r.rank, value: r.total })), maxVal);
        }
        case 'angkatan_community':
          return title + table(['Kategori', 'Nama', 'Butiran'], rows.map((r) => [r.category, r.label, r.detail]));
        case 'kewangan_budget': {
          const prepped = prepKewanganBudget(rows);
          const blocks = prepped.categories.map((cat) => `
            <h3>${escape(cat.kategori)}</h3>
            ${table(['Perihal', 'Agihan (RM)', 'Belanja (RM)', 'Baki (RM)'],
              [...cat.items.map((it) => [it.perihal, it.agihan.toFixed(2), it.belanja.toFixed(2), it.baki.toFixed(2)]),
                ['Subtotal', cat.subtotal.agihan.toFixed(2), cat.subtotal.belanja.toFixed(2), cat.subtotal.baki.toFixed(2)]])}
          `).join('');
          return title + blocks + `<p class="grand-total">JUMLAH — Agihan: RM ${prepped.grandTotal.agihan.toFixed(2)} | Belanja: RM ${prepped.grandTotal.belanja.toFixed(2)} | Baki: RM ${prepped.grandTotal.baki.toFixed(2)}</p>`;
        }
        case 'kewangan_breakdown': {
          const totalAllocation = parseNum(data.kewangan_summary?.[0]?.total_allocation);
          if (totalAllocation > 0) {
            const processed = rows.map((item, index) => {
              const current = parseNum(item.spend);
              const prev = index > 0 ? parseNum(rows[index - 1].spend) : 0;
              const percent = ((current - prev) / totalAllocation) * 100;
              let statusText = 'Underspend';
              if (percent > 25) statusText = 'Melebihi Had';
              else if (percent >= 25 * 0.85) statusText = 'Optimum';
              return [item.q, item.months, current.toFixed(2), `${percent.toFixed(2)}%`, statusText];
            });
            return title + table(['Sukuan', 'Tempoh', 'Belanja Kumulatif (RM)', '% drp Peruntukan', 'Status'], processed);
          }
          return title + table(['Sukuan', 'Tempoh', 'Belanja Kumulatif (RM)'], rows.map((r) => [r.q, r.months, parseNum(r.spend).toFixed(2)]));
        }
        case 'logistik': {
          const { laut, darat } = prepLogistik(rows);
          const totalSea = laut.reduce((sum, r) => sum + (Number(r.qty) || 1), 0);
          const totalLand = darat.length;
          const totalAssets = totalSea + totalLand;
          const activeSea = laut.reduce((sum, r) => (r.status === 'Baik' ? sum + (Number(r.qty) || 1) : sum), 0);
          const activeLand = darat.filter((r) => r.status === 'Baik').length;
          const readiness = totalAssets > 0 ? Math.round(((activeSea + activeLand) / totalAssets) * 100) : 0;
          let html = title + kpiGrid([{ label: 'Total Aset', value: totalAssets }, { label: 'Siap Siaga', value: `${readiness}%` }]);
          if (laut.length) html += `<h3>Logistik Laut</h3>${table(['Model', 'Jenis', 'Kuantiti', 'Status'], laut.map((r) => [r.model, r.type, r.qty, r.status]))}`;
          if (darat.length) html += `<h3>Logistik Darat</h3>${table(['Model', 'Jenis', 'No. Pendaftaran', 'Status'], darat.map((r) => [r.model, r.type, r.reg, r.status]))}`;
          return html;
        }
        case 'vehicles':
          return title + table(['Nama', 'Jenis', 'Status'], rows.map((r) => [r.name, r.type, r.status]));
        case 'latihan': {
          const totalPax = rows.reduce((sum, r) => sum + (parseInt(r.pax) || 0), 0);
          const completed = rows.filter((r) => r.status === 'Berjaya').length;
          const completionRate = rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0;

          const monthsShort = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
          const monthlyCounts = new Array(12).fill(0);
          rows.forEach((r) => {
            if (r.start_date) {
              const m = new Date(r.start_date).getMonth();
              if (m >= 0 && m <= 11) monthlyCounts[m]++;
            }
          });
          const maxMonth = Math.max(...monthlyCounts, 1);
          const monthlyItems = monthsShort.map((m, i) => ({ label: m, value: monthlyCounts[i] })).filter((m) => m.value > 0);

          const audienceGroups = {};
          rows.forEach((r) => {
            const sasarans = (r.note || 'Tiada Kumpulan Sasaran').split(',').map((s) => s.trim()).filter(Boolean);
            (sasarans.length ? sasarans : ['Tiada Kumpulan Sasaran']).forEach((k) => { audienceGroups[k] = (audienceGroups[k] || 0) + 1; });
          });
          const audienceList = Object.keys(audienceGroups).map((k) => ({ label: k, value: audienceGroups[k] })).sort((a, b) => b.value - a.value).slice(0, 5);
          const audienceMax = Math.max(...audienceList.map((a) => a.value), 1);

          return title +
            kpiGrid([
              { label: 'Total Peserta', value: totalPax },
              { label: 'Bil. Latihan', value: rows.length },
              { label: 'Prestasi', value: `${completionRate}% (${completed} Berjaya)` },
            ]) +
            (monthlyItems.length ? `<h3>Statistik Bulanan</h3>${barList(monthlyItems, maxMonth)}` : '') +
            (audienceList.length ? `<h3>Kumpulan Sasaran</h3>${barList(audienceList, audienceMax)}` : '') +
            `<h3>Senarai Latihan</h3>` +
            table(['Tajuk', 'Tarikh Mula', 'Tarikh Tamat', 'Peserta', 'Status', 'Kumpulan Sasaran'],
              rows.map((r) => [r.title, formatValue(r.start_date), formatValue(r.end_date), r.pax, r.status, r.note]));
        }
        case 'laporan_ng999': {
          const { categories, months, grid } = prepNg999Matrix(rows);
          if (!categories.length || !months.length) return title + '<p class="empty">Aucune donnée.</p>';

          const monthlyTrend = months.map((m) => ({ month: m, total: categories.reduce((sum, cat) => sum + (grid[cat][m] || 0), 0) }));
          const totalCases = monthlyTrend.reduce((sum, m) => sum + m.total, 0);
          const kpiItems = monthlyTrend.slice(-2).map((m) => ({ label: m.month, value: m.total }));
          if (monthlyTrend.length >= 2) {
            const diff = monthlyTrend[monthlyTrend.length - 1].total - monthlyTrend[monthlyTrend.length - 2].total;
            kpiItems.push({ label: 'Trend', value: diff > 0 ? `+${diff}` : String(diff) });
          }

          let topLabel = '-'; let topTotal = 0;
          categories.forEach((cat) => {
            const t = months.reduce((sum, m) => sum + (grid[cat][m] || 0), 0);
            if (t > topTotal) { topTotal = t; topLabel = cat; }
          });
          const highlightHtml = topTotal > 0 ? `
            <div class="highlight-card">
              <div class="highlight-title">KES TERTINGGI KESELURUHAN</div>
              <div class="highlight-label">${escape(topLabel)}</div>
              <div class="highlight-sub">Menyumbang ${topTotal} daripada ${totalCases} jumlah panggilan</div>
            </div>` : '';

          const monthsHtml = months.map((month) => {
            const monthTotal = categories.reduce((sum, cat) => sum + (grid[cat][month] || 0), 0);
            if (monthTotal === 0) return '';
            const monthRows = categories
              .filter((cat) => grid[cat][month] > 0)
              .map((cat) => {
                const val = grid[cat][month];
                const percent = ((val / monthTotal) * 100).toFixed(1);
                return [cat, val, `${percent}%`];
              });
            return `<h3>Pecahan Kes — Bulan ${escape(month)} (Jumlah: ${monthTotal})</h3>${table(['Kategori Kes', 'Jumlah Kes', '% drp Bulan'], monthRows)}`;
          }).join('');

          return title + (kpiItems.length ? kpiGrid(kpiItems) : '') + highlightHtml + monthsHtml;
        }
        case 'jpbd_directory':
          return title + rows.map((r) => `
            <div class="card">
              <div class="card-title">${escape(r.agency)}</div>
              <div class="card-line">Pegawai: ${escape(r.officer)} | Jawatan: ${escape(r.position)} | Gred: ${escape(r.grade)}</div>
              <div class="card-line">E-mel: ${escape(r.email)}</div>
              <div class="card-line">Alamat: ${escape(r.address)}</div>
              <div class="card-line">Tel Pejabat: ${escape(r.office_phone)} | Tel Bimbit: ${escape(r.mobile_phone)} | Fax: ${escape(r.fax)}</div>
              <div class="card-line">Bil. Pegawai: ${escape(r.officers_count)} | Bil. Anggota: ${escape(r.members_count)}</div>
              <div class="card-line">Logistik & Aset: ${escape(r.logistics_assets)}</div>
            </div>`).join('');
        case 'hotspots': {
          const grouped = prepHotspots(rows);
          return title + Object.keys(grouped).map((cat) => `
            <h3>${escape(HOTSPOT_CATEGORY_LABELS[cat] || humanizeLabel(cat))}</h3>
            ${table(['No. Rujukan', 'Sungai / Lokasi', 'Kawasan Terjejas'], grouped[cat].map((r) => [r.ref_no, r.river, r.area]))}
          `).join('');
        }
        case 'pps_list': {
          const { byType, total } = prepPpsStats(rows);
          return title +
            table(['Jenis', 'Bilangan', 'Jumlah Kapasiti (Pax)'],
              [...Object.keys(byType).map((t) => [t, byType[t].qty, byType[t].capacity]), ['JUMLAH', total.qty, total.capacity]]) +
            table(['Nama PPS', 'Zon', 'Jenis', 'Kapasiti', 'Status'], rows.map((r) => [r.name, r.zone, r.type, r.capacity, r.status]));
        }
        case 'home_data': {
          const d = rows[0]?.data_json || {};
          return title + `
            <h3>${escape(d.welcomeTitle)}</h3>
            <p>${escape(d.welcomeSubtitle)}</p>
            <h3>Peranan Utama</h3><p>${escape(d.visiText)}</p>
            <h3>Kemanusiaan</h3><p>${escape(d.misiText)}</p>`;
        }
        case 'pentadbiran_data': {
          const d = rows[0]?.data_json || {};
          let html = `<h2>${escape(SECTION_LABELS.pentadbiran_data)}</h2>`;

          if (d.dikemaskini) {
            html += `<div class="pt-card"><div class="pt-header-title">DIKEMASKINI ${escape(d.dikemaskini)}</div></div>`;
          }

          if (d.pematuhan?.length) {
            html += `<div class="pt-card">
              <div class="pt-section-title">INSPEKTORAT PEMATUHAN</div>
              <div class="pt-compliance-row">
                ${d.pematuhan.map((item) => `
                  <div class="pt-compliance-box">
                    <div class="pt-compliance-score">${escape(item.score)}%</div>
                    <div class="pt-compliance-title">${escape(item.title)}</div>
                    <div class="pt-compliance-desc">${escape(item.desc)}</div>
                  </div>`).join('')}
              </div>
            </div>`;
          }

          if (d.waran?.length) {
            html += `<div class="pt-card">
              <div class="pt-section-title" style="text-align:center;">WARAN PERJAWATAN</div>
              ${ptTable(['GRED', 'KP9', 'KP5', 'KP2', 'N2', 'KP1', 'N1', 'H1', 'JUMLAH'],
                d.waran.map((r) => [r.label, r.kp9, r.kp5, r.kp2, r.n2, r.kp1, r.n1, r.h1, r.jumlah]))}
            </div>`;
          }

          if (d.pdpa?.length) {
            html += `<div class="pt-card">
              <div class="pt-section-title">PROJEK PDPA WILAYAH PERSEKUTUAN LABUAN</div>
              ${d.pdpa.map((item) => {
                const pct = parseInt(item.percent) || 0;
                const barColor = pct > 10 ? '#f39c12' : '#e74c3c';
                return `
                <div class="pt-progress-item">
                  <div class="pt-progress-label">${escape(item.label)}</div>
                  <div class="pt-progress-bg"><div class="pt-progress-fill" style="width:${pct}%;background:${barColor};"></div></div>
                  <div class="pt-progress-percent">${pct}%</div>
                </div>`;
              }).join('')}
            </div>`;
          }

          if (d.kpi?.length) {
            html += `<div class="pt-card">
              <div class="pt-section-title">KEY PERFORMANCE INDICATOR (KPI)</div>
              <div class="pt-kpi-grid">
                ${d.kpi.map((item, index) => `
                  <div class="pt-kpi-card">
                    <div class="pt-kpi-number">0${index + 1}</div>
                    <div class="pt-kpi-text">${escape(item.title)}</div>
                    <div class="pt-kpi-score">${escape(item.score)}</div>
                  </div>`).join('')}
              </div>
            </div>`;
          }

          if (d.tanggungjawab?.length) {
            html += `<div class="pt-card">
              <div class="pt-section-title" style="text-align:center;">TANGGUNGJAWAB</div>
              ${ptTable(['KAKITANGAN', 'KEHADIRAN KURSUS', 'TAPISAN KESELAMATAN'],
                d.tanggungjawab.map((r) => [r.name, r.kursus, r.tapisan]))}
            </div>`;
          }

          if (d.pecahanUnit?.length || d.unitPentadbiran?.length) {
            html += `<div class="pt-card">
              <div class="pt-section-title">BAHAGIAN KHIDMAT PENGURUSAN</div>
              <div class="pt-unit-container">
                ${d.pecahanUnit?.length ? `
                  <div class="pt-unit-box">
                    <div class="pt-box-title">PECAHAN UNIT</div>
                    ${d.pecahanUnit.map((i) => `<div class="pt-list-item">• ${escape(i)}</div>`).join('')}
                  </div>` : ''}
                ${d.unitPentadbiran?.length ? `
                  <div class="pt-unit-box">
                    <div class="pt-box-title">UNIT PENTADBIRAN</div>
                    ${d.unitPentadbiran.map((i) => `
                      <div style="margin-bottom:8px;">
                        <div class="pt-list-item">${escape(i.name)}</div>
                        <div class="pt-sub-list-item">${escape(i.role)}</div>
                      </div>`).join('')}
                  </div>` : ''}
              </div>
            </div>`;
          }

          return html;
        }
        default: {
          const columns = getVisibleColumns(rows[0]);
          return title + table(columns.map((c) => getFieldLabel(key, c)), rows.map((r) => columns.map((c) => formatValue(r[c]))));
        }
      }
    };

    const departmentHeaderHtml = (dept) => `
      <div class="dept-header" style="border-left-color:${dept.color};"><span>${escape(dept.label)}</span></div>`;

    const kewanganHeaderCardHtml = (sm) => `
      <div class="kewangan-header">
        <div class="kewangan-header-title">${escape(sm.title || '')}</div>
        <div class="kewangan-header-year">Tahun Kewangan ${escape(sm.year || '')}</div>
        <div class="kewangan-header-total">Jumlah Peruntukan: RM ${parseNum(sm.total_allocation).toFixed(2)}</div>
      </div>`;

    const bodyHtml = DEPARTMENTS.map((dept) => {
      const presentKeys = dept.keys.filter((k) => k !== 'kewangan_summary' && k in data);
      if (presentKeys.length === 0) return '';

      let deptHtml = departmentHeaderHtml(dept);
      if (dept.key === 'kewangan' && data.kewangan_summary?.[0]) {
        deptHtml += kewanganHeaderCardHtml(data.kewangan_summary[0]);
      }
      deptHtml += presentKeys.map((key) => sectionHtml(key, data[key])).join('');
      return deptHtml;
    }).join('');

    return `
      <html><head><meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
        h1 { font-size: 20px; margin-bottom: 4px; text-align: center; }
        .logo-wrap { text-align: center; margin-bottom: 24px; }
        .logo-wrap img { width: 110px; height: 110px; }
        .subtitle { color: #64748b; font-size: 12px; margin-bottom: 24px; text-align: center; }
        .dept-header { border-left-width: 4px; border-left-style: solid; padding-left: 10px; margin-top: 22px; margin-bottom: 10px; }
        .dept-header span { font-size: 16px; font-weight: 800; color: #0f172a; }
        .kewangan-header { background: #1e40af; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; }
        .kewangan-header-title { color: #dbeafe; font-size: 10px; }
        .kewangan-header-year { color: #ffffff; font-size: 14px; font-weight: 800; margin: 2px 0 6px; }
        .kewangan-header-total { color: #ffffff; font-size: 11px; font-weight: 700; }
        h2 { font-size: 15px; margin-top: 24px; margin-bottom: 8px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        h3 { font-size: 12px; margin-top: 14px; margin-bottom: 6px; color: #1e40af; }
        .empty { color: #94a3b8; font-style: italic; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #e2e8f0; padding: 5px 7px; font-size: 10px; text-align: left; }
        th { background-color: #3b82f6; color: #fff; font-weight: 700; }
        .kpi-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
        .kpi-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; width: 22%; }
        .kpi-value { font-size: 15px; font-weight: 800; color: #1e40af; }
        .kpi-label { font-size: 8px; color: #64748b; margin-top: 2px; }
        .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .bar-label { width: 100px; font-size: 10px; font-weight: 700; color: #1e293b; }
        .bar-track { flex: 1; background: #e2e8f0; border-radius: 4px; height: 12px; overflow: hidden; }
        .bar-fill { background: #3b82f6; height: 100%; }
        .bar-value { font-size: 10px; color: #334155; width: 30px; }
        .progress-row { margin-bottom: 8px; }
        .progress-label { font-size: 10px; color: #334155; margin-bottom: 3px; }
        .progress-track { background: #e2e8f0; border-radius: 3px; height: 7px; overflow: hidden; }
        .progress-fill { background: #f97316; height: 100%; }
        .progress-percent { font-size: 8px; color: #94a3b8; text-align: right; }
        .grand-total { font-size: 10px; font-weight: 700; color: #0f172a; }
        .highlight-card { background: #fff7ed; border: 1px solid #f97316; border-radius: 8px; padding: 10px 12px; margin: 8px 0 12px; }
        .highlight-title { font-size: 8px; font-weight: 800; color: #9a3412; text-transform: uppercase; margin-bottom: 4px; }
        .highlight-label { font-size: 14px; font-weight: 900; color: #ea580c; }
        .highlight-sub { font-size: 9px; color: #c2410c; margin-top: 2px; }

        /* Pentadbiran — reproduit les couleurs exactes de PentadbiranArchiveView.js */
        .pt-card { background: #ffffff; border-radius: 10px; padding: 14px; margin-bottom: 14px; border: 1px solid #e5e8e8; }
        .pt-header-title { font-size: 13px; font-weight: 700; color: #2c3e50; text-align: center; }
        .pt-section-title { font-size: 12px; font-weight: 700; color: #2980b9; margin-bottom: 10px; border-bottom: 1px solid #ecf0f1; padding-bottom: 4px; }
        .pt-compliance-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .pt-compliance-box { flex: 1; min-width: 45%; background: #e8f6f3; border-radius: 8px; padding: 10px; text-align: center; }
        .pt-compliance-score { font-size: 18px; font-weight: 700; color: #1abc9c; margin-bottom: 4px; }
        .pt-compliance-title { font-size: 10px; font-weight: 700; color: #16a085; margin-bottom: 3px; }
        .pt-compliance-desc { font-size: 9px; color: #7f8c8d; }
        .pt-progress-item { margin-bottom: 10px; }
        .pt-progress-label { font-size: 10px; color: #34495e; margin-bottom: 4px; }
        .pt-progress-bg { height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden; }
        .pt-progress-fill { height: 100%; }
        .pt-progress-percent { font-size: 9px; color: #7f8c8d; text-align: right; margin-top: 2px; font-weight: 700; }
        .pt-kpi-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .pt-kpi-card { width: 47%; background: #f8f9f9; border: 1px solid #e5e8e8; border-radius: 8px; padding: 10px; text-align: center; }
        .pt-kpi-number { font-size: 14px; font-weight: 700; color: #3498db; margin-bottom: 3px; }
        .pt-kpi-text { font-size: 9px; color: #7f8c8d; margin-bottom: 6px; }
        .pt-kpi-score { font-size: 13px; font-weight: 700; color: #2ecc71; }
        .pt-unit-container { display: flex; gap: 8px; }
        .pt-unit-box { flex: 1; background: #f8f9f9; border-radius: 8px; padding: 8px; }
        .pt-box-title { font-size: 10px; font-weight: 700; color: #34495e; margin-bottom: 6px; }
        .pt-list-item { font-size: 10px; color: #2c3e50; margin-bottom: 2px; }
        .pt-sub-list-item { font-size: 9px; color: #7f8c8d; margin-left: 10px; font-style: italic; }
        .pt-table th { background-color: #ecf0f1; color: #2c3e50; }
        .pt-table td, .pt-table th { text-align: center; }
        .pt-table td:first-child, .pt-table th:first-child { text-align: left; font-weight: 700; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; }
        .card-title { font-size: 11px; font-weight: 800; color: #1e3a8a; margin-bottom: 3px; }
        .card-line { font-size: 9px; color: #475569; margin-bottom: 1px; }
      </style></head>
      <body>
        ${logoBase64 ? `<div class="logo-wrap"><img src="${logoBase64}" /></div>` : ''}
        <h1>${escape(save.name)}</h1>
        <div class="subtitle">Disimpan pada ${escape(new Date(save.created_at).toLocaleString())}</div>
        ${bodyHtml}
      </body></html>`;
  };

  const handleExportPDF = async () => {
    if (!selectedSave || !snapshotData) return;

    setIsExporting(true);
    try {
      const logoBase64 = await getLogoBase64();

      if (Platform.OS === 'web') {
        exportPdfWeb(selectedSave, snapshotData, logoBase64);
      } else {
        const html = buildSaveHtml(selectedSave, snapshotData, logoBase64);
        const { uri } = await Print.printToFileAsync({ html });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('PDF généré', `Fichier créé à : ${uri}`);
        }
      }
    } catch (err) {
      console.error('Erreur handleExportPDF:', err);
      Alert.alert('Ralat', "Gagal menjana PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  if (selectedSave) {
    return (
      <View style={{ flex: 1, backgroundColor: theme?.background || '#fff' }}>
        <TouchableOpacity
          onPress={closeSaveDetail}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#e2e8f0' }}
        >
          <ChevronLeft size={20} color={theme?.text || '#000'} />
          <Text style={{ marginLeft: 4, fontWeight: '700', fontSize: 15, color: theme?.text || '#000' }}>Kembali ke Senarai</Text>
        </TouchableOpacity>

        <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontWeight: '900', fontSize: 22, color: theme?.text || '#000' }}>{selectedSave.name}</Text>
            <Text style={{ fontSize: 15, color: '#64748b', marginTop: 2 }}>
              Disimpan pada {new Date(selectedSave.created_at).toLocaleString()}
            </Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={handleExportPDF}
              disabled={isExporting || loadingDetail || !snapshotData}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
                opacity: (isExporting || loadingDetail || !snapshotData) ? 0.5 : 1,
                marginRight: 8,
              }}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FileDown size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 6 }}>Eksport PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => confirmDeleteSave(selectedSave)}
              disabled={deletingId === selectedSave.id}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: '#ef4444', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
                opacity: deletingId === selectedSave.id ? 0.5 : 1,
              }}
            >
              {deletingId === selectedSave.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Trash2 size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 6 }}>Padam</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loadingDetail ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : (
          renderDepartmentView()
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme?.background || '#fff' }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ fontWeight: '700', marginBottom: 8, color: theme?.text || '#000' }}>Simpanan Baharu</Text>
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            value={newSaveName}
            onChangeText={setNewSaveName}
            placeholder="Cth: Simpanan sebelum mesyuarat bulanan"
            style={{ flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }}
          />
          <TouchableOpacity
            onPress={handleCreateSave}
            disabled={isSaving}
            style={{ backgroundColor: '#3b82f6', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8, opacity: isSaving ? 0.5 : 1 }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700' }}>Simpan</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={saves}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#64748b' }}>Tiada simpanan buat masa ini.</Text>
          }
        />
      )}
    </View>
  );
}
