// src/screens/sekretariat/petaStyles.js
import { StyleSheet } from 'react-native';

export const petaStyles = StyleSheet.create({
  petaFixedContainer: { flex: 1, flexDirection: 'row', margin: 15, borderRadius: 20, overflow: 'hidden' },
  petaMapHalf: { flex: 1, position: 'relative' },
  petaMapContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  petaHeaderCard: { position: 'absolute', top: 16, left: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, minWidth: 200 },
  petaIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center' },
  petaHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  liveTagContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  liveText: { fontSize: 10, fontWeight: '700' },
  petaListContainer: { position: 'absolute', bottom: 50, left: 16, right: 16, zIndex: 10 },
  petaAgencyCard: { padding: 12, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, minWidth: 160 },
  petaAgencyDot: { width: 10, height: 10, borderRadius: 5 },
  petaAgencyName: { fontSize: 12, fontWeight: '700', color: '#0f172a', maxWidth: 120 },
  petaAgencyUser: { fontSize: 10, color: '#64748b' },
  agencyLegendPalette: {
    position: 'absolute', top: 108, left: 16, zIndex: 10, backgroundColor: '#fff',
    borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 10, elevation: 4, width: 140,
  },
  agencyLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  agencyLegendDot: { width: 10, height: 10, borderRadius: 5 },
  agencyLegendLabel: { fontSize: 11, fontWeight: '700', color: '#334155', flex: 1 },

  historyToggleBtn: {
    position: 'absolute', top: 16, right: 112, zIndex: 10,
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  summaryToggleBtn: {
    position: 'absolute', top: 16, right: 64, zIndex: 10,
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  addBencanaToggleBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  addBencanaToggleBtnActive: { backgroundColor: '#ea580c' },
  placingBencanaHint: {
    position: 'absolute', top: 60, right: 16, zIndex: 10,
    backgroundColor: '#0f172a', color: '#fff', fontSize: 10, fontWeight: '700',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, maxWidth: 130, textAlign: 'center',
  },
  historyTooltip: {
    position: 'absolute', top: 46, right: 0, zIndex: 20,
    backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  historyTooltipText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  petaHistoryHalf: { flex: 1, backgroundColor: '#fff', borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  petaHistoryHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  petaHistoryTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  historyFilterRow: { flexDirection: 'row', gap: 10, padding: 16, zIndex: 50 },

  calamityTableWrapper: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden', marginHorizontal: 16 },
  calamityTableHeaderRow: { flexDirection: 'row', backgroundColor: '#1E3A8A' },
  calamityHeaderCellBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 6 },
  calamityTableHeaderCell: { fontSize: 12, fontWeight: '800', color: '#fff', textAlign: 'center' },
  calamityTableRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  calamityTableCell: { fontSize: 13, color: '#334155', textAlign: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  historyAgencyColFlex: { flex: 2 },
  calamityCatColFlex: { flex: 1 },
  calamityTotalColFlex: { flex: 1.2, alignItems: 'center', justifyContent: 'center' },

  paginationRow: { alignItems: 'center', paddingVertical: 12, gap: 8 },
  pageArrowRow: { flexDirection: 'row', gap: 10 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { backgroundColor: '#f1f5f9' },
  pageBtnText: { fontSize: 16, fontWeight: '700', color: '#1E3A8A' },
  pageBtnTextDisabled: { color: '#cbd5e1' },
  pageIndicator: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  tableCellAgency: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  tableCellMember: { fontSize: 11, color: '#64748b', marginTop: 1 },
  tableCellDate: { fontSize: 11, fontWeight: '700', color: '#334155' },
  tableCellTime: { fontSize: 10, color: '#94a3b8', marginTop: 1 },

  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20, fontStyle: 'italic' },
});