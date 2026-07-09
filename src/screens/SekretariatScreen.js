// src/screens/SekretariatScreen.js
import React, { useState, useEffect, createElement, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Briefcase, AlertTriangle, Home, Droplets, Mountain, Users, AlertCircle, Plus, Edit, Trash2, X, Map, Flame, Wind, MoreHorizontal, History } from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import { supabaseSandbox } from '../supabaseSandboxClient';

// Import your universal edit button
import AdminEditButton from '../components/AdminEditButton';

// Répartit chaque agence sur un cercle de teintes (HSL) selon sa position dans jpbdList,
// ce qui garantit un écart maximal entre les couleurs, peu importe combien d'agences existent.
const buildAgencyColorMap = (agencyList) => {
  const map = {};
  const total = agencyList.length || 1;
  agencyList.forEach((a, index) => {
    const hue = Math.round((360 / total) * index);
    map[a.agency] = `hsl(${hue}, 70%, 45%)`;
  });
  return map;
};

const CALAMITY_CATEGORIES = [
  { key: 'KJR', label: 'Kes Kemalangan Jalan Raya', color: '#ef4444' },
  { key: 'KM', label: 'Kes Menangkap Ular', color: '#f97316' },
  { key: 'MMS', label: 'Memusnah Sarang Serangga', color: '#eab308' },
  { key: 'KBD', label: 'Kes Bunuh Diri', color: '#64748b' },
  { key: 'KK', label: 'Khidmat Khas', color: '#a855f7' },
  { key: 'SKT', label: 'Sakit (Medikal/Trauma)', color: '#ec4899' },
  { key: 'KTK', label: 'Kemalangan Tempat Kerja', color: '#14b8a6' },
  { key: 'PT', label: 'Pokok Tumbang', color: '#84cc16' },
  { key: 'KBR', label: 'Kes Kebakaran', color: '#dc2626' },
  { key: 'ML', label: 'Mangsa Lemas', color: '#0ea5e9' },
  { key: 'LLK', label: 'Lain-lain Kes', color: '#94a3b8' },
  { key: 'KB', label: 'Kes Bergaduh', color: '#f43f5e' },
  { key: 'MHL', label: 'Menangkap Haiwan Liar', color: '#65a30d' },
  { key: 'MHP', label: 'Menangkap Haiwan Peliharaan', color: '#22c55e' },
  { key: 'MT', label: 'Mangsa Terperangkap', color: '#7c3aed' },
];

const getCalamityMeta = (key) => CALAMITY_CATEGORIES.find(c => c.key === key) || CALAMITY_CATEGORIES[4];


