import { StyleSheet } from 'react-native';
import { PALETTE } from '../../constants/palette';

export const angkatanStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.softOrangeBg },

  stickyHeader: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: PALETTE.cardLight, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder,
    zIndex: 10, gap: 10, position: 'relative',
  },
  stickyHeaderCenter: {
    position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center',
  },
  stickyHeaderDikemaskini: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },

  contentGrid: { padding: 20, paddingBottom: 40, gap: 16 },
  row: { flexDirection: 'row', gap: 16 },

  card: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, position: 'relative',
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionHeaderRowSpaced: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionIconBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.12)', justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: PALETTE.orange, textTransform: 'uppercase', flex: 1 },

  editBadge: {
    position: 'absolute', top: -10, right: -10, backgroundColor: PALETTE.orange,
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 4,
  },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: PALETTE.orange, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Hero
  heroCard: {
    borderRadius: 18, padding: 20, overflow: 'hidden', position: 'relative',
    backgroundColor: PALETTE.ink,
  },
  heroGlow: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: PALETTE.orange, opacity: 0.25, top: -70, right: -60,
  },
  heroValue: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  heroLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 4 },

  // Status grid
  statusGrid: { flexDirection: 'row', gap: 10 },
  statusBox: { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: PALETTE.surface },
  statusValue: { fontSize: 22, fontWeight: '900' },
  statusLabel: { fontSize: 11, fontWeight: '700', marginTop: 4, textAlign: 'center', color: PALETTE.textMutedDark },

  // Categories list
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  listItemLast: { borderBottomWidth: 0 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  listItemLabel: { color: PALETTE.textMutedDark, flex: 1, marginLeft: 10, fontSize: 14 },
  listItemValue: { color: PALETTE.textDark, fontWeight: '700', marginRight: 10, fontSize: 14 },

  // Gender
  genderContainer: { gap: 18 },
  genderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  genderIconCircle: { width: 44, height: 44, borderRadius: 13, backgroundColor: PALETTE.blueSoft, justifyContent: 'center', alignItems: 'center' },
  genderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  genderLabel: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark },
  genderValue: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark },
  progressBarBg: { height: 8, backgroundColor: PALETTE.surface, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  // Ranks table
  tableScroll: { marginHorizontal: -20 },
  tableScrollContent: { paddingHorizontal: 20, minWidth: '100%' },
  table: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.cardLightBorder, minWidth: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: PALETTE.surface },
  tableHeaderCell: { flex: 1, padding: 12, fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, textAlign: 'center', letterSpacing: 0.3 },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder },
  tableRowAlt: { backgroundColor: PALETTE.surface },
  tableCell: { flex: 1, padding: 12, textAlign: 'center', color: PALETTE.textMutedDark, fontSize: 13 },
  tableCellRank: { fontWeight: '700', color: PALETTE.textDark, textAlign: 'left' },
  tableActionCell: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 10 },

  // Community
  communityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  communityItemLast: { borderBottomWidth: 0 },
  programBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, justifyContent: 'center', alignItems: 'center', width: 70 },
  programBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  communityLabel: { color: PALETTE.textDark, fontWeight: '700', fontSize: 15 },
  communityDetail: { color: PALETTE.textMutedDark, marginTop: 4, fontSize: 13 },

  // Pyramid
  pyramidRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  pyramidLabel: { width: 100, fontSize: 12, color: PALETTE.textMutedDark, fontWeight: '600' },
  pyramidBarBg: { flex: 1, height: 26, backgroundColor: PALETTE.surface, borderRadius: 6, overflow: 'hidden' },
  pyramidBarFill: { height: '100%', borderRadius: 6 },
  pyramidValue: { marginLeft: 8, fontSize: 12, color: PALETTE.textDark, fontWeight: '700', width: 30 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, overflow: 'hidden', elevation: 5,
    width: '100%', maxWidth: 460, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  modalTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, marginBottom: 6, marginTop: 10 },
  modalInput: {
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 12,
    fontSize: 14, backgroundColor: '#fafafa', color: PALETTE.textDark,
    outlineStyle: 'none', outlineWidth: 0,
  },
  saveButton: { backgroundColor: PALETTE.orange, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  employeeListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  employeeListHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  employeeListActions: { flexDirection: 'row', gap: 8 },
  employeeHint: { color: PALETTE.textMutedDark, fontSize: 12, fontStyle: 'italic', marginBottom: 10 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 12,
    width: 220, height: 40, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  searchInput: { marginLeft: 10, fontSize: 13, fontWeight: '600', flex: 1, color: PALETTE.textDark },

  employeeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  employeeAvatar: { width: 44, height: 44, borderRadius: 22 },
  employeeAvatarPlaceholder: { backgroundColor: PALETTE.surface, justifyContent: 'center', alignItems: 'center' },
  employeeName: { color: PALETTE.textDark, fontWeight: '700', fontSize: 15 },
  employeeRank: { color: PALETTE.textMutedDark, fontSize: 12, marginTop: 2 },
  employeeStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 10 },
  employeeStatusBadgeText: { fontSize: 10, fontWeight: '700' },
  lihatSijilBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, backgroundColor: PALETTE.orangeSoft,
  },
  lihatSijilBtnText: { color: PALETTE.orange, fontSize: 11, fontWeight: '700', marginLeft: 5 },

  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, gap: 15 },
  paginationBtnText: { color: PALETTE.orange, fontWeight: '700' },
  paginationCount: { color: PALETTE.textMutedDark, fontSize: 12 },
  employeeModalContainer: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, overflow: 'hidden', elevation: 5,
    width: '100%', maxWidth: 640, maxHeight: '90%', borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  profileHeader: {
    alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder,
  },
  profilePhotoWrap: { padding: 4, borderRadius: 60, borderWidth: 2, borderColor: PALETTE.orange, marginBottom: 12 },
  profilePhotoLarge: { width: 100, height: 100, borderRadius: 50 },
  profileName: { color: PALETTE.textDark, fontSize: 19, fontWeight: '800' },
  profileRank: { color: PALETTE.textMutedDark, fontSize: 13, marginTop: 4 },
  profileStatusBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  profileStatusText: { fontSize: 11, fontWeight: '700' },
  changePhotoBtn: { marginTop: 12 },
  changePhotoText: { color: PALETTE.orange, fontWeight: '700', fontSize: 13 },

  quickInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  quickInfoBox: { flexBasis: '47%', backgroundColor: PALETTE.surface, padding: 12, borderRadius: 10 },
  quickInfoLabel: { color: PALETTE.textMutedDark, fontSize: 11, marginBottom: 4 },
  quickInfoValue: { color: PALETTE.textDark, fontSize: 14, fontWeight: '700' },

  seeMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PALETTE.orangeSoft, paddingVertical: 12, borderRadius: 10, marginBottom: 10,
  },
  seeMoreBtnText: { color: PALETTE.orange, fontWeight: '700' },

  tabBarScroll: { marginBottom: 20 },
  tabBar: { flexDirection: 'row', backgroundColor: PALETTE.surface, borderRadius: 12, padding: 4, gap: 4 },
  tabBtn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 9 },
  tabBtnActive: { backgroundColor: PALETTE.cardLight, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: PALETTE.textMutedDark },
  tabBtnTextActive: { color: PALETTE.orange, fontWeight: '800' },

  fieldLabel: { color: PALETTE.textMutedDark, marginBottom: 6, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldValue: { color: PALETTE.textDark, fontSize: 15, fontWeight: '600' },
  fieldListItem: { color: PALETTE.textDark, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: PALETTE.cardLightBorder, backgroundColor: '#fafafa' },
  pickerChipActive: { backgroundColor: PALETTE.orange, borderColor: PALETTE.orange },
  pickerChipText: { fontSize: 12, fontWeight: '600', color: PALETTE.textDark },
  pickerChipTextActive: { color: '#fff' },

  certRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  certName: { color: PALETTE.textDark, fontWeight: '700', fontSize: 14 },
  certLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  certLinkText: { color: PALETTE.blue, fontSize: 12, fontWeight: '600' },
});