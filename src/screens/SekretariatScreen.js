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
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'JPBD' && styles.tabItemActive]} onPress={() => setActiveTab('JPBD')} activeOpacity={0.8}>
          <Users size={16} color={activeTab === 'JPBD' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'JPBD' ? styles.tabTextActive : { color: '#94a3b8' }]}>Jawatankuasa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'HOTSPOT' && styles.tabItemActive]} onPress={() => setActiveTab('HOTSPOT')} activeOpacity={0.8}>
          <AlertTriangle size={16} color={activeTab === 'HOTSPOT' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'HOTSPOT' ? styles.tabTextActive : { color: '#94a3b8' }]}>Hotspot</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'PPS' && styles.tabItemActive]} onPress={() => setActiveTab('PPS')} activeOpacity={0.8}>
          <Home size={16} color={activeTab === 'PPS' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'PPS' ? styles.tabTextActive : { color: '#94a3b8' }]}>Data PPS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'PETA' && styles.tabItemActive]} onPress={() => setActiveTab('PETA')} activeOpacity={0.8}>
          <Map size={16} color={activeTab === 'PETA' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'PETA' ? styles.tabTextActive : { color: '#94a3b8' }]}>PETA</Text>
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
  tabBar: { flexDirection: 'row', margin: 16, padding: 6, borderRadius: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  tabItemActive: { backgroundColor: '#f97316' },
  tabText: { fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  listContent: { padding: 15, paddingBottom: 50 },
});

export default SekretariatScreen;