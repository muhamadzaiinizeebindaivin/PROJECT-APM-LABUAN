// src/screen/SaveManagementScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
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

const getVisibleColumns = (row) => Object.keys(row).filter((k) => !HIDDEN_COLUMNS.includes(k));

// ============================================================
// DATA PREP
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

  const renderDepartmentView = () => {
    const presentDepartments = DEPARTMENTS.filter(
      (dept) => dept.keys.filter((k) => snapshotData && k in snapshotData).length > 0
    );

    return (
      <View style={{ flex: 1 }}>
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

  // PDF export functionality removed

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