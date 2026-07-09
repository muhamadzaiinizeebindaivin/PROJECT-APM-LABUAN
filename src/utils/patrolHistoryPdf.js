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
export async function generatePatrolHistoryPdf({ rows, periodLabel, calamityBreakdown, waypointsByPatrol = {} }) {
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

  if (rows.length === 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100);
    doc.text('Tiada rekod sejarah untuk tempoh ini.', pageWidth / 2, cursorY + 10, { align: 'center' });
    doc.setTextColor(0);
  } else {
    const MAIN_HEAD = ['#', 'No. Plat', 'Model', 'Tempoh', 'Jumlah Jarak', 'Tarikh', 'Masa'];
    const pageHeight = doc.internal.pageSize.getHeight();

    let mainBuffer = [];
    let isFirstMainTable = true;
    let tableY = cursorY;

    const flushMainBuffer = () => {
      if (mainBuffer.length === 0) return;
      autoTable(doc, {
        startY: tableY,
        head: isFirstMainTable ? [MAIN_HEAD] : undefined,
        body: mainBuffer,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      tableY = doc.lastAutoTable.finalY;
      isFirstMainTable = false;
      mainBuffer = [];
    };

    rows.forEach((h, index) => {
      const waypoints = waypointsByPatrol[h.id] || [];

      if (waypoints.length === 0) {
        mainBuffer.push([
          index + 1,
          h.vehicle_reg || '-',
          h.vehicle_model || '-',
          formatDurationForPdf(h.duration_seconds),
          `${(h.distance_km || 0).toFixed(2)} km`,
          new Date(h.ended_at).toLocaleDateString('ms-MY'),
          new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
        ]);
        return;
      }

      // Termine le tableau principal jusqu'à la patrouille précédente,
      // pour isoler celle-ci (qui a des points) dans son propre mini-tableau.
      flushMainBuffer();

      if (tableY > pageHeight - 60) {
        doc.addPage('a4', 'portrait');
        tableY = 16;
        isFirstMainTable = false; // évite de réafficher l'en-tête principal après un saut de page ici
      }

      const frameTop = tableY;

      autoTable(doc, {
        startY: tableY,
        head: isFirstMainTable ? [MAIN_HEAD] : undefined,
        body: [[
          index + 1,
          h.vehicle_reg || '-',
          h.vehicle_model || '-',
          formatDurationForPdf(h.duration_seconds),
          `${(h.distance_km || 0).toFixed(2)} km`,
          new Date(h.ended_at).toLocaleDateString('ms-MY'),
          new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
        ]],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      });
      isFirstMainTable = false;
      tableY = doc.lastAutoTable.finalY;

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text(`Titik Patrol — ${h.vehicle_reg || '-'} (#${index + 1})`, 20, tableY + 6);
      doc.setTextColor(0);
      tableY += 8;

      const segBody = waypoints.map((wp, wpIndex) => [
        wpIndex === 0 ? 'Pangkalan' : `Titik ${wpIndex}`,
        `Titik ${wpIndex + 1}`,
        formatDurationForPdf(wp.duration_from_previous_seconds),
        `${wp.distance_from_previous_km.toFixed(2)} km`,
        new Date(wp.marked_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
      ]);

      const subTableSideMargin = 20; // même marge que le cadre, de chaque côté

      autoTable(doc, {
        startY: tableY,
        head: [['Dari', 'Ke', 'Tempoh', 'Jarak', 'Masa']],
        body: segBody,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [148, 163, 184], textColor: 255, fontStyle: 'bold' },
        margin: { left: subTableSideMargin, right: subTableSideMargin },
      });

      const frameBottom = doc.lastAutoTable.finalY;

      // Cadre englobant la ligne de patrouille + son sous-tableau de points
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.4);
      doc.rect(14, frameTop, pageWidth - 28, frameBottom - frameTop);

      tableY = frameBottom + 6;
    });

    flushMainBuffer();

    // --- Ringkasan mengikut kenderaan (agrégation par véhicule) ---
    const vehicleRecapMap = {};
    rows.forEach(h => {
      const key = h.vehicle_reg || h.vehicle_model || 'N/A';
      if (!vehicleRecapMap[key]) {
        vehicleRecapMap[key] = {
          reg: h.vehicle_reg || '-',
          model: h.vehicle_model || '-',
          count: 0,
          totalSeconds: 0,
          totalDistance: 0,
        };
      }
      vehicleRecapMap[key].count += 1;
      vehicleRecapMap[key].totalSeconds += h.duration_seconds || 0;
      vehicleRecapMap[key].totalDistance += h.distance_km || 0;
    });
    const vehicleRecapRows = Object.values(vehicleRecapMap).sort((a, b) => b.count - a.count);

    doc.addPage('a4', 'portrait');
    let recapY = 16;

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Ringkasan Mengikut Kenderaan', pageWidth / 2, recapY, { align: 'center' });
    recapY += 8;

    const recapBody = vehicleRecapRows.map(v => [
      v.reg,
      v.model,
      v.count,
      formatDurationForPdf(v.totalSeconds),
      `${v.totalDistance.toFixed(2)} km`,
    ]);

    autoTable(doc, {
      startY: recapY,
      head: [['No. Plat', 'Model', 'Bilangan Patrol', 'Jumlah Tempoh', 'Jumlah Jarak']],
      body: recapBody,
      styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' } },
    });
  }

  if (calamityBreakdown) {
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

    if (calamityBreakdown.rows.length === 0) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(100);
      doc.text('Tiada data kecemasan untuk tempoh ini.', landscapeWidth / 2, 30, { align: 'center' });
      doc.setTextColor(0);
    } else {
      const catKeys = calamityBreakdown.categories.map(c => c.key);
      const cumulativeRowIndex = calamityBreakdown.rows.findIndex(r => r.isCumulative);
      const head = [['Bulan', ...catKeys, 'Jumlah']];
      const body = calamityBreakdown.rows.map(r => [r.month, ...catKeys.map(k => r.counts[k]), r.total]);

      autoTable(doc, {
        startY: 22,
        head,
        body,
        styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index === cumulativeRowIndex) {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
    }
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
  const visibleRows = rows;

  if (visibleRows.length === 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100);
    doc.text('Tiada data kecemasan untuk tempoh ini.', pageWidth / 2, cursorY + 10, { align: 'center' });
    doc.setTextColor(0);
  } else {
    const cumulativeRowIndex = visibleRows.findIndex(r => r.isCumulative);
    const head = [['Bulan', ...catKeys, 'Jumlah']];
    const body = visibleRows.map(r => [r.month, ...catKeys.map(k => r.counts[k]), r.total]);

    autoTable(doc, {
      startY: cursorY,
      head,
      body,
      styles: { fontSize: 8, cellPadding: 2.5, halign: 'center' },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === cumulativeRowIndex) {
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }

  const filename = `ringkasan-kecemasan-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}