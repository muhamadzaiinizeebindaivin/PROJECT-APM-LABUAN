// src/screens/sekretariat/sekretariatStyles.js
import { StyleSheet } from 'react-native';
import { PALETTE } from '../constants/palette';

/**
 * Styles partagés entre JpbdSection, HotspotSection et PpsSection —
 * cartes, modales, formulaires génériques, boutons d'action.
 */
export const appStyles = StyleSheet.create({
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: PALETTE.orange, textTransform: 'uppercase', marginBottom: 0 },
  addButton: { flexDirection: 'row', backgroundColor: PALETTE.orange, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: 'center', gap: 6 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: PALETTE.textMutedDark, marginTop: 20, fontStyle: 'italic' },

  card: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, marginBottom: 16,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerContent: { flex: 1 },
  body: { padding: 16, paddingTop: 0, backgroundColor: PALETTE.surface, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 10 },
  editBtn: { flexDirection: 'row', backgroundColor: PALETTE.orange, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignItems: 'center', gap: 4 },
  deleteBtn: { flexDirection: 'row', backgroundColor: PALETTE.dangerSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignItems: 'center', gap: 4 },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  sectionTitle: { fontSize: 12, fontWeight: '800', color: PALETTE.orange, marginTop: 12, marginBottom: 8, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: PALETTE.cardLightBorder, marginVertical: 10 },
  section: { marginTop: 5 },
  label: { fontSize: 12, color: PALETTE.textMutedDark, marginBottom: 4 },
  value: { color: PALETTE.textDark, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  halfCol: { width: '48%' },
  statLabel: { fontSize: 11, color: PALETTE.textMutedDark, fontWeight: '700', textTransform: 'uppercase' },
  statValue2: { fontSize: 18, fontWeight: 'bold', color: PALETTE.textDark, textAlign: 'center' },
  logisticsBox: { backgroundColor: PALETTE.orangeSoft, padding: 10, borderRadius: 8, marginTop: 10 },
  subTitle: { fontSize: 12, fontWeight: '700', color: PALETTE.orangeDark, marginBottom: 4 },
  logItem: { fontSize: 12, color: PALETTE.orangeDark, marginLeft: 4, marginBottom: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: PALETTE.cardLight, width: '100%', maxWidth: 460, borderRadius: 18, maxHeight: '85%', overflow: 'hidden', elevation: 5, borderWidth: 1, borderColor: PALETTE.cardLightBorder },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  modalTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark },
  modalForm: { padding: 20 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 12,
    fontSize: 14, color: PALETTE.textDark, backgroundColor: '#fafafa',
    outlineStyle: 'none', outlineWidth: 0,
  },
  saveButton: { backgroundColor: PALETTE.orange, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, borderColor: PALETTE.cardLightBorder, backgroundColor: '#fafafa' },
  categoryBtnActive: { backgroundColor: PALETTE.orangeSoft, borderColor: PALETTE.orange },
  categoryBtnText: { fontSize: 12, fontWeight: '600', color: PALETTE.textMutedDark },
  categoryBtnTextActive: { color: PALETTE.orange, fontWeight: '700' },

  ppsActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 8, backgroundColor: PALETTE.surface, borderRadius: 8 },
  pdfExportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PALETTE.orange, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, minWidth: 60, justifyContent: 'center' },
  pdfExportBtnDisabled: { backgroundColor: PALETTE.cardLightBorder },
  pdfExportBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
