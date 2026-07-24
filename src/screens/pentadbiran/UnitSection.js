import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Users, ListChecks, Pencil, Trash2, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';
import SectionHeader from './SectionHeader';
import PecahanUnitEditModal from './PecahanUnitEditModal';
import StaffEditModal from './StaffEditModal';

const EMPTY_STAFF_DRAFT = { name: '', role: '' };

export default function UnitSection({ pageData, isEditing, updateField, onSave, unitStaffList, saveStaffItem, deleteStaffItem, reorderStaff, onNotify }) {
  const [hoveredPecahanIndex, setHoveredPecahanIndex] = useState(null);
  const [hoveredStaffIndex, setHoveredStaffIndex] = useState(null);

  const [pecahanModalIndex, setPecahanModalIndex] = useState(null); // null = fermé, -1 = ajout, >=0 = édition
  const [pecahanDraft, setPecahanDraft] = useState('');
  const [isSavingPecahan, setIsSavingPecahan] = useState(false);
  const [isDeletingPecahan, setIsDeletingPecahan] = useState(false);
  const [pecahanFormError, setPecahanFormError] = useState(null);

  const [staffModalIndex, setStaffModalIndex] = useState(null);
  const [staffDraft, setStaffDraft] = useState(EMPTY_STAFF_DRAFT);
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [isDeletingStaff, setIsDeletingStaff] = useState(false);
  const [staffFormError, setStaffFormError] = useState(null);
  const [confirmStaffDeleteIndex, setConfirmStaffDeleteIndex] = useState(null);
  const [confirmPecahanDeleteIndex, setConfirmPecahanDeleteIndex] = useState(null);

  // ── Pecahan Unit ──
  const openPecahanEdit = (index) => {
    setPecahanModalIndex(index);
    setPecahanDraft(pageData.pecahanUnit[index]);
    setPecahanFormError(null);
  };
  const openPecahanAdd = () => {
    setPecahanModalIndex(-1);
    setPecahanDraft('');
    setPecahanFormError(null);
  };
  const closePecahanModal = () => {
    setPecahanModalIndex(null);
    setPecahanDraft('');
    setPecahanFormError(null);
  };
  const handlePecahanSave = async () => {
    if (!pecahanDraft.trim()) {
      setPecahanFormError('Nama unit tidak boleh kosong.');
      return;
    }
    setPecahanFormError(null);
    const isNew = pecahanModalIndex === -1;
    let updated;
    if (isNew) updated = [...pageData.pecahanUnit, pecahanDraft];
    else updated = pageData.pecahanUnit.map((it, i) => (i === pecahanModalIndex ? pecahanDraft : it));
    updateField('pecahanUnit', updated);
    setIsSavingPecahan(true);
    const ok = onSave ? await onSave({ pecahanUnit: updated }) : true;
    setIsSavingPecahan(false);
    if (ok === false) {
      onNotify?.('error', isNew ? 'Gagal menambah unit.' : 'Gagal mengemaskini unit.');
      return;
    }
    closePecahanModal();
    onNotify?.('success', isNew ? 'Unit berjaya ditambah.' : 'Unit berjaya dikemaskini.');
  };
  const handlePecahanQuickDelete = (index) => {
    setConfirmPecahanDeleteIndex(index);
  };

  const confirmPecahanDeleteFromCard = async () => {
    const index = confirmPecahanDeleteIndex;
    const updated = pageData.pecahanUnit.filter((_, i) => i !== index);
    setIsDeletingPecahan(true);
    const ok = onSave ? await onSave({ pecahanUnit: updated }) : true;
    setIsDeletingPecahan(false);
    if (ok === false) {
      onNotify?.('error', 'Gagal memadam unit.');
      return;
    }
    updateField('pecahanUnit', updated);
    setConfirmPecahanDeleteIndex(null);
    onNotify?.('success', 'Unit berjaya dipadam.');
  };

  // ── Unit Pentadbiran (staff) — désormais stocké dans sandbox.unit_staff (page='pentadbiran') ──
  const openStaffEdit = (index) => {
    setStaffModalIndex(index);
    const item = unitStaffList[index];
    setStaffDraft({ name: item.name, role: item.role });
    setStaffFormError(null);
  };
  const openStaffAdd = () => {
    setStaffModalIndex(-1);
    setStaffDraft(EMPTY_STAFF_DRAFT);
    setStaffFormError(null);
  };
  const closeStaffModal = () => {
    setStaffModalIndex(null);
    setStaffDraft(EMPTY_STAFF_DRAFT);
    setStaffFormError(null);
  };
  const handleStaffSave = async () => {
    if (!staffDraft.name.trim() || !staffDraft.role.trim()) {
      setStaffFormError('Nama dan peranan tidak boleh kosong.');
      return;
    }
    setStaffFormError(null);
    const isNew = staffModalIndex === -1;
    const editItem = isNew ? null : unitStaffList[staffModalIndex];
    setIsSavingStaff(true);
    const ok = await saveStaffItem(staffDraft, editItem);
    setIsSavingStaff(false);
    if (!ok) {
      onNotify?.('error', isNew ? 'Gagal menambah kakitangan.' : 'Gagal mengemaskini kakitangan.');
      return;
    }
    closeStaffModal();
    onNotify?.('success', isNew ? 'Kakitangan berjaya ditambah.' : 'Kakitangan berjaya dikemaskini.');
  };
  const moveStaff = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= unitStaffList.length) return;

    const reordered = [...unitStaffList];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const ok = await reorderStaff(reordered);
    if (ok === false) onNotify?.('error', 'Gagal menyusun semula kakitangan.');
  };
  const handleStaffQuickDelete = (index) => {
    setConfirmStaffDeleteIndex(index);
  };

  const confirmStaffDeleteFromCard = async () => {
    const index = confirmStaffDeleteIndex;
    setIsDeletingStaff(true);
    const ok = await deleteStaffItem(unitStaffList[index]);
    setIsDeletingStaff(false);
    if (!ok) {
      onNotify?.('error', 'Gagal memadam kakitangan.');
      return;
    }
    setConfirmStaffDeleteIndex(null);
    onNotify?.('success', 'Kakitangan berjaya dipadam.');
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

          {unitStaffList.map((item, index) => (
            <View key={item.id} style={styles.editRowBlock}>
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
                      style={[styles.staffReorderBtn, index === unitStaffList.length - 1 && styles.staffReorderBtnDisabled]}
                      onPress={() => moveStaff(index, 1)}
                      disabled={index === unitStaffList.length - 1}
                    >
                      <ChevronDown size={13} color={index === unitStaffList.length - 1 ? PALETTE.textMutedDark : PALETTE.orange} />
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

      <Modal visible={confirmPecahanDeleteIndex !== null} transparent animationType="fade" onRequestClose={() => setConfirmPecahanDeleteIndex(null)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmBanner}>
              <View style={styles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={styles.confirmTitle}>Padam Unit</Text>
              <Text style={styles.confirmSubtitle}>
                Adakah anda pasti mahu memadam unit ini? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, isDeletingPecahan && { opacity: 0.5 }]}
                onPress={() => setConfirmPecahanDeleteIndex(null)}
                disabled={isDeletingPecahan}
              >
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmConfirmBtn, isDeletingPecahan && { opacity: 0.7 }]}
                onPress={confirmPecahanDeleteFromCard}
                disabled={isDeletingPecahan}
              >
                {isDeletingPecahan ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={styles.confirmConfirmText}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmStaffDeleteIndex !== null} transparent animationType="fade" onRequestClose={() => setConfirmStaffDeleteIndex(null)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmBanner}>
              <View style={styles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={styles.confirmTitle}>Padam Kakitangan</Text>
              <Text style={styles.confirmSubtitle}>
                Padam kakitangan ini{confirmStaffDeleteIndex !== null && unitStaffList[confirmStaffDeleteIndex]?.name ? ` "${unitStaffList[confirmStaffDeleteIndex].name}"` : ''}? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, isDeletingStaff && { opacity: 0.5 }]}
                onPress={() => setConfirmStaffDeleteIndex(null)}
                disabled={isDeletingStaff}
              >
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmConfirmBtn, isDeletingStaff && { opacity: 0.7 }]}
                onPress={confirmStaffDeleteFromCard}
                disabled={isDeletingStaff}
              >
                {isDeletingStaff ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={styles.confirmConfirmText}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PecahanUnitEditModal
        visible={pecahanModalIndex !== null}
        isNew={pecahanModalIndex === -1}
        draft={pecahanDraft}
        setDraft={setPecahanDraft}
        onSave={handlePecahanSave}
        onClose={closePecahanModal}
        isSaving={isSavingPecahan}
        error={pecahanFormError}
      />

      <StaffEditModal
        visible={staffModalIndex !== null}
        isNew={staffModalIndex === -1}
        draft={staffDraft}
        setDraft={setStaffDraft}
        onSave={handleStaffSave}
        onClose={closeStaffModal}
        isSaving={isSavingStaff}
        error={staffFormError}
      />
    </View>
  );
}