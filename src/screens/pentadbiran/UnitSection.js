import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users, ListChecks, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';
import SectionHeader from './SectionHeader';
import PecahanUnitEditModal from './PecahanUnitEditModal';
import StaffEditModal from './StaffEditModal';

const EMPTY_STAFF_DRAFT = { name: '', role: '' };

export default function UnitSection({ pageData, isEditing, updateField, onSave }) {
  const [hoveredPecahanIndex, setHoveredPecahanIndex] = useState(null);
  const [hoveredStaffIndex, setHoveredStaffIndex] = useState(null);

  const [pecahanModalIndex, setPecahanModalIndex] = useState(null); // null = fermé, -1 = ajout, >=0 = édition
  const [pecahanDraft, setPecahanDraft] = useState('');

  const [staffModalIndex, setStaffModalIndex] = useState(null);
  const [staffDraft, setStaffDraft] = useState(EMPTY_STAFF_DRAFT);

  // ── Pecahan Unit ──
  const openPecahanEdit = (index) => {
    setPecahanModalIndex(index);
    setPecahanDraft(pageData.pecahanUnit[index]);
  };
  const openPecahanAdd = () => {
    setPecahanModalIndex(-1);
    setPecahanDraft('');
  };
  const closePecahanModal = () => {
    setPecahanModalIndex(null);
    setPecahanDraft('');
  };
  const handlePecahanSave = async () => {
    let updated;
    if (pecahanModalIndex === -1) updated = [...pageData.pecahanUnit, pecahanDraft];
    else updated = pageData.pecahanUnit.map((it, i) => (i === pecahanModalIndex ? pecahanDraft : it));
    updateField('pecahanUnit', updated);
    closePecahanModal();
    if (onSave) await onSave({ pecahanUnit: updated });
  };
  const handlePecahanDelete = async () => {
    const updated = pageData.pecahanUnit.filter((_, i) => i !== pecahanModalIndex);
    updateField('pecahanUnit', updated);
    closePecahanModal();
    if (onSave) await onSave({ pecahanUnit: updated });
  };
  const handlePecahanQuickDelete = async (index) => {
    const confirmed = window.confirm('Adakah anda pasti mahu memadam unit ini?');
    if (!confirmed) return;
    const updated = pageData.pecahanUnit.filter((_, i) => i !== index);
    updateField('pecahanUnit', updated);
    if (onSave) await onSave({ pecahanUnit: updated });
  };

  // ── Unit Pentadbiran (staff) ──
  const openStaffEdit = (index) => {
    setStaffModalIndex(index);
    const item = pageData.unitPentadbiran[index];
    setStaffDraft({ name: item.name, role: item.role });
  };
  const openStaffAdd = () => {
    setStaffModalIndex(-1);
    setStaffDraft(EMPTY_STAFF_DRAFT);
  };
  const closeStaffModal = () => {
    setStaffModalIndex(null);
    setStaffDraft(EMPTY_STAFF_DRAFT);
  };
  const handleStaffSave = async () => {
    let updated;
    if (staffModalIndex === -1) updated = [...pageData.unitPentadbiran, staffDraft];
    else updated = pageData.unitPentadbiran.map((it, i) => (i === staffModalIndex ? { ...it, ...staffDraft } : it));
    updateField('unitPentadbiran', updated);
    closeStaffModal();
    if (onSave) await onSave({ unitPentadbiran: updated });
  };
  const handleStaffDelete = async () => {
    const updated = pageData.unitPentadbiran.filter((_, i) => i !== staffModalIndex);
    updateField('unitPentadbiran', updated);
    closeStaffModal();
    if (onSave) await onSave({ unitPentadbiran: updated });
  };
  const moveStaff = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pageData.unitPentadbiran.length) return;

    const reordered = [...pageData.unitPentadbiran];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    updateField('unitPentadbiran', reordered);
    if (onSave) await onSave({ unitPentadbiran: reordered });
  };
  const handleStaffQuickDelete = async (index) => {
    const confirmed = window.confirm('Adakah anda pasti mahu memadam kakitangan ini?');
    if (!confirmed) return;
    const updated = pageData.unitPentadbiran.filter((_, i) => i !== index);
    updateField('unitPentadbiran', updated);
    if (onSave) await onSave({ unitPentadbiran: updated });
  };

  return (
    <View style={styles.card}>
      <SectionHeader title="BAHAGIAN KHIDMAT PENGURUSAN" Icon={Users} />

      <View style={styles.unitContainer}>
        {/* ── Pecahan Unit ── */}
        <View style={styles.unitBox}>
          <View style={styles.unitBoxHeader}>
            <ListChecks size={15} color={PALETTE.orange} />
            <Text style={styles.boxTitle}>PECAHAN UNIT</Text>
          </View>

          {pageData.pecahanUnit.map((item, index) => (
            <View key={`pecahan-${index}`} style={styles.unitListItem}>
              <View style={styles.unitListBullet} />
              <Text style={[styles.listItem, { flex: 1 }]}>{item}</Text>
              {isEditing && (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={styles.kpiPencilBtnInline}
                    onPress={() => openPecahanEdit(index)}
                    onMouseEnter={() => setHoveredPecahanIndex(index)}
                    onMouseLeave={() => setHoveredPecahanIndex(null)}
                  >
                    <Pencil size={13} color={PALETTE.orange} />
                    {hoveredPecahanIndex === index && (
                      <View style={styles.kpiTooltip}>
                        <Text style={styles.kpiTooltipText}>Ubah</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.kpiDeleteBtnInline}
                    onPress={() => handlePecahanQuickDelete(index)}
                  >
                    <Trash2 size={13} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {isEditing && (
            <TouchableOpacity onPress={openPecahanAdd} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Tambah</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Unit Pentadbiran ── */}
        <View style={styles.unitBox}>
          <View style={styles.unitBoxHeader}>
            <Users size={15} color={PALETTE.orange} />
            <Text style={styles.boxTitle}>UNIT PENTADBIRAN</Text>
          </View>

{pageData.unitPentadbiran.map((item, index) => (
            <View key={`pentadbiran-${index}`} style={styles.editRowBlock}>
              <View style={styles.staffCard}>
                {isEditing && (
                  <View style={styles.staffReorderGroup}>
                    <TouchableOpacity
                      style={[styles.staffReorderBtn, index === 0 && styles.staffReorderBtnDisabled]}
                      onPress={() => moveStaff(index, -1)}
                      disabled={index === 0}
                    >
                      <ChevronUp size={13} color={index === 0 ? PALETTE.textMutedDark : PALETTE.orange} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.staffReorderBtn, index === pageData.unitPentadbiran.length - 1 && styles.staffReorderBtnDisabled]}
                      onPress={() => moveStaff(index, 1)}
                      disabled={index === pageData.unitPentadbiran.length - 1}
                    >
                      <ChevronDown size={13} color={index === pageData.unitPentadbiran.length - 1 ? PALETTE.textMutedDark : PALETTE.orange} />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffName}>{item.name}</Text>
                  <Text style={styles.staffRole}>{item.role}</Text>
                </View>

                {isEditing && (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.kpiPencilBtnInline}
                      onPress={() => openStaffEdit(index)}
                      onMouseEnter={() => setHoveredStaffIndex(index)}
                      onMouseLeave={() => setHoveredStaffIndex(null)}
                    >
                      <Pencil size={13} color={PALETTE.orange} />
                      {hoveredStaffIndex === index && (
                        <View style={styles.kpiTooltip}>
                          <Text style={styles.kpiTooltipText}>Ubah</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.kpiDeleteBtnInline} onPress={() => handleStaffQuickDelete(index)}>
                      <Trash2 size={13} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}

          {isEditing && (
            <TouchableOpacity onPress={openStaffAdd} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Tambah</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <PecahanUnitEditModal
        visible={pecahanModalIndex !== null}
        isNew={pecahanModalIndex === -1}
        draft={pecahanDraft}
        setDraft={setPecahanDraft}
        onSave={handlePecahanSave}
        onDelete={handlePecahanDelete}
        onClose={closePecahanModal}
      />

      <StaffEditModal
        visible={staffModalIndex !== null}
        isNew={staffModalIndex === -1}
        draft={staffDraft}
        setDraft={setStaffDraft}
        onSave={handleStaffSave}
        onDelete={handleStaffDelete}
        onClose={closeStaffModal}
      />
    </View>
  );
}