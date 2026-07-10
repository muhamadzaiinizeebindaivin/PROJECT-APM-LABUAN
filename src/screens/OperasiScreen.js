// src/screens/OperasiScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapIcon, BarChart2 } from 'lucide-react-native';

import LiveMapTab from './operasi/LiveMapTab';
import Ng999ReportTab from './operasi/Ng999ReportTab';
import { operasiScreenStyles as styles } from './operasi/operasiScreenStyles';

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

      {/* Le Live Map reste monté (display: none) quand on quitte l'onglet, pour
          ne pas recharger l'iframe Leaflet à chaque changement d'onglet. */}
      <View style={{ flex: 1, display: activeTab === 'map' ? 'flex' : 'none' }}>
        <LiveMapTab theme={theme} userRole={userRole} />
      </View>

      {activeTab === 'report' && (
        <Ng999ReportTab theme={theme} userRole={userRole} />
      )}
    </View>
  );
}
