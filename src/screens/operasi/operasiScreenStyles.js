// src/screens/operasi/operasiScreenStyles.js
import { StyleSheet } from 'react-native';

export const operasiScreenStyles = StyleSheet.create({
  container: { position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 24, paddingBottom: 16 },
  toggleWrapper: { flexDirection: 'row', margin: 16, padding: 6, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, zIndex: 20 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  toggleBtnActive: { backgroundColor: '#3b82f6' },
  toggleText: { fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: '#fff' },
});
