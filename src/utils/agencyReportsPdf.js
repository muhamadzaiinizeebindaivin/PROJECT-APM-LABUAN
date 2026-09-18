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
 * Export PDF pour "Rekod Kejadian" (Hotspot) — une ligne par kejadian,
 * avec tarikh, kawasan terjejas, jumlah KIR, jumlah mangsa, PPS.
 */
export async function generateKejadianPdf({ rows, categoryLabel, periodLabel }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { pageWidth, cursorY } = await addLogoAndHeader(doc, `Rekod Kejadian - ${categoryLabel}`, periodLabel);

  if (rows.length === 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100);
    doc.text('Tiada rekod kejadian untuk tempoh ini.', pageWidth / 2, cursorY + 10, { align: 'center' });
    doc.setTextColor(0);
  } else {
    const tableRows = rows.map((k, index) => [
      index + 1,
      k.tarikh || '-',
      k.jenis_bencana || '-',
      k.lokasi || '-',
      k.jumlah_kir ?? '-',
      k.jumlah_mangsa ?? '-',
      k.jumlah_rumah_terjejas ?? '-',
      k.pps || '-',
      k.status === 'resolved' ? 'Selesai' : 'Aktif',
      k.resolved_at ? new Date(k.resolved_at).toLocaleDateString('ms-MY') : '-',
    ]);

    const marginLeft = 14;
    const marginRight = 14;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginLeft, right: marginRight },
      head: [['#', 'Tarikh', 'Jenis Bencana', 'Kawasan Terjejas', 'Jumlah KIR', 'Jumlah Mangsa', 'Rumah Terjejas', 'PPS', 'Status', 'Tarikh Selesai']],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 6.5, cellPadding: 2, overflow: 'linebreak',
        lineColor: [30, 58, 138], lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold',
        lineColor: [30, 58, 138], lineWidth: 0.3,
      },
      bodyStyles: { lineColor: [180, 190, 210], lineWidth: 0.2 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 18 },
        2: { cellWidth: 22 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 16 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
        7: { cellWidth: 16 },
        8: { cellWidth: 20 },
      },
    });


  }

  const filename = `rekod-kejadian-${categoryLabel.replace(/\s+/g, '-').toLowerCase()}-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}

/**
 * Export PDF pour "Ringkasan Pemantauan" — une ligne par titik pemantauan,
 * avec tarikh, lokasi, jumlah rumah terjejas, PPS, agensi di lapangan, bacaan air.
 */
export async function generatePemantauanPdf({ rows, periodLabel }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { pageWidth, cursorY } = await addLogoAndHeader(doc, 'Ringkasan Pemantauan', periodLabel);

  if (rows.length === 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100);
    doc.text('Tiada rekod pemantauan untuk tempoh ini.', pageWidth / 2, cursorY + 10, { align: 'center' });
    doc.setTextColor(0);
  } else {
    const tableRows = rows.map((p, index) => [
      index + 1,
      new Date(p.created_at).toLocaleDateString('ms-MY'),
      p.lokasi || '-',
      p.jumlah_rumah_terjejas ?? 0,
      p.pps || '-',
      p.agensi_di_lapangan || '-',
      p.bacaan_air || '-',
      p.status === 'resolved' ? 'Selesai' : 'Aktif',
      p.resolved_at ? new Date(p.resolved_at).toLocaleDateString('ms-MY') : '-',
    ]);

    const marginLeft = 14;
    const marginRight = 14;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginLeft, right: marginRight },
      head: [['#', 'Tarikh', 'Lokasi', 'Jumlah Rumah', 'PPS', 'Agensi di Lapangan', 'Bacaan Air', 'Status', 'Tarikh Selesai']],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 6.5, cellPadding: 2, overflow: 'linebreak',
        lineColor: [30, 58, 138], lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold',
        lineColor: [30, 58, 138], lineWidth: 0.3,
      },
      bodyStyles: { lineColor: [180, 190, 210], lineWidth: 0.2 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 18 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 16 },
        4: { cellWidth: 18 },
        5: { cellWidth: 26 },
        6: { cellWidth: 18 },
        7: { cellWidth: 14 },
        8: { cellWidth: 20 },
      },
    });
  }

  const filename = `ringkasan-pemantauan-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}