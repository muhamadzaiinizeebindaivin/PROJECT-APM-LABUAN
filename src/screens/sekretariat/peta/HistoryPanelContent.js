// src/screens/sekretariat/peta/HistoryPanelContent.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { PALETTE } from '../../../constants/palette';
import { petaStyles as styles } from '../petaStyles';
import { PanelFilters, PanelPagination } from './PanelControls';
import { deleteBtnStyle, AgencyMark, formatDuration } from './petaUtils';

// Contenu du panneau "Sejarah Patrol Agensi" (tableau desktop / cartes mobile)
export default function HistoryPanelContent({ large = false, theme, isMobile, filter, loading, canDelete, onDelete, getAgencyLogo, getAgencyColor }) {
  return (
    <>
      <PanelFilters theme={theme} filter={filter} searchPlaceholder="Cari agensi atau ahli..." />

      {loading ? (
        <ActivityIndicator size="small" color={PALETTE.orange} style={{ marginTop: 20 }} />
      ) : filter.paged.length === 0 ? (
        <Text style={styles.emptyText}>Tiada rekod sejarah untuk tempoh ini.</Text>
      ) : (
        <>
          {!isMobile ? (
          <View style={styles.calamityTableWrapper}>
            <View style={styles.calamityTableHeaderRow}>
              <View style={[styles.historyAgencyColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Agensi</Text>
              </View>
              <View style={[styles.calamityCatColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Tempoh</Text>
              </View>
              <View style={[styles.calamityCatColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Jarak</Text>
              </View>
              <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Tarikh</Text>
              </View>
              {canDelete && (
                <View style={[{ width: 50 }, styles.calamityHeaderCellBox]}>
                  <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}></Text>
                </View>
              )}
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {filter.paged.map((h, index) => (
                <View key={h.id} style={[styles.calamityTableRow, { backgroundColor: index % 2 === 0 ? PALETTE.cardLight : PALETTE.surface }]}>
                  <View style={[styles.historyAgencyColFlex, { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingVertical: 10 }]}>
                    <AgencyMark logo={getAgencyLogo(h.jpbd_directory?.agency)} color={getAgencyColor(h.jpbd_directory?.agency)} size={20} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tableCellAgency, large && { fontSize: 16 }]} numberOfLines={1}>{h.jpbd_directory?.agency || '-'}</Text>
                      <Text style={[styles.tableCellMember, large && { fontSize: 13 }]} numberOfLines={1}>{h.member_name}</Text>
                    </View>
                  </View>
                  <Text style={[styles.calamityTableCell, styles.calamityCatColFlex, large && { fontSize: 16 }]}>{formatDuration(h.duration_seconds)}</Text>
                  <Text style={[styles.calamityTableCell, styles.calamityCatColFlex, large && { fontSize: 16 }]}>{h.distance_km?.toFixed(2) || '0.00'} km</Text>
                  <View style={[styles.calamityTotalColFlex, { paddingVertical: 10 }]}>
                    <Text style={[styles.tableCellDate, large && { fontSize: 13 }]}>{new Date(h.ended_at).toLocaleDateString('ms-MY')}</Text>
                    <Text style={[styles.tableCellTime, large && { fontSize: 12 }]}>{new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  {canDelete && (
                    <View style={{ width: 50, alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => onDelete(h.id, h.jpbd_directory?.agency || h.member_name)}
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
            {filter.paged.map((h) => (
              <View key={h.id} style={styles.historyCardMobile}>
                <View style={styles.historyCardMobileTopRow}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AgencyMark logo={getAgencyLogo(h.jpbd_directory?.agency)} color={getAgencyColor(h.jpbd_directory?.agency)} size={20} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tableCellAgency} numberOfLines={1}>{h.jpbd_directory?.agency || '-'}</Text>
                      <Text style={styles.tableCellMember} numberOfLines={1}>{h.member_name}</Text>
                    </View>
                  </View>
                  {canDelete && (
                    <TouchableOpacity
                      onPress={() => onDelete(h.id, h.jpbd_directory?.agency || h.member_name)}
                      style={deleteBtnStyle}
                    >
                      <Trash2 size={13} color={PALETTE.danger || '#dc2626'} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.historyCardMobileStatsRow}>
                  <Text style={styles.historyCardMobileStat}>{formatDuration(h.duration_seconds)}</Text>
                  <Text style={styles.historyCardMobileStatDivider}>·</Text>
                  <Text style={styles.historyCardMobileStat}>{h.distance_km?.toFixed(2) || '0.00'} km</Text>
                  <Text style={styles.historyCardMobileStatDivider}>·</Text>
                  <Text style={styles.historyCardMobileStat}>{new Date(h.ended_at).toLocaleDateString('ms-MY')} {new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</Text>
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
