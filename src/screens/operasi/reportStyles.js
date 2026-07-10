// src/screens/operasi/reportStyles.js
import { StyleSheet } from 'react-native';

export const reportStyles = StyleSheet.create({
  reportContainer: { flex: 1, paddingHorizontal: 16 },
  reportHeader: { marginBottom: 20, marginTop: 10 },
  reportTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statBoxTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statBoxValue: { fontSize: 28, fontWeight: '900' },
  highlightCard: { padding: 20, borderRadius: 16, marginBottom: 20 },
  dropdownHeaderBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  dropdownList: { marginTop: 8, borderRadius: 12, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  dropdownItem: { padding: 16 },
  breakdownContainer: { padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, marginBottom: 20 },
  breakdownTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20 },
  breakdownRow: { marginBottom: 16 },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  crudContainer: { padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, marginBottom: 30 },
  crudHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22c55e', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  crudItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  actionBtns: { flexDirection: 'row', gap: 16 },
  iconBtn: { padding: 4 },
});