const SekretariatScreen = ({ theme, userRole }) => {
  const [activeTab, setActiveTab] = useState('JPBD'); 
  const [expandedId, setExpandedId] = useState(null);

  // --- MASTER EDIT MODE STATE ---
  const [isEditMode, setIsEditMode] = useState(false);

  // --- JPBD STATES ---
  const [jpbdList, setJpbdList] = useState([]);
  const [loadingJPBD, setLoadingJPBD] = useState(true);
  const [modalJpbdVisible, setModalJpbdVisible] = useState(false);
  const [formModeJpbd, setFormModeJpbd] = useState('add');
  const [editIdJpbd, setEditIdJpbd] = useState(null);
  const [formJpbd, setFormJpbd] = useState({
    agency: '', officer: '', position: '', grade: '', email: '',
    address: '', office_phone: '', mobile_phone: '', fax: '',
    officers_count: '', members_count: '', logistics_assets: ''
  });

  // --- PPS STATES ---
  const [ppsList, setPpsList] = useState([]);
  const [ppsStats, setPpsStats] = useState([]);
  const [loadingPPS, setLoadingPPS] = useState(true);
  const [modalPpsVisible, setModalPpsVisible] = useState(false);
  const [formModePps, setFormModePps] = useState('add');
  const [editIdPps, setEditIdPps] = useState(null);
  const [formPps, setFormPps] = useState({
    name: '', zone: '', type: 'Dewan', capacity: '', status: 'OK'
  });

  // --- HOTSPOT STATES ---
  const [hotspotList, setHotspotList] = useState([]);
  const [loadingHotspot, setLoadingHotspot] = useState(true);
  const [modalHotspotVisible, setModalHotspotVisible] = useState(false);
  const [formModeHotspot, setFormModeHotspot] = useState('add');
  const [editIdHotspot, setEditIdHotspot] = useState(null);
  const [formHotspot, setFormHotspot] = useState({
    category: 'banjir', ref_no: '', river: '', area: ''
  });

  // --- PETA STATES ---
  const [onlineAgencies, setOnlineAgencies] = useState([]);
  const [loadingPeta, setLoadingPeta] = useState(true);
  const [hasLoadedPetaOnce, setHasLoadedPetaOnce] = useState(false);
  const [petaIframeLoading, setPetaIframeLoading] = useState(true);
  const petaIframeRef = useRef(null);

  const [calamityPoints, setCalamityPoints] = useState([]);
  const [activeCalamityTool, setActiveCalamityTool] = useState(null); // catégorie en cours de placement
  const [pendingPlacement, setPendingPlacement] = useState(null); // { lat, lng } en attente de confirmation
  const [calamityDescription, setCalamityDescription] = useState('');
  const [calamityModalVisible, setCalamityModalVisible] = useState(false);

  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyBtnHovered, setHistoryBtnHovered] = useState(false);
  const [calamityTooltip, setCalamityTooltip] = useState(null); // { text, top, left }

  const handlePetaIframeLoad = () => {
    setPetaIframeLoading(false);

    // Renvoie les données actuelles une fois l'iframe prête à les recevoir
    setTimeout(() => {
      if (petaIframeRef?.current?.contentWindow) {
        const agencyPayload = onlineAgencies.map(a => ({
          id: a.id,
          name: a.member_name,
          agency: a.jpbd_directory?.agency || '',
          lat: a.latitude,
          lng: a.longitude,
          color: getAgencyColorFromMap(a.jpbd_directory?.agency || ''),
          updated: a.last_updated ? new Date(a.last_updated).toLocaleTimeString() : ''
        }));
        petaIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_AGENCIES', payload: agencyPayload }), '*');

        const calamityPayload = calamityPoints.map(c => ({
          id: c.id,
          category: c.category,
          description: c.description || '',
          lat: c.latitude,
          lng: c.longitude,
          color: getCalamityMeta(c.category).color,
          label: getCalamityMeta(c.category).label
        }));
        petaIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_CALAMITIES', payload: calamityPayload }), '*');
      }
    }, 300);
  };

  useEffect(() => {
    fetchJPBD();
    fetchPPS();
    fetchHotspots();
    fetchOnlineAgencies();
    fetchCalamityPoints();
    fetchTrackingHistory();

    const ppsSubscription = supabase
      .channel('pps_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pps_list' }, () => {
        fetchPPS(); 
      })
      .subscribe();

    const hotspotSubscription = supabase
      .channel('hotspots_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotspots' }, () => {
        fetchHotspots();
      })
      .subscribe();

    const petaSubscription = supabaseSandbox
      .channel('agency_trackers_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'agency_trackers' }, () => {
        fetchOnlineAgencies();
      })
      .subscribe();

    const calamitySubscription = supabaseSandbox
      .channel('calamity_points_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'calamity_points' }, () => {
        fetchCalamityPoints();
      })
      .subscribe();

    const historySubscription = supabaseSandbox
      .channel('agency_tracking_history_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'agency_tracking_history' }, () => {
        fetchTrackingHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ppsSubscription);
      supabase.removeChannel(hotspotSubscription);
      supabaseSandbox.removeChannel(petaSubscription);
      supabaseSandbox.removeChannel(calamitySubscription);
      supabaseSandbox.removeChannel(historySubscription);
    };
  }, []);

  const fetchTrackingHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabaseSandbox
      .from('agency_tracking_history')
      .select('*, jpbd_directory(agency)')
      .order('ended_at', { ascending: false })
      .limit(50);

    if (!error) setTrackingHistory(data || []);
    else console.error(error);
    setLoadingHistory(false);
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}jam ${m} minit`;
    return `${m} minit`;
  };
  
  const fetchCalamityPoints = async () => {
    const { data, error } = await supabaseSandbox
      .from('calamity_points')
      .select('*');
    if (!error) setCalamityPoints(data || []);
    else console.error(error);
  };

  useEffect(() => {
    if (petaIframeRef?.current?.contentWindow) {
      const payload = onlineAgencies.map(a => ({
        id: a.id,
        name: a.member_name,  // ✅ corrigé
        agency: a.jpbd_directory?.agency || '',
        lat: a.latitude,
        lng: a.longitude,
        color: getAgencyColorFromMap(a.jpbd_directory?.agency || ''),
        updated: a.last_updated ? new Date(a.last_updated).toLocaleTimeString() : ''
      }));
      petaIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_AGENCIES', payload }), '*');
    }
  }, [onlineAgencies]);

  useEffect(() => {
    if (petaIframeRef?.current?.contentWindow) {
      const payload = calamityPoints.map(c => ({
        id: c.id,
        category: c.category,
        description: c.description || '',
        lat: c.latitude,
        lng: c.longitude,
        color: getCalamityMeta(c.category).color,
        label: getCalamityMeta(c.category).label
      }));
      petaIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_CALAMITIES', payload }), '*');
    }
  }, [calamityPoints]);

  useEffect(() => {
    const handleMapMessage = (event) => {
      if (event.source !== petaIframeRef.current?.contentWindow) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'MAP_CLICKED' && activeCalamityTool) {
          setPendingPlacement({ lat: data.lat, lng: data.lng });
          setCalamityModalVisible(true);
        } else if (data.type === 'DELETE_CALAMITY_REQUEST') {
          handleDeleteCalamity(data.id);
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, [activeCalamityTool]);

  const handleSaveCalamity = async () => {
    if (!pendingPlacement || !activeCalamityTool) return;

    const { error } = await supabaseSandbox
      .from('calamity_points')
      .insert([{
        category: activeCalamityTool,
        description: calamityDescription.trim() || null,
        latitude: pendingPlacement.lat,
        longitude: pendingPlacement.lng
      }]);

    if (error) {
      Alert.alert('Ralat', 'Gagal menyimpan titik bencana.');
    } else {
      setCalamityModalVisible(false);
      setCalamityDescription('');
      setPendingPlacement(null);
      setActiveCalamityTool(null);
      fetchCalamityPoints();
    }
  };

  const handleDeleteCalamity = async (id) => {
    const confirmed = Platform.OS === 'web' ? window.confirm('Padam titik bencana ini?') : true;
    if (!confirmed) return;
    const { error } = await supabaseSandbox.from('calamity_points').delete().eq('id', id);
    if (!error) fetchCalamityPoints();
  };


  // ==========================================
  // JPBD CRUD FUNCTIONS
  // ==========================================
  const fetchJPBD = async () => {
    setLoadingJPBD(true);
    const { data, error } = await supabase.from('jpbd_directory').select('*').order('created_at', { ascending: true });
    if (!error) setJpbdList(data || []);
    setLoadingJPBD(false);
  };

  const handleSaveJPBD = async () => {
    if (!formJpbd.agency) return Alert.alert('Ralat', 'Sila masukkan nama Agensi.');
    setLoadingJPBD(true);
    
    if (formModeJpbd === 'add') {
      const { error } = await supabase.from('jpbd_directory').insert([formJpbd]);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'Rekod ditambah.'); setModalJpbdVisible(false); fetchJPBD(); }
    } else {
      const { error } = await supabase.from('jpbd_directory').update(formJpbd).eq('id', editIdJpbd);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'Rekod dikemaskini.'); setModalJpbdVisible(false); fetchJPBD(); }
    }
    setLoadingJPBD(false);
  };

  const confirmDeleteJPBD = (id) => {
    if (Platform.OS === 'web') {
      const proceed = window.confirm('Pengesahan: Padam rekod agensi ini?');
      if (proceed) executeDeleteJPBD(id);
    } else {
      Alert.alert('Pengesahan Padam', 'Padam rekod agensi ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: () => executeDeleteJPBD(id) },
      ]);
    }
  };

  const executeDeleteJPBD = async (id) => {
    setLoadingJPBD(true);
    const { error } = await supabase.from('jpbd_directory').delete().eq('id', id);
    if (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
    } else {
      fetchJPBD();
    }
    setLoadingJPBD(false);
  };

  // ==========================================
  // HOTSPOT CRUD FUNCTIONS
  // ==========================================
  const fetchHotspots = async () => {
    setLoadingHotspot(true);
    const { data, error } = await supabase.from('hotspots').select('*').order('created_at', { ascending: true });
    if (!error) setHotspotList(data || []);
    setLoadingHotspot(false);
  };

  const handleSaveHotspot = async () => {
    if (!formHotspot.ref_no || !formHotspot.river || !formHotspot.area) {
      return Alert.alert('Ralat', 'Sila masukkan No. Rujukan, maklumat Sungai/Lokasi dan Kawasan.');
    }
    
    setLoadingHotspot(true);
    if (formModeHotspot === 'add') {
      const { error } = await supabase.from('hotspots').insert([formHotspot]);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'Hotspot ditambah.'); setModalHotspotVisible(false); fetchHotspots(); }
    } else {
      const { error } = await supabase.from('hotspots').update(formHotspot).eq('id', editIdHotspot);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'Hotspot dikemaskini.'); setModalHotspotVisible(false); fetchHotspots(); }
    }
    setLoadingHotspot(false);
  };

  const confirmDeleteHotspot = (id) => {
    if (Platform.OS === 'web') {
      const proceed = window.confirm('Pengesahan: Padam rekod hotspot ini?');
      if (proceed) executeDeleteHotspot(id);
    } else {
      Alert.alert('Pengesahan Padam', 'Padam rekod hotspot ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: () => executeDeleteHotspot(id) },
      ]);
    }
  };

  const executeDeleteHotspot = async (id) => {
    setLoadingHotspot(true);
    const { error } = await supabase.from('hotspots').delete().eq('id', id);
    if (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
    } else {
      fetchHotspots();
    }
    setLoadingHotspot(false);
  };

  // ==========================================
  // PETA-AGENSI CRUD FUNCTIONS
  // ==========================================
  const fetchOnlineAgencies = async () => {
    if (!hasLoadedPetaOnce) setLoadingPeta(true);

    const { data, error } = await supabaseSandbox
      .from('agency_trackers')
      .select('id, member_name, latitude, longitude, tracking_status, last_updated, jpbd_directory(agency)')
      .eq('tracking_status', 'Online')
      .not('latitude', 'is', null);

    if (!error) setOnlineAgencies(data || []);
    else console.error(error);

    setLoadingPeta(false);
    setHasLoadedPetaOnce(true);
  };

  // ==========================================
  // PPS CRUD & CALCULATION FUNCTIONS
  // ==========================================
  const fetchPPS = async () => {
    setLoadingPPS(true);
    const { data, error } = await supabase.from('pps_list').select('*').order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching PPS:', error);
    } else {
      setPpsList(data || []);
      calculatePPSStats(data || []);
    }
    setLoadingPPS(false);
  };

  const calculatePPSStats = (list) => {
    const stats = {
      'Dewan': { qty: 0, capacity: 0 },
      'Sekolah/Kolej': { qty: 0, capacity: 0 },
      'Balairaya': { qty: 0, capacity: 0 },
      'Lain-Lain': { qty: 0, capacity: 0 },
      'TOTAL': { qty: 0, capacity: 0 }
    };

    list.forEach(item => {
      const type = item.type || 'Lain-Lain';
      const cap = parseInt(item.capacity) || 0;

      if (stats[type]) {
        stats[type].qty += 1;
        stats[type].capacity += cap;
      } else {
        stats['Lain-Lain'].qty += 1;
        stats['Lain-Lain'].capacity += cap;
      }

      stats['TOTAL'].qty += 1;
      stats['TOTAL'].capacity += cap;
    });

    setPpsStats([
      { type: 'Dewan', ...stats['Dewan'] },
      { type: 'Sekolah/Kolej', ...stats['Sekolah/Kolej'] },
      { type: 'Balairaya', ...stats['Balairaya'] },
      { type: 'Lain-Lain', ...stats['Lain-Lain'] },
      { type: 'TOTAL', ...stats['TOTAL'] }
    ]);
  };

  const handleSavePPS = async () => {
    if (!formPps.name || !formPps.capacity) {
      return Alert.alert('Ralat', 'Nama PPS dan Kapasiti wajib diisi.');
    }

    setLoadingPPS(true);
    const payload = {
      name: formPps.name,
      zone: formPps.zone,
      type: formPps.type,
      capacity: parseInt(formPps.capacity) || 0,
      status: formPps.status || 'OK'
    };

    if (formModePps === 'add') {
      const { error } = await supabase.from('pps_list').insert([payload]);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'PPS ditambah.'); setModalPpsVisible(false); fetchPPS(); }
    } else {
      const { error } = await supabase.from('pps_list').update(payload).eq('id', editIdPps);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'PPS dikemaskini.'); setModalPpsVisible(false); fetchPPS(); }
    }
    setLoadingPPS(false);
  };

  const confirmDeletePPS = (id) => {
    if (Platform.OS === 'web') {
      const proceed = window.confirm('Pengesahan: Adakah anda pasti mahu memadam PPS ini?');
      if (proceed) executeDeletePPS(id);
    } else {
      Alert.alert('Pengesahan Padam', 'Adakah anda pasti mahu memadam PPS ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: () => executeDeletePPS(id) },
      ]);
    }
  };

  const executeDeletePPS = async (id) => {
    setLoadingPPS(true);
    const { error } = await supabase.from('pps_list').delete().eq('id', id);
    if (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
    } else {
      fetchPPS();
    }
    setLoadingPPS(false);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 1. RENDER JPBD
  const renderJPBD = () => (
    <View>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Direktori Agensi (JPBD)</Text>
        
        {userRole === 'admin' && isEditMode ? (
          <TouchableOpacity style={styles.addButton} onPress={() => {
            setFormModeJpbd('add');
            setFormJpbd({ agency: '', officer: '', position: '', grade: '', email: '', address: '', office_phone: '', mobile_phone: '', fax: '', officers_count: '', members_count: '', logistics_assets: '' });
            setModalJpbdVisible(true);
          }}>
            <Plus size={16} color="#fff" />
            <Text style={styles.addButtonText}>Tambah</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loadingJPBD && jpbdList.length === 0 ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 20 }} />
      ) : jpbdList.length === 0 ? (
        <Text style={styles.emptyText}>Tiada rekod dijumpai. Sila tambah agensi.</Text>
      ) : (
        jpbdList.map((item, index) => {
          const isExpanded = expandedId === item.id;
          return (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity style={styles.header} onPress={() => toggleExpand(item.id)} activeOpacity={0.7}>
                <View style={styles.headerContent}>
                  <Text style={styles.agencyName}>{index + 1}. {item.agency}</Text>
                  {item.officer ? <Text style={styles.officerName}>{item.officer}</Text> : null}
                </View>
                <Briefcase size={20} color="#1E3A8A" />
              </TouchableOpacity>

              {isExpanded ? (
                <View style={styles.body}>
                  {userRole === 'admin' && isEditMode ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => {
                        setFormModeJpbd('edit');
                        setEditIdJpbd(item.id);
                        setFormJpbd({ 
                          ...item, 
                          officers_count: item.officers_count?.toString() || '', 
                          members_count: item.members_count?.toString() || '' 
                        });
                        setModalJpbdVisible(true);
                      }}>
                        <Edit size={14} color="#fff" />
                        <Text style={styles.actionText}>Kemaskini</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDeleteJPBD(item.id)}>
                        <Trash2 size={14} color="#fff" />
                        <Text style={styles.actionText}>Padam</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View style={styles.section}>
                    <Text style={styles.label}>Jawatan: <Text style={styles.value}>{item.position || '-'}</Text></Text>
                    <Text style={styles.label}>Email: <Text style={styles.value}>{item.email || '-'}</Text></Text>
                    <Text style={styles.label}>Gred: <Text style={styles.value}>{item.grade || '-'}</Text></Text>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Hubungan & Logistik</Text>
                  <Text style={styles.label}>Alamat: <Text style={styles.value}>{item.address || '-'}</Text></Text>
                  
                  <View style={styles.row}>
                      <View style={styles.halfCol}><Text style={styles.label}>Tel (Pejabat):</Text><Text style={styles.value}>{item.office_phone || '-'}</Text></View>
                      <View style={styles.halfCol}><Text style={styles.label}>Tel (Bimbit):</Text><Text style={styles.value}>{item.mobile_phone || '-'}</Text></View>
                  </View>
                  <Text style={[styles.label, { marginTop: 4 }]}>Fax: <Text style={styles.value}>{item.fax || '-'}</Text></Text>

                  {(item.officers_count || item.members_count) ? (
                      <>
                          <View style={[styles.divider, { marginVertical: 8 }]} />
                          <Text style={styles.subTitle}>Kekuatan Anggota</Text>
                          <View style={styles.row}>
                              <View style={styles.halfCol}><Text style={styles.statLabel}>Pegawai</Text><Text style={styles.statValue2}>{item.officers_count || '0'}</Text></View>
                              <View style={styles.halfCol}><Text style={styles.statLabel}>Anggota</Text><Text style={styles.statValue2}>{item.members_count || '0'}</Text></View>
                          </View>
                      </>
                  ) : null}

                  {item.logistics_assets ? (
                    <View style={styles.logisticsBox}>
                      <Text style={styles.subTitle}>Logistik & Aset:</Text>
                      <Text style={styles.logItem}>{item.logistics_assets}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );

  // 2. RENDER HOTSPOT 
  const renderHotspot = () => {
    const banjirData = hotspotList.filter(h => h.category === 'banjir');
    const cerunData = hotspotList.filter(h => h.category === 'cerun');
    const pantaiData = hotspotList.filter(h => h.category === 'pantai');

    const renderHotspotItem = (item, badgeColor, prefixText = 'NO.') => (
      <View key={item.id} style={styles.hotspotCard}>
        <View style={[styles.hotspotBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.hotspotBadgeText}>{prefixText} {item.ref_no || '-'}</Text>
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={styles.hotspotRiver}>{item.river}</Text>
          <Text style={styles.hotspotArea}>{item.area}</Text>
        </View>

        {userRole === 'admin' && isEditMode ? (
          <View style={styles.ppsActions}>
            <TouchableOpacity onPress={() => {
                setFormModeHotspot('edit');
                setEditIdHotspot(item.id);
                setFormHotspot({ category: item.category, ref_no: item.ref_no || '', river: item.river, area: item.area });
                setModalHotspotVisible(true);
              }} style={styles.iconBtn}>
              <Edit size={16} color="#22c55e" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDeleteHotspot(item.id)} style={styles.iconBtn}>
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );

    return (
      <View>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Senarai Hotspot Bencana</Text>
          {userRole === 'admin' && isEditMode ? (
            <TouchableOpacity style={styles.addButton} onPress={() => {
              setFormModeHotspot('add');
              setFormHotspot({ category: 'banjir', ref_no: '', river: '', area: '' });
              setModalHotspotVisible(true);
            }}>
              <Plus size={16} color="#fff" />
              <Text style={styles.addButtonText}>Tambah</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {loadingHotspot && hotspotList.length === 0 ? (
          <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 20 }} />
        ) : hotspotList.length === 0 ? (
          <Text style={styles.emptyText}>Tiada data hotspot dijumpai.</Text>
        ) : (
          <>
            <View style={[styles.hotspotHeader, { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }]}>
              <Droplets size={24} color="#2563eb" />
              <View>
                <Text style={[styles.hotspotTitle, { color: '#1e3a8a' }]}>HOTSPOT BANJIR</Text>
                <Text style={styles.hotspotSub}>Kawasan berisiko banjir</Text>
              </View>
            </View>
            
            <View style={styles.mapCard}>
              <Image source={require('../../assets/map_banjir.png')} style={styles.mapImage} resizeMode="contain" />
              <Text style={styles.mapCaption}>Rajah 1: Peta Taburan Hotspot Banjir</Text>
            </View>
            
            {banjirData.map(item => renderHotspotItem(item, '#2563eb', 'NO.'))}

            {pantaiData.length > 0 ? (
              <View style={{ marginTop: 25 }}>
                <View style={[styles.hotspotHeader, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                  <Droplets size={24} color="#d97706" />
                  <View>
                    <Text style={[styles.hotspotTitle, { color: '#92400e' }]}>HOTSPOT PANTAI</Text>
                    <Text style={styles.hotspotSub}>Kawasan hakisan pantai / ombak besar</Text>
                  </View>
                </View>
                {pantaiData.map(item => renderHotspotItem(item, '#f59e0b', 'ID'))}
              </View>
            ) : null}

            <View style={[styles.hotspotHeader, { backgroundColor: '#fff7ed', borderColor: '#f97316', marginTop: 25 }]}>
              <Mountain size={24} color="#ea580c" />
              <View>
                <Text style={[styles.hotspotTitle, { color: '#9a3412' }]}>HOTSPOT TANAH RUNTUH</Text>
                <Text style={styles.hotspotSub}>Cerun Kritikal & Berisiko</Text>
              </View>
            </View>
            
            <View style={styles.mapCard}>
              <Image source={require('../../assets/map_landslide.png')} style={styles.mapImage} resizeMode="contain" />
              <Text style={styles.mapCaption}>Rajah 2: Lokasi Cerun Kritikal (Landslide)</Text>
            </View>

            {cerunData.map(item => renderHotspotItem(item, '#ea580c', 'ID'))}
          </>
        )}
      </View>
    );
  };

  // 3. RENDER PPS
  const renderPPS = () => (
    <View>
      <View style={styles.statsGrid}>
        {ppsStats.map((stat, index) => (
          <View key={index} style={[styles.statCard, stat.type === 'TOTAL' ? styles.statCardTotal : null]}>
            <Text style={[styles.statLabel, stat.type === 'TOTAL' ? { color: 'white' } : null]}>{stat.type}</Text>
            <Text style={[styles.statValue, stat.type === 'TOTAL' ? { color: 'white' } : null]}>{stat.qty}</Text>
            <Text style={[styles.statSub, stat.type === 'TOTAL' ? { color: '#bfdbfe' } : null]}>{stat.capacity} pax</Text>
          </View>
        ))}
      </View>

      <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
        <Text style={styles.sectionHeaderTitle}>Senarai & Status PPS</Text>
        
        {userRole === 'admin' && isEditMode ? (
          <TouchableOpacity style={styles.addButton} onPress={() => {
            setFormModePps('add');
            setFormPps({ name: '', zone: '', type: 'Dewan', capacity: '', status: 'OK' });
            setModalPpsVisible(true);
          }}>
            <Plus size={16} color="#fff" />
            <Text style={styles.addButtonText}>Tambah PPS</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loadingPPS && ppsList.length === 0 ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 20 }} />
      ) : ppsList.length === 0 ? (
        <Text style={styles.emptyText}>Tiada data PPS dijumpai.</Text>
      ) : (
        ppsList.map((pps) => (
          <View key={pps.id} style={styles.ppsCard}>
            <View style={styles.ppsHeader}>
              <View style={[styles.ppsIconBox, pps.status !== 'OK' && {backgroundColor: '#ef4444'}]}>
                <Home size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                  <Text style={styles.ppsName}>{pps.name}</Text>
                  <View style={styles.ppsTags}>
                      <View style={styles.tagZone}><Text style={styles.tagText}>Zon {pps.zone || '-'}</Text></View>
                      <View style={styles.tagCap}><Text style={styles.tagText}>{pps.capacity} Pax</Text></View>
                      <View style={styles.tagType}><Text style={styles.tagText}>{pps.type}</Text></View>
                  </View>
              </View>
              
              {userRole === 'admin' && isEditMode ? (
                <View style={styles.ppsActions}>
                  <TouchableOpacity onPress={() => {
                      setFormModePps('edit');
                      setEditIdPps(pps.id);
                      setFormPps({ ...pps, capacity: pps.capacity.toString() });
                      setModalPpsVisible(true);
                    }} style={styles.iconBtn}>
                    <Edit size={16} color="#22c55e" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDeletePPS(pps.id)} style={styles.iconBtn}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {pps.status !== 'OK' ? (
              <View style={styles.alertBox}>
                  <AlertCircle size={16} color="#ef4444" />
                  <Text style={styles.alertText}>{pps.status}</Text>
              </View>
            ) : null}
          </View>
        ))
      )}
    </View>
  );

  // 4. PETA MAP HTML (rendu au niveau composant, comme OperasiScreen)
  const petaMapHtml = `
    <!DOCTYPE html>
    <html style="height: 100%; margin: 0;">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; height: 100%; background-color: ${theme?.background || '#f8fafc'}; }
          #map { height: 100%; width: 100%; }
          .leaflet-control-zoom { border: none !important; margin-right: 20px !important; margin-bottom: 30px !important; }
          .leaflet-popup-content-wrapper { border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .custom-popup { text-align: center; font-family: sans-serif; }
          .custom-popup strong { font-size: 14px; color: #1f2937; display: block; margin-bottom: 4px; }
          .custom-popup span { font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([5.2831, 115.2308], 12);
          var canDeleteCalamity = ${userRole === 'admin' || userRole === 'sekretariat' ? 'true' : 'false'};
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          window.addEventListener('resize', function() {
            map.invalidateSize();
          });

          var createIcon = (color) => L.divIcon({
            className: 'custom-pin',
            html: '<svg width="26" height="34" viewBox="0 0 26 34" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">' +
                    '<path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="' + color + '" fill-opacity="0.72" stroke="white" stroke-width="2"/>' +
                    '<circle cx="13" cy="13" r="5" fill="white" fill-opacity="0.9"/>' +
                  '</svg>',
            iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30]
          });

          var markers = {};
          var calamityMarkers = {};

          map.on('click', function(e) {
            window.parent.postMessage(JSON.stringify({
              type: 'MAP_CLICKED',
              lat: e.latlng.lat,
              lng: e.latlng.lng
            }), '*');
          });

          window.requestDeleteCalamity = function(id) {
            window.parent.postMessage(JSON.stringify({
              type: 'DELETE_CALAMITY_REQUEST',
              id: id
            }), '*');
          };

          var createCalamityIcon = (color, category) => L.divIcon({
            className: 'calamity-pin',
            html: '<svg width="28" height="36" viewBox="0 0 28 36" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">' +
                    '<path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="' + color + '" stroke="white" stroke-width="2"/>' +
                    '<polygon points="14,7 20,18 8,18" fill="white"/>' +
                    '<text x="14" y="17" text-anchor="middle" font-size="9" font-weight="900" fill="' + color + '" font-family="sans-serif">!</text>' +
                  '</svg>',
            iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -34]
          });
          window.addEventListener('message', function(event) {
            var data = JSON.parse(event.data);
            if (data.type === 'UPDATE_AGENCIES') {
              var currentIds = data.payload.map(function(a) { return a.id; });
              Object.keys(markers).forEach(function(id) {
                if (currentIds.indexOf(id) === -1) {
                  map.removeLayer(markers[id]);
                  delete markers[id];
                }
              });

              data.payload.forEach(function(a) {
                var popupContent = '<div class="custom-popup"><strong>' + a.agency + '</strong><span>' + a.name + ' — ' + a.updated + '</span></div>';
                if (markers[a.id]) {
                  markers[a.id].setLatLng([a.lat, a.lng]).setPopupContent(popupContent);
                } else {
                  markers[a.id] = L.marker([a.lat, a.lng], { icon: createIcon(a.color) })
                    .bindPopup(popupContent)
                    .addTo(map);
                }
              });
            } else if (data.type === 'UPDATE_CALAMITIES') {
              var currentCalamityIds = data.payload.map(function(c) { return c.id; });
              Object.keys(calamityMarkers).forEach(function(id) {
                if (currentCalamityIds.indexOf(id) === -1) {
                  map.removeLayer(calamityMarkers[id]);
                  delete calamityMarkers[id];
                }
              });

              data.payload.forEach(function(c) {
                if (!calamityMarkers[c.id]) {
                  var popupDiv = document.createElement('div');
                  popupDiv.className = 'custom-popup';

                  var strongEl = document.createElement('strong');
                  strongEl.textContent = c.label;
                  popupDiv.appendChild(strongEl);

                  var spanEl = document.createElement('span');
                  spanEl.textContent = c.description || 'Tiada keterangan';
                  popupDiv.appendChild(spanEl);

                  if (canDeleteCalamity) {
                    var btnEl = document.createElement('button');
                    btnEl.textContent = 'Padam Titik';
                    btnEl.style.marginTop = '6px';
                    btnEl.style.backgroundColor = '#ef4444';
                    btnEl.style.color = 'white';
                    btnEl.style.border = 'none';
                    btnEl.style.padding = '4px 10px';
                    btnEl.style.borderRadius = '6px';
                    btnEl.style.fontSize = '11px';
                    btnEl.style.fontWeight = '700';
                    btnEl.style.cursor = 'pointer';
                    btnEl.style.width = '100%';
                    btnEl.addEventListener('click', function() {
                      window.requestDeleteCalamity(c.id);
                    });
                    popupDiv.appendChild(btnEl);
                  }

                  calamityMarkers[c.id] = L.marker([c.lat, c.lng], { icon: createCalamityIcon(c.color, c.category) })
                    .bindPopup(popupDiv)
                    .addTo(map);
                }
              });
            }
          });
        </script>
      </body>
    </html>
  `;
  const agencyColorMap = buildAgencyColorMap(jpbdList);
  const getAgencyColorFromMap = (agencyName) => agencyColorMap[agencyName] || '#64748b';
  const petaMapSrc = `data:text/html;charset=utf-8,${encodeURIComponent(petaMapHtml)}`;

  return (
    <View style={styles.container}>
      <View style={styles.mainHeader}>
        <View>
          <Text style={styles.mainTitle}>SEKRETARIAT JPBD</Text>
          <Text style={styles.subMainTitle}>W.P. LABUAN</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'JPBD' ? styles.tabActive : null]} onPress={() => setActiveTab('JPBD')}>
          <Users size={18} color={activeTab === 'JPBD' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'JPBD' ? styles.tabTextActive : null]}>Jawatankuasa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'HOTSPOT' ? styles.tabActive : null]} onPress={() => setActiveTab('HOTSPOT')}>
          <AlertTriangle size={18} color={activeTab === 'HOTSPOT' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'HOTSPOT' ? styles.tabTextActive : null]}>Hotspot</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'PPS' ? styles.tabActive : null]} onPress={() => setActiveTab('PPS')}>
          <Home size={18} color={activeTab === 'PPS' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'PPS' ? styles.tabTextActive : null]}>Data PPS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'PETA' ? styles.tabActive : null]} onPress={() => setActiveTab('PETA')}>
          <Map size={18} color={activeTab === 'PETA' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'PETA' ? styles.tabTextActive : null]}>PETA</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'PETA' ? (
        // --- PETA: carte à gauche, historique à droite ---
        <View style={[styles.petaFixedContainer, { height: '70vh', minHeight: 500 }]}>
          <View style={styles.petaMapHalf}>
            <View style={styles.petaMapContainer}>
              {Platform.OS === 'web' ? (
                createElement('iframe', {
                  ref: petaIframeRef,
                  src: petaMapSrc,
                  style: { width: '100%', height: '100%', border: 'none' },
                  title: "Peta Agensi",
                  onLoad: handlePetaIframeLoad
                })
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme?.card || '#fff' }}>
                  <Map size={48} color={theme?.textSecondary || '#64748b'} />
                  <Text style={{ marginTop: 12, color: theme?.textSecondary || '#64748b', fontWeight: '600' }}>
                    Peta memerlukan 'react-native-webview' pada peranti mudah alih.
                  </Text>
                </View>
              )}
              {petaIframeLoading && Platform.OS === 'web' && (
                <View style={[styles.loader, { backgroundColor: theme?.background || '#f8fafc' }]}>
                  <ActivityIndicator size="large" color="#1E3A8A" />
                </View>
              )}
            </View>

            <View style={styles.petaHeaderCard}>
              <View style={styles.petaIconCircle}><Map color="#fff" size={20} /></View>
              <View>
                <Text style={styles.petaHeaderTitle}>Peta Agensi</Text>
                <View style={styles.liveTagContainer}>
                  {onlineAgencies.length > 0 && <View style={styles.liveDot} />}
                  <Text style={[styles.liveText, { color: onlineAgencies.length > 0 ? '#22c55e' : '#94a3b8' }]}>
                    {onlineAgencies.length} AGENSI ONLINE
                  </Text>
                </View>
              </View>
            </View>

            {onlineAgencies.length > 0 && (
              <View style={styles.petaListContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {onlineAgencies.map(a => (
                    <View key={a.id} style={styles.petaAgencyCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={[styles.petaAgencyDot, { backgroundColor: getAgencyColorFromMap(a.jpbd_directory?.agency) }]} />
                        <View>
                          <Text style={styles.petaAgencyName} numberOfLines={1}>{a.jpbd_directory?.agency || '-'}</Text>
                          <Text style={styles.petaAgencyUser}>{a.member_name}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            {userRole === 'sekretariat' || userRole === 'admin' ? (
              <View style={styles.calamityPalette}>
                <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {CALAMITY_CATEGORIES.map(cat => {
                  const isActive = activeCalamityTool === cat.key;
                  return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.calamityToolBtn, { backgroundColor: isActive ? cat.color : '#fff', borderColor: cat.color }]}
                    onPress={() => setActiveCalamityTool(isActive ? null : cat.key)}
                    {...(Platform.OS === 'web' ? {
                      onMouseEnter: (e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setCalamityTooltip({ text: cat.label, top: rect.top, left: rect.left });
                      },
                      onMouseLeave: () => setCalamityTooltip(null),
                    } : {})}
                  >
                    <Text style={[styles.calamityToolText, { color: isActive ? '#fff' : cat.color }]}>{cat.key}</Text>
                  </TouchableOpacity>
                  );
                })}
                </ScrollView>
                {activeCalamityTool && (
                  <Text style={styles.calamityHint}>Klik pada peta untuk letak titik</Text>
                )}
              </View>
            ) : null}
            {jpbdList.length > 0 && (
              <View style={styles.agencyLegendPalette}>
                <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                  {jpbdList.map(a => (
                    <View key={a.id} style={styles.agencyLegendRow}>
                      <View style={[styles.agencyLegendDot, { backgroundColor: getAgencyColorFromMap(a.agency) }]} />
                      <Text style={styles.agencyLegendLabel} numberOfLines={1}>{a.agency}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
                <TouchableOpacity
                  style={styles.historyToggleBtn}
                  onPress={() => setShowHistory(!showHistory)}
                  {...(Platform.OS === 'web' ? {
                    onMouseEnter: () => setHistoryBtnHovered(true),
                    onMouseLeave: () => setHistoryBtnHovered(false),
                  } : {})}
                >
                  <History size={18} color="#1E3A8A" />
                  {historyBtnHovered && (
                    <View style={styles.historyTooltip}>
                      <Text style={styles.historyTooltipText}>Sejarah</Text>
                    </View>
                  )}
                </TouchableOpacity>          
          </View>

            {showHistory && (
            <View style={styles.petaHistoryHalf}>
              <View style={styles.petaHistoryHeader}>
                <Text style={styles.petaHistoryTitle}>Sejarah Aktiviti Agensi</Text>
              </View>

              {loadingHistory ? (
                <ActivityIndicator size="small" color="#1E3A8A" style={{ marginTop: 20 }} />
              ) : trackingHistory.length === 0 ? (
                <Text style={styles.emptyText}>Tiada rekod sejarah lagi.</Text>
              ) : (
                <>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, { flex: 1.6 }]}>Agensi</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tempoh</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Jarak</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Tarikh</Text>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {trackingHistory.map((h, index) => (
                      <View
                        key={h.id}
                        style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }]}
                      >
                        <View style={{ flex: 1.6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={[styles.petaAgencyDot, { backgroundColor: getAgencyColorFromMap(h.jpbd_directory?.agency) }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.tableCellAgency} numberOfLines={1}>{h.jpbd_directory?.agency || '-'}</Text>
                            <Text style={styles.tableCellMember} numberOfLines={1}>{h.member_name}</Text>
                          </View>
                        </View>

                        <Text style={[styles.tableCell, { flex: 1 }]}>{formatDuration(h.duration_seconds)}</Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>{h.distance_km?.toFixed(2) || '0.00'} km</Text>

                        <View style={{ flex: 1.3 }}>
                          <Text style={styles.tableCellDate}>{new Date(h.ended_at).toLocaleDateString('ms-MY')}</Text>
                          <Text style={styles.tableCellTime}>{new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
            )}
          </View>
        ) : (
        // --- Autres onglets : ScrollView classique ---
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          
          {/* UNIVERSAL ADMIN EDIT BUTTON */}
          <AdminEditButton 
            isEditMode={isEditMode} 
            setIsEditMode={setIsEditMode} 
            userRole={userRole} 
          />

          {activeTab === 'JPBD' ? renderJPBD() : null}
          {activeTab === 'HOTSPOT' ? renderHotspot() : null}
          {activeTab === 'PPS' ? renderPPS() : null}
        </ScrollView>
      )}

      {/* --- MODALS BELOW --- */}
      <Modal visible={modalJpbdVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModeJpbd === 'add' ? 'Tambah Agensi' : 'Kemaskini Agensi'}</Text>
              <TouchableOpacity onPress={() => setModalJpbdVisible(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Agensi *</Text>
              <TextInput style={styles.input} placeholder="Contoh: PDRM" value={formJpbd.agency} onChangeText={(t) => setFormJpbd({...formJpbd, agency: t})} />
              <Text style={styles.inputLabel}>Nama Pegawai</Text>
              <TextInput style={styles.input} placeholder="Nama penuh pegawai" value={formJpbd.officer} onChangeText={(t) => setFormJpbd({...formJpbd, officer: t})} />
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Jawatan</Text>
                  <TextInput style={styles.input} placeholder="Cth: Pengarah" value={formJpbd.position} onChangeText={(t) => setFormJpbd({...formJpbd, position: t})} />
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Gred</Text>
                  <TextInput style={styles.input} placeholder="Cth: KB 9" value={formJpbd.grade} onChangeText={(t) => setFormJpbd({...formJpbd, grade: t})} />
                </View>
              </View>
              <Text style={styles.inputLabel}>E-mel</Text>
              <TextInput style={styles.input} placeholder="emel@domain.com" keyboardType="email-address" value={formJpbd.email} onChangeText={(t) => setFormJpbd({...formJpbd, email: t})} />
              <Text style={styles.inputLabel}>Alamat</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Alamat penuh" multiline value={formJpbd.address} onChangeText={(t) => setFormJpbd({...formJpbd, address: t})} />
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Tel Pejabat</Text>
                  <TextInput style={styles.input} placeholder="087-XXXXXX" keyboardType="phone-pad" value={formJpbd.office_phone} onChangeText={(t) => setFormJpbd({...formJpbd, office_phone: t})} />
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Tel Bimbit</Text>
                  <TextInput style={styles.input} placeholder="01X-XXXXXXX" keyboardType="phone-pad" value={formJpbd.mobile_phone} onChangeText={(t) => setFormJpbd({...formJpbd, mobile_phone: t})} />
                </View>
              </View>
              <Text style={styles.inputLabel}>No. Fax</Text>
              <TextInput style={styles.input} placeholder="087-XXXXXX" keyboardType="phone-pad" value={formJpbd.fax} onChangeText={(t) => setFormJpbd({...formJpbd, fax: t})} />
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Bil. Pegawai</Text>
                  <TextInput style={styles.input} placeholder="Cth: 5" keyboardType="number-pad" value={formJpbd.officers_count} onChangeText={(t) => setFormJpbd({...formJpbd, officers_count: t})} />
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Bil. Anggota</Text>
                  <TextInput style={styles.input} placeholder="Cth: 30" keyboardType="number-pad" value={formJpbd.members_count} onChangeText={(t) => setFormJpbd({...formJpbd, members_count: t})} />
                </View>
              </View>
              <Text style={styles.inputLabel}>Logistik & Aset (Senaraikan)</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Cth: 3 Buah Hilux, 2 Bot Aluminium..." multiline value={formJpbd.logistics_assets} onChangeText={(t) => setFormJpbd({...formJpbd, logistics_assets: t})} />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveJPBD}>
                {loadingJPBD ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Simpan Rekod</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={modalPpsVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModePps === 'add' ? 'Tambah PPS' : 'Kemaskini PPS'}</Text>
              <TouchableOpacity onPress={() => setModalPpsVisible(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Pusat Pemindahan (PPS) *</Text>
              <TextInput style={styles.input} placeholder="Cth: Dewan Serbaguna Perbadanan" value={formPps.name} onChangeText={(t) => setFormPps({...formPps, name: t})} />
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Zon (Kawasan)</Text>
                  <TextInput style={styles.input} placeholder="Cth: 1" value={formPps.zone} onChangeText={(t) => setFormPps({...formPps, zone: t})} />
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Kapasiti (Pax) *</Text>
                  <TextInput style={styles.input} placeholder="Cth: 500" keyboardType="number-pad" value={formPps.capacity} onChangeText={(t) => setFormPps({...formPps, capacity: t})} />
                </View>
              </View>
              <Text style={styles.inputLabel}>Kategori PPS</Text>
              <View style={styles.categoryWrap}>
                {['Dewan', 'Sekolah/Kolej', 'Balairaya', 'Lain-Lain'].map(type => (
                  <TouchableOpacity 
                    key={type} 
                    style={[styles.categoryBtn, formPps.type === type ? styles.categoryBtnActive : null]}
                    onPress={() => setFormPps({...formPps, type: type})}
                  >
                    <Text style={[styles.categoryBtnText, formPps.type === type ? styles.categoryBtnTextActive : null]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Status Kesediaan</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="OK (Atau nyatakan kerosakan)" multiline value={formPps.status} onChangeText={(t) => setFormPps({...formPps, status: t})} />
              <TouchableOpacity style={styles.saveButton} onPress={handleSavePPS}>
                {loadingPPS ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Simpan PPS</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={modalHotspotVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModeHotspot === 'add' ? 'Tambah Hotspot' : 'Kemaskini Hotspot'}</Text>
              <TouchableOpacity onPress={() => setModalHotspotVisible(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Kategori Hotspot</Text>
              <View style={styles.categoryWrap}>
                {['banjir', 'pantai', 'cerun'].map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.categoryBtn, formHotspot.category === cat ? styles.categoryBtnActive : null]}
                    onPress={() => setFormHotspot({...formHotspot, category: cat})}
                  >
                    <Text style={[styles.categoryBtnText, formHotspot.category === cat ? styles.categoryBtnTextActive : null]}>
                      {cat.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>No. Rujukan / ID *</Text>
              <TextInput style={styles.input} placeholder="Cth: 1, 2, atau 17/4" value={formHotspot.ref_no} onChangeText={(t) => setFormHotspot({...formHotspot, ref_no: t})} />
              <Text style={styles.inputLabel}>Sungai / Koordinat / Lokasi Utama *</Text>
              <TextInput style={styles.input} placeholder="Cth: Sg. Kinabenua / 5°22'16.5N 115..." value={formHotspot.river} onChangeText={(t) => setFormHotspot({...formHotspot, river: t})} />
              <Text style={styles.inputLabel}>Kawasan Terjejas *</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Cth: Kg Rancha-Rancha / Slope ID 17/4" multiline value={formHotspot.area} onChangeText={(t) => setFormHotspot({...formHotspot, area: t})} />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveHotspot}>
                {loadingHotspot ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Simpan Hotspot</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={calamityModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Titik Bencana</Text>
              <TouchableOpacity onPress={() => { setCalamityModalVisible(false); setPendingPlacement(null); }}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Kategori: {getCalamityMeta(activeCalamityTool).label}</Text>
              <Text style={styles.inputLabel}>Keterangan (pilihan)</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Cth: Air naik setinggi 1 meter"
                multiline
                value={calamityDescription}
                onChangeText={setCalamityDescription}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCalamity}>
                <Text style={styles.saveButtonText}>Simpan Titik</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {Platform.OS === 'web' && calamityTooltip &&
        createElement('div', {
          style: {
            position: 'fixed',
            top: `${calamityTooltip.top}px`,
            left: `${calamityTooltip.left - 175}px`,
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '600',
            width: '160px',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          }
        }, calamityTooltip.text)
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  mainHeader: { flexDirection: 'row', backgroundColor: '#1E3A8A', padding: 20, paddingTop: 50, alignItems: 'center', justifyContent: 'space-between' },
  mainTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  subMainTitle: { color: '#93c5fd', fontSize: 12, fontWeight: '700', marginTop: 2 },
  
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', elevation: 4 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#f97316', backgroundColor: '#fff7ed' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  tabTextActive: { color: '#f97316', fontWeight: '800' },
  listContent: { padding: 15, paddingBottom: 50 },
  
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 0 },
  addButton: { flexDirection: 'row', backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignItems: 'center', gap: 6 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20, fontStyle: 'italic' },

  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerContent: { flex: 1 },
  agencyName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  officerName: { fontSize: 13, color: '#64748b', marginTop: 4 },
  body: { padding: 16, paddingTop: 0, backgroundColor: '#f8fafc', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 10 },
  editBtn: { flexDirection: 'row', backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, alignItems: 'center', gap: 4 },
  deleteBtn: { flexDirection: 'row', backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, alignItems: 'center', gap: 4 },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#1E3A8A', marginTop: 12, marginBottom: 8, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#cbd5e1', marginVertical: 10 },
  section: { marginTop: 5 },
  label: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  value: { color: '#334155', fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  halfCol: { width: '48%' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  statValue2: { fontSize: 18, fontWeight: 'bold', color: '#1E3A8A', textAlign: 'center' },
  logisticsBox: { backgroundColor: '#e0f2fe', padding: 10, borderRadius: 8, marginTop: 10 },
  subTitle: { fontSize: 12, fontWeight: '700', color: '#0284c7', marginBottom: 4 },
  logItem: { fontSize: 12, color: '#0369a1', marginLeft: 4, marginBottom: 2 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', width: '100%', borderRadius: 12, maxHeight: '85%', overflow: 'hidden', elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  modalForm: { padding: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 14, color: '#334155', backgroundColor: '#f8fafc' },
  saveButton: { backgroundColor: '#1E3A8A', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 25 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f1f5f9' },
  categoryBtnActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  categoryBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  categoryBtnTextActive: { color: '#1d4ed8' },

  // Hotspot Styles
  hotspotHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 15, gap: 12 },
  hotspotTitle: { fontSize: 16, fontWeight: '800' },
  hotspotSub: { fontSize: 12, color: '#64748b' },
  hotspotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', gap: 12 },
  hotspotBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, width: 75, alignItems: 'center', justifyContent: 'center' },
  hotspotBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  hotspotRiver: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  hotspotArea: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  mapCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#cbd5e1', padding: 10, alignItems: 'center' },
  mapImage: { width: '100%', height: 420, borderRadius: 8, backgroundColor: '#f1f5f9' },
  mapCaption: { fontSize: 12, color: '#64748b', marginTop: 8, fontWeight: '600', fontStyle: 'italic' },

  // PPS Styles
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  statCardTotal: { width: '100%', backgroundColor: '#2563eb', borderColor: '#2563eb' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginVertical: 4 },
  statSub: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  ppsCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  ppsHeader: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' },
  ppsIconBox: { width: 40, height: 40, backgroundColor: '#22c55e', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  ppsName: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  ppsTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tagZone: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagCap: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagType: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  ppsActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 6 },
  alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#fee2e2' },
  alertText: { fontSize: 11, color: '#ef4444', fontWeight: '700', flex: 1 },

  // PETA Styles (structure fixe type Operasi)
  petaFixedContainer: { flexDirection: 'row', margin: 15, borderRadius: 20, overflow: 'hidden' },
  petaMapHalf: { flex: 1, position: 'relative' },
  historyToggleBtn: {
    position: 'absolute', top: 16, right: 116, zIndex: 10,
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  historyTooltip: {
    position: 'absolute', top: 46, right: 0, zIndex: 20,
    backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  historyTooltipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  petaHistoryHalf: { flex: 1, backgroundColor: '#fff', borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  petaHistoryHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  petaHistoryTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  tableHeaderRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  tableHeaderCell: { fontSize: 10, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  tableCell: { fontSize: 12, fontWeight: '700', color: '#334155' },
  tableCellAgency: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  tableCellMember: { fontSize: 11, color: '#64748b', marginTop: 1 },
  tableCellDate: { fontSize: 11, fontWeight: '700', color: '#334155' },
  tableCellTime: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  petaMapContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  petaHeaderCard: { position: 'absolute', top: 16, left: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, minWidth: 200 },
  petaIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center' },
  petaHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  liveTagContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  liveText: { fontSize: 10, fontWeight: '700' },
  petaListContainer: { position: 'absolute', bottom: 50, left: 16, right: 16, zIndex: 10 },
  petaAgencyCard: { padding: 12, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, minWidth: 160 },
  petaAgencyDot: { width: 10, height: 10, borderRadius: 5 },
  petaAgencyName: { fontSize: 12, fontWeight: '700', color: '#0f172a', maxWidth: 120 },
  petaAgencyUser: { fontSize: 10, color: '#64748b' },
  calamityPalette: { position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: '#fff', borderRadius: 16, padding: 10, gap: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, width: 90 },
  calamityToolBtn: { paddingVertical: 8, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 6, position: 'relative' },
  calamityTooltip: {
    position: 'absolute', top: 0, right: '100%', marginRight: 8, zIndex: 30,
    backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    width: 160,
  },
  calamityTooltipText: { color: '#fff', fontSize: 11, fontWeight: '600', textAlign: 'left' },
    calamityToolText: { fontSize: 11, fontWeight: '800' },
  calamityHint: { fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 4 },
  agencyLegendPalette: {
    position: 'absolute', top: 110, left: 16, zIndex: 10, backgroundColor: '#fff',
    borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 10, elevation: 4, width: 140,
  },
  agencyLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  agencyLegendDot: { width: 10, height: 10, borderRadius: 5 },
  agencyLegendLabel: { fontSize: 11, fontWeight: '700', color: '#334155', flex: 1 },
});

export default SekretariatScreen;