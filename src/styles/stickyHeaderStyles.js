import { StyleSheet } from 'react-native';
import { PALETTE } from '../constants/palette';

export const stickyHeaderStyles = StyleSheet.create({
  stickyHeader: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: PALETTE.cardLight, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder,
    zIndex: 10, gap: 10, position: 'relative',
  },
  stickyHeaderCenter: {
    position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center',
  },
  stickyHeaderDikemaskini: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },
});