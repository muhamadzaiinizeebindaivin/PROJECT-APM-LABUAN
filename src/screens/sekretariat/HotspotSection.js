// src/screens/sekretariat/HotspotSection.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Image, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Droplets, Waves, Mountain, MapPin, Plus, Edit, Trash2, X, Users,
  Flame, Wind, Tornado, CloudRain, CloudLightning, CloudFog, Zap,
  Sun, Snowflake, Umbrella, TreePine, Trees, Globe, Bug,
  AlertTriangle, Biohazard, Radiation, Siren, ShieldAlert, LifeBuoy,
  Factory, Building2, Home, Tent, Warehouse, Landmark,
  Ship, Anchor, Truck, Car, Plane, Fuel, Maximize2, Camera, ClipboardList, Calendar, ChevronDown, ChevronUp, BarChart2, ChevronLeft, ChevronRight, FileDown,
} from 'lucide-react-native';
import { generateKejadianPdf } from '../../utils/agencyReportsPdf';
import { useHotspots } from '../../hooks/useHotspots';
import { useHotspotCategories } from '../../hooks/useHotspotCategories';
import { useHotspotKejadian } from '../../hooks/useHotspotKejadian';
import { useKejadianPhoto } from '../../hooks/useKejadianPhoto';
import { appStyles as styles } from '../../styles/appStyles';
import { PALETTE } from '../../constants/palette';

// Scrollbar toujours visible sur web
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('hotspot-scrollbar-css')) {
  const style = document.createElement('style');
  style.id = 'hotspot-scrollbar-css';
  style.textContent = `
    .hotspot-pills-scroll::-webkit-scrollbar { height: 8px; }
    .hotspot-pills-scroll::-webkit-scrollbar-track { background: #00000010; border-radius: 4px; }
    .hotspot-pills-scroll::-webkit-scrollbar-thumb { background: #F97316; border-radius: 4px; }
    .hotspot-pills-scroll { scrollbar-width: thin; scrollbar-color: #F97316 #00000010; }
  `;
  document.head.appendChild(style);
}

// Registre d'icônes sélectionnables (nom stocké en base → composant)
const ICONS = {
  MapPin, Droplets, Waves, Mountain,
  Flame, Wind, Tornado, CloudRain, CloudLightning, CloudFog, Zap,
  Sun, Snowflake, Umbrella, TreePine, Trees, Globe, Bug,
  AlertTriangle, Biohazard, Radiation, Siren, ShieldAlert, LifeBuoy,
  Factory, Building2, Home, Tent, Warehouse, Landmark,
  Ship, Anchor, Truck, Car, Plane, Fuel,
};
const resolveIcon = (cat) => ICONS[cat?.icon] || MapPin;

const COLOR_CHOICES = ['#3B82F6', '#d97706', '#EA580C', '#16A34A', '#9333EA', '#DC2626', '#0891B2'];
const DEFAULT_PREFIX = 'NO.';

// Style calqué sur appStyles.input, pour le <input type="date"> HTML natif (web uniquement)
const webDateInput = {
  width: '100%',
  boxSizing: 'border-box',
  border: `1px solid ${PALETTE.cardLightBorder}`,
  borderRadius: 10,
  padding: 12,
  fontSize: 14,
  color: PALETTE.textDark,
  backgroundColor: '#fafafa',
  outline: 'none',
  fontFamily: 'inherit',
};
const PREFIX_CHOICES = ['ID', 'NO.', 'REF', 'Bil', 'Lain-lain'];

import HoverTip from '../../components/HoverTip';

function MapImage({ source, caption }) {
  const [containerWidth, setContainerWidth] = useState(1);
  const [aspect, setAspect] = useState(1197 / 673); // fallback raisonnable tant que non chargée
  const [fullscreen, setFullscreen] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  return (
    <View
      style={hotspotStyles.mapCard}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 20)} // moins le padding horizontal (10+10)
    >
      <TouchableOpacity activeOpacity={0.9} onPress={() => setFullscreen(true)} style={{ width: '100%' }}>
        {isMobile ? (
          <Image
            source={source}
            style={[hotspotStyles.mapImage, { height: containerWidth / aspect }]}
            resizeMode="contain"
            onLoad={(e) => {
              const { width: w, height: h } = e.nativeEvent.source || {};
              if (w && h) setAspect(w / h);
            }}
          />
        ) : (
          <Image source={source} style={[hotspotStyles.mapImage, { height: 420 }]} resizeMode="contain" />
        )}
        <View style={hotspotStyles.mapZoomHint}>
          <Maximize2 size={12} color="#fff" />
          <Text style={hotspotStyles.mapZoomHintText}>Klik untuk besarkan</Text>
        </View>
      </TouchableOpacity>
      <Text style={hotspotStyles.mapCaption}>{caption}</Text>

      <Modal visible={fullscreen} transparent animationType="fade" onRequestClose={() => setFullscreen(false)}>
        <View style={hotspotStyles.mapFullscreenOverlay}>
          <TouchableOpacity style={hotspotStyles.mapFullscreenClose} onPress={() => setFullscreen(false)}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <Image source={source} style={hotspotStyles.mapFullscreenImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}

