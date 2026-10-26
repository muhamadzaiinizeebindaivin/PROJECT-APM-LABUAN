// src/screens/sekretariat/hotspot/KejadianFilterBar.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { X, Plus, FileDown } from 'lucide-react-native';
import { appStyles as styles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';
import { BULAN_MS } from '../../../constants/bulan';
import { hotspotStyles } from './hotspotStyles';

// Liste de choix plein écran (utilisée pour Tahun et Bulan)
function PickerModal({ visible, title, maxHeight, allLabel, options, selected, onSelect, onClose }) {
  const renderOption = (value, label) => {
    const isSelected = selected === value;
    return (
      <TouchableOpacity
        key={String(value)}
        onPress={() => { onSelect(value); onClose(); }}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 18, paddingVertical: 16, borderRadius: 12,
          borderWidth: 1.5, borderColor: isSelected ? PALETTE.orange : (PALETTE.cardLightBorder || '#e2e8f0'),
          backgroundColor: isSelected ? PALETTE.orange + '14' : '#fff',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: isSelected ? '800' : '600', color: isSelected ? PALETTE.orange : PALETTE.textDark }}>{label}</Text>
        {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.orange }} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxWidth: 440, maxHeight }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={PALETTE.textMutedDark} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {renderOption(null, allLabel)}
            {options.map((o) => renderOption(o.value, o.label))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Barre de filtres de l'onglet "Rekod" : Tahun / Bulan, export PDF, bouton Tambah
export default function KejadianFilterBar({
  isMobile, years, filterYear, filterMonth, onChangeYear, onChangeMonth,
  onExportPdf, canEdit, onAdd,
}) {
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExportPdf();
    } finally {
      setExporting(false);
    }
  };

  const selectBox = {
    borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff',
  };

  return (
    <View style={isMobile ? { gap: 12, marginBottom: 16 } : { flexDirection: 'row', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
      <View style={isMobile ? {} : { flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.textDark, marginBottom: 8 }}>Tahun</Text>
        <TouchableOpacity onPress={() => setYearOpen(true)} style={selectBox}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.textDark }}>
            {filterYear === null ? 'Semua Tahun' : filterYear}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[isMobile ? {} : { flex: 1 }, { opacity: filterYear === null ? 0.5 : 1 }]}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.textDark, marginBottom: 8 }}>Bulan</Text>
        <TouchableOpacity disabled={filterYear === null} onPress={() => setMonthOpen(true)} style={selectBox}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.textDark }}>
            {filterMonth === null ? 'Semua Bulan' : BULAN_MS[filterMonth]}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleExport}
        disabled={exporting}
        style={[hotspotStyles.pdfExportBtn, isMobile ? { alignSelf: 'stretch' } : { marginLeft: 4 }, exporting && { opacity: 0.6 }]}
        activeOpacity={0.7}
      >
        {exporting ? (
          <ActivityIndicator size="small" color={PALETTE.orange} />
        ) : (
          <FileDown size={14} color={PALETTE.orange} />
        )}
        <Text style={hotspotStyles.pdfExportBtnText}>{exporting ? 'Menjana PDF...' : 'Muat Turun PDF'}</Text>
      </TouchableOpacity>

      {canEdit && (
        <TouchableOpacity
          style={[
            styles.addButton,
            { paddingVertical: 14, paddingHorizontal: 18, justifyContent: 'center' },
            isMobile ? { alignSelf: 'stretch' } : { marginLeft: 4 },
          ]}
          onPress={onAdd}
        >
          <Plus size={16} color={PALETTE.white} />
          <Text style={styles.addButtonText}>Tambah</Text>
        </TouchableOpacity>
      )}

      <PickerModal
        visible={yearOpen}
        title="Pilih Tahun"
        maxHeight="80%"
        allLabel="Semua Tahun"
        options={years.map((y) => ({ value: y, label: String(y) }))}
        selected={filterYear}
        onSelect={onChangeYear}
        onClose={() => setYearOpen(false)}
      />
      <PickerModal
        visible={monthOpen}
        title="Pilih Bulan"
        maxHeight="85%"
        allLabel="Semua Bulan"
        options={BULAN_MS.map((m, idx) => ({ value: idx, label: m }))}
        selected={filterMonth}
        onSelect={onChangeMonth}
        onClose={() => setMonthOpen(false)}
      />
    </View>
  );
}
