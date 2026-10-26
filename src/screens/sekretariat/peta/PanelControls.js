// src/screens/sekretariat/peta/PanelControls.js
//
// Éléments communs aux 3 panneaux latéraux de la carte : cadre du panneau
// (titre, plein écran, export PDF, fermer), filtres Tahun/Bulan + recherche,
// et pagination.
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';
import { X, Download, Search } from 'lucide-react-native';
import ModalSelectField from '../../../components/ModalSelectField';
import FullscreenViewer from '../../../components/FullscreenViewer';
import { appStyles as sekretariatStyles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';
import { BULAN_MS, BULAN_OPTIONS } from '../../../constants/bulan';
import { petaStyles as styles } from '../petaStyles';

// Cadre d'un panneau latéral. `renderContent(large)` est rendu deux fois :
// dans le panneau, et en grand dans la vue plein écran.
export function PanelShell({ title, renderContent, onExportPdf, onClose }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExportPdf();
    } catch (e) {
      console.error('Gagal menjana PDF:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.petaHistoryHalf, isMobile && styles.petaHistoryHalfMobile]}>
      <View style={[styles.petaHistoryHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={styles.petaHistoryTitle}>{title}</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <FullscreenViewer title={title}>
            {renderContent(true)}
          </FullscreenViewer>
          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting}
            style={[sekretariatStyles.pdfExportBtn, exporting && sekretariatStyles.pdfExportBtnDisabled]}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={PALETTE.white} />
            ) : (
              <>
                <Download size={14} color={PALETTE.white} />
                <Text style={sekretariatStyles.pdfExportBtnText}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.panelCloseBtn}>
            <X size={16} color={PALETTE.textMutedDark} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {renderContent(false)}
      </ScrollView>
    </View>
  );
}

// Tahun / Bulan + champ de recherche. `filter` vient de usePanelFilter.
// `searchWithIcon` : loupe à gauche du champ (Ringkasan), sinon champ simple (Sejarah).
export function PanelFilters({ theme, filter, searchPlaceholder, searchWithIcon = false }) {
  return (
    <>
      <View style={styles.historyFilterRow}>
        <View style={{ flex: 1 }}>
          <ModalSelectField
            theme={theme}
            label="Tahun"
            value={String(filter.year)}
            placeholder="Tahun"
            options={filter.availableYears}
            isOpen={filter.yearOpen}
            onToggle={() => { filter.setYearOpen(!filter.yearOpen); filter.setMonthOpen(false); }}
            onSelect={(opt) => { filter.setYear(Number(opt)); filter.setYearOpen(false); }}
            stackIndex={2000}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ModalSelectField
            theme={theme}
            label="Bulan"
            value={filter.month === null ? 'Semua Bulan' : BULAN_MS[filter.month]}
            placeholder="Bulan"
            options={BULAN_OPTIONS}
            isOpen={filter.monthOpen}
            onToggle={() => { filter.setMonthOpen(!filter.monthOpen); filter.setYearOpen(false); }}
            onSelect={(opt) => { filter.setMonth(opt === 'Semua Bulan' ? null : BULAN_MS.indexOf(opt)); filter.setMonthOpen(false); }}
            stackIndex={1000}
          />
        </View>
      </View>

      {searchWithIcon ? (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ position: 'relative', justifyContent: 'center' }}>
            <Search size={16} color={PALETTE.textMutedDark} style={{ position: 'absolute', left: 12, zIndex: 1 }} />
            <TextInput
              style={[sekretariatStyles.input, { paddingLeft: 38 }]}
              placeholder={searchPlaceholder}
              placeholderTextColor={PALETTE.textMutedDark}
              value={filter.query}
              onChangeText={filter.setQuery}
            />
          </View>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <TextInput
            style={sekretariatStyles.input}
            placeholder={searchPlaceholder}
            placeholderTextColor={PALETTE.textMutedDark}
            value={filter.query}
            onChangeText={filter.setQuery}
          />
        </View>
      )}
    </>
  );
}

// "1 / 3  ← →"
export function PanelPagination({ filter }) {
  const { page, setPage, totalPages } = filter;
  const isFirst = page === 0;
  const isLast = page >= totalPages - 1;
  return (
    <View style={styles.paginationRow}>
      <Text style={styles.pageIndicator}>{page + 1} / {totalPages}</Text>
      <View style={styles.pageArrowRow}>
        <TouchableOpacity
          onPress={() => setPage((p) => Math.max(0, p - 1))}
          disabled={isFirst}
          style={[styles.pageBtn, isFirst && styles.pageBtnDisabled]}
        >
          <Text style={[styles.pageBtnText, isFirst && styles.pageBtnTextDisabled]}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={isLast}
          style={[styles.pageBtn, isLast && styles.pageBtnDisabled]}
        >
          <Text style={[styles.pageBtnText, isLast && styles.pageBtnTextDisabled]}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
