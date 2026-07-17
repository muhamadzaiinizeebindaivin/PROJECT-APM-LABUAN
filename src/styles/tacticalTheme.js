// src/styles/tacticalTheme.js
import { StyleSheet } from 'react-native';

export const TACTICAL_THEME = {
  background: '#0F1113',
  card: '#1A1C1F',
  cardAlt: '#24272B',
  accent: '#F4762B',
  accentDark: '#D8591F',
  accent2: '#FF9A57',
  text: '#F7F7F5',
  textSecondary: '#9BA0A6',
  textMuted: '#63666B',
  border: '#2B2E32',
  success: '#1D4E89',
  danger: '#D62828',
  warning: '#FFB454',
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const RADIUS = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };

export const FONTS = {
  display: 'Rajdhani_600SemiBold',
  displayBold: 'Rajdhani_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
};

export const GRADIENTS = {
  accent: ['#FF9A57', '#F4762B', '#D8591F'],
  accentSubtle: ['#F4762B30', '#F4762B00'],
  darkGlass: ['#24272B', '#1A1C1F'],
  hero: ['#242629', '#1A1C1F', '#0F1113'],
  success: ['#2E6DB4', '#1D4E89'],
  danger: ['#E85B5B', '#D62828'],
};

const T = TACTICAL_THEME;

export const tacticalStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.background },
  card: {
    backgroundColor: T.card, borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: T.border,
  },
  sectionTitle: {
    color: T.text, fontSize: 14, fontFamily: FONTS.display,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  sectionEyebrow: {
    color: T.accent, fontSize: 10.5, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2,
  },
  input: {
    backgroundColor: T.cardAlt, borderWidth: 1, borderColor: T.border,
    borderRadius: RADIUS.sm, padding: 12, color: T.text, fontSize: 14,
  },
  tableWrap: { borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: T.border },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: T.cardAlt },
  tableHeaderCell: {
    flex: 1, padding: 13, fontSize: 10, fontWeight: '800',
    color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: T.border },
  tableCell: { flex: 1, padding: 13, color: T.textSecondary, fontSize: 13 },
});