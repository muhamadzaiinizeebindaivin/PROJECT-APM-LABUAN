import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CALAMITY_CATEGORIES } from '../constants/operasiConstants';
import { BULAN_MS } from '../constants/bulan';
import { fetchImageAsBase64, getImageNaturalSize } from './patrolHistoryPdf';

const ASSETS_BASE = 'https://kceeewyadcskivtmilyf.supabase.co/storage/v1/object/public/logo';

const CATEGORY_LABELS = {
  KJR: 'KES KEMALANGAN JALAN RAYA',
  KMU: 'KES MENANGKAP ULAR',
  MSS: 'MEMUSNAH SARANG SERANGGA',
  KBD: 'KES BUNUH DIRI',
  KK:  'KHIDMAT KHAS',
  MT:  'MANGSA TERPERANGKAP',
  ML:  'MANGSA LEMAS',
  MHL: 'MENANGKAP HAIWAN LIAR',
  MHP: 'MENANGKAP HAIWAN PELIHARAAN',
  LLK: 'LAIN-LAIN KES',
  KB:  'KES BERGADUH',
  SKT: 'SAKIT (MEDIKAL/TRAUMA)',
  KTK: 'KEMALANGAN TEMPAT KERJA',
  PT:  'POKOK TUMBANG',
  KBR: 'KES KEBAKARAN',
};

const GRID_ORDER = [
  'KJR', 'KMU', 'MSS', 'ML', 'KB',
  'MT', 'KBR', 'KBD', 'SKT', 'MHL',
  'MHP', 'PT', 'LLK', 'KTK', 'KK',
];

const TABLE_COLUMN_ORDER = ['KJR', 'SKT', 'MSS', 'KTK', 'KBD', 'KBR', 'MT', 'ML', 'KMU', 'LLK', 'KK', 'KB', 'MHP', 'MHL', 'PT'];

const PETUNJUK_COLUMNS = [
  ['KJR', 'KMU', 'MSS', 'KBD', 'KK'],
  ['SKT', 'KTK', 'PT', 'KBR', 'ML'],
  ['LLK', 'KB', 'MHL', 'MHP', 'MT'],
];

async function safeLoadImage(filename) {
  try {
    const base64 = await fetchImageAsBase64(`${ASSETS_BASE}/${filename}`);
    const { width, height } = await getImageNaturalSize(base64);
    return { base64, width, height };
  } catch (e) {
    console.warn(`Gagal memuatkan ${filename}:`, e);
    return null;
  }
}

