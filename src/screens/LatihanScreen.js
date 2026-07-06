import React, { useState, useMemo, useEffect, useRef, createElement } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing, Pressable, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { Users, Calendar, CheckCircle2, Activity, Plus, Edit, Trash2, X, Settings2, XCircle, CalendarDays, Clock } from 'lucide-react-native';
import { supabase } from '../supabaseClient'; 

// Import Universal Edit Button
import AdminEditButton from '../components/AdminEditButton';

// Safe Require for Native Only
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker');
    if (DateTimePicker && DateTimePicker.default) {
      DateTimePicker = DateTimePicker.default;
    }
  } catch (e) {
    console.log("DateTimePicker loading skipped on Web");
  }
}

const SASARAN_OPTIONS = ["STAF TETAP", "ASPA", "ORANG AWAM", "ASTO", "AGENSI", "JABATAN", "PELAJAR SEKOLAH"];

const AnimatedVerticalBar = ({ height, color, delay, isSelected, onPress, label, value, total }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const safeHeight = Number.isFinite(height) ? height : 0;
    Animated.timing(animatedHeight, {
      toValue: safeHeight,
      duration: 1000,
      delay: delay,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [height]);

  return (
    <View style={styles.barWrapper}>
      {isSelected ? (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{value} ({total > 0 ? Math.round((value/total)*100) : 0}%)</Text>
        </View>
      ) : null}
      <Pressable onPress={onPress} style={styles.barTrack}>
        <Animated.View 
          style={[
            styles.barFill, 
            { 
              height: animatedHeight, 
              backgroundColor: isSelected ? '#f97316' : (value > 0 ? color : '#e2e8f0') 
            }
          ]} 
        />
      </Pressable>
      <Text style={[styles.barLabel, { fontWeight: isSelected ? '800' : '400' }]}>{label}</Text>
    </View>
  );
};

const AnimatedHorizontalBar = ({ widthPercent, color, delay }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const safeWidth = Number.isFinite(widthPercent) ? widthPercent : 0;
    Animated.timing(animatedWidth, {
      toValue: safeWidth,
      duration: 1000,
      delay: delay,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [widthPercent]);

  const widthInterp = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width: widthInterp, backgroundColor: color }]} />
    </View>
  );
};

