// src/screens/sekretariat/peta/MapOverlays.js
//
// Éléments affichés par-dessus la carte : en-tête "Peta Agensi", bandeau des
// agences en ligne, légende des agences, et bulle "Klik pada peta…".
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Map, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { PALETTE } from '../../../constants/palette';
import { petaStyles as styles } from '../petaStyles';
import { AgencyMark } from './petaUtils';

// `style` (optionnel) : remplace le positionnement par défaut, ex. dans une colonne
export function MapHeaderCard({ isMobile, onlineCount, style }) {
  return (
    <View style={[styles.petaHeaderCard, isMobile && { padding: 10, gap: 8, minWidth: 0, borderRadius: 12 }, style]}>
      <View style={[styles.petaIconCircle, isMobile && { width: 30, height: 30, borderRadius: 9 }]}>
        <Map color={PALETTE.white} size={isMobile ? 15 : 20} />
      </View>
      <View>
        <Text style={[styles.petaHeaderTitle, isMobile && { fontSize: 12 }]}>Peta Agensi</Text>
        <View style={styles.liveTagContainer}>
          {onlineCount > 0 && <View style={[styles.liveDot, isMobile && { width: 5, height: 5 }]} />}
          <Text style={[styles.liveText, isMobile && { fontSize: 8 }, { color: onlineCount > 0 ? PALETTE.success : PALETTE.textMutedDark }]}>
            {onlineCount} AGENSI ONLINE
          </Text>
        </View>
      </View>
    </View>
  );
}

// Cartes horizontales des agences connectées (clic = centrer la carte dessus)
export function OnlineAgencyList({ onlineAgencies, getAgencyLogo, getAgencyColor, onFocus, onDelete }) {
  if (onlineAgencies.length === 0) return null;
  return (
    <View style={styles.petaListContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {onlineAgencies.map((a) => (
          <TouchableOpacity key={a.id} activeOpacity={0.7} style={styles.petaAgencyCard} onPress={() => onFocus(a)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.agencyMarkWrap}>
                <AgencyMark logo={getAgencyLogo(a.jpbd_directory?.agency)} color={getAgencyColor(a.jpbd_directory?.agency)} size={22} />
                <View style={styles.onlineBadge} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.petaAgencyName} numberOfLines={1}>{a.jpbd_directory?.agency || '-'}</Text>
                <View style={styles.onlineRow}>
                  <Text style={styles.petaAgencyUser} numberOfLines={1}>{a.member_name}</Text>
                  <Text style={styles.onlineLabel}>● Online</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation?.(); onDelete(a.id, `${a.jpbd_directory?.agency || '-'} (${a.member_name})`); }}
                style={{ padding: 6 }}
              >
                <Trash2 size={15} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Légende couleur/logo de toutes les agences de l'annuaire.
// `collapsible` : l'en-tête "AGENSI" replie/déplie la liste (fermée au départ si `defaultCollapsed`).
// `isCollapsed` + `onToggle` (optionnels) : repli piloté par le parent (ex. une seule légende ouverte).
// `style` (optionnel) : remplace le positionnement par défaut, ex. dans une colonne.
export function AgencyLegend({
  isMobile, agencyNames, getAgencyLogo, getAgencyColor,
  collapsible = false, defaultCollapsed = false, isCollapsed, onToggle, style,
}) {
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const collapsed = isCollapsed ?? innerCollapsed;
  const toggle = onToggle || (() => setInnerCollapsed((c) => !c));
  if (agencyNames.length === 0) return null;

  const isClosed = collapsible && collapsed;
  const header = (
    <Text style={[styles.agencyLegendHeader, isMobile && styles.agencyLegendHeaderMobile, isClosed && { marginBottom: 0 }]}>
      AGENSI{collapsible ? ` (${agencyNames.length})` : ''}
    </Text>
  );
  const Chevron = collapsed ? ChevronDown : ChevronUp;

  return (
    <View style={[styles.agencyLegendPalette, isMobile && styles.agencyLegendPaletteMobile, style]}>
      {collapsible ? (
        <TouchableOpacity
          onPress={toggle}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {header}
          <Chevron size={isMobile ? 12 : 14} color={PALETTE.textMutedDark} style={isClosed ? null : { marginBottom: 6 }} />
        </TouchableOpacity>
      ) : header}

      {!isClosed && (
        <ScrollView style={{ maxHeight: isMobile ? 140 : 220 }} showsVerticalScrollIndicator={false}>
          {agencyNames.map((a) => (
            <View key={a.id} style={[styles.agencyLegendRow, isMobile && styles.agencyLegendRowMobile]}>
              <View style={[styles.agencyLegendDot, { backgroundColor: getAgencyColor(a.agency) }, isMobile && styles.agencyLegendDotMobile]} />
              <AgencyMark logo={getAgencyLogo(a.agency)} color={getAgencyColor(a.agency)} size={isMobile ? 14 : 20} />
              <Text style={[styles.agencyLegendLabel, isMobile && styles.agencyLegendLabelMobile]} numberOfLines={1}>{a.agency}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// Bulle "Klik pada peta untuk letak titik" pendant le placement d'un point
export function PlacementHint({ Icon, iconColor }) {
  return (
    <View
      style={{
        position: 'absolute', top: 16, left: 0, right: 0,
        alignItems: 'center', zIndex: 500, pointerEvents: 'none',
      }}
    >
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: 999,
          paddingHorizontal: 16, paddingVertical: 10,
          shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
        }}
      >
        <Icon size={16} color={iconColor} />
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Klik pada peta untuk letak titik</Text>
      </View>
    </View>
  );
}
