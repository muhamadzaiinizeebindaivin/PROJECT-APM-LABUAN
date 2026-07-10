// src/screens/OperasiScreen.js
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MapIcon, BarChart2 } from 'lucide-react-native';
import LiveMapTab from './operasi/LiveMapTab';
import Ng999ReportTab from './operasi/Ng999ReportTab';

export default function OperasiScreen({ theme, userRole }) {
  const [activeTab, setActiveTab] = useState('map');

  return (
    <View style={[styles.container, { flex: 1, backgroundColor: theme.background }]}>
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

      {activeTab === 'map' && <LiveMapTab theme={theme} userRole={userRole} />}
      {activeTab === 'report' && <Ng999ReportTab theme={theme} userRole={userRole} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 24, paddingBottom: 16 },
  toggleWrapper: { flexDirection: 'row', margin: 16, padding: 6, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, zIndex: 20 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  toggleBtnActive: { backgroundColor: '#3b82f6' },
  toggleText: { fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: '#fff' },
});