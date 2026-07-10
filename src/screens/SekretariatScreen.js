// src/screens/SekretariatScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Users, AlertTriangle, Home, Map } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

import AdminEditButton from '../components/AdminEditButton';
import JpbdSection from './sekretariat/JpbdSection';
import HotspotSection from './sekretariat/HotspotSection';
import PpsSection from './sekretariat/PpsSection';
import PetaTab from './sekretariat/PetaTab';

const SekretariatScreen = ({ theme, userRole }) => {
  const [activeTab, setActiveTab] = useState('JPBD');
  const [isEditMode, setIsEditMode] = useState(false);

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
        <PetaTab theme={theme} userRole={userRole} />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <AdminEditButton
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            userRole={userRole}
          />

          {activeTab === 'JPBD' && <JpbdSection userRole={userRole} isEditMode={isEditMode} />}
          {activeTab === 'HOTSPOT' && <HotspotSection userRole={userRole} isEditMode={isEditMode} />}
          {activeTab === 'PPS' && <PpsSection userRole={userRole} isEditMode={isEditMode} />}
        </ScrollView>
      )}
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
});

export default SekretariatScreen;