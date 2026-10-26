// src/screens/sekretariat/peta/BencanaSummaryContent.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { PALETTE } from '../../../constants/palette';
import { petaStyles as styles } from '../petaStyles';
import { PanelFilters, PanelPagination } from './PanelControls';
import { deleteBtnStyle } from './petaUtils';

// Contenu du panneau "Ringkasan Bencana"
export default function BencanaSummaryContent({ large = false, theme, isMobile, filter, canDelete, onDelete }) {
  return (
    <>
      <PanelFilters theme={theme} filter={filter} searchPlaceholder="Cari bencana..." searchWithIcon />

      {filter.paged.length === 0 ? (
        <Text style={styles.emptyText}>Tiada rekod bencana untuk tempoh ini.</Text>
      ) : (
        <>
          {!isMobile ? (
          <View style={[styles.calamityTableWrapper, { borderRadius: 14, borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', overflow: 'hidden' }]}>
            <View style={[styles.calamityTableHeaderRow, { backgroundColor: '#1e3a8a' }]}>
              <View style={[styles.historyAgencyColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, { color: '#fff', fontWeight: '800' }, large && { fontSize: 16 }]}>Kategori Bencana</Text>
              </View>
              <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, { color: '#fff', fontWeight: '800' }, large && { fontSize: 16 }]}>Tempat</Text>
              </View>
              <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, { color: '#fff', fontWeight: '800' }, large && { fontSize: 16 }]}>Tarikh Mula</Text>
              </View>
              <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, { color: '#fff', fontWeight: '800' }, large && { fontSize: 16 }]}>Tarikh Tamat</Text>
              </View>
              {canDelete && (
                <View style={[{ width: 50 }, styles.calamityHeaderCellBox]}>
                  <Text style={[styles.calamityTableHeaderCell, { color: '#fff', fontWeight: '800' }, large && { fontSize: 16 }]}></Text>
                </View>
              )}
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {filter.paged.map((b, index) => (
                <View key={b.id} style={[styles.calamityTableRow, { backgroundColor: index % 2 === 1 ? (PALETTE.surface || '#f8fafc') : '#fff', borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder || '#e2e8f0' }]}>
                  <Text style={[styles.calamityTableCell, styles.historyAgencyColFlex, { textAlign: 'center', fontWeight: '700' }, large && { fontSize: 16 }]} numberOfLines={1}>
                    {b.category}
                  </Text>
                  <Text style={[styles.calamityTableCell, styles.calamityTotalColFlex, large && { fontSize: 16 }]} numberOfLines={1}>
                    {b.lokasi || '-'}
                  </Text>
                  <Text style={[styles.calamityTableCell, styles.calamityTotalColFlex, large && { fontSize: 16 }]}>
                    {new Date(b.created_at).toLocaleDateString('ms-MY')}
                  </Text>
                  <Text style={[styles.calamityTableCell, styles.calamityTotalColFlex, !b.resolved_at && { fontStyle: 'italic', color: PALETTE.orangeDark }, large && { fontSize: 16 }]}>
                    {b.resolved_at ? new Date(b.resolved_at).toLocaleDateString('ms-MY') : 'Bencana Belum Selesai'}
                  </Text>
                  {canDelete && (
                    <View style={{ width: 50, alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => onDelete(b.id, b.category)}
                        style={deleteBtnStyle}
                      >
                        <Trash2 size={13} color={PALETTE.danger || '#dc2626'} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
          ) : (
          <View>
            {filter.paged.map((b) => (
              <View key={b.id} style={styles.historyCardMobile}>
                <View style={styles.historyCardMobileTopRow}>
                  <Text style={[styles.tableCellAgency, { flex: 1 }]} numberOfLines={1}>{b.category}</Text>
                  {canDelete && (
                    <TouchableOpacity
                      onPress={() => onDelete(b.id, b.category)}
                      style={deleteBtnStyle}
                    >
                      <Trash2 size={13} color={PALETTE.danger || '#dc2626'} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.historyCardMobileStatsRow}>
                  <Text style={styles.historyCardMobileStat}>Mula: {new Date(b.created_at).toLocaleDateString('ms-MY')}</Text>
                  <Text style={styles.historyCardMobileStatDivider}>·</Text>
                  <Text style={[styles.historyCardMobileStat, !b.resolved_at && { fontStyle: 'italic', color: PALETTE.orangeDark }]}>
                    {b.resolved_at ? `Tamat: ${new Date(b.resolved_at).toLocaleDateString('ms-MY')}` : 'Belum Selesai'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          )}

          <PanelPagination filter={filter} />
        </>
      )}
    </>
  );
}
