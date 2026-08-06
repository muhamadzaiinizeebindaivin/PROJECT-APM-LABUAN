import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { Pencil, Trash2, AlertTriangle, ClipboardCheck } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';
import SectionHeader from './SectionHeader';
import PenilaianEditModal from './PenilaianEditModal';

const EMPTY_DRAFT = { tarikh: '', agensi: '', tajukPenilaian: '' };

function formatTarikh(value) {
  if (!value) return '';
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

// Cellule de table : le View porte la bordure verticale (pleine hauteur), le Text porte la typo.
function TableCell({ children, colStyle, header, align = 'center', last }) {
  return (
    <View style={[styles.pematuhanCellWrap, colStyle, last && styles.pematuhanCellWrapLast]}>
      <Text style={[
        header ? styles.pematuhanHeaderText : styles.pematuhanCellText,
        align === 'left' && styles.pematuhanCellTextLeft,
      ]}>
        {children}
      </Text>
    </View>
  );
}

export default function ComplianceSection({ pageData, isEditing, updateField, onSave, onNotify }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const colTarikh = { width: isMobile ? 110 : 110 };
  const colAgensi = isMobile ? { width: 200 } : { flex: 1 };
  const colTajuk = isMobile ? { width: 260 } : { flex: 1 };
  const colAction = { width: isMobile ? 90 : 100 };

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [modalIndex, setModalIndex] = useState(null); // null = fermé, -1 = ajout, >=0 = édition
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [formError, setFormError] = useState(null);
  const [hoveredDeleteIndex, setHoveredDeleteIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);

  const openEdit = (index) => {
    setModalIndex(index);
    const item = pageData.pematuhan[index];
    setDraft({
      tarikh: item.tarikh || '',
      agensi: item.agensi || '',
      tajukPenilaian: item.tajukPenilaian || '',
    });
    setFormError(null);
  };

  const openAdd = () => {
    setModalIndex(-1);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
  };

  const closeModal = () => {
    setModalIndex(null);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!draft.tarikh.trim() || !draft.agensi.trim() || !draft.tajukPenilaian.trim()) {
      setFormError('Semua medan mesti diisi.');
      return;
    }
    setFormError(null);
    const isNew = modalIndex === -1;
    let updated;
    if (isNew) {
      updated = [...pageData.pematuhan, draft];
    } else {
      updated = pageData.pematuhan.map((it, i) => (i === modalIndex ? { ...it, ...draft } : it));
    }
    updateField('pematuhan', updated);
    closeModal();
    if (onSave) {
      const ok = await onSave({ pematuhan: updated });
      if (ok === false) {
        onNotify?.('error', isNew ? 'Gagal menambah penilaian.' : 'Gagal mengemaskini penilaian.');
        return;
      }
    }
    onNotify?.('success', isNew ? 'Penilaian berjaya ditambah.' : 'Penilaian berjaya dikemaskini.');
  };

  const handleDelete = () => {
    const index = modalIndex;
    closeModal();
    deleteAtIndex(index);
  };

  const deleteAtIndex = async (index) => {
    const updated = pageData.pematuhan.filter((_, i) => i !== index);
    updateField('pematuhan', updated);
    if (onSave) {
      const ok = await onSave({ pematuhan: updated });
      if (ok === false) {
        onNotify?.('error', 'Gagal memadam penilaian.');
        return;
      }
    }
    onNotify?.('success', 'Penilaian berjaya dipadam.');
  };

  const confirmDeleteFromCard = () => {
    const index = confirmDeleteIndex;
    setConfirmDeleteIndex(null);
    deleteAtIndex(index);
  };

  return (
    <View style={styles.card}>
      <SectionHeader title="PENILAIAN SEMASA/TAHUNAN" Icon={ClipboardCheck} />

      <ScrollView
        horizontal={isMobile}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={isMobile ? null : { flex: 1 }}
        style={styles.pematuhanScroll}
      >
      <View style={[styles.pematuhanTable, isMobile ? null : { flex: 1 }]}>
        <View style={[styles.pematuhanRow, styles.pematuhanHeaderRow]}>
          <TableCell colStyle={colTarikh} header>TARIKH</TableCell>
          <TableCell colStyle={colAgensi} header align="left">AGENSI</TableCell>
          <TableCell colStyle={colTajuk} header align="left">TAJUK PENILAIAN</TableCell>
          {isEditing && <TableCell colStyle={colAction} header last></TableCell>}
        </View>

        {pageData.pematuhan.map((item, index) => {
          const isLastRow = index === pageData.pematuhan.length - 1;
          return (
            <View key={`pematuhan-${index}`} style={[styles.pematuhanRow, isLastRow && styles.pematuhanRowLast]}>
              <TableCell colStyle={colTarikh}>{formatTarikh(item.tarikh)}</TableCell>
              <TableCell colStyle={colAgensi} align="left">{item.agensi}</TableCell>
              <TableCell colStyle={colTajuk} align="left">{item.tajukPenilaian}</TableCell>

              {isEditing && (
                <View style={[styles.pematuhanCellWrap, colAction, styles.pematuhanCellWrapLast, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]}>
                  <TouchableOpacity
                    style={styles.kpiPencilBtnInline}
                    onPress={() => openEdit(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <Pencil size={14} color={PALETTE.orange} />
                    {hoveredIndex === index && (
                      <View style={styles.kpiTooltip}>
                        <Text style={styles.kpiTooltipText}>Ubah</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.kpiPencilBtnInline, { backgroundColor: 'rgba(220, 38, 38, 0.10)' }]}
                    onPress={() => setConfirmDeleteIndex(index)}
                    onMouseEnter={() => setHoveredDeleteIndex(index)}
                    onMouseLeave={() => setHoveredDeleteIndex(null)}
                  >
                    <Trash2 size={14} color="#dc2626" />
                    {hoveredDeleteIndex === index && (
                      <View style={styles.kpiTooltip}>
                        <Text style={styles.kpiTooltipText}>Padam</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
      </ScrollView>

      {isEditing && (
        <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { marginTop: 10 }]}>
          <Text style={styles.addBtnText}>+ Tambah Penilaian</Text>
        </TouchableOpacity>
      )}

      <Modal visible={confirmDeleteIndex !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteIndex(null)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmBanner}>
              <View style={styles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={styles.confirmTitle}>Padam Penilaian</Text>
              <Text style={styles.confirmSubtitle}>
                Adakah anda pasti mahu memadam penilaian "{confirmDeleteIndex !== null ? pageData.pematuhan[confirmDeleteIndex]?.tajukPenilaian : ''}"? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmDeleteIndex(null)}>
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmConfirmBtn} onPress={confirmDeleteFromCard}>
                <Trash2 size={16} color="#fff" />
                <Text style={styles.confirmConfirmText}>Padam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PenilaianEditModal
        visible={modalIndex !== null}
        isNew={modalIndex === -1}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={closeModal}
        error={formError}
      />
    </View>
  );
}