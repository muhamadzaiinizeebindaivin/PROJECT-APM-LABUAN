import { StyleSheet } from 'react-native';
import { PALETTE } from '../../constants/palette';

export const pentadbiranStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.softOrangeBg },

  stickySaveBtn: { backgroundColor: PALETTE.orange, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 },
  stickySaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scrollArea: { flex: 1 },
  contentContainer: { padding: 20 },

  card: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, overflow: 'hidden',
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },

  sectionHeaderRowSpaced: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionEditToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: PALETTE.orange, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  sectionEditToggleActive: { backgroundColor: '#ef4444' },
  sectionEditToggleText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  sectionIconBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.12)', justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: PALETTE.orange, textTransform: 'uppercase' },

  headerTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark },
  linkButton: { backgroundColor: PALETTE.orange, padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  linkButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

  unitContainer: { flexDirection: 'row', gap: 12 },
  unitBox: {
    flex: 1, backgroundColor: PALETTE.surface, padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  unitBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  boxTitle: { fontWeight: '800', color: PALETTE.textMutedDark, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  listItem: { fontSize: 14, color: PALETTE.textDark, flex: 1, flexShrink: 1, width: '100%', lineHeight: 20 },
  subListItem: { fontSize: 12, color: PALETTE.textMutedDark, marginLeft: 15, marginBottom: 6, fontStyle: 'italic' },

  unitListItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10, width: '100%' },
  unitListBullet: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.orange,
    marginTop: 7,
  },

  staffCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, width: '100%',
    backgroundColor: PALETTE.cardLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, marginBottom: 8, overflow: 'hidden',
  },
  staffAvatar: {
    width: 32, height: 32, borderRadius: 16, flexShrink: 0,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  staffAvatarText: { fontSize: 12, fontWeight: '800', color: PALETTE.orange },
  staffName: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark, marginBottom: 2, flexShrink: 1, width: '100%' },  
  staffRole: { fontSize: 12, color: PALETTE.textMutedDark, flexShrink: 1, width: '100%' },

  table: { borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 14, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  tableRowLast: { borderBottomWidth: 0 },
  tableHeader: { backgroundColor: 'rgba(249, 115, 22, 0.06)' },
  tableCell: {
    width: 84, paddingVertical: 16, paddingHorizontal: 10, textAlign: 'center',
    borderRightWidth: 1, borderRightColor: PALETTE.cardLightBorder,
    fontSize: 14, color: PALETTE.textMutedDark,
  },
  tableCellLabel: { width: 160 },
  tableInput: {
    paddingVertical: 10, paddingHorizontal: 8, backgroundColor: '#fafafa',
    borderWidth: 1.5, borderColor: PALETTE.cardLightBorder, color: PALETTE.textDark, fontSize: 14,
    outlineStyle: 'none', outlineWidth: 0,
  },
  cellHeader: { fontWeight: '800', color: PALETTE.textDark, fontSize: 12, letterSpacing: 0.4 },
  cellHeaderAccent: { color: PALETTE.orange },
  rowLabel: { fontWeight: '800', backgroundColor: 'rgba(234, 179, 8, 0.14)', color: '#854d0e', fontSize: 14 },
  cellHeaderGred: { color: '#854d0e', backgroundColor: 'rgba(234, 179, 8, 0.22)' },
  boldCell: { fontWeight: '800', color: '#be185d', fontSize: 14, backgroundColor: 'rgba(236, 72, 153, 0.10)' },
  cellHeaderJumlah: { color: '#be185d', backgroundColor: 'rgba(236, 72, 153, 0.14)' },

  progressItem: { marginBottom: 15 },
  progressLabel: { fontSize: 14, color: PALETTE.textMutedDark, marginBottom: 5 },
  progressBarBackground: { height: 10, backgroundColor: PALETTE.surface, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  progressPercent: { fontSize: 12, color: PALETTE.textMutedDark, textAlign: 'right', marginTop: 2, fontWeight: '700' },

  complianceRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  complianceBox: {
    flex: 1, minWidth: '45%', backgroundColor: PALETTE.surface, padding: 16, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  complianceScore: { fontSize: 26, fontWeight: '900', color: PALETTE.orange, marginBottom: 5 },
  complianceTitle: { fontSize: 14, fontWeight: '800', textAlign: 'center', color: PALETTE.textDark, marginBottom: 5 },
  complianceDesc: { fontSize: 12, textAlign: 'center', color: PALETTE.textMutedDark },

  kpiMarqueeViewport: {
    overflow: 'hidden',
    width: '100%',
    borderRadius: 14,
  },
  kpiGrid: { flexDirection: 'row', gap: 12, paddingVertical: 4 },

  kpiScrollTrack: {
    width: 160,
    height: 4,
    borderRadius: 2,
    backgroundColor: PALETTE.cardLightBorder,
    alignSelf: 'center',
    marginTop: 14,
    overflow: 'hidden',
  },
  kpiScrollThumb: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: PALETTE.orange,
    cursor: 'grab',
  },
  kpiCard: {
    width: 220, minHeight: 200, backgroundColor: PALETTE.surface, borderRadius: 14, padding: 16,
    borderWidth: 2, position: 'relative',
    flexDirection: 'column', justifyContent: 'space-between',
  },
  kpiCardBody: { flex: 1, marginLeft: 6 },
  kpiCardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingRight: 30 },
  kpiCardNama: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark, lineHeight: 22, flex: 1 },
  kpiCardTafsiran: { fontSize: 14, color: PALETTE.textMutedDark, lineHeight: 21, marginBottom: 6 },
  kpiCardPencapaian: { fontSize: 14, color: PALETTE.textDark, marginBottom: 6 },
  kpiCardAnalisis: { fontSize: 14, color: PALETTE.textMutedDark, lineHeight: 21, fontStyle: 'italic' },

  statusDot: { width: 9, height: 9, borderRadius: 5, marginTop: 5 },
  kpiLegendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  kpiLegendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  kpiLegendText: { fontSize: 14, color: PALETTE.textMutedDark, flex: 1, flexShrink: 1, minWidth: 0 },
  kpiLegendLabel: { fontWeight: '800', color: PALETTE.textDark },

  subSeksyenRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  subSeksyenChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: PALETTE.cardLightBorder, backgroundColor: '#fafafa',
  },
  subSeksyenChipSelected: { borderColor: PALETTE.orange, backgroundColor: 'rgba(249, 115, 22, 0.10)' },
  subSeksyenChipText: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },
  subSeksyenChipTextSelected: { color: PALETTE.orange },

  subSeksyenBadge: {
    alignSelf: 'flex-start', backgroundColor: PALETTE.cardLightBorder,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8,
  },
  subSeksyenBadgeText: { fontSize: 12, fontWeight: '800', color: PALETTE.textMutedDark, letterSpacing: 0.5 },

  kpiDetailStatusRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16,
  },
  kpiDetailStatusLabel: { fontSize: 12, fontWeight: '800', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiDetailStatusDesc: { fontSize: 14, color: PALETTE.textMutedDark },

  kpiDetailBox: {
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 12,
    padding: 14, backgroundColor: PALETTE.surface, marginBottom: 14,
  },
  kpiDetailText: { fontSize: 14, color: PALETTE.textDark, lineHeight: 21, marginTop: 4 },
  kpiDetailRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  kpiDetailCol: { flex: 1, marginBottom: 0 },
  kpiDetailValue: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark, marginTop: 4 },
  kpiModalContainer: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, overflow: 'hidden', elevation: 5,
    width: '100%', maxWidth: 500, maxHeight: '85%', borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  kpiModalScroll: { flexGrow: 0 },
  kpiSectionLabel: {
    fontSize: 12, fontWeight: '800', color: PALETTE.orange, letterSpacing: 0.8,
    marginBottom: 10, textTransform: 'uppercase',
  },
  kpiDivider: { height: 1, backgroundColor: PALETTE.cardLightBorder, marginVertical: 18 },
  kpiFieldRow: { flexDirection: 'row', gap: 12 },
  kpiFieldCol: { flex: 1 },

  kpiStatusChipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  kpiStatusChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: PALETTE.cardLightBorder,
  },
  kpiStatusChipLabel: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },
  kpiStatusChipDesc: { fontSize: 12, color: PALETTE.textMutedDark, textAlign: 'center' },

  kpiModalFooter: {
    flexDirection: 'row', gap: 10, padding: 20,
    borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder,
  },
  kpiSasaranBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(249, 115, 22, 0.12)', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 999, marginLeft: 6, marginTop: 12, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  kpiSasaranText: { fontSize: 16, fontWeight: '800', color: PALETTE.orange },
  kpiProgressWrap: { marginLeft: 6, marginTop: 12 },
  kpiProgressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  kpiProgressLabel: { fontSize: 15, fontWeight: '900', color: PALETTE.textDark },
  kpiProgressLabelMuted: { fontSize: 11, fontWeight: '600', color: PALETTE.textMutedDark },
  kpiProgressTrack: { height: 8, borderRadius: 4, backgroundColor: PALETTE.surface, overflow: 'hidden' },
  kpiProgressFill: { height: '100%', borderRadius: 4 },
  kpiPencilBtn: {
    zIndex: 1,
    position: 'absolute', top: 10, right: 10, zIndex: 5,
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#16a34a',
    justifyContent: 'center', alignItems: 'center',
  },
  kpiPencilBtnInline: {
    width: 26, height: 26, borderRadius: 7, position: 'relative',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  kpiDeleteBtnInline: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: 'rgba(220, 38, 38, 0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  kpiTooltip: {
    position: 'absolute', top: -30, right: 0, zIndex: 999,
    backgroundColor: PALETTE.textDark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  kpiTooltipText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  kpiModalDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  kpiModalDeleteBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 12 },

  kpiPaginationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, marginTop: 14,
  },
  kpiPageBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  kpiPageBtnDisabled: { backgroundColor: PALETTE.surface },
  kpiPageIndicator: { fontSize: 12, fontWeight: '700', color: PALETTE.textDark },

  input: { borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 8, fontSize: 14, backgroundColor: '#fafafa', color: PALETTE.textDark },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editRowBlock: { marginBottom: 10 },
  delBtn: { color: '#dc2626', fontWeight: '800', marginLeft: 10, padding: 5 },
  addBtn: { marginTop: 10, padding: 10, backgroundColor: PALETTE.surface, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: PALETTE.cardLightBorder },
  addBtnText: { color: PALETTE.orange, fontWeight: '800', fontSize: 12 },

  warningBanner: {
    backgroundColor: 'rgba(217, 119, 6, 0.10)', padding: 12, borderRadius: 12, marginBottom: 15,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  warningBannerText: { fontSize: 12, color: '#b45309', flex: 1 },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  userName: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark },
  userRole: { fontSize: 12, color: PALETTE.textMutedDark, textTransform: 'uppercase' },
  userActionBtn: { flexDirection: 'row', backgroundColor: 'rgba(249, 115, 22, 0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  userActionBtnText: { fontSize: 12, fontWeight: '800', color: PALETTE.orange },
  userDangerBtn: { flexDirection: 'row', backgroundColor: 'rgba(220, 38, 38, 0.10)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  userDangerBtnText: { fontSize: 12, fontWeight: '800', color: '#dc2626' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, overflow: 'hidden', elevation: 5,
    width: '100%', maxWidth: 500, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  modalTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, marginBottom: 8, marginTop: 10 },
  modalInput: { borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: '#fafafa', color: PALETTE.textDark, marginBottom: 10 },
  saveButton: { backgroundColor: PALETTE.orange, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dangerIconCircle: { backgroundColor: 'rgba(220, 38, 38, 0.10)', padding: 8, borderRadius: 20, marginRight: 12 },
  confirmText: { fontSize: 14, color: PALETTE.textMutedDark, marginBottom: 25, lineHeight: 21 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: PALETTE.surface },
  cancelBtnText: { color: PALETTE.textMutedDark, fontWeight: '700' },
  confirmDeleteBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#dc2626', flexDirection: 'row', alignItems: 'center' },
  orgChartWrap: {
    borderRadius: 14, overflow: 'hidden', backgroundColor: PALETTE.surface,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, position: 'relative',
  },
  orgChartImage: { width: '100%', height: 520 },
  orgChartEmpty: {
    height: 520, justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  orgChartFullscreenOverlay: {
    flex: 1, backgroundColor: 'rgba(11, 12, 14, 0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  orgChartFullscreenImage: { width: '95%', height: '90%' },
  orgChartFullscreenClose: {
    position: 'absolute', top: 20, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  orgChartZoomHint: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  orgChartZoomHintText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  orgChartEmptyText: { fontSize: 14, color: PALETTE.textMutedDark },
  orgChartLoader: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)',
  },
  orgChartActions: {
    flexDirection: 'row', gap: 10, padding: 12,
    borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder, backgroundColor: PALETTE.cardLight,
  },
  orgChartActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: PALETTE.orange, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
  },
  orgChartActionBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  orgChartDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.08)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
  },
  orgChartDeleteBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 12 },
  orgChartError: { fontSize: 12, color: '#dc2626', padding: 10, textAlign: 'center' },
  sectionSaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: PALETTE.orange, paddingVertical: 12, borderRadius: 12, marginTop: 14,
  },
  sectionSaveBtnUrgent: {
    backgroundColor: '#d97706',
    shadowColor: '#d97706', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  sectionSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  sectionHeaderWithBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, width: '100%',
  },
  unsavedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(217, 119, 6, 0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  unsavedBadgeText: { fontSize: 12, fontWeight: '700', color: '#b45309' },
  staffReorderGroup: { gap: 2 },
  staffReorderBtn: {
    width: 20, height: 16, borderRadius: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
staffReorderBtnDisabled: { backgroundColor: PALETTE.surface },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: {
    width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
  },
  confirmBanner: { backgroundColor: '#0c0c0e', padding: 24, alignItems: 'center' },
  confirmIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  confirmTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  confirmSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: 10, padding: 20, backgroundColor: '#fff' },
  confirmCancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: PALETTE.cardLightBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmCancelText: { color: PALETTE.textMutedDark, fontWeight: '800', fontSize: 14 },
  confirmConfirmBtn: {
    flex: 1, height: 48, borderRadius: 12, backgroundColor: '#ef4444',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});