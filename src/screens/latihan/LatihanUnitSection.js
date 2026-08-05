// src/screens/latihan/LatihanUnitSection.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { UserCog, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { appStyles as shared } from '../../styles/appStyles';
import { latihanStyles as styles } from './latihanStyles';
import UnitEditModal from '../kewangan/UnitEditModal';

const EMPTY_DRAFT = { name: '', role: '' };

export default function LatihanUnitSection({ unitList, loadingUnit, isEditMode, saveUnitItem, deleteUnitItem, reorderUnit }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const openAdd = () => { setEditItem(null); setDraft(EMPTY_DRAFT); setModalVisible(true); };
  const openEdit = (item) => { setEditItem(item); setDraft({ name: item.name, role: item.role }); setModalVisible(true); };

  const handleSave = async () => {
    if (!draft.name.trim()) return;
    const ok = await saveUnitItem(draft, editItem);
    if (ok) setModalVisible(false);
  };

  const move = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= unitList.length) return;
    const reordered = [...unitList];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    reorderUnit(reordered);
  };

  return (
    <View style={styles.sectionCard}>
      {/* ---- Header ---- */}
      <View style={shared.sectionHeaderRow}>
        <View style={styles.sectionTitleGroup}>
          <View style={styles.sectionIconBadge}><UserCog size={16} color={PALETTE.orange} /></View>
          <Text style={shared.sectionHeaderTitle}>UNIT LATIHAN</Text>
        </View>
      </View>

      {/* ---- Liste ---- */}
      {loadingUnit ? (
        <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginVertical: 16 }} />
      ) : unitList.length === 0 ? (
        <Text style={shared.emptyText}>Tiada maklumat unit.</Text>
      ) : (
        unitList.map((item, index) => (
          <View key={item.id} style={styles.unitCard}>
            {isEditMode ? (
              <View style={styles.reorderGroup}>
                <TouchableOpacity
                  style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                  onPress={() => move(index, -1)}
                  disabled={index === 0}
                >
                  <ChevronUp size={13} color={index === 0 ? PALETTE.textMutedDark : PALETTE.orange} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reorderBtn, index === unitList.length - 1 && styles.reorderBtnDisabled]}
                  onPress={() => move(index, 1)}
                  disabled={index === unitList.length - 1}
                >
                  <ChevronDown size={13} color={index === unitList.length - 1 ? PALETTE.textMutedDark : PALETTE.orange} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.unitAvatar}>
              <Text style={styles.unitAvatarText}>{index + 1}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.unitName}>{item.name}</Text>
              <Text style={styles.unitRole}>{item.role || '—'}</Text>
            </View>

            {isEditMode ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={styles.unitEditBtn}
                  onPress={() => openEdit(item)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <Pencil size={13} color={PALETTE.orange} />
                  {hoveredIndex === index ? (
                    <View style={styles.unitTooltip}>
                      <Text style={styles.unitTooltipText}>Ubah</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity style={styles.unitDeleteBtn} onPress={() => deleteUnitItem(item)}>
                  <Trash2 size={13} color={PALETTE.danger} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))
      )}

      {isEditMode && (
        <TouchableOpacity onPress={openAdd} style={styles.addBtnOutline}>
          <Text style={styles.addBtnOutlineText}>+ Tambah</Text>
        </TouchableOpacity>
      )}

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