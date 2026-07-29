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
    flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0,
  },
  stickyHeaderDikemaskiniBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.18)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  stickyHeaderDikemaskiniDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.orange,
  },
  stickyHeaderDikemaskini: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, letterSpacing: 0.2, flexShrink: 1 },
});