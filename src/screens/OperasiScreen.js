// src/screen/OperasiScreen.js
import React, { useState, useEffect, useRef, useMemo, createElement } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Modal, Alert, TextInput, Platform } from 'react-native';
import { ShieldAlert, Ambulance, Truck, Car, Bike, Map as MapIcon, BarChart2, AlertTriangle, TrendingDown, TrendingUp, Calendar, ChevronDown, ChevronUp, Plus, Edit2, Trash2, X, Check, History } from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import { supabaseSandbox } from '../supabaseSandboxClient';

// Import Universal Edit Button
import AdminEditButton from '../components/AdminEditButton';

const CATEGORY_OPTIONS = [
  "KJR - Kemalangan Jalan Raya",
  "KMU - Kes Menangkap Ular",
  "MSS - Musnah Sarang Serangga",
  "ML - Mangsa Lemas",
  "SKT - Sakit",
  "KTK - Kemalangan Tempat Kerja",
  "MT - Mangsa Terperangkap",
  "KK - Kes Kebakaran",
  "KBD - Kes Bunuh Diri",
  "LLK - Lain-lain kes"
];

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

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

const getCalamityMeta = (key) => CALAMITY_CATEGORIES.find(c => c.key === key) || CALAMITY_CATEGORIES[10];

const getCategoryColor = (id) => {
  const colors = {
    "KJR": "#ef4444", "KMU": "#f97316", "MSS": "#eab308", "ML": "#3b82f6",
    "SKT": "#a855f7", "KTK": "#ec4899", "MT": "#14b8a6", "KK": "#f43f5e",
    "KBD": "#64748b", "LLK": "#94a3b8"
  };
  return colors[id] || "#3b82f6";
};

