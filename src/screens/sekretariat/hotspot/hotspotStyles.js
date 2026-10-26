// src/screens/sekretariat/hotspot/hotspotStyles.js
import { StyleSheet } from 'react-native';
import { PALETTE } from '../../../constants/palette';

export const hotspotStyles = StyleSheet.create({
  // Onglets
  pillsScroll: { marginBottom: 10 },
  pillsContent: { gap: 10, paddingBottom: 10, paddingHorizontal: 2 },
  pill: {
    width: 160, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10,
    borderRadius: 12, backgroundColor: PALETTE.cardLight, borderWidth: 1, gap: 4,
  },
  pillLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  pillCount: { fontSize: 11, fontWeight: '600' },
  pillAdd: {
    width: 120, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: PALETTE.orange, gap: 4,
  },
  pillAddText: { fontSize: 12, fontWeight: '700', color: PALETTE.orange, textAlign: 'center' },

  // Sous-onglets
  subTabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  subTabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    flexShrink: 0,
  },
  subTabText: { fontSize: 12, fontWeight: '700' },

  // Export PDF (Rekod)
  pdfExportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: 8,
    borderWidth: 1, borderColor: PALETTE.orange, backgroundColor: PALETTE.orange + '10',
  },
  pdfExportBtnText: { fontSize: 13, fontWeight: '700', color: PALETTE.orange },

  // Upload photo kejadian
  photoUploadEmpty: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: PALETTE.orange, borderRadius: 12,
    paddingVertical: 30, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 15,
  },
  photoUploadEmptyText: { fontSize: 13, fontWeight: '700', color: PALETTE.orange },
  photoReplaceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: PALETTE.orange,
  },
  photoReplaceBtnText: { fontSize: 12, fontWeight: '700', color: PALETTE.orange },
  photoEmptyReadOnly: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: PALETTE.cardLightBorder, borderRadius: 12,
    paddingVertical: 26, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 15,
    backgroundColor: PALETTE.cardLight,
  },
  photoEmptyReadOnlyText: { fontSize: 13, fontWeight: '600', color: PALETTE.textMutedDark, textAlign: 'center' },
  dateInputBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: PALETTE.white,
  },
  dateInputBtnText: { fontSize: 14, color: PALETTE.textDark },

  // Bandeau catégorie
  catBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12,
  },
  catBannerText: { flex: 1, fontSize: 13, fontWeight: '700' },
  catBannerCount: { fontSize: 12, fontWeight: '800' },
  catDeleteBtn: { marginLeft: 6, padding: 4 },

  // Cartes d'items
  hotspotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.cardLight, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: PALETTE.cardLightBorder, gap: 12 },
  hotspotBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, width: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  hotspotBadgeText: { fontSize: 10, fontWeight: '800' },
  hotspotRiver: { fontSize: 11, color: PALETTE.textMutedDark, fontWeight: '700', textTransform: 'uppercase' },
  hotspotArea: { fontSize: 14, color: PALETTE.textDark, fontWeight: '600' },
  itemActions: { flexDirection: 'row', gap: 6 },
  addBtnBeforeList: { alignSelf: 'flex-end', marginBottom: 8 },
  itemActionBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  // Carte (Rajah)
  mapCard: { backgroundColor: PALETTE.cardLight, borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: PALETTE.cardLightBorder, padding: 10, alignItems: 'center' },
  mapImage: { width: '100%', borderRadius: 8, backgroundColor: PALETTE.surface },
  mapCaption: { fontSize: 12, color: PALETTE.textMutedDark, marginTop: 8, fontWeight: '600' },
  mapZoomHint: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  mapZoomHintText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  mapFullscreenOverlay: { flex: 1, backgroundColor: 'rgba(11, 12, 14, 0.95)', justifyContent: 'center', alignItems: 'center' },
  mapFullscreenClose: {
    position: 'absolute', top: 40, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  mapFullscreenImage: { width: '100%', height: '90%' },

  // Modale catégorie
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  iconCell: {
    width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, backgroundColor: PALETTE.cardLight,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  colorSwatch: { width: 34, height: 34, borderRadius: 17 },
  colorSwatchSelected: { borderWidth: 3, borderColor: PALETTE.textDark },
  prefixRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  prefixPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
    borderColor: PALETTE.cardLightBorder, backgroundColor: PALETTE.cardLight,
  },
  prefixPillSelected: { backgroundColor: PALETTE.orange + '18', borderColor: PALETTE.orange },
  prefixPillText: { fontSize: 13, fontWeight: '700', color: PALETTE.textMutedDark },
  prefixPillTextSelected: { color: PALETTE.orange },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: {
    width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
  },
  confirmBanner: { backgroundColor: '#0c0c0e', padding: 24, alignItems: 'center' },
  confirmIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  confirmTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  confirmSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: 10, padding: 20, backgroundColor: '#fff' },
  confirmCancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmCancelText: { color: '#64748b', fontWeight: '800', fontSize: 14 },
  confirmConfirmBtn: {
    flex: 1, height: 48, borderRadius: 12, backgroundColor: '#ef4444',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Modale butiran hotspot
  detailCatChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', backgroundColor: PALETTE.surface,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16,
  },
  detailCatDot: { width: 8, height: 8, borderRadius: 4 },
  detailCatChipText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  detailRefChipText: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, marginLeft: 4 },
  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder,
  },
  detailIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: PALETTE.orange + '15',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  detailLabel: { fontSize: 11, fontWeight: '700', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '600', color: PALETTE.textDark },
  coordRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  coordBox: {
    flex: 1, backgroundColor: PALETTE.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
});
