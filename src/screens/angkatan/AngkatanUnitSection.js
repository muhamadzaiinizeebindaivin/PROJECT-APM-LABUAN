// src/screens/angkatan/AngkatanUnitSection.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { UserCog, Pencil, Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import UnitEditModal from '../kewangan/UnitEditModal';

const EMPTY_DRAFT = { name: '', role: '' };

export default function AngkatanUnitSection({ unitList, loadingUnit, isEditMode, saveUnitItem, deleteUnitItem, reorderUnit }) {
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
    <View style={unitStyles.card}>
      {/* ---- Header ---- */}
      <View style={unitStyles.headerRow}>
        <View style={unitStyles.titleGroup}>
          <View style={unitStyles.iconBadge}><UserCog size={16} color={PALETTE.orange} /></View>
          <Text style={unitStyles.title}>UNIT BERTANGGUNGJAWAB</Text>
        </View>
        {isEditMode ? (
          <TouchableOpacity style={unitStyles.addBtn} onPress={openAdd}>
            <Plus size={16} color="#fff" />
            <Text style={unitStyles.addBtnText}>Tambah</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ---- Liste ---- */}
      {loadingUnit ? (
        <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginVertical: 16 }} />
      ) : unitList.length === 0 ? (
        <Text style={unitStyles.emptyText}>Tiada maklumat unit.</Text>
      ) : (
        unitList.map((item, index) => (
          <View key={item.id} style={unitStyles.itemCard}>
            {isEditMode ? (
              <View style={unitStyles.reorderGroup}>
                <TouchableOpacity
                  style={[unitStyles.reorderBtn, index === 0 && unitStyles.reorderBtnDisabled]}
                  onPress={() => move(index, -1)} disabled={index === 0}
                >
                  <ChevronUp size={13} color={index === 0 ? PALETTE.textMutedDark : PALETTE.orange} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[unitStyles.reorderBtn, index === unitList.length - 1 && unitStyles.reorderBtnDisabled]}
                  onPress={() => move(index, 1)} disabled={index === unitList.length - 1}
                >
                  <ChevronDown size={13} color={index === unitList.length - 1 ? PALETTE.textMutedDark : PALETTE.orange} />
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={unitStyles.avatar}>
              <Text style={unitStyles.avatarText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={unitStyles.name}>{item.name}</Text>
              <Text style={unitStyles.role}>{item.role || '—'}</Text>
            </View>
            {isEditMode ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={unitStyles.editBtn}
                  onPress={() => openEdit(item)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <Pencil size={13} color={PALETTE.orange} />
                  {hoveredIndex === index ? (
                    <View style={unitStyles.tooltip}>
                      <Text style={unitStyles.tooltipText}>Ubah</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity style={unitStyles.deleteBtn} onPress={() => deleteUnitItem(item)}>
                  <Trash2 size={13} color={PALETTE.danger} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))
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

const unitStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.12)', justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: PALETTE.orange, textTransform: 'uppercase' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PALETTE.orange, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  emptyText: { textAlign: 'center', color: PALETTE.textMutedDark, marginTop: 10, fontStyle: 'italic' },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: PALETTE.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, marginBottom: 8,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.14)', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '800', color: PALETTE.orange },
  name: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark, marginBottom: 2 },
  role: { fontSize: 12, color: PALETTE.textMutedDark },
  reorderGroup: { gap: 2 },
  reorderBtn: { width: 20, height: 16, borderRadius: 4, backgroundColor: 'rgba(249, 115, 22, 0.10)', justifyContent: 'center', alignItems: 'center' },
  reorderBtnDisabled: { backgroundColor: PALETTE.surface },
  editBtn: { width: 26, height: 26, borderRadius: 7, position: 'relative', backgroundColor: 'rgba(249, 115, 22, 0.12)', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(220, 38, 38, 0.10)', justifyContent: 'center', alignItems: 'center' },
  tooltip: { position: 'absolute', top: -30, right: 0, zIndex: 10, backgroundColor: PALETTE.textDark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tooltipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});