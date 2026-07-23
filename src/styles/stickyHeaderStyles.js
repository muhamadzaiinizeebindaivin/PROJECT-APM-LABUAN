import { StyleSheet } from 'react-native';
import { PALETTE } from '../constants/palette';

export const stickyHeaderStyles = StyleSheet.create({
  stickyHeader: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: PALETTE.cardLight, borderBottomWidth: 3, borderBottomColor: '#fdba74',
    zIndex: 10, gap: 10, position: 'relative',
  },
  stickyHeaderCenter: {
    position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center',
  },
  stickyHeaderDikemaskiniBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.18)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  stickyHeaderDikemaskiniDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.orange,
  },
  stickyHeaderDikemaskini: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, letterSpacing: 0.2 },
});