export async function generateLaporanKecemasamPdf({ historiqueGrid }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const bulanLabel = BULAN_MS[currentMonth].toUpperCase();

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const MARGIN = 8;
  const CONTENT_W = W - MARGIN * 2;
  let y = 0;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  // ═══════════════════════════════════════════════════════════════
  // HEADER — logos
  // ═══════════════════════════════════════════════════════════════
  const [madani, jata, apm, apmLabuan] = await Promise.all([
    safeLoadImage('madani.png'),
    safeLoadImage('jata.png'),
    safeLoadImage('apm.png'),
    safeLoadImage('apm_labuan.png'),
  ]);

  const logoH = 13;
  const logoGap = 6;
  let lx = MARGIN;
  const ly = 6;
  [madani, jata, apm, apmLabuan].filter(Boolean).forEach(logo => {
    const lw = (logo.width / logo.height) * logoH;
    doc.addImage(logo.base64, 'PNG', lx, ly, lw, logoH);
    lx += lw + logoGap;
  });

  y = ly + logoH + 4;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, W - MARGIN, y);
  y += 6;

  // ═══════════════════════════════════════════════════════════════
  // STAMP "BULAN ..." + TITRE
  // ═══════════════════════════════════════════════════════════════
  const stampW = 60;
  const stampH = 20;

  doc.setDrawColor(190, 40, 40);
  doc.setLineWidth(0.6);
  doc.setLineDashPattern([1.5, 1.2], 0);
  doc.roundedRect(MARGIN, y, stampW, stampH, 1.5, 1.5);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(190, 40, 40);
  doc.text(`BULAN ${bulanLabel}`, MARGIN + stampW / 2, y + 8, { align: 'center' });
  doc.setFontSize(10);
  doc.text(String(currentYear), MARGIN + stampW / 2, y + 13.5, { align: 'center' });

  doc.setFontSize(5.8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(90, 90, 90);
  const dateStr = now.toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
  doc.text(`DIKEMASKINI PADA : ${dateStr}`, MARGIN + stampW / 2, y + 17.5, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(20, 30, 60);
  doc.text('LAPORAN KES KECEMASAN MERS 999', W - MARGIN, y + 6, { align: 'right' });

  doc.setFontSize(21);
  doc.setTextColor(20, 40, 90);
  doc.text(`W.P LABUAN ${currentYear}`, W - MARGIN, y + 16, { align: 'right' });

  y += stampH + 6;

  // ═══════════════════════════════════════════════════════════════
  // CALCUL DES TOTAUX DU MOIS COURANT
  // ═══════════════════════════════════════════════════════════════
  const allKeys = CALAMITY_CATEGORIES.map(c => c.key);
  const monthTotals = {};
  const currentMonthGrid = historiqueGrid[currentMonth + 1] || {};
  allKeys.forEach(k => { monthTotals[k] = currentMonthGrid[k] || 0; });

  const iconEntries = await Promise.all(
    GRID_ORDER.map(async key => [key, await safeLoadImage(`${key}.png`)])
  );
  const icons = Object.fromEntries(iconEntries);

  // ═══════════════════════════════════════════════════════════════
  // GRILLE D'ICÔNES — 5 colonnes × 3 lignes, mise en page fixe et symétrique
  // ═══════════════════════════════════════════════════════════════
  const gridCols = 5;
  const gridRows = 3;
  const cellGap = 2;
  const cellW = (CONTENT_W - cellGap * (gridCols - 1)) / gridCols;
  const cellH = 27;
  const gridTop = y;

  GRID_ORDER.forEach((key, idx) => {
    const col = idx % gridCols;
    const row_ = Math.floor(idx / gridCols);
    const cx = MARGIN + col * (cellW + cellGap);
    const cy = gridTop + row_ * (cellH + cellGap);

    // Carte de fond
    doc.setFillColor(249, 249, 250);
    doc.setDrawColor(224, 224, 228);
    doc.setLineWidth(0.25);
    doc.roundedRect(cx, cy, cellW, cellH, 1.5, 1.5, 'FD');

    // Zone haute : icône (gauche) + chiffre (droite), alignés sur le même axe vertical
    const iconAreaH = 15;
    const iconAreaY = cy + 3;
    const icon = icons[key];

    if (icon) {
      const iconSize = 13;
      const iw = (icon.width / icon.height) * iconSize;
      const iconX = cx + 4;
      const iconY = iconAreaY + (iconAreaH - iconSize) / 2;
      doc.addImage(icon.base64, 'PNG', iconX, iconY, iw, iconSize);

      doc.setFontSize(17);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(224, 100, 20);
      doc.text(String(monthTotals[key] ?? 0), cx + cellW - 4, iconAreaY + iconAreaH / 2 + 3, { align: 'right' });
    } else {
      doc.setFontSize(17);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(224, 100, 20);
      doc.text(String(monthTotals[key] ?? 0), cx + cellW / 2, iconAreaY + iconAreaH / 2 + 3, { align: 'center' });
    }

    // Séparateur fin entre icône et label
    doc.setDrawColor(230, 230, 234);
    doc.setLineWidth(0.2);
    doc.line(cx + 3, cy + iconAreaH + 3, cx + cellW - 3, cy + iconAreaH + 3);

    // Label — toujours 2 lignes réservées, centré
    doc.setFontSize(5.3);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 40, 45);
    const label = CATEGORY_LABELS[key] || key;
    const lines = doc.splitTextToSize(label, cellW - 5).slice(0, 2);
    const labelStartY = cy + iconAreaH + 7;
    lines.forEach((line, li) => {
      doc.text(line, cx + cellW / 2, labelStartY + li * 3.3, { align: 'center' });
    });
  });

  y = gridTop + gridRows * cellH + (gridRows - 1) * cellGap + 4;

  // ═══════════════════════════════════════════════════════════════
  // SECTION PETUNJUK
  // ═══════════════════════════════════════════════════════════════
  const sectionHeaderH = 6.5;

  doc.setFillColor(30, 42, 74);
  doc.rect(MARGIN, y, CONTENT_W, sectionHeaderH, 'F');
  doc.setFontSize(8.5);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PETUNJUK', W / 2, y + sectionHeaderH / 2 + 1.2, { align: 'center' });
  y += sectionHeaderH;

  const petunjukCols = 3;
  const colGap = 0;
  const colW = CONTENT_W / petunjukCols;
  const rowH = 9;
  const keyColW = 15;

  for (let ci = 0; ci < petunjukCols; ci++) {
    const keys = PETUNJUK_COLUMNS[ci];
    keys.forEach((key, ri) => {
      const px = MARGIN + ci * colW;
      const py = y + ri * rowH;
      const isAlt = ri % 2 === 1;

      doc.setFillColor(226, 230, 238);
      doc.setDrawColor(200, 206, 218);
      doc.setLineWidth(0.2);
      doc.rect(px, py, keyColW, rowH, 'FD');
      doc.setFontSize(7.5);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(20, 30, 60);
      doc.text(key, px + keyColW / 2, py + rowH / 2 + 1.1, { align: 'center' });

      doc.setFillColor(isAlt ? 250 : 246, isAlt ? 230 : 224, isAlt ? 200 : 190);
      doc.rect(px + keyColW, py, colW - keyColW, rowH, 'FD');
      doc.setFontSize(6);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(CATEGORY_LABELS[key] || key, px + keyColW + (colW - keyColW) / 2, py + rowH / 2 + 1, { align: 'center' });
    });
  }

  y += 5 * rowH + 3;

  // ═══════════════════════════════════════════════════════════════
  // TITRE TABLEAU
  // ═══════════════════════════════════════════════════════════════
  doc.setFillColor(30, 42, 74);
  doc.rect(MARGIN, y, CONTENT_W, sectionHeaderH, 'F');
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    `PERINCIAN KESELURUHAN KES KECEMASAN MERS 999 BAGI BULAN ${bulanLabel} ${currentYear}`,
    W / 2, y + sectionHeaderH / 2 + 1.2, { align: 'center' }
  );
  y += sectionHeaderH + 1;

  // ═══════════════════════════════════════════════════════════════
  // TABLEAU PRINCIPAL
  // ═══════════════════════════════════════════════════════════════
  const monthlyData = BULAN_MS.map((label, mIdx) => {
    const counts = {};
    let total = 0;
    const monthGrid = historiqueGrid[mIdx + 1] || {};
    allKeys.forEach(k => {
      const val = monthGrid[k] || 0;
      counts[k] = val;
      total += val;
    });
    return { label: label.toUpperCase(), counts, total };
  });

  const cumCounts = {};
  allKeys.forEach(k => { cumCounts[k] = 0; });
  let cumTotal = 0;
  monthlyData.forEach(m => {
    allKeys.forEach(k => { cumCounts[k] += m.counts[k]; });
    cumTotal += m.total;
  });

  const tableHead = [['BULAN', ...TABLE_COLUMN_ORDER, 'JUMLAH\nKES']];
  const tableBody = [
    ...monthlyData.map(m => [
      m.label,
      ...TABLE_COLUMN_ORDER.map(k => m.counts[k] > 0 ? m.counts[k] : '0'),
      m.total,
    ]),
    [
      'KUMULATIF\nKES',
      ...TABLE_COLUMN_ORDER.map(k => cumCounts[k]),
      cumTotal,
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    styles: {
      fontSize: 6.2, cellPadding: 1.6, halign: 'center', valign: 'middle',
      lineColor: [205, 213, 227], lineWidth: 0.15,
    },
    headStyles: { fillColor: [41, 98, 168], textColor: 255, fontStyle: 'bold', fontSize: 6.3 },
    alternateRowStyles: { fillColor: [228, 238, 250] },
    bodyStyles: { fillColor: [255, 255, 255] },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 19 } },
    margin: { left: MARGIN, right: MARGIN },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 12) {
        data.cell.styles.fillColor = [250, 202, 62];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════
  const footerH = 8;
  const footerY = H - footerH;
  doc.setFillColor(20, 30, 60);
  doc.rect(0, footerY, W, footerH, 'F');
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    'BAHAGIAN PENGURUSAN BENCANA DAN OPERASI // ANGKATAN PERTAHANAN AWAM MALAYSIA W.P LABUAN',
    W / 2, footerY + footerH / 2 + 1.5, { align: 'center' }
  );

  doc.save(`laporan-kecemasan-${bulanLabel.toLowerCase()}-${currentYear}.pdf`);
}