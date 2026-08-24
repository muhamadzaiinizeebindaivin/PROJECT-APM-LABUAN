import { StyleSheet, Platform } from 'react-native';
import { PALETTE } from '../../constants/palette';

const blurFilter = (px) => Platform.select({ web: { filter: `blur(${px}px)` }, default: {} });

export const homeScreenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.softOrangeBg, position: 'relative', overflow: 'hidden' },

  spatialBackdrop: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 9999, ...blurFilter(90) },
  blobBlue: {
    width: 480, height: 480, top: -160, left: -140,
    backgroundColor: PALETTE.blue, opacity: 0.22,
  },
  blobOrange: {
    width: 420, height: 420, top: 260, right: -160,
    backgroundColor: PALETTE.orange, opacity: 0.25,
  },
  blobOrangeSmall: {
    width: 300, height: 300, bottom: -60, left: 60,
    backgroundColor: PALETTE.orangeDark, opacity: 0.16,
  },

  stickySaveBtn: {
    backgroundColor: PALETTE.orange,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  stickySaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scrollContent: { paddingTop: 12, paddingBottom: 16 },

  heroGradient: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#0b0c0e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 6,
  },

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