function KejadianPhotoCard({ photoUrl, canEdit, uploading, onUpload }) {
  const [fullscreen, setFullscreen] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  if (!photoUrl) {
    return canEdit ? (
      <TouchableOpacity style={hotspotStyles.photoUploadEmpty} onPress={onUpload} disabled={uploading} activeOpacity={0.8}>
        {uploading ? <ActivityIndicator color={PALETTE.orange} /> : (
          <>
            <Camera size={28} color={PALETTE.orange} />
            <Text style={hotspotStyles.photoUploadEmptyText}>Muat Naik Gambar Kejadian Biasa</Text>
          </>
        )}
      </TouchableOpacity>
    ) : (
      <View style={hotspotStyles.photoEmptyReadOnly}>
        <Camera size={22} color={PALETTE.textMutedDark} />
        <Text style={hotspotStyles.photoEmptyReadOnlyText}>Belum ada gambar untuk kategori ini buat masa ini.</Text>
      </View>
    );
  }

  return (
    <View style={hotspotStyles.mapCard}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setFullscreen(true)} style={{ width: '100%' }}>
        <Image
          source={{ uri: photoUrl }}
          style={[hotspotStyles.mapImage, { height: isMobile ? 220 : 420 }]}
          resizeMode="contain"
        />
        <View style={hotspotStyles.mapZoomHint}>
          <Maximize2 size={12} color="#fff" />
          <Text style={hotspotStyles.mapZoomHintText}>Klik untuk besarkan</Text>
        </View>
      </TouchableOpacity>
      <Text style={hotspotStyles.mapCaption}>Gambar Kejadian Biasa</Text>

      {canEdit ? (
        <TouchableOpacity style={hotspotStyles.photoReplaceBtn} onPress={onUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator size="small" color={PALETTE.orange} /> : (
            <>
              <Camera size={14} color={PALETTE.orange} />
              <Text style={hotspotStyles.photoReplaceBtnText}>Tukar Gambar</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      <Modal visible={fullscreen} transparent animationType="fade" onRequestClose={() => setFullscreen(false)}>
        <View style={hotspotStyles.mapFullscreenOverlay}>
          <TouchableOpacity style={hotspotStyles.mapFullscreenClose} onPress={() => setFullscreen(false)}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: photoUrl }} style={hotspotStyles.mapFullscreenImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}

export default function HotspotSection({ userRole, isEditMode, onNotify }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const [selectedCat, setSelectedCat] = useState(null);

  const {
    hotspotList, loadingHotspot,
    modalHotspotVisible, setModalHotspotVisible,
    formModeHotspot, formHotspot, setFormHotspot,
    openAddModal, openEditModal,
    handleSaveHotspot, confirmDeleteHotspot,
  } = useHotspots(onNotify);
  const { categories, loadingCategories, addCategory, updateCategory, deleteCategory, updateCategoryPhoto } = useHotspotCategories(onNotify);
  const {
    kejadianList, loadingKejadian,
    modalKejadianVisible, setModalKejadianVisible,
    formModeKejadian, formKejadian, setFormKejadian,
    openAddKejadianModal, openEditKejadianModal,
    handleSaveKejadian, confirmDeleteKejadian,
  } = useHotspotKejadian(onNotify);
  const { pickAndUploadKejadianPhoto, uploadingKejadianPhoto } = useKejadianPhoto();
  const [activeSubTab, setActiveSubTab] = useState('lokasi'); // 'lokasi' | 'kejadian'
  const [showTarikhPicker, setShowTarikhPicker] = useState(false);
  const [kejadianHotspotId, setKejadianHotspotId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const displayDetailItemRef = useRef(null);
  if (detailItem) displayDetailItemRef.current = detailItem;

  // ---- Champ koordonnées combiné (format Google Maps: "lat, lng") ----
  const [coordsText, setCoordsText] = useState('');
  useEffect(() => {
    if (modalHotspotVisible) {
      setCoordsText(
        formHotspot.latitude && formHotspot.longitude
          ? `${formHotspot.latitude}, ${formHotspot.longitude}`
          : ''
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalHotspotVisible]);

  const handleCoordsChange = (raw) => {
    const cleaned = raw.replace(/[^0-9.\-,\s]/g, '');
    setCoordsText(cleaned);
    const parts = cleaned.split(',').map((s) => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setFormHotspot({ ...formHotspot, latitude: parts[0], longitude: parts[1] });
      }
    }
  };

  // ---- Modale de gestion de catégorie ----
  const [modalCatVisible, setModalCatVisible] = useState(false);
  const [formCat, setFormCat] = useState({ label: '', sub: '', color: COLOR_CHOICES[0], prefix: DEFAULT_PREFIX, icon: 'MapPin' });
  const [editingCatId, setEditingCatId] = useState(null); // null = ajout, sinon = modification de cette catégorie

  // Sélectionne la 1re catégorie au chargement
  useEffect(() => {
    if (!selectedCat && categories.length > 0) setSelectedCat(categories[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const currentCat = categories.find((c) => c.key === selectedCat) || null;
  const currentColor = currentCat?.color || PALETTE.orange;
  const currentData = currentCat
    ? hotspotList
        .filter((h) => h.category === currentCat.key)
        .slice()
        .sort((a, b) => {
          const numA = parseFloat(a.ref_no);
          const numB = parseFloat(b.ref_no);
          const validA = !isNaN(numA);
          const validB = !isNaN(numB);
          if (validA && validB && numA !== numB) return numA - numB;
          if (validA !== validB) return validA ? -1 : 1;
          // Nombor rujukan sama atau bukan angka: susun ikut teks ref_no
          return String(a.ref_no || '').localeCompare(String(b.ref_no || ''));
        })
    : [];
  const [kejadianFilterYear, setKejadianFilterYear] = useState(null); // null = tous
  const [kejadianFilterMonth, setKejadianFilterMonth] = useState(null); // null = tous, 0-11 sinon
  const [kejadianYearDropdownOpen, setKejadianYearDropdownOpen] = useState(false);
  const [kejadianMonthDropdownOpen, setKejadianMonthDropdownOpen] = useState(false);
  const [lokasiPage, setLokasiPage] = useState(0);

  const currentKejadianDataAll = currentCat ? kejadianList.filter((k) => k.category === currentCat.key) : [];

  const kejadianAvailableYears = React.useMemo(() => {
    const years = new Set(
      currentKejadianDataAll
        .filter((k) => k.tarikh)
        .map((k) => new Date(k.tarikh).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [currentKejadianDataAll]);

  const currentKejadianData = currentKejadianDataAll.filter((k) => {
    if (!k.tarikh) return kejadianFilterYear === null && kejadianFilterMonth === null;
    const d = new Date(k.tarikh);
    if (kejadianFilterYear !== null && d.getFullYear() !== kejadianFilterYear) return false;
    if (kejadianFilterMonth !== null && d.getMonth() !== kejadianFilterMonth) return false;
    return true;
  });
  const CurrentIcon = resolveIcon(currentCat);

  useEffect(() => {
    setActiveSubTab('lokasi');
    setKejadianFilterYear(null);
    setKejadianFilterMonth(null);
    setLokasiPage(0);
  }, [selectedCat]);

  const closeCatModal = () => {
    setModalCatVisible(false);
    setEditingCatId(null);
    setFormCat({ label: '', sub: '', color: COLOR_CHOICES[0], prefix: DEFAULT_PREFIX, icon: 'MapPin' });
  };

  const openEditCategoryModal = (cat) => {
    setEditingCatId(cat.id);
    setFormCat({ label: cat.label, sub: cat.sub || '', color: cat.color, prefix: DEFAULT_PREFIX, icon: cat.icon || 'MapPin' });
    setModalCatVisible(true);
  };

  const handleSaveCategory = async () => {
    const ok = editingCatId ? await updateCategory(editingCatId, formCat) : await addCategory(formCat);
    if (ok) closeCatModal();
  };

  const [catToDelete, setCatToDelete] = useState(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);
  const displayDeleteCatRef = useRef(null);
  if (catToDelete !== null) displayDeleteCatRef.current = catToDelete;

  const handleDeleteCategory = (cat) => setCatToDelete(cat);

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    setIsDeletingCat(true);
    const ok = await deleteCategory(catToDelete);
    setIsDeletingCat(false);
    if (ok && selectedCat === catToDelete.key) setSelectedCat(null);
    setCatToDelete(null);
  };

  const renderHotspotItem = (item, badgeColor, prefixText) => (
    <View key={item.id} style={hotspotStyles.hotspotCard}>
      <TouchableOpacity
        onPress={() => (userRole === 'admin' && isEditMode ? openEditModal(item) : setDetailItem(item))}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
      >
        <View style={[hotspotStyles.hotspotBadge, { backgroundColor: badgeColor + '18', borderColor: badgeColor }]}>
          <Text style={[hotspotStyles.hotspotBadgeText, { color: badgeColor }]}>{prefixText} {item.ref_no || '-'}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={hotspotStyles.hotspotRiver}>{item.river}</Text>
          <Text style={hotspotStyles.hotspotArea}>{item.area}</Text>
        </View>
      </TouchableOpacity>

      {userRole === 'admin' && isEditMode ? (
        <View style={hotspotStyles.itemActions}>
          <HoverTip label="Kemaskini titik ini">
            <TouchableOpacity onPress={() => openEditModal(item)} style={[hotspotStyles.itemActionBtn, { backgroundColor: PALETTE.orange + '18' }]}>
              <Edit size={15} color={PALETTE.orange} />
            </TouchableOpacity>
          </HoverTip>
          <HoverTip label="Padam titik ini">
            <TouchableOpacity onPress={() => confirmDeleteHotspot(item.id)} style={[hotspotStyles.itemActionBtn, { backgroundColor: PALETTE.danger + '18' }]}>
              <Trash2 size={15} color={PALETTE.danger} />
            </TouchableOpacity>
          </HoverTip>
        </View>
      ) : null}
    </View>
  );

  const kejadianTableCols = [
    { key: 'tarikh', label: 'Tarikh' },
    { key: 'lokasi', label: 'Kawasan Terjejas' },
    { key: 'jumlah_kir', label: 'Jumlah KIR' },
    { key: 'jumlah_mangsa', label: 'Jumlah Mangsa' },
    { key: 'jumlah_rumah_terjejas', label: 'Rumah Terjejas' },
    { key: 'pps', label: 'PPS' },
  ];

  const renderKejadianTableHeader = (canEditKejadian) => (
    <View style={{ flexDirection: 'row', backgroundColor: '#1e3a8a' }}>
      {kejadianTableCols.map((col) => (
        <View key={col.key} style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{col.label}</Text>
        </View>
      ))}
      {canEditKejadian && (
        <View style={{ width: 90, paddingVertical: 14, paddingHorizontal: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff', textAlign: 'center' }}>Aksi</Text>
        </View>
      )}
    </View>
  );

  const renderKejadianRow = (item, index, canEditKejadian) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.7}
      onPress={() => openEditKejadianModal(item)}
      style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: index % 2 === 1 ? (PALETTE.surface || '#f8fafc') : '#fff',
        borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder || '#e2e8f0',
      }}
    >
      <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 10 }}>
        <Text style={{ fontSize: 13, color: PALETTE.textDark, textAlign: 'center' }}>{item.tarikh || '-'}</Text>
      </View>
      <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 10 }}>
        <Text style={{ fontSize: 13, color: PALETTE.textDark, textAlign: 'center' }}>{item.lokasi || '-'}</Text>
      </View>
      <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 10 }}>
        <Text style={{ fontSize: 13, color: PALETTE.textDark, textAlign: 'center' }}>{item.jumlah_kir ?? '-'}</Text>
      </View>
      <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 10 }}>
        <Text style={{ fontSize: 13, color: PALETTE.textDark, textAlign: 'center' }}>{item.jumlah_mangsa ?? '-'}</Text>
      </View>
      <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 10 }}>
        <Text style={{ fontSize: 13, color: PALETTE.textDark, textAlign: 'center' }}>{item.jumlah_rumah_terjejas ?? '-'}</Text>
      </View>
      <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 10 }}>
        <Text style={{ fontSize: 13, color: PALETTE.textDark, textAlign: 'center' }}>{item.pps || '-'}</Text>
      </View>
      {canEditKejadian && (
        <View style={{ width: 90, flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 14 }}>
          <HoverTip label="Kemaskini rekod ini">
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); openEditKejadianModal(item); }}
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: PALETTE.orange + '18', alignItems: 'center', justifyContent: 'center' }}
            >
              <Edit size={13} color={PALETTE.orange} />
            </TouchableOpacity>
          </HoverTip>
          <HoverTip label="Padam rekod ini">
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); confirmDeleteKejadian(item.id); }}
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: PALETTE.danger + '18', alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 size={13} color={PALETTE.danger} />
            </TouchableOpacity>
          </HoverTip>
        </View>
      )}
    </TouchableOpacity>
  );

  const BULAN_LABELS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

  const [exportingKejadianPdf, setExportingKejadianPdf] = useState(false);

  const handleExportKejadianPdf = async () => {
    const catLabel = currentCat?.label || 'Semua';
    const periodLabel = [
      kejadianFilterYear !== null ? kejadianFilterYear : null,
      kejadianFilterMonth !== null ? BULAN_LABELS[kejadianFilterMonth] : null,
    ].filter(Boolean).join(' ') || 'Semua Rekod';

    setExportingKejadianPdf(true);
    try {
      await generateKejadianPdf({ rows: currentKejadianData, categoryLabel: catLabel, periodLabel });
    } catch (e) {
      console.error('Ralat PDF Kejadian:', e);
      onNotify?.('error', 'Gagal menjana PDF.');
    } finally {
      setExportingKejadianPdf(false);
    }
  };

  const renderKejadianAnalytics = () => {
    const data = currentKejadianDataAll;
    const totalKejadian = data.length;
    const totalMangsa = data.reduce((sum, k) => sum + (k.jumlah_mangsa || 0), 0);
    const totalKir = data.reduce((sum, k) => sum + (k.jumlah_kir || 0), 0);
    const purataMangsa = totalKejadian > 0 ? (totalMangsa / totalKejadian).toFixed(1) : '0';

    // Trend bulanan — année la plus récente présente dans les données, sinon année courante
    const years = data.filter((k) => k.tarikh).map((k) => new Date(k.tarikh).getFullYear());
    const trendYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
    const monthlyCounts = Array(12).fill(0);
    const monthlyMangsa = Array(12).fill(0);
    const monthlyKir = Array(12).fill(0);
    data.forEach((k) => {
      if (!k.tarikh) return;
      const d = new Date(k.tarikh);
      if (d.getFullYear() === trendYear) {
        monthlyCounts[d.getMonth()] += 1;
        monthlyMangsa[d.getMonth()] += k.jumlah_mangsa || 0;
        monthlyKir[d.getMonth()] += k.jumlah_kir || 0;
      }
    });
    const maxMonthly = Math.max(1, ...monthlyCounts);
    const peakMonthIdx = monthlyCounts.indexOf(Math.max(...monthlyCounts));

    // Kawasan Terjejas paling kerap
    const lokasiCounts = {};
    data.forEach((k) => {
      if (!k.lokasi?.trim()) return;
      lokasiCounts[k.lokasi.trim()] = (lokasiCounts[k.lokasi.trim()] || 0) + 1;
    });
    const sortedLokasi = Object.entries(lokasiCounts).sort((a, b) => b[1] - a[1]);
    const maxLokasiCount = sortedLokasi.length > 0 ? sortedLokasi[0][1] : 1;
    const LOKASI_PAGE_SIZE = 5;
    const totalLokasiPages = Math.ceil(sortedLokasi.length / LOKASI_PAGE_SIZE);
    const safeLokasiPage = Math.min(lokasiPage, Math.max(0, totalLokasiPages - 1));
    const pagedLokasi = sortedLokasi.slice(safeLokasiPage * LOKASI_PAGE_SIZE, safeLokasiPage * LOKASI_PAGE_SIZE + LOKASI_PAGE_SIZE);

    const statCards = [
      { label: 'Jumlah Kejadian', value: totalKejadian, Icon: ClipboardList, color: '#2563eb', bg: '#eff6ff' },
      { label: 'Jumlah Mangsa', value: totalMangsa, Icon: Users, color: '#dc2626', bg: '#fef2f2' },
      { label: 'Jumlah KIR', value: totalKir, Icon: ShieldAlert, color: '#16a34a', bg: '#f0fdf4' },
      { label: 'Purata Mangsa/Kejadian', value: purataMangsa, Icon: BarChart2, color: '#7c3aed', bg: '#f5f3ff' },
    ];

    const rankColors = ['#eab308', '#f97316', '#65a30d', '#22c55e', '#ec4899', '#94a3b8', '#a855f7', '#ef4444'];

    if (totalKejadian === 0) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${currentColor}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <BarChart2 size={24} color={currentColor} />
          </View>
          <Text style={styles.emptyText}>Tiada data untuk dianalisis bagi kategori ini.</Text>
        </View>
      );
    }

    const sectionCardStyle = {
      backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0',
      padding: 16, marginBottom: 20,
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
    };

    return (
      <View>
        {/* ---- Ringkasan ---- */}
        <View style={sectionCardStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${currentColor}14`, alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={14} color={currentColor} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.textDark, textTransform: 'uppercase', letterSpacing: 0.3 }}>Ringkasan</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {statCards.map((card) => (
              <View
                key={card.label}
                style={{
                  flexBasis: '48%', flexGrow: 1, backgroundColor: card.bg, borderRadius: 12, padding: 14,
                  borderWidth: 1, borderColor: `${card.color}30`,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>{card.label}</Text>
                <Text style={{ fontSize: 26, fontWeight: '900', color: card.color }}>{card.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ---- Trend Bulanan ---- */}
        <View style={[sectionCardStyle, { padding: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={14} color="#2563eb" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.textDark, textTransform: 'uppercase', letterSpacing: 0.3 }}>Trend Bulanan · {trendYear}</Text>
            </View>

            <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={isMobile} style={{ marginHorizontal: 16, marginBottom: 16 }}>
              <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', minWidth: isMobile ? 440 : '100%' }}>
                <View style={{ flexDirection: 'row', backgroundColor: '#1e3a8a' }}>
                  <View style={{ width: 140, paddingVertical: 14, paddingHorizontal: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Bulan</Text>
                  </View>
                  <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' }}>Kejadian</Text>
                  </View>
                  <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' }}>Mangsa</Text>
                  </View>
                  <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' }}>KIR</Text>
                  </View>
                </View>
                {BULAN_LABELS.map((label, idx) => {
                  const isPeak = monthlyCounts[idx] === maxMonthly && maxMonthly > 0 && idx === peakMonthIdx;
                  return (
                    <View
                      key={label}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: isPeak ? '#eff6ff' : (idx % 2 === 1 ? (PALETTE.surface || '#f8fafc') : '#fff'),
                        borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder || '#e2e8f0',
                      }}
                    >
                      <View style={{ width: 140, paddingVertical: 14, paddingHorizontal: 14 }}>
                        <Text style={{ fontSize: 15, fontWeight: isPeak ? '800' : '600', color: PALETTE.textDark }}>{label}</Text>
                      </View>
                      <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: isPeak ? '#2563eb' : PALETTE.textDark, textAlign: 'center' }}>{monthlyCounts[idx]}</Text>
                      </View>
                      <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: PALETTE.textDark, textAlign: 'center' }}>{monthlyMangsa[idx]}</Text>
                      </View>
                      <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: PALETTE.textDark, textAlign: 'center' }}>{monthlyKir[idx]}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

        {/* ---- Kawasan Terjejas Paling Kerap ---- */}
        <View style={[sectionCardStyle, { padding: 0, marginBottom: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={14} color="#2563eb" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.textDark, textTransform: 'uppercase', letterSpacing: 0.3 }}>Kawasan Terjejas Paling Kerap</Text>
            </View>

            {pagedLokasi.length === 0 ? (
              <Text style={{ paddingHorizontal: 16, paddingBottom: 16, fontSize: 13, color: PALETTE.textMutedDark, fontStyle: 'italic' }}>Tiada kawasan direkodkan.</Text>
            ) : (
              <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={isMobile} style={{ marginHorizontal: 16, marginBottom: 16 }}>
                <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', minWidth: isMobile ? 500 : '100%' }}>
                  <View style={{ flexDirection: 'row', backgroundColor: '#1e3a8a' }}>
                    <View style={{ width: 60, paddingVertical: 14 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' }}>#</Text>
                    </View>
                    <View style={{ width: isMobile ? 300 : undefined, flex: isMobile ? undefined : 2, paddingVertical: 14, paddingHorizontal: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Kawasan</Text>
                    </View>
                    <View style={{ width: isMobile ? 140 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' }}>Kejadian</Text>
                    </View>
                  </View>
                  {pagedLokasi.map(([lokasi, count], i) => {
                    const globalIdx = safeLokasiPage * LOKASI_PAGE_SIZE + i;
                    return (
                      <View
                        key={lokasi}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          backgroundColor: i % 2 === 1 ? (PALETTE.surface || '#f8fafc') : '#fff',
                          borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder || '#e2e8f0',
                        }}
                      >
                        <View style={{ width: 60, paddingVertical: 14 }}>
                          <Text style={{ fontSize: 15, fontWeight: '800', color: PALETTE.textMutedDark, textAlign: 'center' }}>{globalIdx + 1}</Text>
                        </View>
                        <View style={{ width: isMobile ? 300 : undefined, flex: isMobile ? undefined : 2, paddingVertical: 14, paddingHorizontal: 10 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: PALETTE.textDark }} numberOfLines={1}>{lokasi}</Text>
                        </View>
                        <View style={{ width: isMobile ? 140 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: PALETTE.textDark, textAlign: 'center' }}>{count}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {totalLokasiPages > 1 && (
              <View style={{ alignItems: 'center', paddingVertical: 16, paddingTop: 4, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <TouchableOpacity
                    disabled={safeLokasiPage === 0}
                    onPress={() => setLokasiPage((p) => Math.max(0, p - 1))}
                    style={{
                      width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: safeLokasiPage === 0 ? (PALETTE.surface || '#f1f5f9') : 'rgba(249, 115, 22, 0.10)',
                    }}
                  >
                    <ChevronLeft size={17} color={safeLokasiPage === 0 ? PALETTE.textMutedDark : PALETTE.orange} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={safeLokasiPage >= totalLokasiPages - 1}
                    onPress={() => setLokasiPage((p) => Math.min(totalLokasiPages - 1, p + 1))}
                    style={{
                      width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: safeLokasiPage >= totalLokasiPages - 1 ? (PALETTE.surface || '#f1f5f9') : 'rgba(249, 115, 22, 0.10)',
                    }}
                  >
                    <ChevronRight size={17} color={safeLokasiPage >= totalLokasiPages - 1 ? PALETTE.textMutedDark : PALETTE.orange} />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: PALETTE.textMutedDark }}>{safeLokasiPage + 1} / {totalLokasiPages}</Text>
              </View>
            )}
        </View>
      </View>
    );
  };

  const isLoading = (loadingHotspot || loadingCategories) && hotspotList.length === 0 && categories.length === 0;

  return (
    <View>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Senarai Hotspot Bencana</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />
      ) : categories.length === 0 ? (
        <Text style={styles.emptyText}>Tiada kategori dijumpai. Sila tambah kategori.</Text>
      ) : (
        <>
          {/* ---- Onglets de catégorie ---- */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={hotspotStyles.pillsScroll}
            contentContainerStyle={hotspotStyles.pillsContent}
            {...(Platform.OS === 'web' ? { className: 'hotspot-pills-scroll' } : {})}
          >
            {categories.map((cat) => {
              const isSelected = cat.key === selectedCat;
              const count = hotspotList.filter((h) => h.category === cat.key).length;
              const IconCmp = resolveIcon(cat);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    hotspotStyles.pill,
                    { borderColor: cat.color },
                    isSelected && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setSelectedCat(cat.key)}
                  activeOpacity={0.8}
                >
                  <IconCmp size={22} color={isSelected ? PALETTE.white : cat.color} />
                  <Text style={[hotspotStyles.pillLabel, { color: isSelected ? PALETTE.white : cat.color }]}>
                    {cat.label}
                  </Text>
                  <Text style={[hotspotStyles.pillCount, { color: isSelected ? PALETTE.white : PALETTE.textMutedDark }]}>
                    {count} lokasi
                  </Text>
                  {userRole === 'admin' && isEditMode ? (
                    <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); openEditCategoryModal(cat); }}
                        style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.12)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit size={12} color={isSelected ? PALETTE.white : cat.color} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); handleDeleteCategory(cat); }}
                        style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.12)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={12} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {/* Pill "ajouter une catégorie" (admin + édition) */}
            {userRole === 'admin' && isEditMode ? (
              <TouchableOpacity style={hotspotStyles.pillAdd} onPress={() => { setEditingCatId(null); setModalCatVisible(true); }} activeOpacity={0.8}>
                <Plus size={22} color={PALETTE.orange} />
                <Text style={hotspotStyles.pillAddText}>Kategori Baru</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>

          {currentCat ? (
            <>
              {/* ---- Bandeau info de la catégorie ---- */}
              <View style={[hotspotStyles.catBanner, { backgroundColor: currentColor + '14', borderColor: currentColor + '40' }]}>
                <CurrentIcon size={16} color={currentColor} />
                <Text style={[hotspotStyles.catBannerText, { color: currentColor }]}>{currentCat.sub || currentCat.label}</Text>
                <Text style={[hotspotStyles.catBannerCount, { color: currentColor }]}>{currentData.length} lokasi</Text>
              </View>

              {/* ---- Sous-onglets ---- */}
              <View style={[hotspotStyles.subTabRow, { justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ flexDirection: 'row', gap: 8 }}
                  style={{ maxWidth: '100%' }}
                >
                  <TouchableOpacity
                    style={[hotspotStyles.subTabBtn, activeSubTab === 'lokasi' && { backgroundColor: currentColor }]}
                    onPress={() => setActiveSubTab('lokasi')}
                    activeOpacity={0.8}
                  >
                    <MapPin size={14} color={activeSubTab === 'lokasi' ? PALETTE.white : currentColor} />
                    <Text style={[hotspotStyles.subTabText, { color: activeSubTab === 'lokasi' ? PALETTE.white : currentColor }]}>Lokasi Hotspot</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[hotspotStyles.subTabBtn, activeSubTab === 'kejadian' && { backgroundColor: currentColor }]}
                    onPress={() => setActiveSubTab('kejadian')}
                    activeOpacity={0.8}
                  >
                    <ClipboardList size={14} color={activeSubTab === 'kejadian' ? PALETTE.white : currentColor} />
                    <Text style={[hotspotStyles.subTabText, { color: activeSubTab === 'kejadian' ? PALETTE.white : currentColor }]}>Rekod</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[hotspotStyles.subTabBtn, activeSubTab === 'analisis' && { backgroundColor: currentColor }]}
                    onPress={() => setActiveSubTab('analisis')}
                    activeOpacity={0.8}
                  >
                    <BarChart2 size={14} color={activeSubTab === 'analisis' ? PALETTE.white : currentColor} />
                    <Text style={[hotspotStyles.subTabText, { color: activeSubTab === 'analisis' ? PALETTE.white : currentColor }]}>Analisis & Statistik</Text>
                  </TouchableOpacity>
                </ScrollView>

              </View>

              {activeSubTab === 'lokasi' ? (
                <>
                  {/* ---- Gambar Kejadian Biasa ---- */}
                  <KejadianPhotoCard
                    photoUrl={currentCat.photo_url}
                    canEdit={userRole === 'admin' && isEditMode}
                    uploading={uploadingKejadianPhoto}
                    onUpload={async () => {
                      const url = await pickAndUploadKejadianPhoto();
                      if (url) await updateCategoryPhoto(currentCat.id, url);
                    }}
                  />

                  {userRole === 'admin' && isEditMode && (
                    <TouchableOpacity style={[styles.addButton, { alignSelf: 'flex-end', marginBottom: 12 }]} onPress={() => openAddModal(currentCat.key)}>
                      <Plus size={16} color={PALETTE.white} />
                      <Text style={styles.addButtonText}>Tambah</Text>
                    </TouchableOpacity>
                  )}

                  {/* ---- Liste ---- */}
                  {currentData.length === 0 ? (
                    <Text style={styles.emptyText}>Tiada rekod untuk kategori ini.</Text>
                  ) : (
                    currentData.map((item) => renderHotspotItem(item, currentColor, currentCat.prefix))
                  )}
                </>
              ) : activeSubTab === 'kejadian' ? (
                <>
                  {/* ---- Filtre Tahun/Bulan + Export PDF ---- */}
                  {currentKejadianDataAll.length > 0 && (
                    <View style={isMobile ? { gap: 12, marginBottom: 16 } : { flexDirection: 'row', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
                      <View style={isMobile ? {} : { flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.textDark, marginBottom: 8 }}>Tahun</Text>
                        <TouchableOpacity
                          onPress={() => setKejadianYearDropdownOpen(true)}
                          style={{
                            borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', borderRadius: 8,
                            paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff',
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.textDark }}>
                            {kejadianFilterYear === null ? 'Semua Tahun' : kejadianFilterYear}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={[isMobile ? {} : { flex: 1 }, { opacity: kejadianFilterYear === null ? 0.5 : 1 }]}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.textDark, marginBottom: 8 }}>Bulan</Text>
                        <TouchableOpacity
                          disabled={kejadianFilterYear === null}
                          onPress={() => setKejadianMonthDropdownOpen(true)}
                          style={{
                            borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', borderRadius: 8,
                            paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff',
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.textDark }}>
                            {kejadianFilterMonth === null ? 'Semua Bulan' : ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'][kejadianFilterMonth]}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={handleExportKejadianPdf}
                        disabled={exportingKejadianPdf}
                        style={[hotspotStyles.pdfExportBtn, isMobile ? { alignSelf: 'stretch' } : { marginLeft: 4 }, exportingKejadianPdf && { opacity: 0.6 }]}
                        activeOpacity={0.7}
                      >
                        {exportingKejadianPdf ? (
                          <ActivityIndicator size="small" color={PALETTE.orange} />
                        ) : (
                          <FileDown size={14} color={PALETTE.orange} />
                        )}
                        <Text style={hotspotStyles.pdfExportBtnText}>{exportingKejadianPdf ? 'Menjana PDF...' : 'Muat Turun PDF'}</Text>
                      </TouchableOpacity>

                      {userRole === 'admin' && isEditMode && (
                        <TouchableOpacity
                          style={[
                            styles.addButton,
                            { paddingVertical: 14, paddingHorizontal: 18, justifyContent: 'center' },
                            isMobile ? { alignSelf: 'stretch' } : { marginLeft: 4 },
                          ]}
                          onPress={() => openAddKejadianModal(currentCat.key, currentCat.label)}
                        >
                          <Plus size={16} color={PALETTE.white} />
                          <Text style={styles.addButtonText}>Tambah</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* ---- Liste Kejadian ---- */}
                  {loadingKejadian && currentKejadianData.length === 0 ? (
                    <ActivityIndicator size="small" color={PALETTE.orange} style={{ marginTop: 10 }} />
                  ) : currentKejadianData.length === 0 ? (
                    <Text style={styles.emptyText}>Tiada rekod untuk kategori ini.</Text>
                  ) : (
                    <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={isMobile}>
                      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', overflow: 'hidden', minWidth: isMobile ? 600 : '100%' }}>
                        {renderKejadianTableHeader(userRole === 'admin' && isEditMode)}
                        {currentKejadianData.map((item, index) => renderKejadianRow(item, index, userRole === 'admin' && isEditMode))}
                      </View>
                    </ScrollView>
                  )}
                </>
              ) : (
                renderKejadianAnalytics()
              )}
            </>
          ) : null}
        </>
      )}

      {/* ---- Modale hotspot ---- */}
      <Modal visible={modalHotspotVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 860 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModeHotspot === 'add' ? 'Tambah Hotspot' : 'Kemaskini Hotspot'}</Text>
              <TouchableOpacity onPress={() => setModalHotspotVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Kategori Hotspot</Text>
              <View style={[styles.categoryBtn, styles.categoryBtnActive, { alignSelf: 'flex-start' }]}>
                <Text style={[styles.categoryBtnText, styles.categoryBtnTextActive]}>
                  {categories.find(c => c.key === formHotspot.category)?.label || formHotspot.category}
                </Text>
              </View>
              <Text style={styles.inputLabel}>No. Rujukan</Text>
              <TextInput style={styles.input} placeholder="Cth: 1, 2, 3,..." value={formHotspot.ref_no} onChangeText={(t) => setFormHotspot({ ...formHotspot, ref_no: t })} />
              <Text style={styles.inputLabel}>Lokasi Utama</Text>
              <TextInput style={styles.input} placeholder="Cth: Sg. Kinabenua" value={formHotspot.river} onChangeText={(t) => setFormHotspot({ ...formHotspot, river: t })} />
              <Text style={styles.inputLabel}>Kawasan Terjejas</Text>
              <TextInput style={styles.input} placeholder="Cth: Kg Rancha Rancha" value={formHotspot.area} onChangeText={(t) => setFormHotspot({ ...formHotspot, area: t })} />
              <Text style={styles.inputLabel}>Koordinat (Latitud, Longitud)</Text>
              <Text style={{ fontSize: 11, fontStyle: 'italic', color: PALETTE.textMutedDark, marginTop: -8, marginBottom: 6 }}>
                Salin terus dari Google Maps (klik lokasi pada peta, tampal di sini)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Cth: 5.263464499491023, 115.22960127925502"
                value={coordsText}
                onChangeText={handleCoordsChange}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveHotspot}>
                {loadingHotspot ? <ActivityIndicator color={PALETTE.white} /> : <Text style={styles.saveButtonText}>Simpan Hotspot</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---- Modale butiran hotspot ---- */}
      <Modal visible={!!detailItem} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 640 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Butiran Hotspot</Text>
              <TouchableOpacity onPress={() => setDetailItem(null)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={hotspotStyles.detailCatChip}>
                <View style={[hotspotStyles.detailCatDot, { backgroundColor: categories.find(c => c.key === displayDetailItemRef.current?.category)?.color || PALETTE.orange }]} />
                <Text style={[hotspotStyles.detailCatChipText, { color: categories.find(c => c.key === displayDetailItemRef.current?.category)?.color || PALETTE.orange }]}>
                  {categories.find(c => c.key === displayDetailItemRef.current?.category)?.label || displayDetailItemRef.current?.category}
                </Text>
                <Text style={hotspotStyles.detailRefChipText}>#{displayDetailItemRef.current?.ref_no || '-'}</Text>
              </View>

              <View style={hotspotStyles.detailRow}>
                <View style={hotspotStyles.detailIconBox}><MapPin size={16} color={PALETTE.orange} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={hotspotStyles.detailLabel}>Lokasi Utama</Text>
                  <Text style={hotspotStyles.detailValue}>{displayDetailItemRef.current?.river || '-'}</Text>
                </View>
              </View>

              <View style={hotspotStyles.detailRow}>
                <View style={hotspotStyles.detailIconBox}><Home size={16} color={PALETTE.orange} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={hotspotStyles.detailLabel}>Kawasan Terjejas</Text>
                  <Text style={hotspotStyles.detailValue}>{displayDetailItemRef.current?.area || '-'}</Text>
                </View>
              </View>

              <View style={hotspotStyles.coordRow}>
                <View style={hotspotStyles.coordBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Globe size={13} color={PALETTE.textMutedDark} />
                    <Text style={hotspotStyles.detailLabel}>Latitud</Text>
                  </View>
                  <Text style={hotspotStyles.detailValue}>{displayDetailItemRef.current?.latitude != null ? String(displayDetailItemRef.current.latitude) : '-'}</Text>
                </View>
                <View style={hotspotStyles.coordBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Globe size={13} color={PALETTE.textMutedDark} />
                    <Text style={hotspotStyles.detailLabel}>Longitud</Text>
                  </View>
                  <Text style={hotspotStyles.detailValue}>{displayDetailItemRef.current?.longitude != null ? String(displayDetailItemRef.current.longitude) : '-'}</Text>
                </View>
              </View>

              <View style={{ height: 10 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

{/* ---- Modale rekod kejadian ---- */}
      <Modal visible={modalKejadianVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 640 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModeKejadian === 'add' ? 'Tambah Rekod' : (isEditMode ? 'Kemaskini Rekod' : 'Butiran Rekod')}</Text>
              <TouchableOpacity onPress={() => setModalKejadianVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Tarikh</Text>
              {isEditMode ? (
                Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={formKejadian.tarikh}
                    onChange={(e) => setFormKejadian({ ...formKejadian, tarikh: e.target.value })}
                    style={webDateInput}
                  />
                ) : (
                  <>
                    <TouchableOpacity style={hotspotStyles.dateInputBtn} onPress={() => setShowTarikhPicker(true)}>
                      <Calendar size={16} color={PALETTE.textMutedDark} />
                      <Text style={[hotspotStyles.dateInputBtnText, !formKejadian.tarikh && { color: PALETTE.textMutedDark }]}>
                        {formKejadian.tarikh || 'Pilih tarikh'}
                      </Text>
                    </TouchableOpacity>
                    {showTarikhPicker ? (
                      <DateTimePicker
                        value={formKejadian.tarikh ? new Date(formKejadian.tarikh) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowTarikhPicker(false);
                          if (event.type === 'set' && selectedDate) {
                            const iso = selectedDate.toISOString().split('T')[0];
                            setFormKejadian({ ...formKejadian, tarikh: iso });
                          }
                        }}
                      />
                    ) : null}
                  </>
                )
              ) : (
                <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{formKejadian.tarikh}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Kawasan Terjejas</Text>
              {isEditMode ? (
                <TextInput
                  style={styles.input}
                  placeholder="Cth: Kg Rancha-Rancha"
                  value={formKejadian.lokasi}
                  onChangeText={(t) => setFormKejadian({ ...formKejadian, lokasi: t })}
                />
              ) : (
                <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{formKejadian.lokasi}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Jumlah KIR</Text>
              {isEditMode ? (
                <TextInput style={styles.input} placeholder="Cth: 12" keyboardType="numeric" value={formKejadian.jumlah_kir} onChangeText={(t) => setFormKejadian({ ...formKejadian, jumlah_kir: t.replace(/[^0-9]/g, '') })} />
              ) : (
                <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{formKejadian.jumlah_kir}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Jumlah Mangsa</Text>
              {isEditMode ? (
                <TextInput style={styles.input} placeholder="Cth: 45" keyboardType="numeric" value={formKejadian.jumlah_mangsa} onChangeText={(t) => setFormKejadian({ ...formKejadian, jumlah_mangsa: t.replace(/[^0-9]/g, '') })} />
              ) : (
                <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{formKejadian.jumlah_mangsa}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Jumlah Rumah Terjejas</Text>
              {isEditMode ? (
                <TextInput style={styles.input} placeholder="Cth: 5" keyboardType="numeric" value={formKejadian.jumlah_rumah_terjejas} onChangeText={(t) => setFormKejadian({ ...formKejadian, jumlah_rumah_terjejas: t.replace(/[^0-9]/g, '') })} />
              ) : (
                <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{formKejadian.jumlah_rumah_terjejas}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>PPS</Text>
              {isEditMode ? (
                <TextInput style={styles.input} placeholder="Cth: Dewan Komuniti Kg X" value={formKejadian.pps} onChangeText={(t) => setFormKejadian({ ...formKejadian, pps: t })} />
              ) : (
                <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{formKejadian.pps}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Catatan</Text>
              {isEditMode ? (
                <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Catatan tambahan" multiline value={formKejadian.description} onChangeText={(t) => setFormKejadian({ ...formKejadian, description: t })} />
              ) : (
                <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10, minHeight: 60 }}>
                  <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{formKejadian.description}</Text>
                </View>
              )}

              {isEditMode && (
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveKejadian}>
                  {loadingKejadian ? <ActivityIndicator color={PALETTE.white} /> : <Text style={styles.saveButtonText}>Simpan Rekod</Text>}
                </TouchableOpacity>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

{/* ---- Sélecteur Tahun (Rekod) ---- */}
      <Modal visible={kejadianYearDropdownOpen} transparent animationType="fade" onRequestClose={() => setKejadianYearDropdownOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 440, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Tahun</Text>
              <TouchableOpacity onPress={() => setKejadianYearDropdownOpen(false)}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
              <TouchableOpacity
                onPress={() => { setKejadianFilterYear(null); setKejadianFilterMonth(null); setKejadianYearDropdownOpen(false); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 18, paddingVertical: 16, borderRadius: 12,
                  borderWidth: 1.5, borderColor: kejadianFilterYear === null ? PALETTE.orange : (PALETTE.cardLightBorder || '#e2e8f0'),
                  backgroundColor: kejadianFilterYear === null ? PALETTE.orange + '14' : '#fff',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: kejadianFilterYear === null ? '800' : '600', color: kejadianFilterYear === null ? PALETTE.orange : PALETTE.textDark }}>Semua Tahun</Text>
                {kejadianFilterYear === null && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.orange }} />}
              </TouchableOpacity>
              {kejadianAvailableYears.map((y) => (
                <TouchableOpacity
                  key={y}
                  onPress={() => { setKejadianFilterYear(y); setKejadianYearDropdownOpen(false); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 18, paddingVertical: 16, borderRadius: 12,
                    borderWidth: 1.5, borderColor: kejadianFilterYear === y ? PALETTE.orange : (PALETTE.cardLightBorder || '#e2e8f0'),
                    backgroundColor: kejadianFilterYear === y ? PALETTE.orange + '14' : '#fff',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: kejadianFilterYear === y ? '800' : '600', color: kejadianFilterYear === y ? PALETTE.orange : PALETTE.textDark }}>{y}</Text>
                  {kejadianFilterYear === y && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.orange }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---- Sélecteur Bulan (Rekod) ---- */}
      <Modal visible={kejadianMonthDropdownOpen} transparent animationType="fade" onRequestClose={() => setKejadianMonthDropdownOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 440, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Bulan</Text>
              <TouchableOpacity onPress={() => setKejadianMonthDropdownOpen(false)}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
              <TouchableOpacity
                onPress={() => { setKejadianFilterMonth(null); setKejadianMonthDropdownOpen(false); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 18, paddingVertical: 16, borderRadius: 12,
                  borderWidth: 1.5, borderColor: kejadianFilterMonth === null ? PALETTE.orange : (PALETTE.cardLightBorder || '#e2e8f0'),
                  backgroundColor: kejadianFilterMonth === null ? PALETTE.orange + '14' : '#fff',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: kejadianFilterMonth === null ? '800' : '600', color: kejadianFilterMonth === null ? PALETTE.orange : PALETTE.textDark }}>Semua Bulan</Text>
                {kejadianFilterMonth === null && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.orange }} />}
              </TouchableOpacity>
              {['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'].map((m, idx) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { setKejadianFilterMonth(idx); setKejadianMonthDropdownOpen(false); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 18, paddingVertical: 16, borderRadius: 12,
                    borderWidth: 1.5, borderColor: kejadianFilterMonth === idx ? PALETTE.orange : (PALETTE.cardLightBorder || '#e2e8f0'),
                    backgroundColor: kejadianFilterMonth === idx ? PALETTE.orange + '14' : '#fff',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: kejadianFilterMonth === idx ? '800' : '600', color: kejadianFilterMonth === idx ? PALETTE.orange : PALETTE.textDark }}>{m}</Text>
                  {kejadianFilterMonth === idx && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.orange }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

{/* ---- Confirmation suppression catégorie ---- */}
      <Modal visible={catToDelete !== null} transparent animationType="fade" onRequestClose={() => !isDeletingCat && setCatToDelete(null)}>
        <View style={hotspotStyles.confirmOverlay}>
          <View style={hotspotStyles.confirmBox}>
            <View style={hotspotStyles.confirmBanner}>
              <View style={hotspotStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={hotspotStyles.confirmTitle}>Padam Kategori</Text>
              <Text style={hotspotStyles.confirmSubtitle}>
                Padam kategori "{displayDeleteCatRef.current?.label}"? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>
            <View style={hotspotStyles.confirmActions}>
              <TouchableOpacity
                style={[hotspotStyles.confirmCancelBtn, isDeletingCat && { opacity: 0.5 }]}
                onPress={() => setCatToDelete(null)}
                disabled={isDeletingCat}
              >
                <Text style={hotspotStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[hotspotStyles.confirmConfirmBtn, isDeletingCat && { opacity: 0.7 }]}
                onPress={confirmDeleteCategory}
                disabled={isDeletingCat}
              >
                {isDeletingCat ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={hotspotStyles.confirmConfirmText}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- Modale nouvelle catégorie ---- */}
      <Modal visible={modalCatVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCatId ? 'Kemaskini Kategori' : 'Tambah Kategori'}</Text>
              <TouchableOpacity onPress={closeCatModal}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Kategori *</Text>
              <TextInput style={styles.input} placeholder="Cth: HOTSPOT RIBUT" value={formCat.label} onChangeText={(t) => setFormCat({ ...formCat, label: t })} />
              <Text style={styles.inputLabel}>Keterangan</Text>
              <TextInput style={styles.input} placeholder="Cth: Kawasan berisiko ribut kencang" value={formCat.sub} onChangeText={(t) => setFormCat({ ...formCat, sub: t })} />

              <Text style={styles.inputLabel}>Ikon</Text>
              <View style={hotspotStyles.iconGrid}>
                {Object.entries(ICONS).map(([name, IconCmp]) => {
                  const isSelected = formCat.icon === name;
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[
                        hotspotStyles.iconCell,
                        isSelected && { backgroundColor: formCat.color + '18', borderColor: formCat.color },
                      ]}
                      onPress={() => setFormCat({ ...formCat, icon: name })}
                    >
                      <IconCmp size={20} color={isSelected ? formCat.color : PALETTE.textMutedDark} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Warna</Text>
              <View style={hotspotStyles.colorRow}>
                {COLOR_CHOICES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[hotspotStyles.colorSwatch, { backgroundColor: c }, formCat.color === c && hotspotStyles.colorSwatchSelected]}
                    onPress={() => setFormCat({ ...formCat, color: c })}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategory}>
                <Text style={styles.saveButtonText}>{editingCatId ? 'Kemaskini Kategori' : 'Simpan Kategori'}</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const hotspotStyles = StyleSheet.create({
  // Onglets
  pillsScroll: { marginBottom: 10 },
  pillsContent: { gap: 10, paddingBottom: 10, paddingHorizontal: 2 },
  pill: {
    width: 160, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10,
    borderRadius: 12, backgroundColor: PALETTE.cardLight, borderWidth: 1, gap: 4,
  },
  pillLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  pillCount: { fontSize: 11, fontWeight: '600' },
  pillAdd: {
    width: 120, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: PALETTE.orange, gap: 4,
  },
  pillAddText: { fontSize: 12, fontWeight: '700', color: PALETTE.orange, textAlign: 'center' },

  // Sous-onglets
  subTabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  subTabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    flexShrink: 0,
  },
  subTabText: { fontSize: 12, fontWeight: '700' },

  // Export PDF (Rekod)
  pdfExportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: 8,
    borderWidth: 1, borderColor: PALETTE.orange, backgroundColor: PALETTE.orange + '10',
  },
  pdfExportBtnText: { fontSize: 13, fontWeight: '700', color: PALETTE.orange },

  // Upload photo kejadian
  photoUploadEmpty: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: PALETTE.orange, borderRadius: 12,
    paddingVertical: 30, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 15,
  },
  photoUploadEmptyText: { fontSize: 13, fontWeight: '700', color: PALETTE.orange },
  photoReplaceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: PALETTE.orange,
  },
  photoReplaceBtnText: { fontSize: 12, fontWeight: '700', color: PALETTE.orange },
  photoEmptyReadOnly: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: PALETTE.cardLightBorder, borderRadius: 12,
    paddingVertical: 26, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 15,
    backgroundColor: PALETTE.cardLight,
  },
  photoEmptyReadOnlyText: { fontSize: 13, fontWeight: '600', color: PALETTE.textMutedDark, textAlign: 'center' },
  dateInputBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: PALETTE.white,
  },
  dateInputBtnText: { fontSize: 14, color: PALETTE.textDark },

  // Bandeau catégorie
  catBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12,
  },
  catBannerText: { flex: 1, fontSize: 13, fontWeight: '700' },
  catBannerCount: { fontSize: 12, fontWeight: '800' },
  catDeleteBtn: { marginLeft: 6, padding: 4 },

  // Cartes d'items
  hotspotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.cardLight, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: PALETTE.cardLightBorder, gap: 12 },
  hotspotBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, width: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  hotspotBadgeText: { fontSize: 10, fontWeight: '800' },
  hotspotRiver: { fontSize: 11, color: PALETTE.textMutedDark, fontWeight: '700', textTransform: 'uppercase' },
  hotspotArea: { fontSize: 14, color: PALETTE.textDark, fontWeight: '600' },
  itemActions: { flexDirection: 'row', gap: 6 },
  addBtnBeforeList: { alignSelf: 'flex-end', marginBottom: 8 },
  itemActionBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  // Carte (Rajah)
  mapCard: { backgroundColor: PALETTE.cardLight, borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: PALETTE.cardLightBorder, padding: 10, alignItems: 'center' },
  mapImage: { width: '100%', borderRadius: 8, backgroundColor: PALETTE.surface },
  mapCaption: { fontSize: 12, color: PALETTE.textMutedDark, marginTop: 8, fontWeight: '600' },
  mapZoomHint: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  mapZoomHintText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  mapFullscreenOverlay: { flex: 1, backgroundColor: 'rgba(11, 12, 14, 0.95)', justifyContent: 'center', alignItems: 'center' },
  mapFullscreenClose: {
    position: 'absolute', top: 40, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  mapFullscreenImage: { width: '100%', height: '90%' },

  // Modale catégorie
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  iconCell: {
    width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, backgroundColor: PALETTE.cardLight,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  colorSwatch: { width: 34, height: 34, borderRadius: 17 },
  colorSwatchSelected: { borderWidth: 3, borderColor: PALETTE.textDark },
  prefixRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  prefixPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
    borderColor: PALETTE.cardLightBorder, backgroundColor: PALETTE.cardLight,
  },
  prefixPillSelected: { backgroundColor: PALETTE.orange + '18', borderColor: PALETTE.orange },
  prefixPillText: { fontSize: 13, fontWeight: '700', color: PALETTE.textMutedDark },
  prefixPillTextSelected: { color: PALETTE.orange },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: {
    width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
  },
  confirmBanner: { backgroundColor: '#0c0c0e', padding: 24, alignItems: 'center' },
  confirmIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  confirmTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  confirmSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: 10, padding: 20, backgroundColor: '#fff' },
  confirmCancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmCancelText: { color: '#64748b', fontWeight: '800', fontSize: 14 },
  confirmConfirmBtn: {
    flex: 1, height: 48, borderRadius: 12, backgroundColor: '#ef4444',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Modale butiran hotspot
  detailCatChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', backgroundColor: PALETTE.surface,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16,
  },
  detailCatDot: { width: 8, height: 8, borderRadius: 4 },
  detailCatChipText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  detailRefChipText: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, marginLeft: 4 },
  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder,
  },
  detailIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: PALETTE.orange + '15',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  detailLabel: { fontSize: 11, fontWeight: '700', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '600', color: PALETTE.textDark },
  coordRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  coordBox: {
    flex: 1, backgroundColor: PALETTE.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
});