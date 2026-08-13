import React from 'react';
import { View, Text, TouchableOpacity, Pressable, ScrollView, Modal, Image, Platform } from 'react-native';
import { X, User, ChevronLeft, ChevronRight, Users, Download } from 'lucide-react-native';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import HoverTip from '../../components/HoverTip';
import { FIELD_SECTIONS } from './employeeFieldGroups';

const STATUS_STYLES = {
  AKTIF: { bg: 'rgba(22,163,74,0.12)', color: '#16a34a' },
  SIMPANAN: { bg: 'rgba(37,99,235,0.12)', color: '#2563eb' },
  BERSARA: { bg: 'rgba(245,158,11,0.14)', color: '#b45309' },
  MENINGGAL: { bg: 'rgba(31,41,55,0.12)', color: '#1f2937' },
  'SENARAI HITAM': { bg: 'rgba(220,38,38,0.12)', color: '#dc2626' },
};
const getStatusStyle = (status) => STATUS_STYLES[String(status || '').trim().toUpperCase()] || { bg: PALETTE.surface, color: PALETTE.textMutedDark };

const LOGO_URL = 'https://kceeewyadcskivtmilyf.supabase.co/storage/v1/object/public/logo/apm_labuan.png';

// Convertit l'image du logo (URL publique) en base64 — nécessaire pour
// jsPDF.addImage, qui n'accepte pas une URL distante directement.
const loadImageAsBase64 = (url) =>
  fetch(url)
    .then((res) => res.blob())
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));

// Récupère les dimensions naturelles de l'image (base64) pour l'insérer dans
// le PDF sans la déformer — jsPDF.addImage étire l'image si on force une
// largeur/hauteur ne respectant pas son ratio d'origine.
const getImageDimensions = (base64) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = base64;
  });

