// src/screens/sekretariat/peta/MapToolbar.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { History, ClipboardList, X, Plus, Droplets } from 'lucide-react-native';
import { PALETTE } from '../../../constants/palette';
import { petaStyles as styles } from '../petaStyles';

// Bouton rond de la barre d'outils, avec infobulle au survol (web)
function ToolbarButton({ style, activeStyle, onPress, tooltip, showTooltip = true, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <TouchableOpacity
      style={[style, activeStyle, hovered && { zIndex: 100, elevation: 100 }]}
      onPress={onPress}
      {...(Platform.OS === 'web' ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      } : {})}
    >
      {children}
      {hovered && showTooltip && (
        <View style={styles.historyTooltip}>
          <Text style={styles.historyTooltipText}>{tooltip}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Barre d'outils verticale de la carte : Tambah Bencana + ouverture des 3 panneaux
export default function MapToolbar({ canAdd, isPlacingBencana, onAddPress, sidePanel, onTogglePanel }) {
  return (
    <View style={[styles.mapToolbar, { flexDirection: 'column' }]}>
      {canAdd && (
        <ToolbarButton
          style={styles.addBencanaToggleBtn}
          activeStyle={isPlacingBencana && styles.addBencanaToggleBtnActive}
          onPress={onAddPress}
          tooltip="Tambah Bencana"
          showTooltip={!isPlacingBencana}
        >
          {isPlacingBencana ? <X size={18} color={PALETTE.white} /> : <Plus size={18} color={PALETTE.orange} />}
        </ToolbarButton>
      )}

      <ToolbarButton
        style={styles.summaryToggleBtn}
        onPress={() => onTogglePanel(sidePanel === 'summary' ? 'none' : 'summary')}
        tooltip="Ringkasan Bencana"
      >
        <ClipboardList size={18} color={PALETTE.orange} />
      </ToolbarButton>

      <ToolbarButton
        style={styles.summaryToggleBtn}
        onPress={() => onTogglePanel(sidePanel === 'pemantauanSummary' ? 'none' : 'pemantauanSummary')}
        tooltip="Ringkasan Pemantauan"
      >
        <Droplets size={18} color={PALETTE.orange} />
      </ToolbarButton>

      <ToolbarButton
        style={styles.historyToggleBtn}
        onPress={() => onTogglePanel(sidePanel === 'history' ? 'none' : 'history')}
        tooltip="Sejarah Patrol Agensi"
      >
        <History size={18} color={PALETTE.orange} />
      </ToolbarButton>
    </View>
  );
}
