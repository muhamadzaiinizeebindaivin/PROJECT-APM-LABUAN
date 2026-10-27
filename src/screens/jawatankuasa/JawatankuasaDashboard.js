// src/screens/jawatankuasa/JawatankuasaDashboard.js
//
// Tableau de bord "Sekretariat · Jawatankuasa Pengurusan Bencana Daerah Labuan"
// (lecture seule). Monté uniquement après validation du code d'accès.
import React from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { CMD } from './commandPalette';
import { useJawatankuasaData } from './useJawatankuasaData';
import DashboardHeader from './DashboardHeader';
import CommandMap from './CommandMap';
import StatCards from './StatCards';
import TrendMangsaChart from './TrendMangsaChart';
import PpsStatusDonut from './PpsStatusDonut';
import LaporanTerkini from './LaporanTerkini';
import HotspotList from './HotspotList';

// Deux colonnes sur grand écran, empilé sur mobile. Défini hors du composant
// pour ne pas remonter (et réinitialiser) les blocs à chaque rendu.
function Row({ isWide, children }) {
  return (
    <View style={isWide ? styles.row : styles.stack}>
      {React.Children.map(children, (child) => <View style={isWide ? styles.col : null}>{child}</View>)}
    </View>
  );
}

export default function JawatankuasaDashboard() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const data = useJawatankuasaData();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <DashboardHeader />
        <CommandMap data={data} />
        <StatCards stats={data.stats} />
        <Row isWide={isWide}>
          <TrendMangsaChart availableYears={data.availableYears} monthlyTrend={data.monthlyTrend} />
          <PpsStatusDonut ppsList={data.ppsList} />
        </Row>
        <Row isWide={isWide}>
          <LaporanTerkini laporan={data.laporanTerkini} />
          <HotspotList hotspotList={data.hotspotList} hotspotCategories={data.hotspotCategories} />
        </Row>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CMD.bg },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: '100%', maxWidth: 1200, alignSelf: 'center', gap: 14 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'stretch' },
  col: { flex: 1 },
  stack: { gap: 14 },
});
