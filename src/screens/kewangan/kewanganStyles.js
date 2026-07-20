import { StyleSheet } from 'react-native';
import { PALETTE } from '../../constants/palette';

export const kewanganStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.softOrangeBg },
  contentContainer: { padding: 20, paddingBottom: 40 },

  // Hero (Peruntukan Tahunan) — même esprit sombre que HeroSection sur HomeScreen
  heroCard: {
    borderRadius: 24, padding: 28, marginBottom: 20,
    backgroundColor: PALETTE.ink, overflow: 'hidden', position: 'relative',
  },
  heroGlow: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: PALETTE.orange, opacity: 0.25, top: -110, right: -80,
  },
  heroKicker: { color: PALETTE.orange, fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  heroYear: { fontSize: 20, color: '#fff', fontWeight: '900', marginBottom: 16 },
  heroTotalBox: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 },
  heroTotalLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4, fontWeight: '600' },
  heroTotalAmount: { color: '#fff', fontSize: 22, fontWeight: '900', fontFamily: 'monospace' },
  heroEditBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    marginTop: 16, backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 11, borderRadius: 12,
  },
  heroEditBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Cartes standard (mêmes conventions que Pentadbiran)
  card: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionHeaderRowSpaced: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionIconBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.12)', justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: PALETTE.orange, textTransform: 'uppercase' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: PALETTE.orange, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  unitBox: { backgroundColor: PALETTE.surface, padding: 14, borderRadius: 14 },
  boxTitle: { fontWeight: '800', marginBottom: 8, color: PALETTE.textMutedDark, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  listItem: { fontSize: 14, color: PALETTE.textDark },

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
  staffAvatarText: { fontSize: 13, fontWeight: '800', color: PALETTE.orange },
  staffName: { fontSize: 13.5, fontWeight: '700', color: PALETTE.textDark, marginBottom: 2 },
  staffRole: { fontSize: 12, color: PALETTE.textMutedDark },

  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpiCard: {
    flex: 1, backgroundColor: PALETTE.surface, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, alignItems: 'center',
  },
  kpiTitle: { fontSize: 10.5, color: PALETTE.textMutedDark, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  kpiValue: { fontSize: 14, fontWeight: '800' },

  kategoriHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: PALETTE.surface, padding: 12, borderRadius: 12, marginBottom: 12,
  },
  kategoriTitle: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark },
  toggleIcon: { fontSize: 12, color: PALETTE.textMutedDark, fontWeight: '800' },

  budgetItemRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  budgetMainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetPerihal: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark, flex: 1 },
  budgetActionGroup: { flexDirection: 'row', gap: 8 },
  budgetActionBtn: {
    width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  budgetNumbersRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: PALETTE.softOrangeBg, padding: 10, borderRadius: 10 },
  budgetStat: { flex: 1, alignItems: 'center' },
  budgetStatLabel: { fontSize: 10.5, color: PALETTE.textMutedDark, marginBottom: 2 },
  budgetStatValue: { fontSize: 12.5, fontWeight: '700', color: PALETTE.textDark },

  quarterCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  quarterHeaderRight: { alignItems: 'flex-end', gap: 8 },
  quarterHeaderActions: { flexDirection: 'row', gap: 6 },

  quarterDetailBlock: {
    marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder,
  },
  quarterTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark },
  quarterMonths: { fontSize: 12, color: PALETTE.textMutedDark },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statsLabel: { fontSize: 11, color: PALETTE.textMutedDark, marginBottom: 2 },
  statsValue: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark },

  progressContainer: { height: 12, backgroundColor: PALETTE.surface, borderRadius: 6, overflow: 'hidden', position: 'relative' },
  progressBar: { height: '100%', borderRadius: 6 },
  limitLine: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.1)' },
  limitLabel: { fontSize: 10, color: PALETTE.textMutedDark, textAlign: 'right', marginTop: 4 },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16, borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder, paddingTop: 12 },
  editButton: { backgroundColor: PALETTE.orange, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  editButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  deleteButton: { backgroundColor: 'rgba(220, 38, 38, 0.10)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  deleteButtonText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },

  footer: { marginTop: 8, alignItems: 'center' },
  footerText: { fontSize: 11, color: PALETTE.textMutedDark, fontStyle: 'italic', textAlign: 'center', lineHeight: 17 },

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
  saveButton: { backgroundColor: PALETTE.orange, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
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
  kpiTooltipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  categoryCarouselViewport: { overflow: 'hidden', width: '100%', borderRadius: 14, marginBottom: 12 },
  categoryCarouselTrack: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  categoryCard: {
    paddingVertical: 16, paddingHorizontal: 14, borderRadius: 14,
    backgroundColor: PALETTE.surface, borderWidth: 1.5, borderColor: PALETTE.cardLightBorder,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  categoryDeleteBtn: {
    position: 'absolute', top: 6, right: 6, zIndex: 5,
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center',
  },
  categoryCardCompact: { width: 170 },
  categoryCardSelected: { borderColor: PALETTE.orange, backgroundColor: 'rgba(249, 115, 22, 0.08)' },
  categoryCardText: { fontSize: 13, fontWeight: '800', color: PALETTE.textMutedDark, textAlign: 'center' },
  categoryCardTextSelected: { color: PALETTE.orange },

  categorySummaryTitle: {
    fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 18, marginBottom: 10,
  },
  categorySummaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  categorySummaryCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 14, backgroundColor: PALETTE.surface,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  categorySummaryLabel: { fontSize: 10.5, color: PALETTE.textMutedDark, marginBottom: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  categorySummaryValue: { fontSize: 14, fontWeight: '800' },

  multiRowBlock: {
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 12,
    padding: 12, marginBottom: 12, backgroundColor: PALETTE.surface,
  },
  multiRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  multiRowIndex: { fontSize: 11, fontWeight: '800', color: PALETTE.orange, textTransform: 'uppercase' },
  multiRowDeleteBtn: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: 'rgba(220, 38, 38, 0.10)', justifyContent: 'center', alignItems: 'center',
  },
  addRowBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: PALETTE.cardLightBorder, borderStyle: 'dashed',
    borderRadius: 10, paddingVertical: 10, marginBottom: 16,
  },
  addRowBtnText: { color: PALETTE.orange, fontWeight: '700', fontSize: 12.5 },

  categoryScrollTrack: {
    width: 160, height: 4, borderRadius: 2, backgroundColor: PALETTE.cardLightBorder,
    alignSelf: 'center', marginBottom: 16, overflow: 'hidden',
  },
  categoryScrollThumb: { height: 4, borderRadius: 2, backgroundColor: PALETTE.orange },
  categoryAddBtnFloating: {
    position: 'absolute', top: 20, right: 20, zIndex: 6,
    backgroundColor: PALETTE.blue, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  categoryPickerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  categoryPickerLabel: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },

  categoryChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  categoryChip: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: PALETTE.cardLightBorder, backgroundColor: '#fafafa',
  },
  categoryChipNew: { flexDirection: 'row', alignItems: 'center', gap: 5, borderStyle: 'dashed' },
  categoryChipSelected: { borderColor: PALETTE.orange, backgroundColor: 'rgba(249, 115, 22, 0.10)' },
  categoryChipText: { fontSize: 12.5, fontWeight: '700', color: PALETTE.textMutedDark },
  categoryChipTextSelected: { color: PALETTE.orange },
  inputHint: { fontSize: 11, color: PALETTE.textMutedDark, marginTop: -8, marginBottom: 14, lineHeight: 16 },
  quarterDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  monthDropdownTrigger: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10,
    padding: 12, backgroundColor: '#fafafa',
  },
  monthDropdownText: { fontSize: 14, color: PALETTE.textDark, fontWeight: '600' },
  monthDropdownPlaceholder: { color: PALETTE.textMutedDark, fontWeight: '400' },

  monthDropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  monthDropdownPanel: {
    backgroundColor: PALETTE.cardLight, borderRadius: 16, width: '100%', maxWidth: 320,
    maxHeight: 380, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  monthDropdownOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder,
  },
  monthDropdownOptionSelected: { backgroundColor: 'rgba(249, 115, 22, 0.06)' },
  monthDropdownOptionText: { fontSize: 14, color: PALETTE.textDark, fontWeight: '600' },
  monthDropdownOptionTextSelected: { color: PALETTE.orange },
  budgetPaginationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, marginTop: 16,
  },
  budgetPageBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  budgetPageBtnDisabled: { backgroundColor: PALETTE.surface },
  budgetPageBtnText: { fontSize: 18, fontWeight: '800', color: PALETTE.orange, lineHeight: 20 },
  budgetPageBtnTextDisabled: { color: PALETTE.textMutedDark },
  budgetPageIndicator: { fontSize: 13, fontWeight: '700', color: PALETTE.textDark },
  helpSectionTitle: { fontSize: 13, fontWeight: '800', color: PALETTE.orange, marginTop: 16, marginBottom: 6 },
  helpText: { fontSize: 13, color: PALETTE.textDark, lineHeight: 20 },

  quarterHelpBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  quarterHelpBtnText: { fontSize: 13, fontWeight: '800', color: PALETTE.orange },
});