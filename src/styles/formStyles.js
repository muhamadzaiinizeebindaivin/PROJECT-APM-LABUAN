// src/styles/formStyles.js
import { StyleSheet } from 'react-native';

// These were previously defined inline in OperasiScreen's StyleSheet and
// reused (identically) across the NG999 CRUD modal, the calamity modal,
// and the category/month dropdown fields. Values are unchanged.
export const formStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 500, borderRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  inputGroup: { marginBottom: 16, position: 'relative' },
  inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputField: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 14 },
  modalDropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1 },
  modalDropdownList: { position: 'absolute', top: 75, left: 0, right: 0, borderRadius: 10, borderWidth: 1, elevation: 5, zIndex: 100 },
  modalDropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  saveBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
