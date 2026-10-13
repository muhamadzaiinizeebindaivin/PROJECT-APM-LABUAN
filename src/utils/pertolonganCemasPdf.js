// src/utils/pertolonganCemasPdf.js
// "Jana PDF" of the Pertolongan Cemas tab: the events shown with the current
// filters (year, status, search), one row per event, with the totals.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_URL, fetchImageAsBase64, getImageNaturalSize } from './patrolHistoryPdf';

const tarikhMasa = (tarikh, masa) => {
  if (!tarikh) return '-';
  const [y, m, d] = tarikh.split('-');
  const t = d && m && y ? `${d}/${m}/${y}` : tarikh;
  return masa ? `${t}\n${masa.slice(0, 5)}` : t;
};

const penganjurTeks = (e) =>
  [e.penganjur, e.penganjur_pegawai, e.penganjur_telefon].map((x) => (x || '').trim()).filter(Boolean).join('\n') || '-';

export async function generatePertolonganCemasPdf({ events, tapisan }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  let y = 12;

  try {
    const logo = await fetchImageAsBase64(LOGO_URL);
    const { width, height } = await getImageNaturalSize(logo);
    const h = 18;
    const w = (width / height) * h;
    doc.addImage(logo, 'PNG', (W - w) / 2, y, w, h);
    y += h + 5;
  } catch (e) {
    console.warn('Gagal memuatkan logo untuk PDF:', e);
  }

  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('LAPORAN PERTOLONGAN CEMAS', W / 2, y, { align: 'center' });
  y += 6;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text('Operasi JPBD W.P. Labuan', W / 2, y, { align: 'center' });
  y += 5;
  doc.text(`Tapisan: ${tapisan}`, W / 2, y, { align: 'center' });
  y += 5;
  doc.text(`Dijana pada: ${new Date().toLocaleString('ms-MY')}`, W / 2, y, { align: 'center' });
  y += 7;

  // Totals of the listed events
  const jumlah = (k) => events.reduce((n, e) => n + (Number(e[k]) || 0), 0);
  const bil = (s) => events.filter((e) => e.status === s).length;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9.5);
  doc.text(
    `Jumlah acara: ${events.length}  (Aktif ${bil('aktif')} · Selesai ${bil('selesai')} · Dibatal ${bil('dibatal')})` +
      `     Pegawai: ${jumlah('bilangan_pegawai')}     Anggota: ${jumlah('bilangan_anggota')}` +
      `     Kenderaan: ${jumlah('bilangan_kenderaan')}     Pesakit: ${jumlah('bilangan_pesakit')}`,
    W / 2,
    y,
    { align: 'center' },
  );
  y += 4;

  if (events.length === 0) {
    doc.setFont(undefined, 'italic');
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('Tiada acara untuk tapisan ini.', W / 2, y + 12, { align: 'center' });
    doc.setTextColor(0);
  } else {
    autoTable(doc, {
      startY: y + 2,
      head: [['#', 'Nama Acara', 'Penganjur', 'Lokasi', 'Mula', 'Tamat', 'Pegawai', 'Anggota', 'Kenderaan / Logistik', 'Pesakit', 'Status', 'Catatan']],
      body: events.map((e, i) => [
        i + 1,
        e.nama_acara || '-',
        penganjurTeks(e),
        e.lokasi || '-',
        tarikhMasa(e.tarikh, e.masa_mula),
        tarikhMasa(e.tarikh_tamat, e.masa_tamat),
        e.bilangan_pegawai || 0,
        e.bilangan_anggota || 0,
        [e.bilangan_kenderaan ? `${e.bilangan_kenderaan} unit` : '', e.jenis_kenderaan || ''].filter(Boolean).join('\n') || '-',
        e.bilangan_pesakit || 0,
        (e.status || '-').toUpperCase(),
        e.catatan || '-',
      ]),
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.8, valign: 'middle', overflow: 'linebreak' },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 7 },
        1: { cellWidth: 34 },
        2: { cellWidth: 34 },
        3: { cellWidth: 28 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'center', cellWidth: 14 },
        7: { halign: 'center', cellWidth: 14 },
        8: { cellWidth: 38 },
        9: { halign: 'center', cellWidth: 13 },
        10: { halign: 'center', cellWidth: 17 },
      },
      margin: { left: 10, right: 10 },
      didDrawPage: () => {
        const H = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`Muka ${doc.internal.getNumberOfPages()}`, W - 10, H - 6, { align: 'right' });
        doc.setTextColor(0);
      },
    });
  }

  doc.save(`laporan-pertolongan-cemas-${new Date().toISOString().slice(0, 10)}.pdf`);
}