// src/utils/agencyReportsPdf.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_URL, formatDurationForPdf, fetchImageAsBase64, getImageNaturalSize } from './patrolHistoryPdf';

async function addLogoAndHeader(doc, title, periodLabel) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 14;

  try {
    const logoBase64 = await fetchImageAsBase64(LOGO_URL);
    const { width: naturalW, height: naturalH } = await getImageNaturalSize(logoBase64);
    const logoHeightMm = 22;
    const logoWidthMm = (naturalW / naturalH) * logoHeightMm;
    const logoX = (pageWidth - logoWidthMm) / 2;
    doc.addImage(logoBase64, 'PNG', logoX, cursorY, logoWidthMm, logoHeightMm);
    cursorY += logoHeightMm + 6;
  } catch (e) {
    console.warn('Gagal memuatkan logo untuk PDF:', e);
  }

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(title, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 6;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Sekretariat JPBD W.P. Labuan', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;
  doc.text(`Tempoh: ${periodLabel}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;
  doc.text(`Dijana pada: ${new Date().toLocaleString('ms-MY')}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 8;

  return { pageWidth, cursorY };
}

/**
 * Export PDF pour "Sejarah Patrol Agensi" — une ligne par patrouille
 * d'agence, avec agence, membre, durée, distance, date/heure.
 */
export async function generateAgencyHistoryPdf({ rows, periodLabel }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { pageWidth, cursorY } = await addLogoAndHeader(doc, 'Sejarah Patrol Agensi', periodLabel);

  if (rows.length === 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100);
    doc.text('Tiada rekod sejarah untuk tempoh ini.', pageWidth / 2, cursorY + 10, { align: 'center' });
    doc.setTextColor(0);
  } else {
    const tableRows = rows.map((h, index) => [
      index + 1,
      h.jpbd_directory?.agency || '-',
      h.member_name || '-',
      formatDurationForPdf(h.duration_seconds),
      `${(h.distance_km || 0).toFixed(2)} km`,
      new Date(h.ended_at).toLocaleDateString('ms-MY'),
      new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [['#', 'Agensi', 'Ahli', 'Tempoh', 'Jarak', 'Tarikh', 'Masa']],
      body: tableRows,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  const filename = `sejarah-patrol-agensi-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}

/**
 * Export PDF pour "Ringkasan Bencana" — une ligne par bencana, avec
 * nom, date de début, date de fin (ou "-" si toujours actif).
 */
export async function generateBencanaHistoryPdf({ rows, periodLabel }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { pageWidth, cursorY } = await addLogoAndHeader(doc, 'Ringkasan Bencana', periodLabel);

  if (rows.length === 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100);
    doc.text('Tiada rekod bencana untuk tempoh ini.', pageWidth / 2, cursorY + 10, { align: 'center' });
    doc.setTextColor(0);
  } else {
    const tableRows = rows.map((b, index) => [
      index + 1,
      b.category,
      new Date(b.created_at).toLocaleDateString('ms-MY'),
      b.resolved_at ? new Date(b.resolved_at).toLocaleDateString('ms-MY') : 'Bencana Belum Selesai',
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [['#', 'Nama Bencana', 'Tarikh Mula', 'Tarikh Tamat']],
      body: tableRows,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  const filename = `ringkasan-bencana-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}