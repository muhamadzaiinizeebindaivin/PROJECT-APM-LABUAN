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
import { CMD } from './commandPalette';

const PEMANTAUAN_ICON_URL = Asset.fromModule(pemantauanIconAsset).uri;
const MAP_THEME = { background: CMD.bg };
const LEGEND = [
  { label: 'Bencana', color: CMD.red },
  { label: 'Pemantauan', color: CMD.yellow },
  { label: 'Agensi', color: CMD.green },
];

export default function CommandMap({ data }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);

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
    <View style={[styles.card, { height: isMobile ? 320 : 480 }]}>
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

      <View style={[styles.chip, { top: 12, left: 12 }]}>
        <View style={[styles.dot, { backgroundColor: CMD.green }]} />
        <Text style={styles.chipText}>Peta Bencana · Masa nyata</Text>
      </View>

      <View style={[styles.chip, { bottom: 12, left: 12, gap: 10 }]}>
        {LEGEND.map((l) => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={[styles.dot, { backgroundColor: l.color }]} />
            <Text style={styles.chipText}>{l.label}</Text>
          </View>
        ))}
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
  chip: {
    position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: CMD.cardBorder, zIndex: 500,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { color: CMD.text, fontSize: 11, fontWeight: '700' },
});
