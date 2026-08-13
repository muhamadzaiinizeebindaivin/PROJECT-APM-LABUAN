import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Plus, Pencil, TrendingUp, Trash2, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { pentadbiranStyles } from '../pentadbiran/pentadbiranStyles';

const STATUS_COLORS = {
  aktif: '#16a34a',
  simpanan: '#2563eb',
  bersara: '#f59e0b',
  meninggal: '#1f2937',
  senaraiHitam: '#dc2626',
  lainLain: '#94a3b8',
};
const STATUS_LABELS = {
  aktif: 'Aktif',
  simpanan: 'Simpanan',
  bersara: 'Bersara',
  meninggal: 'Meninggal',
  senaraiHitam: 'Senarai Hitam',
  lainLain: 'Lain-lain',
};

export default function PyramidChart({ pyramidStats, isEditing, onAdd, onEdit, onDelete, onReorder, onNotify }) {
  const maxTotal = Math.max(1, ...pyramidStats.map((p) => p.total || 0));
  const maxLog = Math.log(maxTotal + 1);

  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const displayDeleteItemRef = useRef(null);
  if (confirmDeleteItem !== null) displayDeleteItemRef.current = confirmDeleteItem;
  const [isDeleting, setIsDeleting] = useState(false);

  const [viewingBreakdown, setViewingBreakdown] = useState(null);
  const displayBreakdownRef = useRef(null);
  if (viewingBreakdown !== null) displayBreakdownRef.current = viewingBreakdown;

  const confirmDelete = async () => {
    const item = confirmDeleteItem;
    setIsDeleting(true);
    const ok = await onDelete(item.id);
    setIsDeleting(false);
    setConfirmDeleteItem(null);
    onNotify?.(ok === false ? 'error' : 'success', ok === false ? 'Gagal memadam struktur pangkat.' : 'Struktur pangkat berjaya dipadam.');
  };

  const movePyramidItem = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pyramidStats.length) return;
    const reordered = [...pyramidStats];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const ok = await onReorder?.(reordered);
    if (ok === false) onNotify?.('error', 'Gagal menyusun semula struktur pangkat.');
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

      {pyramidStats.map((item, index) => {
        const val = item.total || 0;
        const barWidthPercent = maxLog > 0 ? (Math.log(val + 1) / maxLog) * 100 : 0;
        const breakdown = item.statusBreakdown || { aktif: 0, simpanan: 0, bersara: 0, meninggal: 0, senaraiHitam: 0, lainLain: 0 };
        return (
          <View key={item.id} style={styles.pyramidRow}>
            {isEditing && (
              <View style={{ marginRight: 8 }}>
                <TouchableOpacity
                  onPress={() => movePyramidItem(index, -1)}
                  disabled={index === 0}
                  style={{ opacity: index === 0 ? 0.3 : 1 }}
                >
                  <ChevronUp size={13} color={PALETTE.orange} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => movePyramidItem(index, 1)}
                  disabled={index === pyramidStats.length - 1}
                  style={{ opacity: index === pyramidStats.length - 1 ? 0.3 : 1 }}
                >
                  <ChevronDown size={13} color={PALETTE.orange} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              disabled={!isEditing}
              onPress={() => onEdit(item)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={styles.pyramidLabel} numberOfLines={1}>{item.rank}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={(e) => { e.stopPropagation?.(); setViewingBreakdown(item); }}
                style={[styles.pyramidBarBg, { flexDirection: 'row', overflow: 'hidden' }]}
              >
                {val > 0 && (
                  <View style={{ width: `${Math.max(barWidthPercent, 2)}%`, flexDirection: 'row', height: '100%' }}>
                    {['aktif', 'simpanan', 'bersara', 'meninggal', 'senaraiHitam', 'lainLain'].map((key) => {
                      const segPercent = val > 0 ? (breakdown[key] / val) * 100 : 0;
                      if (segPercent <= 0) return null;
                      return (
                        <View
                          key={key}
                          style={{ width: `${segPercent}%`, height: '100%', backgroundColor: STATUS_COLORS[key] }}
                        />
                      );
                    })}
                  </View>
                )}
              </TouchableOpacity>
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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder }}>
        {['aktif', 'simpanan', 'bersara', 'meninggal', 'senaraiHitam', 'lainLain'].map((key) => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: STATUS_COLORS[key] }} />
            <Text style={{ fontSize: 11, color: PALETTE.textMutedDark, fontWeight: '600' }}>{STATUS_LABELS[key]}</Text>
          </View>
        ))}
      </View>

      <Modal visible={viewingBreakdown !== null} transparent animationType="fade" onRequestClose={() => setViewingBreakdown(null)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={[pentadbiranStyles.confirmBox, { width: '100%', maxWidth: 420 }]}>
            <View style={{ padding: 26, backgroundColor: '#fff', borderRadius: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={{ fontSize: 19, fontWeight: '800', color: PALETTE.textDark }}>
                  {displayBreakdownRef.current?.rank}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: PALETTE.orange }}>
                  Jumlah: {displayBreakdownRef.current?.total || 0}
                </Text>
              </View>
              {['aktif', 'simpanan', 'bersara', 'meninggal', 'senaraiHitam', 'lainLain'].map((key) => (
                <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: STATUS_COLORS[key] }} />
                    <Text style={{ fontSize: 15, color: PALETTE.textDark, fontWeight: '600' }}>{STATUS_LABELS[key]}</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: PALETTE.textDark }}>
                    {displayBreakdownRef.current?.statusBreakdown?.[key] ?? 0}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setViewingBreakdown(null)}
                style={{ marginTop: 20, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, backgroundColor: PALETTE.surface }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: PALETTE.textMutedDark }}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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