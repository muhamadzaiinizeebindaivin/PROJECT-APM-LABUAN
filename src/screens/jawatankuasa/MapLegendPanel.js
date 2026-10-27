// src/screens/jawatankuasa/MapLegendPanel.js
//
// Panneau "Petunjuk" (légende) en haut à droite de la carte : chaque jenis bencana
// avec la même icône/couleur que ses pins, puis les autres symboles de la carte.
// Repliable ; fermé au départ sur mobile pour laisser la carte visible.
// `isCollapsed` + `onToggle` (optionnels) : repli piloté par le parent.
// `style` (optionnel) : remplace le positionnement par défaut (coin haut droit).
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, Building2 } from 'lucide-react-native';
import { Asset } from 'expo-asset';
import pemantauanIconAsset from '../../../assets/pemantauan-icon.png';
import pemantauanTrackerIconAsset from '../../../assets/pemantauan-tracker-icon.png';
import { resolveIcon } from '../sekretariat/hotspot/hotspotConstants';
import { petaStyles } from '../sekretariat/petaStyles';
import { CMD } from './commandPalette';

const PEMANTAUAN_ICON_URL = Asset.fromModule(pemantauanIconAsset).uri;
const PEMANTAUAN_TRACKER_ICON_URL = Asset.fromModule(pemantauanTrackerIconAsset).uri;
const LANDMARK_NAVY = '#1e3a8a'; // même couleur que les pins PKOD/PDPA de la carte

export default function MapLegendPanel({ isMobile, categories, isCollapsed, onToggle, style, maxListHeight }) {
  const [innerCollapsed, setInnerCollapsed] = useState(isMobile);
  const collapsed = isCollapsed ?? innerCollapsed;
  const toggle = onToggle || (() => setInnerCollapsed((c) => !c));
  const Chevron = collapsed ? ChevronDown : ChevronUp;
  const dot = isMobile ? 18 : 22;

  return (
    <View style={[styles.panel, isMobile && styles.panelMobile, collapsed && styles.panelCollapsed, style]}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.header}>
        {/* Mêmes styles de texte que la légende AGENSI (petaStyles) */}
        <Text style={[petaStyles.agencyLegendHeader, isMobile && petaStyles.agencyLegendHeaderMobile, collapsed && { marginBottom: 0 }]}>
          Petunjuk
        </Text>
        <Chevron size={isMobile ? 12 : 14} color={CMD.textMuted} style={collapsed ? null : { marginBottom: 6 }} />
      </TouchableOpacity>

      {!collapsed && (
        <ScrollView style={{ maxHeight: maxListHeight ?? (isMobile ? 220 : 360) }} showsVerticalScrollIndicator={false}>
          <Text style={styles.section}>JENIS BENCANA</Text>
          {categories.map((cat) => {
            const Icon = resolveIcon(cat);
            return (
              <View key={cat.id || cat.key} style={styles.row}>
                <View style={[styles.circle, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: cat.color || CMD.orange }]}>
                  <Icon size={dot * 0.55} color="#fff" />
                </View>
                <Text style={[petaStyles.agencyLegendLabel, isMobile && petaStyles.agencyLegendLabelMobile]} numberOfLines={1}>{cat.label}</Text>
              </View>
            );
          })}

          <Text style={[styles.section, { marginTop: 8 }]}>LAIN-LAIN</Text>
          <View style={styles.row}>
            <Image source={{ uri: PEMANTAUAN_ICON_URL }} style={{ width: dot, height: dot }} resizeMode="contain" />
            <Text style={[petaStyles.agencyLegendLabel, isMobile && petaStyles.agencyLegendLabelMobile]}>Titik Pemantauan</Text>
          </View>
          <View style={styles.row}>
            <Image source={{ uri: PEMANTAUAN_TRACKER_ICON_URL }} style={{ width: dot, height: dot }} resizeMode="contain" />
            <Text style={[petaStyles.agencyLegendLabel, isMobile && petaStyles.agencyLegendLabelMobile]}>Anggota Pemantauan</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.landmarkBox, { width: dot, height: dot }]}>
              <Building2 size={dot * 0.55} color="#fff" />
            </View>
            <Text style={[petaStyles.agencyLegendLabel, isMobile && petaStyles.agencyLegendLabelMobile]}>PKOD / PDPA</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute', top: 16, right: 16, zIndex: 20, width: 210, padding: 10,
    backgroundColor: CMD.card, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  panelMobile: { width: 160, padding: 6, borderRadius: 12 },
  // Replié : juste la taille de l'en-tête, pour ne pas chevaucher la carte "Peta Agensi" sur petit écran
  panelCollapsed: { width: 'auto' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  section: { color: CMD.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 10, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  circle: { alignItems: 'center', justifyContent: 'center' },
  landmarkBox: { borderRadius: 5, backgroundColor: LANDMARK_NAVY, alignItems: 'center', justifyContent: 'center' },
});