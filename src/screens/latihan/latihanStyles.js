// src/screens/latihan/latihanStyles.js
import { StyleSheet } from 'react-native';
import { PALETTE } from '../../constants/palette';

/**
 * Styles spécifiques au module Latihan.
 * Les éléments génériques (headers, modales, inputs, boutons)
 * viennent de sekretariat/sharedStyles.js.
 */
export const latihanStyles = StyleSheet.create({
  // Écran (aligné sur kewanganStyles.container/contentContainer)
  container: { flex: 1, backgroundColor: PALETTE.softOrangeBg },
  contentContainer: { padding: 20, paddingBottom: 40 },

  // Carte de section (aligné sur kewanganStyles.card)
  sectionCard: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },

  // Cartes stats du haut
  topRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 18, elevation: 2, minHeight: 110, justifyContent: 'space-between' },
  statCardDark: {
    flex: 1, padding: 16, borderRadius: 18, elevation: 2, minHeight: 110, justifyContent: 'space-between',
    backgroundColor: PALETTE.ink, overflow: 'hidden', position: 'relative',
  },
  darkDecorCircle: { position: 'absolute', top: -45, right: -25, width: 110, height: 110, borderRadius: 55, backgroundColor: PALETTE.orange, opacity: 0.25 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconBoxLight: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 8 },
  iconBoxDark: { backgroundColor: 'rgba(255,255,255,0.12)', padding: 6, borderRadius: 8 },
  cardLabelLight: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },
  cardValueLight: { color: '#fff', fontSize: 22, fontWeight: '900', marginVertical: 4 },
  cardSubLight: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },

  // Sous-titre + badge période
  sectionSub: { color: PALETTE.textMutedDark, fontSize: 11, marginTop: 2 },
  badgeBtn: { backgroundColor: 'rgba(249, 115, 22, 0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { color: PALETTE.orange, fontWeight: '700', fontSize: 11 },

  // Liste des latihan (aligné sur budgetItemRow)
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder, gap: 8 },
  dateCol: { width: 85 },
  dateText: { fontSize: 10, fontWeight: '700', color: PALETTE.textMutedDark },
  itemTitle: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark },
  itemSub: { fontSize: 12, color: PALETTE.textMutedDark },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  itemActionBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  // Graphique mensuel
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barWrapper: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barTrack: { height: 130, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barFill: { width: 12, borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 10, marginTop: 8, color: PALETTE.textMutedDark },
  tooltip: { position: 'absolute', top: -30, backgroundColor: PALETTE.textDark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 10, elevation: 5 },
  tooltipText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Donut + sasaran
  splitRow: { flexDirection: 'row', gap: 16 },
  donutContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 20, height: 100 },
  donutCenter: { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: PALETTE.cardLight, justifyContent: 'center', alignItems: 'center' },
  donutText: { fontSize: 20, fontWeight: '900', color: PALETTE.textDark },
  donutSub: { fontSize: 10, color: PALETTE.textMutedDark },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 },
  legendText: { fontSize: 10, color: PALETTE.textMutedDark },
  dot: { width: 8, height: 8, borderRadius: 4 },
  progressRow: { marginBottom: 16 },
  progressLabel: { fontSize: 11, fontWeight: '600', maxWidth: '80%', color: PALETTE.textMutedDark },
  progressPercent: { fontSize: 11, fontWeight: '800', color: PALETTE.textDark },
  progressTrack: { height: 6, backgroundColor: PALETTE.surface, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // Formulaire (éléments non couverts par sharedStyles)
  dateBtn: {
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', backgroundColor: '#fafafa',
  },
  dateBtnText: { color: PALETTE.textDark, fontSize: 13 },
  statusToggle: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },

  // Pecahan
  breakdownTitle: { flex: 1, fontSize: 13, color: PALETTE.textDark, fontWeight: '600' },
  breakdownPax: { fontSize: 14, color: PALETTE.blue, fontWeight: '800' },
  breakdownTotalRow: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder, flexDirection: 'row', justifyContent: 'space-between' },
  breakdownTotalLabel: { fontSize: 14, color: PALETTE.textMutedDark, fontWeight: '700' },
  breakdownTotalValue: { fontSize: 16, color: PALETTE.blue, fontWeight: '900' },
});