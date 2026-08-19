import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Animated } from 'react-native';
import { Pencil, Trash2, Layers, Plus, AlertTriangle } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

const DELETE_ANIM_MS = 250;

function CategoryRow({ cat, index, isLast, isEditing, onOpenCategory, onEdit, onRequestDelete }) {
  const anim = useRef(new Animated.Value(1)).current;

  const animateOutThen = (cb) => {
    Animated.timing(anim, { toValue: 0, duration: DELETE_ANIM_MS, useNativeDriver: false }).start(() => cb());
  };

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ scaleY: anim }],
        maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }),
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        style={[styles.listItem, isLast && styles.listItemLast]}
        onPress={() => onOpenCategory(cat)}
      >
        <View style={[styles.dot, { backgroundColor: cat.color }]} />
        <Text style={styles.listItemLabel}>{cat.name}</Text>
        <Text style={styles.listItemValue}>{cat.count}</Text>
        {isEditing && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onEdit(cat); }}>
              <Pencil size={15} color={PALETTE.orange} />
            </TouchableOpacity>
            <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onRequestDelete(cat, animateOutThen); }}>
              <Trash2 size={15} color="#dc2626" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CategoriesCard({ categories, isEditing, onEdit, onDelete, onOpenCategory, onAdd, fill = true }) {
  const [catToDelete, setCatToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const pendingAnimRef = useRef(null);
  const displayDeleteCatRef = useRef(null);
  if (catToDelete !== null) displayDeleteCatRef.current = catToDelete;

  const requestDelete = (cat, animateOutThen) => {
    setCatToDelete(cat);
    pendingAnimRef.current = animateOutThen;
  };

  const cancelDelete = () => setCatToDelete(null);

  const confirmDelete = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    const animateOutThen = pendingAnimRef.current;
    const finish = async () => {
      const ok = await onDelete(catToDelete.id);
      setIsDeleting(false);
      setCatToDelete(null);
      return ok;
    };
    // Anime la ligne (fondu + collapse) AVANT l'appel réseau — garantit une
    // animation fluide indépendamment du délai de la requête/synchronisation.
    if (animateOutThen) animateOutThen(finish);
    else await finish();
  };

  return (
    <View style={[styles.card, fill && { flex: 1 }]}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionIconBadge}>
          <Layers size={16} color={PALETTE.orange} />
        </View>
        <Text style={styles.sectionTitle}>PENJAWATAN UTAMA</Text>
        {isEditing && onAdd && (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Plus size={14} color="#fff" />
            <Text style={styles.addBtnText}>Tambah</Text>
          </TouchableOpacity>
        )}
      </View>

      {categories.map((cat, index) => (
        <CategoryRow
          key={cat.id}
          cat={cat}
          index={index}
          isLast={index === categories.length - 1}
          isEditing={isEditing}
          onOpenCategory={onOpenCategory}
          onEdit={onEdit}
          onRequestDelete={requestDelete}
        />
      ))}

      <Modal visible={catToDelete !== null} transparent animationType="fade" onRequestClose={() => !isDeleting && cancelDelete()}>
        <View style={local.confirmOverlay}>
          <View style={local.confirmBox}>
            <View style={local.confirmBanner}>
              <View style={local.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={local.confirmTitle}>Padam Penjawatan</Text>
              <Text style={local.confirmSubtitle}>
                Padam "{displayDeleteCatRef.current?.name}"? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>
            <View style={local.confirmActions}>
              <TouchableOpacity
                style={[local.confirmCancelBtn, isDeleting && { opacity: 0.5 }]}
                onPress={cancelDelete}
                disabled={isDeleting}
              >
                <Text style={local.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[local.confirmConfirmBtn, isDeleting && { opacity: 0.7 }]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={local.confirmConfirmText}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const local = {
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: {
    width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
  },
  confirmBanner: { backgroundColor: '#0c0c0e', padding: 24, alignItems: 'center' },
  confirmIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  confirmTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  confirmSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: 10, padding: 20, backgroundColor: '#fff' },
  confirmCancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmCancelText: { color: '#64748b', fontWeight: '800', fontSize: 14 },
  confirmConfirmBtn: {
    flex: 1, height: 48, borderRadius: 12, backgroundColor: '#ef4444',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },
};
