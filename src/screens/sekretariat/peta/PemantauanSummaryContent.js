// src/screens/sekretariat/peta/PemantauanSummaryContent.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { PALETTE } from '../../../constants/palette';
import { petaStyles as styles } from '../petaStyles';
import { PanelFilters, PanelPagination } from './PanelControls';
import { deleteBtnStyle } from './petaUtils';

// Contenu du panneau "Ringkasan Pemantauan"
export default function PemantauanSummaryContent({ large = false, theme, isMobile, filter, canDelete, onDelete }) {
  return (
    <>
      <PanelFilters theme={theme} filter={filter} searchPlaceholder="Cari lokasi pemantauan..." searchWithIcon />

      {filter.paged.length === 0 ? (
        <Text style={styles.emptyText}>Tiada rekod pemantauan untuk tempoh ini.</Text>
      ) : (
        <>
          {!isMobile ? (
          <View style={[styles.calamityTableWrapper, { borderRadius: 14, borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', overflow: 'hidden' }]}>
            <View style={[styles.calamityTableHeaderRow, { backgroundColor: '#1e3a8a' }]}>
              <View style={[{ flex: 2 }, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, { color: '#fff', fontWeight: '800' }, large && { fontSize: 16 }]}>Lokasi</Text>
              </View>
              <View style={[{ flex: 1 }, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, { color: '#fff', fontWeight: '800' }, large && { fontSize: 16 }]}>Rumah</Text>
              </View>
              <View style={[{ flex: 1 }, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, { color: '#fff', fontWeight: '800' }, large && { fontSize: 16 }]}>Bacaan Air</Text>
              </View>
              <View style={[{ flex: 1.2 }, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, { color: '#fff', fontWeight: '800' }, large && { fontSize: 16 }]}>Tarikh</Text>
              </View>
              <View style={[{ flex: 1 }, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, { color: '#fff', fontWeight: '800' }, large && { fontSize: 16 }]}>Status</Text>
              </View>
              {canDelete && (
                <View style={[{ width: 50 }, styles.calamityHeaderCellBox]}>
                  <Text style={[styles.calamityTableHeaderCell, { color: '#fff', fontWeight: '800' }, large && { fontSize: 16 }]}></Text>
                </View>
              )}
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {filter.paged.map((p, index) => (
                <View key={p.id} style={[styles.calamityTableRow, { backgroundColor: index % 2 === 1 ? (PALETTE.surface || '#f8fafc') : '#fff', borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder || '#e2e8f0' }]}>
                  <Text style={[styles.calamityTableCell, { flex: 2 }, large && { fontSize: 16 }]} numberOfLines={1}>
                    {p.lokasi || '-'}
                  </Text>
                  <Text style={[styles.calamityTableCell, { flex: 1, textAlign: 'center' }, large && { fontSize: 16 }]}>
                    {p.jumlah_rumah_terjejas ?? 0}
                  </Text>
                  <Text style={[styles.calamityTableCell, { flex: 1, textAlign: 'center' }, large && { fontSize: 16 }]}>
                    {p.bacaan_air || '-'}
                  </Text>
                  <Text style={[styles.calamityTableCell, { flex: 1.2 }, large && { fontSize: 16 }]}>
                    {new Date(p.created_at).toLocaleDateString('ms-MY')}
                  </Text>
                  <Text style={[styles.calamityTableCell, { flex: 1 }, p.status !== 'resolved' && { fontStyle: 'italic', color: PALETTE.orangeDark }, large && { fontSize: 16 }]}>
                    {p.status === 'resolved' ? 'Selesai' : 'Aktif'}
                  </Text>
                  {canDelete && (
                    <View style={{ width: 50, alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => onDelete(p.id, p.lokasi || 'Titik Pemantauan')}
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
            {filter.paged.map((p) => (
              <View key={p.id} style={styles.historyCardMobile}>
                <View style={styles.historyCardMobileTopRow}>
                  <Text style={[styles.tableCellAgency, { flex: 1 }]} numberOfLines={1}>{p.lokasi || '-'}</Text>
                  {canDelete && (
                    <TouchableOpacity
                      onPress={() => onDelete(p.id, p.lokasi || 'Titik Pemantauan')}
                      style={deleteBtnStyle}
                    >
                      <Trash2 size={13} color={PALETTE.danger || '#dc2626'} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.historyCardMobileStatsRow}>
                  <Text style={styles.historyCardMobileStat}>Rumah: {p.jumlah_rumah_terjejas ?? 0}</Text>
                  <Text style={styles.historyCardMobileStatDivider}>·</Text>
                  <Text style={styles.historyCardMobileStat}>{new Date(p.created_at).toLocaleDateString('ms-MY')}</Text>
                  <Text style={styles.historyCardMobileStatDivider}>·</Text>
                  <Text style={[styles.historyCardMobileStat, p.status !== 'resolved' && { fontStyle: 'italic', color: PALETTE.orangeDark }]}>
                    {p.status === 'resolved' ? 'Selesai' : 'Aktif'}
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
