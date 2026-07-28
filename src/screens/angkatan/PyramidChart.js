import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Plus, Pencil, TrendingUp, Trash2, AlertTriangle } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { pentadbiranStyles } from '../pentadbiran/pentadbiranStyles';

export default function PyramidChart({ pyramidStats, isEditing, onAdd, onEdit, onDelete, onNotify }) {
  const maxTotal = Math.max(1, ...pyramidStats.map((p) => p.total || 0));
  const maxLog = Math.log(maxTotal + 1);

  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const displayDeleteItemRef = useRef(null);
  if (confirmDeleteItem !== null) displayDeleteItemRef.current = confirmDeleteItem;
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    const item = confirmDeleteItem;
    setIsDeleting(true);
    const ok = await onDelete(item.id);
    setIsDeleting(false);
    setConfirmDeleteItem(null);
    onNotify?.(ok === false ? 'error' : 'success', ok === false ? 'Gagal memadam struktur pangkat.' : 'Struktur pangkat berjaya dipadam.');
  };

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRowSpaced}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBadge}>
            <TrendingUp size={16} color={PALETTE.orange} />
          </View>
          <Text style={styles.sectionTitle}>STRUKTUR PANGKAT & KEAHLIAN</Text>
        </View>
        {isEditing && (
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={onAdd}>
            <Plus size={20} color={PALETTE.orange} />
          </TouchableOpacity>
        )}
      </View>

      {pyramidStats.map((item) => {
        const val = item.total || 0;
        const barWidthPercent = maxLog > 0 ? (Math.log(val + 1) / maxLog) * 100 : 0;
        return (
          <View key={item.id} style={styles.pyramidRow}>
            <TouchableOpacity
              disabled={!isEditing}
              onPress={() => onEdit(item)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={styles.pyramidLabel} numberOfLines={1}>{item.rank}</Text>
              <View style={styles.pyramidBarBg}>
                {val > 0 && (
                  <View style={[styles.pyramidBarFill, { width: `${Math.max(barWidthPercent, 2)}%`, backgroundColor: item.color }]} />
                )}
              </View>
              <Text style={styles.pyramidValue}>{val}</Text>
              {isEditing && <Pencil size={12} color={PALETTE.textMutedDark} style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity onPress={() => setConfirmDeleteItem(item)} style={{ marginLeft: 10 }}>
                <Trash2 size={13} color="#dc2626" />
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <Modal visible={confirmDeleteItem !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteItem(null)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={pentadbiranStyles.confirmBanner}>
              <View style={pentadbiranStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>Padam Struktur Pangkat</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                Padam pangkat ini{displayDeleteItemRef.current?.rank ? ` "${displayDeleteItemRef.current.rank}"` : ''}? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>

            <View style={pentadbiranStyles.confirmActions}>
              <TouchableOpacity style={pentadbiranStyles.confirmCancelBtn} onPress={() => setConfirmDeleteItem(null)} disabled={isDeleting}>
                <Text style={pentadbiranStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[pentadbiranStyles.confirmConfirmBtn, isDeleting && { opacity: 0.7 }]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={pentadbiranStyles.confirmConfirmText}>Padam</Text>
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