export default function OperasiScreen({ theme, userRole }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map'); 
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const iframeRef = useRef(null);

  // --- MASTER EDIT MODE STATE ---
  const [isEditMode, setIsEditMode] = useState(false);

  // CRUD State for Laporan NG999
  const [ngData, setNgData] = useState([]);
  const [loadingNg, setLoadingNg] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ id: null, kategori_kes: '', month: '', jumlah_kes: '1' });
  
  // Dropdown States for Modal
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);

  // --- Calamity points ---
  const [calamityPoints, setCalamityPoints] = useState([]);
  const [activeCalamityTool, setActiveCalamityTool] = useState(null);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [calamityDescription, setCalamityDescription] = useState('');
  const [calamityModalVisible, setCalamityModalVisible] = useState(false);

  // --- Historique de patrouille ---
  const [showHistory, setShowHistory] = useState(false);
  const [patrolHistory, setPatrolHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    let isMounted = true; 

    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from('logistik')
        .select('*')
        .eq('category', 'Darat');
        
      if (data && isMounted) {
        setVehicles(data);
      }
    };

    fetchVehicles();
    fetchNgData();

    const subscription = supabase
      .channel('vehicles_channel_web')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'logistik' }, (payload) => {
        const updatedVehicle = payload.new;
        
        if (isMounted) {
          setVehicles(current => current.map(v => v.id === updatedVehicle.id ? { ...v, ...updatedVehicle } : v));
        }

        if (iframeRef?.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(JSON.stringify({
            type: 'UPDATE_LOCATION',
            id: updatedVehicle.id,
            name: updatedVehicle.model, 
            lat: updatedVehicle.latitude,
            lng: updatedVehicle.longitude,
            color: updatedVehicle.color || '#ef4444',
            status: updatedVehicle.tracking_status 
          }), '*');
        }
      })
      .subscribe();
      
    fetchCalamityPoints();
    fetchPatrolHistory();

    const calamitySubscription = supabaseSandbox
      .channel('operasi_calamity_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'calamity_points' }, () => {
        fetchCalamityPoints();
      })
      .subscribe();

    const historySubscription = supabaseSandbox
      .channel('vehicle_patrol_history_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'vehicle_patrol_history' }, () => {
        fetchPatrolHistory();
      })
      .subscribe();

    return () => {
          isMounted = false;
          supabase.removeChannel(subscription);
          supabaseSandbox.removeChannel(calamitySubscription);
          supabaseSandbox.removeChannel(historySubscription);
        };
      }, []);

  useEffect(() => {
    if (!loading && iframeRef?.current?.contentWindow && vehicles.length > 0) {
      const payload = vehicles.map(v => ({
        ...v,
        name: v.model,
        status: v.tracking_status
      }));
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'INIT_VEHICLES', payload }), '*');
    }
  }, [vehicles, loading]);

  const fetchNgData = async () => {
    setLoadingNg(true);
    const { data, error } = await supabase
      .from('laporan_ng999')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setNgData(data);
    if (error) console.error("Error fetching NG999 data:", error);
    setLoadingNg(false);
  };

  const fetchCalamityPoints = async () => {
    const { data, error } = await supabaseSandbox.from('calamity_points').select('*');
    if (!error) setCalamityPoints(data || []);
  };

  const fetchPatrolHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabaseSandbox
      .from('vehicle_patrol_history')
      .select('*')
      .order('ended_at', { ascending: false })
      .limit(50);
    if (!error) setPatrolHistory(data || []);
    setLoadingHistory(false);
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}j ${m}m`;
    return `${m}m`;
  };

  const handleSaveCalamity = async () => {
    if (!pendingPlacement || !activeCalamityTool) return;
    const { error } = await supabaseSandbox.from('calamity_points').insert([{
      category: activeCalamityTool,
      description: calamityDescription.trim() || null,
      latitude: pendingPlacement.lat,
      longitude: pendingPlacement.lng
    }]);
    if (!error) {
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

  useEffect(() => {
    const handleMapMessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }
      if (data.type === 'MAP_CLICKED' && activeCalamityTool) {
        setPendingPlacement({ lat: data.lat, lng: data.lng });
        setCalamityModalVisible(true);
      } else if (data.type === 'DELETE_CALAMITY_REQUEST') {
        handleDeleteCalamity(data.id);
      }
    };
    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, [activeCalamityTool]);

  useEffect(() => {
    if (!loading && iframeRef?.current?.contentWindow) {
      const payload = calamityPoints.map(c => ({
        id: c.id,
        category: c.category,
        description: c.description || '',
        lat: c.latitude,
        lng: c.longitude,
        color: getCalamityMeta(c.category).color,
        label: getCalamityMeta(c.category).label
      }));
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_CALAMITIES', payload }), '*');
    }
  }, [calamityPoints, loading]);

  const handleSaveNg = async () => {
    if (!form.kategori_kes || !form.month || !form.jumlah_kes) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const caseAmount = parseInt(form.jumlah_kes, 10);
    if (isNaN(caseAmount) || caseAmount < 1) {
      Alert.alert('Error', 'Amount of cases must be a valid number greater than 0.');
      return;
    }

    setLoadingNg(true);
    if (form.id) {
      const { error } = await supabase
        .from('laporan_ng999')
        .update({ kategori_kes: form.kategori_kes, month: form.month, jumlah_kes: caseAmount })
        .eq('id', form.id);
      if (!error) fetchNgData();
    } else {
      const { error } = await supabase
        .from('laporan_ng999')
        .insert([{ kategori_kes: form.kategori_kes, month: form.month, jumlah_kes: caseAmount }]);
      if (!error) fetchNgData();
    }
    
    setLoadingNg(false);
    closeModal();
  };

  const handleDeleteNg = async (id) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this record?');
      if (confirmed) {
        setLoadingNg(true);
        const { error } = await supabase.from('laporan_ng999').delete().eq('id', id);
        if (!error) fetchNgData();
        setLoadingNg(false);
      }
    } else {
      Alert.alert('Confirmation', 'Are you sure you want to delete this record?', [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoadingNg(true);
            const { error } = await supabase.from('laporan_ng999').delete().eq('id', id);
            if (!error) fetchNgData();
            setLoadingNg(false);
          }
        }
      ]);
    }
  };

  const openEditModal = (record) => {
    setForm({ 
      id: record.id, 
      kategori_kes: record.kategori_kes, 
      month: record.month, 
      jumlah_kes: (record.jumlah_kes || 1).toString() 
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCategoryOpen(false);
    setMonthOpen(false);
    setForm({ id: null, kategori_kes: '', month: '', jumlah_kes: '1' });
  };

  const { dynamicMonthlyTrend, dynamicCaseBreakdown, topCaseData, totalMersCases } = useMemo(() => {
    const totalMersCases = ngData.reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);
    
    const dynamicMonthlyTrend = MONTH_OPTIONS.map(month => ({
      month,
      total: ngData.filter(item => item.month === month).reduce((sum, item) => sum + (item.jumlah_kes || 1), 0)
    })).filter(m => m.total > 0);

    const dynamicCaseBreakdown = CATEGORY_OPTIONS.map(opt => {
      const [id, ...labelArr] = opt.split(" - ");
      const label = labelArr.join(" - ");
      const color = getCategoryColor(id);
      
      let monthData = {};
      MONTH_OPTIONS.forEach(m => {
        monthData[m] = ngData
          .filter(item => item.kategori_kes === opt && item.month === m)
          .reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);
      });

      return { id, label, color, ...monthData };
    });

    let maxCount = 0;
    let topLabel = 'No Data Available';
    CATEGORY_OPTIONS.forEach(opt => {
      const count = ngData
        .filter(item => item.kategori_kes === opt)
        .reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);
      if (count > maxCount) {
        maxCount = count;
        topLabel = opt.split(" - ")[1];
      }
    });

    return { 
      dynamicMonthlyTrend, 
      dynamicCaseBreakdown, 
      topCaseData: { label: topLabel, total: maxCount },
      totalMersCases 
    };
  }, [ngData]);

  const getTrendData = () => {
    if (dynamicMonthlyTrend.length >= 2) {
      const current = dynamicMonthlyTrend[dynamicMonthlyTrend.length - 1];
      const prev = dynamicMonthlyTrend[dynamicMonthlyTrend.length - 2];
      const diff = current.total - prev.total;
      
      if (diff > 0) return { text: `+${diff} Cases`, color: '#b91c1c', bg: '#fef2f2', border: '#ef4444', icon: <TrendingUp size={16} color="#b91c1c" />, sub: `Compared to ${prev.month}` };
      if (diff < 0) return { text: `${diff} Cases`, color: '#15803d', bg: '#f0fdf4', border: '#22c55e', icon: <TrendingDown size={16} color="#15803d" />, sub: `Compared to ${prev.month}` };
      return { text: "No Change", color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', icon: <BarChart2 size={16} color="#64748b" />, sub: `Compared to ${prev.month}` };
    }
    return { text: "N/A", color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', icon: <BarChart2 size={16} color="#64748b" />, sub: "Need 2 months of data" };
  };
  const trendData = getTrendData();

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html style="height: 100%; margin: 0;">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; height: 100%; background-color: ${theme.background}; }
          #map { height: 100%; width: 100%; }
          .leaflet-control-zoom { border: none !important; margin-right: 20px !important; margin-bottom: 30px !important; }
          .leaflet-popup-content-wrapper { border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .custom-popup { text-align: center; font-family: sans-serif; }
          .custom-popup strong { font-size: 14px; color: #1f2937; display: block; margin-bottom: 4px; }
          .custom-popup span { font-size: 12px; font-weight: bold; padding: 2px 8px; border-radius: 12px; }
          .status-patrol { background-color: #dcfce7; color: #166534; }
          .status-idle { background-color: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var canDeleteCalamity = ${userRole === 'admin' ? 'true' : 'false'};
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([5.2831, 115.2308], 13);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          map.on('click', function(e) {
            window.parent.postMessage(JSON.stringify({ type: 'MAP_CLICKED', lat: e.latlng.lat, lng: e.latlng.lng }), '*');
          });

          window.requestDeleteCalamity = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'DELETE_CALAMITY_REQUEST', id: id }), '*');
          };

          var createIcon = (color) => L.divIcon({
            className: 'custom-pin',
            html: '<svg width="26" height="34" viewBox="0 0 26 34" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">' +
                    '<path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="' + color + '" fill-opacity="0.72" stroke="white" stroke-width="2"/>' +
                    '<circle cx="13" cy="13" r="5" fill="white" fill-opacity="0.9"/>' +
                  '</svg>',
            iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30]
          });

          var createCalamityIcon = (color, category) => L.divIcon({
            className: 'calamity-pin',
            html: '<div style="display: flex; align-items: center; gap: 5px; background-color: white; padding: 4px 8px 4px 4px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 1.5px solid ' + color + ';">' +
                    '<svg width="22" height="20" viewBox="0 0 24 22" style="flex-shrink: 0;">' +
                      '<polygon points="12,1 23,20 1,20" fill="' + color + '" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>' +
                      '<text x="12" y="17" text-anchor="middle" font-size="12" font-weight="900" fill="white" font-family="sans-serif">!</text>' +
                    '</svg>' +
                    '<span style="color: #1f2937; font-size: 11px; font-weight: 800; font-family: sans-serif; white-space: nowrap;">' + category + '</span>' +
                  '</div>',
            iconSize: [70, 30], iconAnchor: [15, 28], popupAnchor: [10, -25]
          });

          var createPopupContent = (name, status) => {
            var statusClass = status === 'Patrol' ? 'status-patrol' : 'status-idle';
            return '<div class="custom-popup"><strong>' + name + '</strong><span class="' + statusClass + '">' + status + '</span></div>';
          };

          var markers = {};
          var calamityMarkers = {};

          window.addEventListener('message', function(event) {
            var data = JSON.parse(event.data);
            
            if (data.type === 'INIT_VEHICLES') {
              data.payload.forEach(v => {
                if (v.latitude && v.longitude && v.status === 'Patrol' && !markers[v.id]) {
                  markers[v.id] = L.marker([v.latitude, v.longitude], { icon: createIcon(v.color || '#ef4444') })
                    .bindPopup(createPopupContent(v.name, v.status))
                    .addTo(map);
                }
              });
            } else if (data.type === 'UPDATE_LOCATION') {
              if (data.status === 'Patrol') {
                if (markers[data.id]) {
                  markers[data.id].setLatLng([data.lat, data.lng]).setPopupContent(createPopupContent(data.name, data.status));
                } else if (data.lat && data.lng) {
                  markers[data.id] = L.marker([data.lat, data.lng], { icon: createIcon(data.color) })
                    .bindPopup(createPopupContent(data.name, data.status))
                    .addTo(map);
                }
              } else {
                if (markers[data.id]) {
                  map.removeLayer(markers[data.id]);
                  delete markers[data.id];
                }
              }
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

  const mapSrc = `data:text/html;charset=utf-8,${encodeURIComponent(mapHtml)}`;

  const getVehicleIcon = (type, color) => {
    const lowerType = (type || '').toLowerCase(); 
    if (lowerType.includes('lori')) return <Truck size={16} color={color || "#f97316"}/>;
    if (lowerType.includes('ambulans')) return <Ambulance size={16} color={color || "#ef4444"}/>;
    if (lowerType.includes('motor') || lowerType.includes('kriss')) return <Bike size={16} color={color || "#3b82f6"}/>;
    return <Car size={16} color={color || "#10b981"}/>; 
  };

  const activeVehicles = vehicles.filter(v => v.tracking_status === 'Patrol');
  const activeVehiclesCount = activeVehicles.length;

  return (
    <View style={[styles.container, { height: '80vh', minHeight: 600, backgroundColor: theme.background }]}>
      
      {/* --- TOGGLE BUTTONS --- */}
      <View style={[styles.toggleWrapper, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={[styles.toggleBtn, activeTab === 'map' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('map')}
          activeOpacity={0.8}
        >
          <MapIcon size={16} color={activeTab === 'map' ? '#fff' : theme.textSecondary} />
          <Text style={[styles.toggleText, activeTab === 'map' ? styles.toggleTextActive : { color: theme.textSecondary }]}>Live Map</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.toggleBtn, activeTab === 'report' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('report')}
          activeOpacity={0.8}
        >
          <BarChart2 size={16} color={activeTab === 'report' ? '#fff' : theme.textSecondary} />
          <Text style={[styles.toggleText, activeTab === 'report' ? styles.toggleTextActive : { color: theme.textSecondary }]}>NG999 Report</Text>
        </TouchableOpacity>
      </View>

      {/* --- VIEW 1: LIVE MAP --- */}
      <View style={[styles.viewContainer, { display: activeTab === 'map' ? 'flex' : 'none', flexDirection: 'row' }]}>
        <View style={{ flex: 1, position: 'relative' }}>
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              createElement('iframe', {
                ref: iframeRef,
                src: mapSrc,
                style: { width: '100%', height: '100%', border: 'none' },
                title: "Leaflet Map",
                onLoad: handleIframeLoad
              })
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.card }}>
                <MapIcon size={48} color={theme.textSecondary} />
                <Text style={{ marginTop: 12, color: theme.textSecondary, fontWeight: '600' }}>
                  Live Map memerlukan 'react-native-webview' pada peranti mudah alih.
                </Text>
              </View>
            )}
            {loading && Platform.OS === 'web' && (
              <View style={[styles.loader, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color="#f97316" /></View>
            )}
          </View>

          <View style={[styles.headerCard, { backgroundColor: theme.card }]}>
            <View style={styles.iconCircle}><ShieldAlert color="#fff" size={20} /></View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Live Tracking</Text>
              <View style={styles.liveTagContainer}>
                {activeVehiclesCount > 0 && <View style={styles.liveDot} />}
                <Text style={[styles.liveText, { color: activeVehiclesCount > 0 ? '#22c55e' : theme.textSecondary }]}>
                  {activeVehiclesCount} ACTIVE ASSETS
                </Text>
              </View>
            </View>
          </View>

          {activeVehiclesCount > 0 && (
            <View style={styles.vehicleListContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {activeVehicles.map(v => (
                  <VehicleCard 
                    key={v.id} 
                    name={v.reg || v.model}
                    status={v.tracking_status} 
                    icon={getVehicleIcon(v.type, v.color)} 
                    theme={theme} 
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={styles.historyToggleBtn} onPress={() => setShowHistory(!showHistory)}>
            <History size={18} color="#1E3A8A" />
          </TouchableOpacity>

          {(userRole === 'sekretariat' || userRole === 'admin') && (
            <View style={styles.calamityPalette}>
              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {CALAMITY_CATEGORIES.map(cat => {
                  const isActive = activeCalamityTool === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.calamityToolBtn, { backgroundColor: isActive ? cat.color : '#fff', borderColor: cat.color }]}
                      onPress={() => setActiveCalamityTool(isActive ? null : cat.key)}
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
          )}
        </View>

        {showHistory && (
          <View style={styles.historyHalf}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Sejarah Patrol Kenderaan</Text>
            </View>

            {loadingHistory ? (
              <ActivityIndicator size="small" color="#1E3A8A" style={{ marginTop: 20 }} />
            ) : patrolHistory.length === 0 ? (
              <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>Tiada rekod sejarah lagi.</Text>
            ) : (
              <>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 1.6 }]}>Kenderaan</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tempoh</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Jarak</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Tarikh</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {patrolHistory.map((h, index) => (
                    <View key={h.id} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
                      <View style={{ flex: 1.6 }}>
                        <Text style={styles.tableCellAgency} numberOfLines={1}>{h.vehicle_reg}</Text>
                        <Text style={styles.tableCellMember} numberOfLines={1}>{h.vehicle_model}</Text>
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

      {/* --- VIEW 2: MERS 999 REPORT --- */}
      {activeTab === 'report' && (
        <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>
          
          <AdminEditButton 
            isEditMode={isEditMode} 
            setIsEditMode={setIsEditMode} 
            userRole={userRole} 
          />

          <View style={styles.reportHeader}>
            <Text style={[styles.reportTitle, { color: theme.text }]}>Emergency Case Report</Text>
            <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>NG 999 W.P. Labuan {new Date().getFullYear()}</Text>
          </View>

          <View style={styles.statsRow}>
            {dynamicMonthlyTrend.length === 0 ? (
               <View style={[styles.statBox, { backgroundColor: theme.card }]}>
                  <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>No Monthly Data</Text>
               </View>
            ) : (
               dynamicMonthlyTrend.slice(-2).map((item, index) => (
                <View key={index} style={[styles.statBox, { backgroundColor: theme.card }]}>
                  <View style={styles.statBoxTop}>
                    <Calendar size={16} color={theme.accent} />
                    <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>{item.month}</Text>
                  </View>
                  <Text style={[styles.statBoxValue, { color: theme.text }]}>{item.total}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 10 }}>Total Cases</Text>
                </View>
              ))
            )}
            
            <View style={[styles.statBox, { backgroundColor: trendData.bg, borderColor: trendData.border, borderWidth: 1 }]}>
               <View style={styles.statBoxTop}>
                  {trendData.icon}
                  <Text style={{ color: trendData.color, fontWeight: '700' }}>Trend</Text>
                </View>
                <Text style={[styles.statBoxValue, { color: trendData.color, fontSize: 20 }]}>{trendData.text}</Text>
                <Text style={{ color: trendData.color, fontSize: 10 }}>{trendData.sub}</Text>
            </View>
          </View>

          <View style={[styles.highlightCard, { backgroundColor: '#fff7ed', borderColor: '#f97316', borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <AlertTriangle size={24} color="#ea580c" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#9a3412', textTransform: 'uppercase' }}>Highest Case Overall</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#ea580c' }}>{topCaseData.label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#c2410c', marginTop: 4 }}>
              Contributing {topCaseData.total} out of {totalMersCases} total calls.
            </Text>
          </View>

          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity 
              style={[styles.dropdownHeaderBtn, { backgroundColor: theme.card, borderColor: '#e2e8f0' }]}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              activeOpacity={0.7}
            >
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>
                {selectedMonth ? `Category Breakdown: ${selectedMonth}` : 'Select Month For Category Breakdown'}
              </Text>
              {dropdownOpen ? <ChevronUp size={20} color={theme.textSecondary} /> : <ChevronDown size={20} color={theme.textSecondary} />}
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: '#e2e8f0' }]}>
                {dynamicMonthlyTrend.map((m, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dropdownItem, index < dynamicMonthlyTrend.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }]}
                    onPress={() => { setSelectedMonth(m.month); setDropdownOpen(false); }}
                  >
                    <Text style={{ color: selectedMonth === m.month ? '#3b82f6' : theme.text, fontWeight: selectedMonth === m.month ? '800' : '500' }}>
                      {m.month}
                    </Text>
                  </TouchableOpacity>
                ))}
                {dynamicMonthlyTrend.length === 0 && (
                   <View style={styles.dropdownItem}><Text style={{ color: theme.textSecondary }}>No data available</Text></View>
                )}
              </View>
            )}
          </View>

          {selectedMonth && (
            <View style={[styles.breakdownContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.breakdownTitle, { color: theme.text }]}>Case Breakdown ({selectedMonth})</Text>
              
              {dynamicCaseBreakdown.map((item, index) => {
                const monthVal = item[selectedMonth];
                if (!monthVal || monthVal === 0) return null; 
                
                const monthTotal = dynamicMonthlyTrend.find(m => m.month === selectedMonth)?.total || 1; 
                const percent = Math.round((monthVal / monthTotal) * 100);
                
                return (
                  <View key={index} style={styles.breakdownRow}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>[{item.id}] {item.label}</Text>
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>
                        {monthVal} <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: '600' }}>({percent}%)</Text>
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { backgroundColor: item.color, width: `${percent}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {isEditMode && (
            <View style={[styles.crudContainer, { backgroundColor: theme.card }]}>
              <View style={styles.crudHeader}>
                <Text style={[styles.breakdownTitle, { color: theme.text, marginBottom: 0 }]}>NG999 Data Management</Text>
                <TouchableOpacity 
                  style={styles.addBtn}
                  onPress={() => { setForm({ id: null, kategori_kes: '', month: '', jumlah_kes: '1' }); setModalVisible(true); }}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Add New</Text>
                </TouchableOpacity>
              </View>

              {loadingNg ? (
                <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 20 }} />
              ) : ngData.length === 0 ? (
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginVertical: 10 }}>No records found.</Text>
              ) : (
                ngData.map((item) => (
                  <View key={item.id} style={[styles.crudItem, { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{item.kategori_kes}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                        Month: {item.month} | Total: <Text style={{fontWeight: '800', color: theme.text}}>{item.jumlah_kes || 1}</Text> cases
                      </Text>
                    </View>
                    <View style={styles.actionBtns}>
                      <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                        <Edit2 size={18} color="#22c55e" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteNg(item.id)} style={styles.iconBtn}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

        </ScrollView>
      )}

      {/* --- CRUD MODAL --- */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>
                {form.id ? 'Update Record' : 'Add New Record'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { zIndex: 2000, elevation: 2000 }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Case Category</Text>
              <TouchableOpacity 
                style={[styles.modalDropdownBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => { setCategoryOpen(!categoryOpen); setMonthOpen(false); }}
              >
                <Text style={{ color: form.kategori_kes ? theme.text : theme.textSecondary, fontSize: 14 }}>
                  {form.kategori_kes || "Select Category..."}
                </Text>
                {categoryOpen ? <ChevronUp size={18} color={theme.textSecondary} /> : <ChevronDown size={18} color={theme.textSecondary} />}
              </TouchableOpacity>
              
              {categoryOpen && (
                <View style={[styles.modalDropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                    {CATEGORY_OPTIONS.map((opt, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={[styles.modalDropdownItem, { borderBottomColor: theme.border }]}
                        onPress={() => { setForm({ ...form, kategori_kes: opt }); setCategoryOpen(false); }}
                      >
                        <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>{opt}</Text>
                        {form.kategori_kes === opt && <Check size={14} color="#3b82f6" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={[styles.inputGroup, { zIndex: 1000, elevation: 1000 }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Month</Text>
              <TouchableOpacity 
                style={[styles.modalDropdownBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => { setMonthOpen(!monthOpen); setCategoryOpen(false); }}
              >
                <Text style={{ color: form.month ? theme.text : theme.textSecondary, fontSize: 14 }}>
                  {form.month || "Select Month..."}
                </Text>
                {monthOpen ? <ChevronUp size={18} color={theme.textSecondary} /> : <ChevronDown size={18} color={theme.textSecondary} />}
              </TouchableOpacity>

              {monthOpen && (
                <View style={[styles.modalDropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                    {MONTH_OPTIONS.map((opt, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={[styles.modalDropdownItem, { borderBottomColor: theme.border }]}
                        onPress={() => { setForm({ ...form, month: opt }); setMonthOpen(false); }}
                      >
                        <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>{opt}</Text>
                        {form.month === opt && <Check size={14} color="#3b82f6" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={[styles.inputGroup, { zIndex: 1 }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Amount of Cases</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="E.g., 5"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={form.jumlah_kes.toString()}
                onChangeText={(text) => setForm({ ...form, jumlah_kes: text.replace(/[^0-9]/g, '') })}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, (loadingNg || categoryOpen || monthOpen) && { opacity: 0.7 }]} 
              onPress={handleSaveNg}
              disabled={loadingNg || categoryOpen || monthOpen}
            >
              {loadingNg ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Record</Text>}
            </TouchableOpacity>
          </View>
        </View>
</Modal>

      <Modal visible={calamityModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>Tambah Titik Bencana</Text>
              <TouchableOpacity onPress={() => { setCalamityModalVisible(false); setPendingPlacement(null); }}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Kategori: {getCalamityMeta(activeCalamityTool).label}
            </Text>
            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 10 }]}>Keterangan (pilihan)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, height: 80, textAlignVertical: 'top' }]}
              placeholder="Cth: Air naik setinggi 1 meter"
              placeholderTextColor={theme.textSecondary}
              multiline
              value={calamityDescription}
              onChangeText={setCalamityDescription}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCalamity}>
              <Text style={styles.saveBtnText}>Simpan Titik</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const VehicleCard = ({ name, status, icon, theme }) => (
  <View style={[styles.vehicleCard, { backgroundColor: theme.card }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {icon}
      <View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, maxWidth: 120 }} numberOfLines={1}>{name}</Text>
        <Text style={{ fontSize: 10, color: theme.textSecondary }}>{status}</Text>
      </View>
    </View>
    <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
  </View>
);

const styles = StyleSheet.create({
  container: { position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 24, paddingBottom: 10 },
  toggleWrapper: { flexDirection: 'row', margin: 16, padding: 6, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, zIndex: 20 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  toggleBtnActive: { backgroundColor: '#3b82f6' },
  toggleText: { fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: '#fff' },
  viewContainer: { flex: 1, position: 'relative' },
  mapContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, borderRadius: 20, overflow: 'hidden' },

  historyToggleBtn: {
    position: 'absolute', top: 16, right: 116, zIndex: 10,
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  calamityPalette: {
    position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: '#fff',
    borderRadius: 16, padding: 10, gap: 6, shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 10, elevation: 4, width: 90,
  },
  calamityToolBtn: { paddingVertical: 8, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  calamityToolText: { fontSize: 11, fontWeight: '800' },
  calamityHint: { fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 4 },

  historyHalf: { flex: 1, backgroundColor: '#fff', borderLeftWidth: 1, borderLeftColor: '#e2e8f0', borderTopRightRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' },
  historyHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  historyTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableHeaderCell: { fontSize: 10, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableCell: { fontSize: 12, fontWeight: '700', color: '#334155' },
  tableCellAgency: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  tableCellMember: { fontSize: 11, color: '#64748b', marginTop: 1 },
  tableCellDate: { fontSize: 11, fontWeight: '700', color: '#334155' },
  tableCellTime: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  headerCard: { position: 'absolute', top: 16, left: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, minWidth: 200 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  liveTagContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  liveText: { fontSize: 10, fontWeight: '700' },
  vehicleListContainer: { position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 10 },
  vehicleCard: { padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, minWidth: 180 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 10 },
  reportContainer: { flex: 1, paddingHorizontal: 16 },
  reportHeader: { marginBottom: 20, marginTop: 10 },
  reportTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statBoxTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statBoxValue: { fontSize: 28, fontWeight: '900' },
  highlightCard: { padding: 20, borderRadius: 16, marginBottom: 20 },
  dropdownHeaderBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  dropdownList: { marginTop: 8, borderRadius: 12, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  dropdownItem: { padding: 16 },
  breakdownContainer: { padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, marginBottom: 20 },
  breakdownTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20 },
  breakdownRow: { marginBottom: 16 },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  crudContainer: { padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, marginBottom: 30 },
  crudHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22c55e', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  crudItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  actionBtns: { flexDirection: 'row', gap: 16 },
  iconBtn: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 500, borderRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  inputGroup: { marginBottom: 16, position: 'relative' },
  inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputField: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 14 },
  modalDropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1 },
  modalDropdownList: { position: 'absolute', top: 75, left: 0, right: 0, borderRadius: 10, borderWidth: 1, elevation: 5, zIndex: 100 },
  modalDropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  saveBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' }
});