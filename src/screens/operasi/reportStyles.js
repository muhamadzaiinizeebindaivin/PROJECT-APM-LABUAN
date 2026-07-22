// src/screens/operasi/reportStyles.js
import { StyleSheet } from 'react-native';
import { PALETTE } from '../../constants/palette';

export const reportStyles = StyleSheet.create({
  reportContainer: { flex: 1, paddingHorizontal: 16 },
  reportHeader: { marginBottom: 20, marginTop: 10 },
  reportTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, color: PALETTE.textDark },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: {
    flex: 1, padding: 16, borderRadius: 16,
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  statBoxTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statBoxValue: { fontSize: 28, fontWeight: '900', color: PALETTE.textDark },
  highlightCard: {
    padding: 20, borderRadius: 16, marginBottom: 20,
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  dropdownHeaderBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    backgroundColor: PALETTE.cardLight,
  },
  dropdownList: {
    marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    overflow: 'hidden', backgroundColor: PALETTE.cardLight,
  },
  dropdownItem: { padding: 16 },
  breakdownContainer: {
    padding: 20, borderRadius: 16, marginBottom: 20,
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  breakdownTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20, color: PALETTE.textDark },
  breakdownRow: { marginBottom: 16 },
  progressBarBg: { height: 8, backgroundColor: PALETTE.surface, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  crudContainer: {
    padding: 20, borderRadius: 16, marginBottom: 30,
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  crudHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PALETTE.orange, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, gap: 6,
  },
  addBtnText: { color: PALETTE.white, fontSize: 13, fontWeight: '700' },
  crudItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder,
  },
  actionBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: PALETTE.surface,
  },
});