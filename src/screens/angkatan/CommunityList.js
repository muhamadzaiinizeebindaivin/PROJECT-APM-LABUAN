import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Plus, Pencil, Trash2, HeartHandshake, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { pentadbiranStyles } from '../pentadbiran/pentadbiranStyles';

const CATEGORIES = ['TUSPA', 'KASPA', 'PISPA', 'SISPA', 'CDA'];
const CATEGORY_COLORS = {
  TUSPA: '#3b82f6',
  KASPA: '#22c55e',
  PISPA: '#8b5cf6',
  SISPA: '#ef4444',
  CDA: '#14b8a6',
};

const PAGE_SIZE = 5;

export default function CommunityList({ communityProgs, isEditing, onAdd, onEdit, onDelete }) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null); // le dernier programme ciblé — jamais vidé pendant la fermeture
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { setPage(1); }, [activeCategory]);

  const filteredProgs = communityProgs.filter((p) => p.category === activeCategory);
  const activeColor = CATEGORY_COLORS[activeCategory] || PALETTE.orange;
  const totalPages = Math.max(1, Math.ceil(filteredProgs.length / PAGE_SIZE));
  const pagedProgs = filteredProgs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRowSpaced}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBadge}>
            <HeartHandshake size={16} color={PALETTE.orange} />
          </View>
          <Text style={styles.sectionTitle}>PROGRAM KOMUNITI (PASUKAN APM)</Text>
        </View>
        {isEditing && (
          <TouchableOpacity style={[commStyles.addBtn, { marginLeft: 'auto', backgroundColor: activeColor }]} onPress={() => onAdd(activeCategory)}>
            <Plus size={13} color="#fff" />
            <Text style={commStyles.addBtnText}>Tambah</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={commStyles.tabRow}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const catColor = CATEGORY_COLORS[cat] || PALETTE.orange;
          const count = communityProgs.filter((p) => p.category === cat).length;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}
              style={[
                commStyles.tabChip,
                isActive
                  ? { backgroundColor: catColor, borderColor: catColor, shadowColor: catColor, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }
                  : commStyles.tabChipInactive,
              ]}
            >
              <Text style={[commStyles.tabChipText, isActive && commStyles.tabChipTextActive]}>{cat}</Text>
              {count > 0 && (
                <View style={[commStyles.tabCount, isActive && commStyles.tabCountActive]}>
                  <Text style={[commStyles.tabCountText, isActive && commStyles.tabCountTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filteredProgs.length === 0 ? (
        <View style={commStyles.emptyBox}>
          <HeartHandshake size={24} color={PALETTE.cardLightBorder} />
          <Text style={commStyles.emptyText}>Tiada program direkodkan untuk {activeCategory}.</Text>
        </View>
      ) : (
        <>
          <View style={{ gap: 10 }}>
            {pagedProgs.map((prog) => (
              <View key={prog.id} style={commStyles.progCard}>
                <View style={[commStyles.progAccent, { backgroundColor: activeColor }]} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={commStyles.progLabel}>{prog.label}</Text>
                  <Text style={commStyles.progDetail}>{prog.detail}</Text>
                </View>
                {isEditing && (
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <TouchableOpacity onPress={() => onEdit(prog)}>
                      <Pencil size={16} color={PALETTE.orange} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setConfirmDelete(prog); setConfirmVisible(true); }}>
                      <Trash2 size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>

          {totalPages > 1 && (
            <View style={commStyles.paginationRow}>
              <TouchableOpacity
                style={[commStyles.pageBtn, page === 1 && commStyles.pageBtnDisabled]}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} color={page === 1 ? PALETTE.cardLightBorder : PALETTE.orange} />
              </TouchableOpacity>
              <Text style={commStyles.pageIndicator}>{page} / {totalPages}</Text>
              <TouchableOpacity
                style={[commStyles.pageBtn, page === totalPages && commStyles.pageBtnDisabled]}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={16} color={page === totalPages ? PALETTE.cardLightBorder : PALETTE.orange} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => !isDeleting && setConfirmVisible(false)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={pentadbiranStyles.confirmBanner}>
              <View style={pentadbiranStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>Padam Program</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                Padam program "{confirmDelete?.label}" ini? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>

            <View style={pentadbiranStyles.confirmActions}>
              <TouchableOpacity style={pentadbiranStyles.confirmCancelBtn} onPress={() => setConfirmVisible(false)} disabled={isDeleting}>
                <Text style={pentadbiranStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[pentadbiranStyles.confirmConfirmBtn, isDeleting && { opacity: 0.6 }]}
                disabled={isDeleting}
                onPress={async () => {
                  setIsDeleting(true);
                  await onDelete(confirmDelete.id);
                  setIsDeleting(false);
                  setConfirmVisible(false);
                }}
              >
                {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : <Trash2 size={16} color="#fff" />}
                <Text style={pentadbiranStyles.confirmConfirmText}>{isDeleting ? 'Memadam...' : 'Padam'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const commStyles = {
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: PALETTE.orange, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  tabRow: { gap: 8, paddingBottom: 16 },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1,
  },
  tabChipInactive: { backgroundColor: PALETTE.cardLight, borderColor: PALETTE.cardLightBorder },
  tabChipActive: {
    backgroundColor: PALETTE.orange, borderColor: PALETTE.orange,
    shadowColor: PALETTE.orange, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  tabChipText: { fontSize: 12, fontWeight: '800', color: PALETTE.textMutedDark },
  tabChipTextActive: { color: '#fff' },
  tabCount: {
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: PALETTE.cardLightBorder, alignItems: 'center', justifyContent: 'center',
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 10, fontWeight: '800', color: PALETTE.textMutedDark },
  tabCountTextActive: { color: '#fff' },

  progCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
  },
  progAccent: { width: 5, height: 38, borderRadius: 3 },
  progLabel: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark, marginBottom: 2 },
  progDetail: { fontSize: 12, color: PALETTE.textMutedDark, fontWeight: '600' },

  emptyBox: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 30 },
  emptyText: { fontSize: 13, color: PALETTE.textMutedDark, fontWeight: '600' },

  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 },
  pageBtn: { padding: 8, backgroundColor: PALETTE.surface, borderRadius: 8 },
  pageBtnDisabled: { opacity: 0.5 },
  pageIndicator: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },
};