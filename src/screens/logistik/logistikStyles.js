import { StyleSheet } from 'react-native';
import { PALETTE } from '../../constants/palette';

export const logistikStyles = StyleSheet.create({
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
  row: { flexDirection: 'row', gap: 10 },

  card: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },

  unitBox: { backgroundColor: PALETTE.surface, padding: 14, borderRadius: 14 },
  boxTitle: { fontWeight: '800', marginBottom: 8, color: PALETTE.textMutedDark, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  listItem: { fontSize: 14, color: PALETTE.textDark, marginBottom: 4 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleMain: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark },
  addButton: { backgroundColor: PALETTE.orange, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder, gap: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', color: PALETTE.textDark },

  filterContainer: { gap: 8, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  filterChipActive: { backgroundColor: PALETTE.orange, borderColor: PALETTE.orange },
  filterText: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },
  filterTextActive: { color: '#fff' },

  sectionContainer: { gap: 12, marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 2, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder, marginBottom: 4,
  },
  assetGroupTitle: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark, letterSpacing: 0.2 },
  sectionSubtitle: {
    fontSize: 12, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: PALETTE.surface, overflow: 'hidden',
  },
  listContainer: { gap: 10 },

  itemCard: {
    backgroundColor: PALETTE.cardLight, padding: 16, paddingLeft: 18, borderRadius: 16,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, position: 'relative', overflow: 'hidden',
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
  },
  itemCardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardMainContent: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 46, height: 46, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  itemInfo: { flex: 1, justifyContent: 'center', paddingRight: 8 },
  modelText: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark, marginBottom: 3 },
  typeText: { fontSize: 12, color: PALETTE.textMutedDark, fontWeight: '600' },
  itemAction: { alignItems: 'flex-end', justifyContent: 'center', gap: 8 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, gap: 6,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  qtyContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: PALETTE.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  qtyText: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },
  regContainer: { backgroundColor: PALETTE.surface, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6 },
  regText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: PALETTE.textDark },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14, borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder, paddingTop: 12 },
  editButton: { backgroundColor: PALETTE.orange, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  editButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  deleteButton: { backgroundColor: 'rgba(220, 38, 38, 0.10)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  deleteButtonText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },

  modalAvatar: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalTypeText: { fontSize: 14, color: PALETTE.textMutedDark, fontWeight: '600', marginBottom: 16 },
  modalRegBadge: { alignSelf: 'flex-start', backgroundColor: PALETTE.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 20 },
  modalRegText: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: PALETTE.textDark },
  modalDetailsContainer: { gap: 14, backgroundColor: PALETTE.surface, padding: 18, borderRadius: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  detailIconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: PALETTE.cardLight, justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: PALETTE.textMutedDark, fontWeight: '600', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark },

  inputLabel: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: PALETTE.cardLightBorder },
  chipInactive: { backgroundColor: '#fafafa' },
  chipActive: { backgroundColor: PALETTE.orange, borderColor: PALETTE.orange },
  chipText: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },
  chipTextActive: { color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, overflow: 'hidden', elevation: 5,
    width: '100%', maxWidth: 460, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  modalTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark },
  modalBody: { padding: 20 },
  modalInput: {
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 12,
    fontSize: 14, backgroundColor: '#fafafa', color: PALETTE.textDark,
    outlineStyle: 'none', outlineWidth: 0,
  },
  saveButton: { backgroundColor: PALETTE.orange, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  staffCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: PALETTE.cardLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  staffAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  staffAvatarText: { fontSize: 12, fontWeight: '800', color: PALETTE.orange },
  staffName: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark, marginBottom: 2 },
  staffRole: { fontSize: 12, color: PALETTE.textMutedDark },

  staffReorderGroup: { gap: 2 },
  staffReorderBtn: {
    width: 20, height: 16, borderRadius: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  staffReorderBtnDisabled: { backgroundColor: PALETTE.surface },

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
    position: 'absolute', top: -30, right: 0, zIndex: 10,
    backgroundColor: PALETTE.textDark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  kpiTooltipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sectionHeaderRowSpaced: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionIconBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.12)', justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: PALETTE.orange, textTransform: 'uppercase', flex: 1 },
  categoryCarouselViewport: { overflow: 'hidden', width: '100%', borderRadius: 14, marginBottom: 12 },
  categoryCarouselTrack: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  categoryScrollTrack: {
    width: 160, height: 4, borderRadius: 2, backgroundColor: PALETTE.cardLightBorder,
    alignSelf: 'center', marginBottom: 16, overflow: 'hidden',
  },
  categoryScrollThumb: { height: 4, borderRadius: 2, backgroundColor: PALETTE.orange },

  compactAssetCard: {
    width: 210, padding: 14, borderRadius: 14,
    backgroundColor: PALETTE.cardLight, borderWidth: 2,
    position: 'relative', overflow: 'hidden',
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  compactAssetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  compactAssetAvatar: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  compactAssetModel: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark },
  compactAssetType: { fontSize: 12, color: PALETTE.textMutedDark, fontWeight: '600' },
  compactAssetActions: { flexDirection: 'row', gap: 4, flexShrink: 0 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statHeroCard: {
    flex: 1, borderRadius: 18, padding: 20, overflow: 'hidden', position: 'relative',
    backgroundColor: PALETTE.ink,
  },
  statHeroGlow: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: PALETTE.orange, opacity: 0.22, top: -50, right: -40,
  },
  statHeroIconBox: {
    width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  statHeroValue: { fontSize: 26, fontWeight: '900', color: '#fff' },
  statHeroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2 },
});