export default function FilteredEmployeeListModal({
  visible, title, totalCount, employees, allEmployees, page, setPage, totalPages, onClose, onSelectEmployee,
}) {
  const handleDownloadPdf = async () => {
    const list = allEmployees || employees;
    const maklumatPeribadiFields = FIELD_SECTIONS.find((s) => s.title === 'Maklumat Peribadi')?.fields || [];

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Le logo échoue silencieusement (réseau, format non reconnu, etc.) — le
    // PDF continue de se générer sans lui plutôt que de bloquer l'utilisateur.
    let logoBase64 = null;
    let logoDrawWidth = 18;
    let logoDrawHeight = 18;
    try {
      logoBase64 = await loadImageAsBase64(LOGO_URL);
      const { width: natW, height: natH } = await getImageDimensions(logoBase64);
      // Réduit à l'échelle en respectant le ratio d'origine, dans une boîte max 48x48mm.
      const maxBox = 48;
      const scale = Math.min(maxBox / natW, maxBox / natH);
      logoDrawWidth = natW * scale;
      logoDrawHeight = natH * scale;
    } catch (err) {
      console.warn('Gagal memuatkan logo untuk PDF:', err);
      logoBase64 = null;
    }

    const pageCenterX = pageWidth / 2;
    let y = 14;

    // 1. Logo — centré horizontalement
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', pageCenterX - logoDrawWidth / 2, y, logoDrawWidth, logoDrawHeight);
      y += logoDrawHeight + 6;
    }

    // 2. Nama APM — petit, gras, majuscules, gris moyen (registre "en-tête officiel")
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text('ANGKATAN PERTAHANAN AWAM MALAYSIA — WILAYAH PERSEKUTUAN LABUAN', pageCenterX, y, { align: 'center' });
    y += 8;

    // 3. Tajuk — le plus grand, gras, couleur de marque
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(234, 88, 12); // PALETTE.orange
    doc.text(title || 'Senarai Anggota', pageCenterX, y, { align: 'center' });
    y += 6;

    // 4. Jumlah / tarikh dijana — italique, discret
    doc.setFont(undefined, 'italic');
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(`Jumlah: ${list.length} anggota — Dijana pada ${new Date().toLocaleString('ms-MY')}`, pageCenterX, y, { align: 'center' });
    doc.setFont(undefined, 'normal');
    y += 6;

    // Ligne de séparation sous l'en-tête — même largeur que le tableau des
    // anggota (margin: 14mm de chaque côté, identique à autoTable plus bas)
    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(0.6);
    doc.line(14, y, pageWidth - 14, y);

    let startY = y + 8;

    list.forEach((e, index) => {
      // Titre "N. Nama" au-dessus de chaque tableau — sert de séparateur entre anggota
      doc.setFontSize(11);
      doc.setTextColor(249, 115, 22);
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${e.nama || '-'}`, 14, startY);
      doc.setFont(undefined, 'normal');

      autoTable(doc, {
        startY: startY + 3,
        head: [['Maklumat', 'Butiran']],
        body: maklumatPeribadiFields.map((f) => [
          f.label,
          e[f.key] != null && e[f.key] !== '' ? String(e[f.key]) : '-',
        ]),
        showHead: 'firstPage',
        styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak', valign: 'top' },
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold', textColor: [90, 90, 90] },
          1: { cellWidth: pageWidth - 55 - 28 },
        },
        margin: { left: 14, right: 14 },
      });

      startY = doc.lastAutoTable.finalY + 12;
    });

    // Numérotation des pages — ajoutée une fois tout le contenu généré, car le
    // nombre total de pages n'est connu qu'après (dépend du nombre d'anggota).
    const pageHeight = doc.internal.pageSize.getHeight();
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Halaman ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    const safeFileName = (title || 'senarai_anggota').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    doc.save(`${safeFileName}.pdf`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
          <View style={[styles.modalHeader, { alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={{ fontSize: 12, color: PALETTE.textMutedDark, fontWeight: '600', marginTop: 2 }}>
                {totalCount ?? employees.length} anggota
              </Text>
            </View>
            {Platform.OS === 'web' && (totalCount ?? employees.length) > 0 && (
              <HoverTip label="Muat turun senarai sebagai PDF">
                <TouchableOpacity
                  onPress={handleDownloadPdf}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: PALETTE.softOrangeBg, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
                >
                  <Download size={16} color={PALETTE.orange} />
                </TouchableOpacity>
              </HoverTip>
            )}
            <HoverTip label="Tutup">
              <TouchableOpacity
                onPress={onClose}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: PALETTE.surface, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </HoverTip>
          </View>

          {employees.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 10 }}>
              <Users size={30} color={PALETTE.cardLightBorder} />
              <Text style={{ fontSize: 13, color: PALETTE.textMutedDark, fontWeight: '600' }}>Tiada anggota dijumpai.</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={[styles.modalBody, { gap: 10 }]}>
              {employees.map((emp) => {
                const statusStyle = getStatusStyle(emp.status_keaktifan);
                return (
                  <Pressable
                    key={emp.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14,
                      backgroundColor: '#fff', borderWidth: 1, borderColor: PALETTE.cardLightBorder,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
                    }}
                    onPress={() => onSelectEmployee(emp)}
                  >
                    {emp.photo_url ? (
                      <Image source={{ uri: emp.photo_url }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                    ) : (
                      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: PALETTE.surface, alignItems: 'center', justifyContent: 'center' }}>
                        <User size={22} color={PALETTE.textMutedDark} />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: PALETTE.textDark, marginBottom: 4 }} numberOfLines={1}>
                        {emp.nama}
                      </Text>
                      <View style={{ alignSelf: 'flex-start', backgroundColor: PALETTE.softOrangeBg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: PALETTE.orange }}>{emp.pangkat}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: statusStyle.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: statusStyle.color }}>{emp.status_keaktifan || '-'}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {totalPages > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 14, paddingBottom: 16 }}>
              <TouchableOpacity
                disabled={page === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: page === 1 ? PALETTE.surface : PALETTE.softOrangeBg, opacity: page === 1 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={17} color={PALETTE.orange} />
              </TouchableOpacity>
              <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark }}>{page} / {totalPages}</Text>
              <TouchableOpacity
                disabled={page === totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: page === totalPages ? PALETTE.surface : PALETTE.softOrangeBg, opacity: page === totalPages ? 0.4 : 1,
                }}
              >
                <ChevronRight size={17} color={PALETTE.orange} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}