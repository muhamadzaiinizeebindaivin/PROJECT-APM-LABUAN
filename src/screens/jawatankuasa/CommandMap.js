// src/screens/jawatankuasa/CommandMap.js
//
// Carte en lecture seule : titik bencana, titik/anggota pemantauan, agences sur le terrain.
// Réutilise la carte Leaflet de Sekretariat → Peta Bencana ; le rôle jawatankuasa
// n'a aucun bouton de modification dans les popups.
import React, { useRef, useState, useMemo, createElement } from 'react';
import { View, Text, Platform, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { Asset } from 'expo-asset';
import pemantauanIconAsset from '../../../assets/pemantauan-icon.png';
import { buildSekretariatMapHtml } from '../sekretariat/sekretariatMapTemplate';
import { usePetaMapBridge } from '../sekretariat/peta/usePetaMapBridge';
import { MapHeaderCard, AgencyLegend } from '../sekretariat/peta/MapOverlays';
import { CMD } from './commandPalette';
import MapLegendPanel from './MapLegendPanel';

const PEMANTAUAN_ICON_URL = Asset.fromModule(pemantauanIconAsset).uri;
const MAP_THEME = { background: CMD.bg };
// Annule le positionnement absolu propre à chaque bloc quand il est rangé dans la colonne
const IN_COLUMN = { position: 'relative', top: 0, left: 0, right: 'auto' };

export default function CommandMap({ data }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  // Une seule légende ouverte à la fois, pour que la colonne tienne dans la hauteur de la carte.
  // Desktop : AGENSI ouverte au départ ; mobile : tout replié.
  const [openLegend, setOpenLegend] = useState(isMobile ? null : 'agensi'); // null | 'agensi' | 'petunjuk'
  const toggleLegend = (key) => setOpenLegend((current) => (current === key ? null : key));

  const html = useMemo(
    () => buildSekretariatMapHtml({ theme: MAP_THEME, userRole: 'jawatankuasa', pemantauanIconUrl: PEMANTAUAN_ICON_URL }),
    []
  );

  usePetaMapBridge({
    iframeRef,
    onMapMessage: () => {}, // lecture seule : aucun message de la carte n'est traité
    onlineAgencies: data.activeAgencies,
    onlinePemantauan: data.activePemantauan,
    getAgencyColor: data.getAgencyColor,
    getAgencyLogo: data.getAgencyLogo,
    agencyNames: data.agencyNames,
    bencanaPoints: data.bencanaPoints,
    hotspotCategories: data.hotspotCategories,
    pemantauanPoints: data.pemantauanPoints,
  });

  return (
    <View style={[styles.card, { height: isMobile ? 420 : 480 }]}>
      {Platform.OS === 'web' ? (
        createElement('iframe', {
          ref: iframeRef,
          srcDoc: html,
          style: { width: '100%', height: '100%', border: 'none' },
          title: 'Peta Bencana',
          onLoad: () => setLoading(false),
        })
      ) : (
        <View style={styles.centered}>
          <Text style={styles.muted}>Peta hanya tersedia pada versi web.</Text>
        </View>
      )}
      {loading && Platform.OS === 'web' && (
        <View style={[StyleSheet.absoluteFill, styles.centered, { backgroundColor: CMD.bg }]}>
          <ActivityIndicator size="large" color={CMD.blue} />
        </View>
      )}

      {/* Colonne à gauche : carte "Peta Agensi", légende AGENSI, puis Petunjuk.
          Le nombre en ligne suit la règle des 15 minutes (activeAgencies). */}
      <View style={styles.leftColumn}>
        <MapHeaderCard isMobile={isMobile} onlineCount={data.activeAgencies.length} style={IN_COLUMN} />
        <AgencyLegend
          isMobile={isMobile}
          agencyNames={data.agencyNames}
          getAgencyLogo={data.getAgencyLogo}
          getAgencyColor={data.getAgencyColor}
          collapsible
          isCollapsed={openLegend !== 'agensi'}
          onToggle={() => toggleLegend('agensi')}
          style={IN_COLUMN}
        />
        <MapLegendPanel
          isMobile={isMobile}
          categories={data.hotspotCategories}
          isCollapsed={openLegend !== 'petunjuk'}
          onToggle={() => toggleLegend('petunjuk')}
          maxListHeight={isMobile ? 220 : 260}
          style={IN_COLUMN}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: CMD.cardBorder,
    backgroundColor: CMD.card, position: 'relative',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: CMD.textMuted, fontSize: 13 },
  leftColumn: { position: 'absolute', top: 16, left: 16, zIndex: 10, gap: 8, alignItems: 'flex-start' },
});
