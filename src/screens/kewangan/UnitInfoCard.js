import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Users, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { kewanganStyles as styles } from './kewanganStyles';
import SectionHeader from '../pentadbiran/SectionHeader';
import UnitEditModal from './UnitEditModal';

const EMPTY_DRAFT = { name: '', role: '' };

export default function UnitInfoCard({ staffList, loading, isEditMode, saveStaffItem, deleteStaffItem, reorderStaff }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const openAdd = () => {
    setEditItem(null);
    setDraft(EMPTY_DRAFT);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setDraft({ name: item.name, role: item.role });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) return;
    const ok = await saveStaffItem(draft, editItem);
    if (ok) setModalVisible(false);
  };

  const moveStaff = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= staffList.length) return;

    const reordered = [...staffList];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    reorderStaff(reordered);
  };

  return (
    <View style={styles.card}>
      <View style={[styles.sectionHeaderRowSpaced, { marginBottom: 0 }]}>
        <SectionHeader title="UNIT KEWANGAN" Icon={Users} />
        {isEditMode && (
          <TouchableOpacity style={[styles.addBtn, { marginLeft: 'auto' }]} onPress={openAdd}>
            <Text style={styles.addBtnText}>+ Tambah</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginVertical: 20 }} />}

      {!loading && staffList.map((item, index) => (
        <View key={item.id} style={[styles.staffCard, { marginBottom: 8 }]}>
          {isEditMode && (
            <View style={styles.staffReorderGroup}>
              <TouchableOpacity
                style={[styles.staffReorderBtn, index === 0 && styles.staffReorderBtnDisabled]}
                onPress={() => moveStaff(index, -1)}
                disabled={index === 0}
              >
                <ChevronUp size={13} color={index === 0 ? PALETTE.textMutedDark : PALETTE.orange} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.staffReorderBtn, index === staffList.length - 1 && styles.staffReorderBtnDisabled]}
                onPress={() => moveStaff(index, 1)}
                disabled={index === staffList.length - 1}
              >
                <ChevronDown size={13} color={index === staffList.length - 1 ? PALETTE.textMutedDark : PALETTE.orange} />
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

          {isEditMode && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={styles.kpiPencilBtnInline}
                onPress={() => openEdit(item)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Pencil size={13} color={PALETTE.orange} />
                {hoveredIndex === index && (
                  <View style={styles.kpiTooltip}>
                    <Text style={styles.kpiTooltipText}>Ubah</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.kpiDeleteBtnInline} onPress={() => deleteStaffItem(item)}>
                <Trash2 size={13} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      <UnitEditModal
        visible={modalVisible}
        isNew={!editItem}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}