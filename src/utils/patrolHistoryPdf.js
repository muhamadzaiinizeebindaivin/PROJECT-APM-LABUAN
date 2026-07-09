// src/utils/patrolHistoryPdf.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LOGO_URL = 'https://kceeewyadcskivtmilyf.supabase.co/storage/v1/object/public/public-assets/apmlogo.png';

function formatDurationForPdf(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getImageNaturalSize(base64) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = base64;
  });
}

/**
 * Generates and downloads a PDF report of the (already filtered) patrol
 * history rows currently shown on screen — the full filtered set, not
 * just the current pagination page.
 */
export async function generatePatrolHistoryPdf({ rows, periodLabel, calamityBreakdown }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 14;

  // Logo (best-effort: if it fails to load, continue without blocking the export)
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
  doc.text('Sejarah Patrol Kenderaan', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 6;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('APM W.P. Labuan', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;
  doc.text(`Tempoh: ${periodLabel}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;
  doc.text(`Dijana pada: ${new Date().toLocaleString('ms-MY')}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 8;

  const tableRows = rows.map((h, index) => [
    index + 1,
    h.vehicle_reg || '-',
    h.vehicle_model || '-',
    formatDurationForPdf(h.duration_seconds),
    `${(h.distance_km || 0).toFixed(2)} km`,
    new Date(h.ended_at).toLocaleDateString('ms-MY'),
    new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['#', 'No. Plat', 'Model', 'Tempoh', 'Jarak', 'Tarikh', 'Masa']],
    body: tableRows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  if (calamityBreakdown && calamityBreakdown.rows.length > 0) {
    doc.addPage([297, 210]);
    const landscapeWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(
      `Perincian Keseluruhan Kes Kecemasan ${calamityBreakdown.year}`,
      landscapeWidth / 2,
      16,
      { align: 'center' }
    );

    const catKeys = calamityBreakdown.categories.map(c => c.key);
    const nonEmptyRows = calamityBreakdown.rows.filter(r => r.total > 0);
    const head = [['Bulan', ...catKeys, 'Jumlah']];
    const body = nonEmptyRows.map(r => [r.month, ...catKeys.map(k => r.counts[k]), r.total]);

    autoTable(doc, {
      startY: 22,
      head,
      body,
      styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  const filename = `sejarah-patrol-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}

/**
 * Standalone export for the "Ringkasan Kecemasan" panel — month × category
 * pivot table only, independent from the patrol history report above.
 */
export async function generateCalamitySummaryPdf({ rows, categories, periodLabel }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 14;

  try {
    const logoBase64 = await fetchImageAsBase64(LOGO_URL);
    const { width: naturalW, height: naturalH } = await getImageNaturalSize(logoBase64);
    const logoHeightMm = 18;
    const logoWidthMm = (naturalW / naturalH) * logoHeightMm;
    const logoX = (pageWidth - logoWidthMm) / 2;
    doc.addImage(logoBase64, 'PNG', logoX, cursorY, logoWidthMm, logoHeightMm);
    cursorY += logoHeightMm + 5;
  } catch (e) {
    console.warn('Gagal memuatkan logo untuk PDF:', e);
  }

  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text('Ringkasan Kecemasan', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 6;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('APM W.P. Labuan', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;
  doc.text(`Tempoh: ${periodLabel}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;
  doc.text(`Dijana pada: ${new Date().toLocaleString('ms-MY')}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 8;

  const catKeys = categories.map(c => c.key);
  const nonEmptyRows = rows.filter(r => r.total > 0);
  const head = [['Bulan', ...catKeys, 'Jumlah']];
  const body = nonEmptyRows.map(r => [r.month, ...catKeys.map(k => r.counts[k]), r.total]);

  autoTable(doc, {
    startY: cursorY,
    head,
    body,
    styles: { fontSize: 8, cellPadding: 2.5, halign: 'center' },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const filename = `ringkasan-kecemasan-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}