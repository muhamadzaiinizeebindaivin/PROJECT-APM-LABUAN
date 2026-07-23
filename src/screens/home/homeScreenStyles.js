import { StyleSheet } from 'react-native';
import { PALETTE } from '../../constants/palette';

export const homeScreenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.softOrangeBg },

  stickySaveBtn: {
    backgroundColor: PALETTE.orange,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  stickySaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scrollContent: { paddingTop: 12, paddingBottom: 16 },

  mainRow: {
    flexDirection: 'row',
    paddingLeft: 20,
    paddingRight: 20,
    gap: 0,
    marginBottom: 28,
    alignItems: 'stretch',
  },
  pdfColumn: { flex: 2 },
  sideColumn: { flex: 1, paddingLeft: 16 },

  footerInfo: {
    marginTop: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: { color: PALETTE.textMutedDark, fontSize: 11, fontWeight: '600' },
});