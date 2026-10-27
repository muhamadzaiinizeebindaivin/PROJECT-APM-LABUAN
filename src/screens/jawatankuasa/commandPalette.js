// src/screens/jawatankuasa/commandPalette.js
//
// Couleurs du tableau de bord Jawatankuasa, reprises du thème du site (constants/palette.js).
import { PALETTE } from '../../constants/palette';

export const CMD = {
  bg: PALETTE.softOrangeBg,
  card: PALETTE.cardLight,
  cardBorder: PALETTE.cardLightBorder,
  cardSoft: PALETTE.orangeSoft,
  text: PALETTE.textDark,
  textMuted: PALETTE.textMutedDark,
  textFaint: PALETTE.slateSoft,
  green: PALETTE.success,
  blue: PALETTE.blue,
  orange: PALETTE.orange,
  red: PALETTE.danger,
  yellow: PALETTE.yellow,
  grey: PALETTE.slateSoft,
};

// Un agent est considéré "en ligne" seulement si sa position a été mise à jour récemment
// (un téléphone fermé sans arrêter le suivi reste sinon "Online" indéfiniment).
export const ONLINE_FRESHNESS_MS = 15 * 60 * 1000;

export const BULAN_PENDEK = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

// "5 jam lalu", "2 hari lalu", sinon la date
export const masaLalu = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'baru sahaja';
  if (diffMin < 60) return `${diffMin} minit lalu`;
  const diffJam = Math.floor(diffMin / 60);
  if (diffJam < 24) return `${diffJam} jam lalu`;
  const diffHari = Math.floor(diffJam / 24);
  if (diffHari < 30) return `${diffHari} hari lalu`;
  return d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
};
