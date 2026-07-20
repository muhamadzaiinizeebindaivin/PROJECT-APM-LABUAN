import { StyleSheet } from 'react-native';
import { PALETTE } from '../../constants/palette';

export const homeScreenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.softOrangeBg },

  stickyHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PALETTE.white,
    borderBottomWidth: 2,
    borderBottomColor: PALETTE.orange,
    zIndex: 10,
    elevation: 4,
    shadowColor: PALETTE.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    gap: 10,
    position: 'relative',
  },
  stickyHeaderCenter: {
    position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center',
  },
  stickyHeaderDikemaskini: { fontSize: 13, fontWeight: '700', color: PALETTE.slateSoft },
  stickySaveBtn: {
    backgroundColor: PALETTE.orange,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  stickySaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scrollContent: { paddingTop: 12, paddingBottom: 60 },

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
    paddingBottom: 40,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: { color: PALETTE.textMutedDark, fontSize: 11, fontWeight: '600' },
});