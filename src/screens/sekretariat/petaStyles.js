// src/screens/sekretariat/petaStyles.js
import { StyleSheet } from 'react-native';
import { PALETTE } from '../../constants/palette';

export const petaStyles = StyleSheet.create({
  petaFixedContainer: { flex: 1, flexDirection: 'row', marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden' },
  petaMapHalf: { flex: 1, position: 'relative' },
  petaMapContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  petaHeaderCard: {
    position: 'absolute', top: 16, left: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16, gap: 12, backgroundColor: PALETTE.cardLight,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, minWidth: 200,
  },
  petaIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: PALETTE.orange, justifyContent: 'center', alignItems: 'center' },
  petaHeaderTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark },
  liveTagContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.success },
  liveText: { fontSize: 10, fontWeight: '700' },
  petaListContainer: { position: 'absolute', bottom: 50, left: 16, right: 16, zIndex: 10 },
  petaAgencyCard: { padding: 12, borderRadius: 12, backgroundColor: PALETTE.cardLight, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, minWidth: 160 },
  petaAgencyDot: { width: 10, height: 10, borderRadius: 5 },
  petaAgencyName: { fontSize: 12, fontWeight: '700', color: PALETTE.textDark, maxWidth: 120 },
  petaAgencyUser: { fontSize: 10, color: PALETTE.textMutedDark },
  agencyLegendPalette: {
    position: 'absolute', top: 108, left: 16, zIndex: 10, backgroundColor: PALETTE.cardLight,
    borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 10, elevation: 4, width: 140,
  },
  agencyLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  agencyLegendDot: { width: 10, height: 10, borderRadius: 5 },
  agencyLegendLabel: { fontSize: 11, fontWeight: '700', color: PALETTE.textDark, flex: 1 },

  historyToggleBtn: {
    position: 'absolute', top: 16, right: 112, zIndex: 10,
    width: 40, height: 40, borderRadius: 12, backgroundColor: PALETTE.cardLight,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  summaryToggleBtn: {
    position: 'absolute', top: 16, right: 64, zIndex: 10,
    width: 40, height: 40, borderRadius: 12, backgroundColor: PALETTE.cardLight,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  addBencanaToggleBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 12, backgroundColor: PALETTE.cardLight,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  addBencanaToggleBtnActive: { backgroundColor: PALETTE.orangeDark },
  placingBencanaHint: {
    position: 'absolute', top: 60, right: 16, zIndex: 10,
    backgroundColor: PALETTE.textDark, color: '#fff', fontSize: 10, fontWeight: '700',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, maxWidth: 130, textAlign: 'center',
  },
  historyTooltip: {
    position: 'absolute', top: 46, right: 0, zIndex: 20,
    backgroundColor: PALETTE.textDark, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  historyTooltipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  panelCloseBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: PALETTE.surface, justifyContent: 'center', alignItems: 'center' },

  petaHistoryHalf: { flex: 1, backgroundColor: PALETTE.cardLight, borderLeftWidth: 1, borderLeftColor: PALETTE.cardLightBorder },
  petaHistoryHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  petaHistoryTitle: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark },
  historyFilterRow: { flexDirection: 'row', gap: 10, padding: 16, zIndex: 50 },

  calamityTableWrapper: { borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 14, overflow: 'hidden', marginHorizontal: 16 },
  calamityTableHeaderRow: { flexDirection: 'row', backgroundColor: PALETTE.surface },
  calamityHeaderCellBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  calamityTableHeaderCell: { fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, textAlign: 'center', letterSpacing: 0.3 },
  calamityTableRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder },
  calamityTableCell: { fontSize: 13, color: PALETTE.textMutedDark, textAlign: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  historyAgencyColFlex: { flex: 2 },
  calamityCatColFlex: { flex: 1 },
  calamityTotalColFlex: { flex: 1.2, alignItems: 'center', justifyContent: 'center' },

  paginationRow: { alignItems: 'center', paddingVertical: 12, gap: 8 },
  pageArrowRow: { flexDirection: 'row', gap: 10 },
  pageBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(249, 115, 22, 0.10)', justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { backgroundColor: PALETTE.surface },
  pageBtnText: { fontSize: 16, fontWeight: '800', color: PALETTE.orange },
  pageBtnTextDisabled: { color: PALETTE.textMutedDark },
  pageIndicator: { fontSize: 12, fontWeight: '700', color: PALETTE.textDark },

  tableCellAgency: { fontSize: 13, fontWeight: '800', color: PALETTE.textDark },
  tableCellMember: { fontSize: 11, color: PALETTE.textMutedDark, marginTop: 1 },
  tableCellDate: { fontSize: 11, fontWeight: '700', color: PALETTE.textDark },
  tableCellTime: { fontSize: 10, color: PALETTE.textMutedDark, marginTop: 1 },

  emptyText: { textAlign: 'center', color: PALETTE.textMutedDark, marginTop: 20, fontStyle: 'italic' },
});
