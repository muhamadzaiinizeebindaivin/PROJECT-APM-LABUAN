import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Pencil } from 'lucide-react-native';
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

export default function ComplianceSection({ pageData, isEditing, updateField, onSave }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [modalIndex, setModalIndex] = useState(null); // null = fermé, -1 = ajout, >=0 = édition
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const openEdit = (index) => {
    setModalIndex(index);
    const item = pageData.pematuhan[index];
    setDraft({
      tarikh: item.tarikh || '',
      agensi: item.agensi || '',
      tajukPenilaian: item.tajukPenilaian || '',
    });
  };

  const openAdd = () => {
    setModalIndex(-1);
    setDraft(EMPTY_DRAFT);
  };

  const closeModal = () => {
    setModalIndex(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleSave = async () => {
    let updated;
    if (modalIndex === -1) {
      updated = [...pageData.pematuhan, draft];
    } else {
      updated = pageData.pematuhan.map((it, i) => (i === modalIndex ? { ...it, ...draft } : it));
    }
    updateField('pematuhan', updated);
    closeModal();
    if (onSave) await onSave({ pematuhan: updated });
  };

  const handleDelete = async () => {
    const updated = pageData.pematuhan.filter((_, i) => i !== modalIndex);
    updateField('pematuhan', updated);
    closeModal();
    if (onSave) await onSave({ pematuhan: updated });
  };

  return (
    <View style={styles.card}>
      <SectionHeader title="PENILAIAN SEMASA/TAHUNAN" />

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.cellHeader, { width: 110 }]}>TARIKH</Text>
          <Text style={[styles.tableCell, styles.cellHeader, { flex: 1, textAlign: 'left' }]}>AGENSI</Text>
          <Text style={[styles.tableCell, styles.cellHeader, { flex: 1, textAlign: 'left' }]}>TAJUK PENILAIAN</Text>
          {isEditing && <Text style={[styles.tableCell, styles.cellHeader, { width: 60 }]}>UBAH</Text>}
        </View>

        {pageData.pematuhan.map((item, index) => (
          <View key={`pematuhan-${index}`} style={[styles.tableRow, index === pageData.pematuhan.length - 1 && styles.tableRowLast]}>
            <Text style={[styles.tableCell, { width: 110 }]}>{formatTarikh(item.tarikh)}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'left', paddingLeft: 10 }]}>{item.agensi}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'left', paddingLeft: 10 }]}>{item.tajukPenilaian}</Text>

            {isEditing && (
              <View style={[styles.tableCell, { width: 60, justifyContent: 'center', alignItems: 'center' }]}>
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
              </View>
            )}
          </View>
        ))}
      </View>

      {isEditing && (
        <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { marginTop: 10 }]}>
          <Text style={styles.addBtnText}>+ Tambah Penilaian</Text>
        </TouchableOpacity>
      )}

      <PenilaianEditModal
        visible={modalIndex !== null}
        isNew={modalIndex === -1}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={closeModal}
      />
    </View>
  );
}