export default function LatihanScreen({ theme, userRole }) {
  const [roadmapData, setRoadmapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showList, setShowList] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(null);

  const [isFormModalVisible, setFormModalVisible] = useState(false);
  const [pesertaModalVisible, setPesertaModalVisible] = useState(false);
  const [prestasiModalVisible, setPrestasiModalVisible] = useState(false);
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', start_date: new Date(), end_date: new Date(), pax: '', status: 'Akan Diadakan', sasaran: [] 
  });

  useEffect(() => { fetchLatihan(); }, []);

  const fetchLatihan = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('latihan').select('*').order('start_date', { ascending: true }); 
    if (!error) setRoadmapData(data || []);
    setIsLoading(false);
  };

  const formatDisplayDate = (startStr, endStr) => {
    if (!startStr) return 'Tiada Tarikh';
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : start;
    const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
    if (start.getTime() === end.getTime() || !endStr) return `${start.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) return `${start.getDate()} - ${end.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
    if (start.getFullYear() === end.getFullYear()) return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]} ${start.getFullYear()}`;
    return `${start.getDate()} ${months[start.getMonth()]} ${start.getFullYear()} - ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
  };

  const toggleFormStatus = () => {
    setFormData(prev => {
      let next = 'Berjaya';
      if (prev.status === 'Berjaya') next = 'Tidak Berjaya';
      else if (prev.status === 'Tidak Berjaya') next = 'Akan Diadakan';
      return { ...prev, status: next };
    });
  };

  const getStatusColors = (status) => {
    if (status === 'Berjaya') return { bg: '#dcfce7', border: '#22c55e', text: '#15803d' };
    if (status === 'Akan Diadakan') return { bg: '#fef9c3', border: '#eab308', text: '#854d0e' };
    return { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' }; 
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ title: '', start_date: new Date(), end_date: new Date(), pax: '', status: 'Akan Diadakan', sasaran: [] });
    setFormModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    const parsedSasaran = item.note ? item.note.split(',').map(s => s.trim()).filter(s => s) : [];
    setFormData({
      title: item.title, start_date: item.start_date ? new Date(item.start_date) : new Date(),
      end_date: item.end_date ? new Date(item.end_date) : new Date(), pax: item.pax ? item.pax.toString() : '',
      status: item.status || 'Akan Diadakan', sasaran: parsedSasaran
    });
    setFormModalVisible(true);
  };

  const executeDelete = async (id) => {
    await supabase.from('latihan').delete().eq('id', id);
    fetchLatihan();
  };

  const handleDelete = (id) => {
    if (Platform.OS === 'web') {
      if (window.confirm("Adakah anda pasti mahu memadam latihan ini?")) executeDelete(id);
    } else {
      Alert.alert("Padam Latihan?", "Adakah anda pasti mahu memadam latihan ini?", [
        { text: "Batal", style: "cancel" }, { text: "Padam", style: "destructive", onPress: () => executeDelete(id) }
      ]);
    }
  };

  const handleSave = async () => {
    if (!formData.title) return Platform.OS === 'web' ? window.alert("Sila masukkan tajuk latihan.") : Alert.alert("Ralat", "Sila masukkan tajuk latihan.");
    const payload = {
      title: formData.title, start_date: formData.start_date.toISOString().split('T')[0], end_date: formData.end_date.toISOString().split('T')[0],
      pax: parseInt(formData.pax) || 0, status: formData.status, note: formData.sasaran.join(', ')
    };
    if (editingId) await supabase.from('latihan').update(payload).eq('id', editingId);
    else await supabase.from('latihan').insert([payload]);
    setFormModalVisible(false);
    fetchLatihan(); 
  };

  const toggleSasaran = (option) => {
    setFormData(prev => ({
      ...prev, sasaran: prev.sasaran.includes(option) ? prev.sasaran.filter(item => item !== option) : [...prev.sasaran, option]
    }));
  };

  const stats = useMemo(() => {
    const totalEvents = roadmapData.length;
    const totalPax = roadmapData.reduce((acc, item) => acc + (parseInt(item.pax) || 0), 0);
    const completed = roadmapData.filter(i => i.status === 'Berjaya').length;
    const completionRate = totalEvents > 0 ? Math.round((completed / totalEvents) * 100) : 0;
    const monthlyCounts = new Array(12).fill(0);
    roadmapData.forEach(item => { if (item.start_date) { const m = new Date(item.start_date).getMonth(); if (m >= 0 && m <= 11) monthlyCounts[m]++; }});
    const audienceGroups = {};
    roadmapData.forEach(item => {
      const sasarans = (item.note || 'Tiada Kumpulan Sasaran').split(',').map(s => s.trim()).filter(s => s);
      if (sasarans.length === 0) sasarans.push('Tiada Kumpulan Sasaran');
      sasarans.forEach(key => audienceGroups[key] = (audienceGroups[key] || 0) + 1);
    });
    return {
      totalEvents, totalPax, completed, completionRate, monthlyCounts, maxMonthVal: Math.max(...monthlyCounts, 1),
      totalRecordedEvents: monthlyCounts.reduce((a, b) => a + b, 0),
      monthsLabel: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'],
      audienceList: Object.keys(audienceGroups).map(key => ({ label: key, count: audienceGroups[key], percent: totalEvents > 0 ? Math.round((audienceGroups[key] / totalEvents) * 100) : 0 })).sort((a, b) => b.count - a.count).slice(0, 5)
    };
  }, [roadmapData]);

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} />
        
        <View style={styles.topRow}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#14b8a6' }]} activeOpacity={0.7} onPress={() => setPesertaModalVisible(true)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabelLight}>Total Peserta</Text>
              <View style={styles.iconBoxLight}><Users size={16} color="#14b8a6" /></View>
            </View>
            <Text style={styles.cardValueLight}>{stats.totalPax}</Text>
            <Text style={[styles.cardSubLight, { textDecorationLine: 'underline' }]}>Lihat Pecahan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#3b82f6', transform: [{ scale: showList ? 0.98 : 1 }] }]} activeOpacity={0.7} onPress={() => setShowList(!showList)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabelLight}>Bil. Latihan</Text>
              <View style={[styles.iconBoxLight, showList ? { backgroundColor: 'white' } : null]}>
                <Calendar size={16} color={showList ? '#3b82f6' : 'white'} />
              </View>
            </View>
            <Text style={styles.cardValueLight}>{stats.totalEvents}</Text>
            <Text style={[styles.cardSubLight, { fontWeight: 'bold', textDecorationLine: 'underline' }]}>{showList ? 'Tutup Senarai' : 'Lihat Senarai'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#f97316' }]} activeOpacity={0.7} onPress={() => setPrestasiModalVisible(true)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabelLight}>Prestasi</Text>
              <View style={styles.iconBoxLight}><Activity size={16} color="#f97316" /></View>
            </View>
            <Text style={styles.cardValueLight}>{stats.completionRate}%</Text>
            <Text style={[styles.cardSubLight, { textDecorationLine: 'underline' }]}>{stats.completed} Berjaya</Text>
          </TouchableOpacity>
        </View>

        {showList ? (
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: '#3b82f6', borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Senarai Latihan</Text>
              {isEditMode ? (
                <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
                  <Plus size={16} color="white" />
                  <Text style={styles.addBtnText}>Tambah</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {roadmapData.map((item) => (
              <View key={item.id} style={styles.listItem}>
                <View style={{ width: 85 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary }}>{formatDisplayDate(item.start_date, item.end_date)}</Text>
                </View>
                <View style={{ flex: 1, paddingLeft: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>{item.title}</Text>
                  <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>{item.note || 'Tiada Kumpulan'} • {item.pax} Pax</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {item.status === 'Berjaya' ? <CheckCircle2 size={16} color="#22c55e" /> : item.status === 'Akan Diadakan' ? <Clock size={16} color="#eab308" /> : <XCircle size={16} color="#ef4444" />}
                  {isEditMode ? (
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity onPress={() => handleOpenEdit(item)} style={{ padding: 4 }}><Edit size={16} color="#22c55e" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}><Trash2 size={16} color="#ef4444" /></TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
            
            {roadmapData.length === 0 ? (
              <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 10 }}>Tiada data latihan.</Text>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Statistik Bulanan</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Tekan bar untuk lihat peratusan</Text>
            </View>
            <View style={styles.badgeBtn}>
              <Text style={styles.badgeText}>Yearly</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {stats.monthsLabel.map((m, i) => {
              const height = (stats.monthlyCounts[i] / stats.maxMonthVal) * 120;
              return (
                <AnimatedVerticalBar 
                  key={i} label={m} height={height} value={stats.monthlyCounts[i]} total={stats.totalRecordedEvents} color="#3b82f6" delay={i * 100}
                  isSelected={hoveredMonthIndex === i} onPress={() => setHoveredMonthIndex(hoveredMonthIndex === i ? null : i)}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.splitRow}>
          <View style={[styles.sectionCard, { backgroundColor: theme.card, flex: 0.45 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 14 }]}>Status Program</Text>
            
            <View style={styles.donutContainer}>
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#e2e8f0', transform: [{ rotate: '-90deg' }] }}>
                  <View style={{ position: 'absolute', width: 50, height: 100, left: 0, overflow: 'hidden' }}>
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: stats.completionRate > 50 ? '#3b82f6' : '#e2e8f0', position: 'absolute', left: 0 }} />
                  </View>
                  <View style={{ position: 'absolute', width: 100, height: 100, transform: [{ rotate: `${(stats.completionRate / 100) * 360}deg` }] }}>
                    <View style={{ position: 'absolute', width: 50, height: 100, right: 0, overflow: 'hidden' }}>
                      <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#3b82f6', position: 'absolute', right: 0 }} />
                    </View>
                  </View>
                  {stats.completionRate <= 50 ? (
                    <View style={{ position: 'absolute', width: 50, height: 100, left: 0, overflow: 'hidden' }}>
                      <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#e2e8f0', position: 'absolute', left: 0 }} />
                    </View>
                  ) : null}
              </View>

              <View style={{ position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={[styles.donutText, { color: theme.text }]}>{stats.completionRate}%</Text>
                <Text style={{ fontSize: 10, color: theme.textSecondary }}>Berjaya</Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 15, flexWrap: 'wrap' }}>
               <View style={{flexDirection:'row', alignItems:'center', marginBottom: 4}}>
                  <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
                  <Text style={{ fontSize: 10, color: theme.textSecondary, marginLeft: 4 }}>Berjaya</Text>
               </View>
               <View style={{flexDirection:'row', alignItems:'center', marginBottom: 4}}>
                  <View style={[styles.dot, { backgroundColor: '#eab308' }]} />
                  <Text style={{ fontSize: 10, color: theme.textSecondary, marginLeft: 4 }}>Akan Diadakan</Text>
               </View>
               <View style={{flexDirection:'row', alignItems:'center'}}>
                  <View style={[styles.dot, { backgroundColor: '#e2e8f0' }]} />
                  <Text style={{ fontSize: 10, color: theme.textSecondary, marginLeft: 4 }}>Tidak Berjaya</Text>
               </View>
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: theme.card, flex: 1 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 14, marginBottom: 15 }]}>Kumpulan Sasaran</Text>
            {stats.audienceList.map((item, index) => (
              <View key={index} style={styles.progressRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={[styles.progressLabel, { color: theme.textSecondary }]} numberOfLines={1}>{item.label}</Text>
                  <Text style={[styles.progressPercent, { color: theme.text }]}>{item.percent}%</Text>
                </View>
                <AnimatedHorizontalBar widthPercent={item.percent} color={index % 2 === 0 ? '#3b82f6' : '#14b8a6'} delay={500 + (index * 150)} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* --- ADD / EDIT FORM MODAL --- */}
      <Modal visible={isFormModalVisible} animationType="slide" transparent={true} onRequestClose={() => setFormModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{editingId ? 'Kemaskini Latihan' : 'Tambah Latihan Baru'}</Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)}><X size={24} color={theme.textSecondary} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Tajuk Latihan</Text>
              <TextInput style={[styles.inputField, { color: theme.text, borderColor: theme.border }]} placeholder="Cth: Kursus Asas Pertahanan Awam" placeholderTextColor={theme.textSecondary} value={formData.title} onChangeText={(text) => setFormData({...formData, title: text})} />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.text, marginTop: 0 }]}>Tarikh Mula</Text>
                  {Platform.OS === 'web' ? (
                    createElement('input', {
                      type: 'date', value: formData.start_date.toISOString().split('T')[0],
                      onChange: (e) => setFormData({...formData, start_date: new Date(e.target.value)}),
                      style: { padding: '12px', borderRadius: '10px', border: '1px solid ' + theme.border, width: '100%', fontSize: '14px', outline: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: theme.text }
                    })
                  ) : (
                    <View>
                      <TouchableOpacity style={[styles.dateBtn, { borderColor: theme.border }]} onPress={() => setShowStartPicker(true)}>
                        <CalendarDays size={16} color={theme.textSecondary} />
                        <Text style={{ color: theme.text, fontSize: 13 }}>{formData.start_date.toLocaleDateString('ms-MY')}</Text>
                      </TouchableOpacity>
                      {showStartPicker && DateTimePicker ? (
                        <DateTimePicker value={formData.start_date} mode="date" display="default" onChange={(event, date) => { setShowStartPicker(false); if (date) setFormData({...formData, start_date: date, end_date: date < formData.end_date ? formData.end_date : date}); }} />
                      ) : null}
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.text, marginTop: 0 }]}>Tarikh Tamat</Text>
                  {Platform.OS === 'web' ? (
                    createElement('input', {
                      type: 'date', min: formData.start_date.toISOString().split('T')[0], value: formData.end_date.toISOString().split('T')[0],
                      onChange: (e) => setFormData({...formData, end_date: new Date(e.target.value)}),
                      style: { padding: '12px', borderRadius: '10px', border: '1px solid ' + theme.border, width: '100%', fontSize: '14px', outline: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: theme.text }
                    })
                  ) : (
                    <View>
                      <TouchableOpacity style={[styles.dateBtn, { borderColor: theme.border }]} onPress={() => setShowEndPicker(true)}>
                        <CalendarDays size={16} color={theme.textSecondary} />
                        <Text style={{ color: theme.text, fontSize: 13 }}>{formData.end_date.toLocaleDateString('ms-MY')}</Text>
                      </TouchableOpacity>
                      {showEndPicker && DateTimePicker ? (
                        <DateTimePicker value={formData.end_date} mode="date" display="default" minimumDate={formData.start_date} onChange={(event, date) => { setShowEndPicker(false); if (date) setFormData({...formData, end_date: date}); }} />
                      ) : null}
                    </View>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.text, marginTop: 0 }]}>Jumlah Peserta (Pax)</Text>
                  <TextInput style={[styles.inputField, { color: theme.text, borderColor: theme.border }]} placeholder="Cth: 50" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={formData.pax} onChangeText={(text) => setFormData({...formData, pax: text})} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.text, marginTop: 0 }]}>Status</Text>
                  <TouchableOpacity style={[styles.statusToggle, { backgroundColor: getStatusColors(formData.status).bg, borderColor: getStatusColors(formData.status).border }]} onPress={toggleFormStatus}>
                    <Text style={{ fontWeight: '700', color: getStatusColors(formData.status).text }}>{formData.status}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: theme.text }]}>Kumpulan Sasaran (Boleh pilih lebih dari satu)</Text>
              <View style={styles.chipContainer}>
                {SASARAN_OPTIONS.map((option) => {
                  const isSelected = formData.sasaran.includes(option);
                  return (
                    <TouchableOpacity key={option} style={[styles.chip, { backgroundColor: isSelected ? '#3b82f6' : 'transparent', borderColor: isSelected ? '#3b82f6' : theme.border }]} onPress={() => toggleSasaran(option)}>
                      <Text style={{ fontSize: 11, color: isSelected ? 'white' : theme.textSecondary, fontWeight: '600' }}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Simpan Latihan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- PESERTA BREAKDOWN MODAL --- */}
      <Modal visible={pesertaModalVisible} animationType="fade" transparent={true} onRequestClose={() => setPesertaModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Pecahan Peserta</Text>
              <TouchableOpacity onPress={() => setPesertaModalVisible(false)}><X size={24} color={theme.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {roadmapData.map((item) => (
                <View key={item.id} style={[styles.listItem, { borderBottomColor: theme.border }]}>
                  <Text style={{ flex: 1, fontSize: 13, color: theme.text, fontWeight: '600' }}>{item.title}</Text>
                  <Text style={{ fontSize: 14, color: '#14b8a6', fontWeight: '800' }}>{item.pax} Pax</Text>
                </View>
              ))}
              <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: theme.textSecondary, fontWeight: '700' }}>Jumlah Keseluruhan</Text>
                <Text style={{ fontSize: 16, color: '#14b8a6', fontWeight: '900' }}>{stats.totalPax} Pax</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- PRESTASI BREAKDOWN MODAL --- */}
      <Modal visible={prestasiModalVisible} animationType="fade" transparent={true} onRequestClose={() => setPrestasiModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Status Keseluruhan</Text>
              <TouchableOpacity onPress={() => setPrestasiModalVisible(false)}><X size={24} color={theme.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {roadmapData.map((item) => (
                <View key={item.id} style={[styles.listItem, { borderBottomColor: theme.border }]}>
                  <Text style={{ flex: 1, fontSize: 13, color: theme.text, fontWeight: '600' }}>{item.title}</Text>
                  {item.status === 'Berjaya' ? (
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={{ fontSize: 12, color: '#22c55e', fontWeight: '700' }}>Berjaya</Text><CheckCircle2 size={14} color="#22c55e" /></View>
                  ) : item.status === 'Akan Diadakan' ? (
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={{ fontSize: 12, color: '#eab308', fontWeight: '700' }}>Akan Diadakan</Text><Clock size={14} color="#eab308" /></View>
                  ) : (
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '700' }}>Tidak Berjaya</Text><XCircle size={14} color="#ef4444" /></View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 40, paddingTop: 15 },
  topRow: { flexDirection: 'row', gap: 12, marginBottom: 24, paddingHorizontal: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, elevation: 4, minHeight: 110, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconBoxLight: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 8 },
  cardLabelLight: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },
  cardValueLight: { color: 'white', fontSize: 22, fontWeight: '800', marginVertical: 4 },
  cardSubLight: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  sectionCard: { padding: 24, borderRadius: 24, marginBottom: 24, marginHorizontal: 16, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  badgeBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: '#3b82f6', fontWeight: '700', fontSize: 11 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8 },
  addBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center', gap: 6 },
  addBtnText: { color: 'white', fontSize: 12, fontWeight: '700' },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barWrapper: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barTrack: { height: 130, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barFill: { width: 12, borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 10, marginTop: 8, color: '#94a3b8' },
  tooltip: { position: 'absolute', top: -30, backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 10, elevation: 5 },
  tooltipText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  splitRow: { flexDirection: 'row', gap: 16, marginHorizontal: 16 },
  donutContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 20, height: 100 },
  donutText: { fontSize: 20, fontWeight: '900' },
  progressRow: { marginBottom: 16 },
  progressLabel: { fontSize: 11, fontWeight: '600', maxWidth: '80%' },
  progressPercent: { fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  inputField: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  dateBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  statusToggle: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  saveBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 10 },
  saveBtnText: { color: 'white', fontSize: 14, fontWeight: '700' }
});