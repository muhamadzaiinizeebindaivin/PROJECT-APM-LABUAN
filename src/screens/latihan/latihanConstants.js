// src/screens/latihan/latihanConstants.js
import { CheckCircle2, Clock, XCircle } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';

export const SASARAN_OPTIONS = ['STAF TETAP', 'ASPA', 'ORANG AWAM', 'ASTO', 'AGENSI', 'JABATAN', 'PELAJAR SEKOLAH'];

export const MONTHS_MS = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];

// "Akan Diadakan" garde un ambre sémantique volontairement hors PALETTE (comme "pantai")
const STATUS_META = {
  'Berjaya': { Icon: CheckCircle2, color: PALETTE.success, soft: PALETTE.successSoft },
  'Akan Diadakan': { Icon: Clock, color: '#b45309', soft: '#fef3c7' },
  'Tidak Berjaya': { Icon: XCircle, color: PALETTE.danger, soft: PALETTE.dangerSoft },
};
export const statusMeta = (status) => STATUS_META[status] || STATUS_META['Akan Diadakan'];

export const formatDisplayDate = (startStr, endStr) => {
  if (!startStr) return 'Tiada Tarikh';
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : start;
  if (start.getTime() === end.getTime() || !endStr) return `${start.getDate()} ${MONTHS_MS[start.getMonth()]} ${start.getFullYear()}`;
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) return `${start.getDate()} - ${end.getDate()} ${MONTHS_MS[start.getMonth()]} ${start.getFullYear()}`;
  if (start.getFullYear() === end.getFullYear()) return `${start.getDate()} ${MONTHS_MS[start.getMonth()]} - ${end.getDate()} ${MONTHS_MS[end.getMonth()]} ${start.getFullYear()}`;
  return `${start.getDate()} ${MONTHS_MS[start.getMonth()]} ${start.getFullYear()} - ${end.getDate()} ${MONTHS_MS[end.getMonth()]} ${end.getFullYear()}`;
};