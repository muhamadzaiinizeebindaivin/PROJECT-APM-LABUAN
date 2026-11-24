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
import { PemantauanSideLeft, PemantauanSideRight, PemantauanTopBanner } from './PemantauanBanner';

// À partir de cette largeur, la bannière Pemantauan occupe les espaces vides
// à gauche et à droite ; en dessous, elle devient un bandeau en haut.
const SIDE_RAILS_BREAKPOINT = 1500;

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

  const hasPemantauan = data.pemantauanAktif.length > 0;
  const showSideRails = hasPemantauan && width >= SIDE_RAILS_BREAKPOINT;
  const showTopBanner = hasPemantauan && !showSideRails;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.layout}>
        {showSideRails && <PemantauanSideLeft reports={data.pemantauanAktif} />}

        <View style={styles.inner}>
          <DashboardHeader />
          {showTopBanner && <PemantauanTopBanner reports={data.pemantauanAktif} />}
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

        {showSideRails && <PemantauanSideRight reports={data.pemantauanAktif} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CMD.bg },
  content: { padding: 16, paddingBottom: 40 },
  layout: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 14 },
  inner: { flex: 1, minWidth: 0, maxWidth: 1200, gap: 14 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'stretch' },
  col: { flex: 1 },
  stack: { gap: 14 },
});
