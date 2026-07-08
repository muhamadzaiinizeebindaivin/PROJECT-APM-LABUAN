// src/screen/OperasiScreen.native.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import LinearGradient from 'react-native-linear-gradient'; 
import { ShieldAlert, Ambulance, Truck, Car, Bike, Map as MapIcon, BarChart2, AlertTriangle, TrendingDown, Calendar, ChevronDown, ChevronUp } from 'lucide-react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { MERS_SUMMARY, MERS_MONTHLY_TREND, MERS_CASE_BREAKDOWN } from '../../data';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const reportTheme = {
  accent: '#f97316', 
  text: '#f1f5f9', 
  textSecondary: '#94a3b8', 
  insight: ['#fef3c7', '#fcd34d'], 
  insightText: '#9a3412', 
  card: '#1e293b', 
  progressBg: '#334155', 
  mainGradient: ['#0f172a', '#1e293b'], 
};

export default function OperasiScreen({ theme }) {
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState('report'); 
  const [selectedMonth, setSelectedMonth] = useState(null); 
  const webviewRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchVehicles = async () => {
      // 1. FETCH FROM LOGISTIK TABLE
      const { data, error } = await supabase
        .from('logistik')
        .select('*')
        .eq('category', 'Darat');

      if (data && isMounted) {
        setVehicles(data);
        if (webviewRef?.current) {
          webviewRef.current.injectJavaScript(`window.initVehicles('${JSON.stringify(data)}'); true;`);
        }
      } else if (error) {
        console.error("Error fetching vehicles:", error);
      }
    };
    
    fetchVehicles();

    // 2. LISTEN TO LOGISTIK CHANGES
    const subscription = supabase
      .channel('vehicles_channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'logistik' }, (payload) => {
        const updatedVehicle = payload.new;

        if (isMounted) {
          setVehicles(current =>
            current.map(v => v.id === updatedVehicle.id ? { ...v, ...updatedVehicle } : v)
          );
        }

        const safeColor = updatedVehicle.color || '#ef4444';
        
        // 3. MAP PAYLOAD TO MATCH WHAT MAP EXPECTS
        const updatePayload = JSON.stringify({
          id: updatedVehicle.id,
          lat: updatedVehicle.latitude,
          lng: updatedVehicle.longitude,
          color: safeColor,
          status: updatedVehicle.tracking_status, // Map tracking_status to status
          name: updatedVehicle.model              // Map model to name
        });

        const script = `
          if (window.updateVehicleLocation) {
            window.updateVehicleLocation('${updatePayload}');
          }
          true;
        `;
        
        if (webviewRef?.current) {
          webviewRef.current.injectJavaScript(script);
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(subscription);
    };
  }, []);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; background-color: ${theme.background}; }
          #map { height: 100vh; width: 100vw; }
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
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([5.2831, 115.2308], 13);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
            maxZoom: 19 
          }).addTo(map);

          var markers = {};
          var createIcon = (color) => L.divIcon({
            className: 'custom-pin',
            html: \`<div style="background-color: \${color || '#ef4444'}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>\`,
            iconSize: [14, 14], popupAnchor: [0, -8]
          });

          var createPopupContent = (name, status) => {
            var statusClass = status === 'Patrol' ? 'status-patrol' : 'status-idle';
            return \`<div class="custom-popup"><strong>\${name}</strong><span class="\${statusClass}">\${status}</span></div>\`;
          };

          window.initVehicles = function(dataStr) {
            try {
              var vehiclesData = JSON.parse(dataStr);
              vehiclesData.forEach(v => {
                // 4. USE tracking_status AND model FOR INITIAL LOAD
                if (v.latitude && v.longitude && v.tracking_status === 'Patrol' && !markers[v.id]) {
                  markers[v.id] = L.marker([v.latitude, v.longitude], { icon: createIcon(v.color) })
                    .bindPopup(createPopupContent(v.model, v.tracking_status))
                    .addTo(map);
                }
              });
            } catch(e) {}
          };

          window.updateVehicleLocation = function(dataStr) {
            try {
              var data = JSON.parse(dataStr);
              if (data.status === 'Patrol') {
                if (markers[data.id]) {
                  markers[data.id].setLatLng([data.lat, data.lng])
                                  .setPopupContent(createPopupContent(data.name, data.status));
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
            } catch(e) {}
          };
        </script>
      </body>
    </html>
  `;

  // 5. SAFE ICON HELPER
  const getVehicleIcon = (type, color) => {
    const lowerType = (type || '').toLowerCase(); // Safely convert to lowercase
    if (lowerType.includes('lori')) return <Truck size={18} color={color || "#f97316"}/>;
    if (lowerType.includes('ambulans')) return <Ambulance size={18} color={color || "#ef4444"}/>;
    if (lowerType.includes('motor') || lowerType.includes('kriss')) return <Bike size={18} color={color || "#3b82f6"}/>;
    return <Car size={18} color={color || "#10b981"}/>;
  };

  // 6. FILTER USING tracking_status
  const activeVehicles = vehicles.filter(v => v.tracking_status === 'Patrol');
  const activeVehiclesCount = activeVehicles.length;

  const totalMersCases = MERS_SUMMARY.totalJan + MERS_SUMMARY.totalFeb;

  const ReportSummaryCard = () => (
    <View style={styles.summaryCardWrapper}>
      <View style={[styles.summaryColumn, { flex: 1.4 }]}>
        <Text style={styles.summaryLabel}>PANGGILAN DITERIMA</Text>
        <Text style={styles.summaryValue}>{totalMersCases.toLocaleString()}</Text>
        <Text style={styles.summarySub}>Jumlah Kes Berdasarkan Sistem MERS 999</Text>
      </View>

      <View style={[styles.summaryColumn, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#334155' }]}>
        <Text style={styles.trendPercentage}>-14</Text>
        <View style={styles.trendRow}>
           <Text style={styles.trendLabel}>KES VS JAN '26</Text>
           <TrendingDown size={14} color={reportTheme.accent} />
        </View>
      </View>

      <View style={[styles.summaryColumn, { alignItems: 'flex-end', paddingRight: 8 }]}>
        <Text style={styles.summaryTotalLabel}>200</Text>
        <View style={styles.barChartRow}>
          {MERS_MONTHLY_TREND.map((m) => (
             <View key={m.month} style={styles.barWrapper}>
               <View style={[styles.barFill, { height: m.total / 1.2 }]} />
               <Text style={styles.barMonthLabel}>{m.month}</Text>
             </View>
          ))}
        </View>
      </View>
    </View>
  );

  const ReportInsightBar = () => (
    <LinearGradient colors={reportTheme.insight} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.insightBar}>
      <Text style={styles.insightText}>KES TERTINGGI: {MERS_SUMMARY.topCaseLabel.toUpperCase()} MENYUMBANG {MERS_SUMMARY.topCaseTotal} PANGGILAN</Text>
    </LinearGradient>
  );

  const ReportFilterBar = () => (
    <View style={styles.filterBarWrapper}>
       <Text style={styles.filterTextMain}>TERPILIH: BULANAN</Text>
       <View style={styles.segmentContainer}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[ { month: 'SEMUA' }, ...MERS_MONTHLY_TREND].map((m) => (
              <TouchableOpacity 
                key={m.month} 
                style={[styles.segmentItem, selectedMonth === m.month && styles.segmentItemActive]}
                onPress={() => setSelectedMonth(m.month)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, selectedMonth === m.month && { color: '#fff' }]}>
                  [{m.month === 'SEMUA' ? m.month : m.month.substring(0, 3).toUpperCase()}]
                </Text>
              </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.segmentItem, styles.segmentItemPecahan]} activeOpacity={0.8}>
            <Text style={styles.segmentText}>[PECAHAN...]</Text>
          </TouchableOpacity>
         </ScrollView>
       </View>
    </View>
  );

  return (
    <View style={[styles.container, { height: screenHeight * 0.84, backgroundColor: theme.background }]}>
      
      {/* --- TOGGLE BUTTONS --- */}
      <View style={[styles.toggleWrapper, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={[styles.toggleBtn, activeTab === 'map' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('map')}
          activeOpacity={0.8}
        >
          <MapIcon size={16} color={activeTab === 'map' ? '#fff' : theme.textSecondary} />
          <Text style={[styles.toggleText, activeTab === 'map' ? styles.toggleTextActive : { color: theme.textSecondary }]}>
            Peta Langsung
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.toggleBtn, activeTab === 'report' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('report')}
          activeOpacity={0.8}
        >
          <BarChart2 size={16} color={activeTab === 'report' ? '#fff' : theme.textSecondary} />
          <Text style={[styles.toggleText, activeTab === 'report' ? styles.toggleTextActive : { color: theme.textSecondary }]}>
            Laporan NG999
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        {/* --- VIEW 1: LIVE MAP --- */}
        <View 
          style={[StyleSheet.absoluteFill, { opacity: activeTab === 'map' ? 1 : 0 }]} 
          pointerEvents={activeTab === 'map' ? 'auto' : 'none'}
        >
          <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml, baseUrl: 'https://apm-dashboard.local' }}
            style={{ flex: 1, backgroundColor: 'transparent' }}
            startInLoadingState={true}
            renderLoading={() => (
               <View style={[styles.loader, { backgroundColor: theme.background }]}>
                  <ActivityIndicator size="large" color="#f97316" />
               </View>
            )}
            onLoadEnd={() => {
              if (vehicles.length > 0 && webviewRef?.current) {
                 webviewRef.current.injectJavaScript(`window.initVehicles('${JSON.stringify(vehicles)}'); true;`);
              }
            }}
          />

          <View style={[styles.headerCard, { backgroundColor: theme.card }]}>
            <View style={styles.iconCircle}>
               <ShieldAlert color="#fff" size={20} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Live Tracking</Text>
              <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{activeVehiclesCount} Aset Aktif</Text>
            </View>
            {activeVehiclesCount > 0 && <View style={styles.liveDot} />}
          </View>

          {activeVehiclesCount > 0 && (
            <View style={styles.bottomListWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {activeVehicles.map((v) => (
                  <View key={v.id} style={[styles.listItem, { backgroundColor: theme.card }]}>
                    {/* 7. SAFE JSX RENDER FOR LIST */}
                    {getVehicleIcon(v.type, v.color)}
                    <Text style={[styles.listText, { color: theme.text }]} numberOfLines={1}>
                      {v.reg || v.model}
                    </Text>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginLeft: 4 }} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* --- VIEW 2: MERS 999 REPORT --- */}
        {activeTab === 'report' && (
          <LinearGradient colors={reportTheme.mainGradient} style={[StyleSheet.absoluteFill, { borderRadius: 20, zIndex: 2 }]} start={{x:0, y:0}} end={{x:1, y:1}}>
            <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.reportHeader}>
                <View>
                  <Text style={styles.reportHeaderSub}>PELAPORAN NG999</Text>
                  <Text style={styles.reportTitle}>W.P. LABUAN, {MERS_SUMMARY.year}</Text>
                  <Text style={styles.reportHeaderSubAlt}>DATA SUMBER: APM WPL</Text>
                </View>
                <Text style={styles.reportTitleAlt}>JAN-FEB, 2026</Text>
              </View>

              <ReportSummaryCard />

              <ReportInsightBar />

              <ReportFilterBar />

              {selectedMonth && selectedMonth !== 'SEMUA' && (
                <View style={[styles.breakdownContainer, { backgroundColor: reportTheme.card }]}>
                  <Text style={styles.breakdownTitle}>Pecahan Kes ({selectedMonth})</Text>
                  
                  {MERS_CASE_BREAKDOWN.map((item, index) => {
                    const monthKey = selectedMonth.toLowerCase(); 
                    const monthVal = item[monthKey];
                    
                    if (!monthVal || monthVal === 0) return null;
                    
                    const monthTotal = MERS_SUMMARY[`total${selectedMonth}`] || 1; 
                    const percent = Math.round((monthVal / monthTotal) * 100);
                    
                    return (
                      <View key={index} style={styles.breakdownRow}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: reportTheme.text, fontWeight: '700', fontSize: 13 }}>
                            [{item.id}] {item.label}
                          </Text>
                          <Text style={{ color: reportTheme.text, fontWeight: '800', fontSize: 13 }}>
                            {monthVal} <Text style={{ fontSize: 10, color: reportTheme.textSecondary, fontWeight: '600' }}>({percent}%)</Text>
                          </Text>
                        </View>
                        
                        <View style={[styles.progressBarBg, { backgroundColor: reportTheme.progressBg }]}>
                          <View style={[styles.progressBarFill, { backgroundColor: reportTheme.accent, width: `${percent}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

            </ScrollView>
          </LinearGradient>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  
  toggleWrapper: {
    flexDirection: 'row', margin: 16, padding: 6, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, zIndex: 20
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, gap: 8
  },
  toggleBtnActive: { backgroundColor: '#3b82f6' },
  toggleText: { fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: '#fff' },

  contentArea: { flex: 1, position: 'relative' },

  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    position: 'absolute', top: 16, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 12,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSub: { fontSize: 12, fontWeight: '600' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginLeft: 'auto' },
  bottomListWrapper: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, borderRadius: 12, gap: 8, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5,
    minWidth: 160
  },
  listText: { fontSize: 12, fontWeight: '700', maxWidth: 100 },

  reportContainer: { flex: 1, paddingHorizontal: 16, zIndex: 2 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, marginTop: 20 },
  reportHeaderSub: { color: reportTheme.accent, fontWeight: '700', fontSize: 11 },
  reportTitle: { fontSize: 24, fontWeight: '900', color: reportTheme.text, letterSpacing: -0.5 },
  reportHeaderSubAlt: { color: reportTheme.textSecondary, fontWeight: '600', fontSize: 11 },
  reportTitleAlt: { color: reportTheme.textSecondary, fontWeight: '600', fontSize: 12, textAlign: 'right' },
  
  summaryCardWrapper: {
    flexDirection: 'row', padding: 16, borderRadius: 20, backgroundColor: reportTheme.card,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
    marginBottom: 16
  },
  summaryColumn: { flex: 1, paddingHorizontal: 8, justifyContent: 'center' },
  summaryLabel: { color: reportTheme.text, fontWeight: '700', fontSize: 10 },
  summaryValue: { color: reportTheme.accent, fontSize: 32, fontWeight: '900' },
  summarySub: { color: reportTheme.text, fontWeight: '500', fontSize: 9, marginTop: 2 },
  
  trendPercentage: { color: reportTheme.accent, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  trendLabel: { color: reportTheme.text, fontWeight: '700', fontSize: 10, textAlign: 'center' },
  
  summaryTotalLabel: { color: reportTheme.text, fontWeight: '700', fontSize: 12, marginBottom: 8 },
  barChartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  barWrapper: { alignItems: 'center', width: 22, gap: 4 },
  barFill: { width: '100%', backgroundColor: reportTheme.accent, borderRadius: 4 },
  barMonthLabel: { color: reportTheme.text, fontWeight: '600', fontSize: 8 },

  insightBar: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: reportTheme.insight[0], 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20
  },
  insightText: { color: reportTheme.insightText, fontWeight: '800', fontSize: 10, textAlign: 'center' },

  filterBarWrapper: { marginBottom: 20 },
  filterTextMain: { color: reportTheme.text, fontWeight: '700', fontSize: 12, textAlign: 'center', marginBottom: 12 },
  segmentContainer: { padding: 6, backgroundColor: reportTheme.card, borderRadius: 12 },
  segmentItem: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  segmentItemActive: { backgroundColor: '#3b82f6' }, 
  segmentItemPecahan: { backgroundColor: reportTheme.accent, opacity: 0.9, marginLeft: 10 }, 
  segmentText: { color: reportTheme.text, fontWeight: '800', fontSize: 11 },

  breakdownContainer: { padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, marginBottom: 40 },
  breakdownTitle: { fontSize: 16, fontWeight: '800', color: reportTheme.text, marginBottom: 20 },
  breakdownRow: { marginBottom: 16 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 }
});