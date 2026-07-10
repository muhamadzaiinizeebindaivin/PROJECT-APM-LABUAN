// src/screens/sekretariat/sharedStyles.js
import { StyleSheet } from 'react-native';

/**
 * Styles partagés entre JpbdSection, HotspotSection et PpsSection —
 * cartes, modales, formulaires génériques, boutons d'action.
 */
export const sharedStyles = StyleSheet.create({
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 0 },
  addButton: { flexDirection: 'row', backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignItems: 'center', gap: 6 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20, fontStyle: 'italic' },

  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerContent: { flex: 1 },
  body: { padding: 16, paddingTop: 0, backgroundColor: '#f8fafc', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 10 },
  editBtn: { flexDirection: 'row', backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, alignItems: 'center', gap: 4 },
  deleteBtn: { flexDirection: 'row', backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, alignItems: 'center', gap: 4 },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#1E3A8A', marginTop: 12, marginBottom: 8, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#cbd5e1', marginVertical: 10 },
  section: { marginTop: 5 },
  label: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  value: { color: '#334155', fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  halfCol: { width: '48%' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  statValue2: { fontSize: 18, fontWeight: 'bold', color: '#1E3A8A', textAlign: 'center' },
  logisticsBox: { backgroundColor: '#e0f2fe', padding: 10, borderRadius: 8, marginTop: 10 },
  subTitle: { fontSize: 12, fontWeight: '700', color: '#0284c7', marginBottom: 4 },
  logItem: { fontSize: 12, color: '#0369a1', marginLeft: 4, marginBottom: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', width: '100%', borderRadius: 12, maxHeight: '85%', overflow: 'hidden', elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  modalForm: { padding: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 14, color: '#334155', backgroundColor: '#f8fafc' },
  saveButton: { backgroundColor: '#1E3A8A', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 25 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f1f5f9' },
  categoryBtnActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  categoryBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  categoryBtnTextActive: { color: '#1d4ed8' },

  ppsActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 6 },
  pdfExportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1E3A8A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 60, justifyContent: 'center' },
  pdfExportBtnDisabled: { backgroundColor: '#cbd5e1' },
  pdfExportBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});