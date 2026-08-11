import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Plus, Pencil, Trash2, HeartHandshake, ChevronLeft, ChevronRight, AlertTriangle, X, MapPin } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { pentadbiranStyles } from '../pentadbiran/pentadbiranStyles';
import { SCHOOL_CATEGORIES, CDA_CATEGORIES } from '../../hooks/useAngkatanCommunity';

const CATEGORIES = ['TUSPA', 'KASPA', 'PISPA', 'SISPA', 'CDA'];
const CDA_CODE_OPTIONS = Array.from({ length: 12 }, (_, i) => `CDA${String(i + 1).padStart(2, '0')}`);
const CATEGORY_COLORS = {
  TUSPA: '#3b82f6',
  KASPA: '#22c55e',
  PISPA: '#8b5cf6',
  SISPA: '#ef4444',
  CDA: '#14b8a6',
};

const PAGE_SIZE = 5;

export default function CommunityList({ communityProgs, isEditing, onAdd, onEdit, onDelete }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null); // le dernier programme ciblé — jamais vidé pendant la fermeture
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingProg, setViewingProg] = useState(null); // garde le dernier contenu — jamais vidé pendant la fermeture
  const [viewVisible, setViewVisible] = useState(false);

  useEffect(() => { setPage(1); }, [activeCategory]);

  const filteredProgs = communityProgs.filter((p) => p.category === activeCategory);
  const activeColor = CATEGORY_COLORS[activeCategory] || PALETTE.orange;
  const totalPages = Math.max(1, Math.ceil(filteredProgs.length / PAGE_SIZE));
  const pagedProgs = filteredProgs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isSchoolCategory = SCHOOL_CATEGORIES.includes(activeCategory);
  const schoolTotals = isSchoolCategory
    ? filteredProgs.reduce((acc, p) => ({
        lelaki: acc.lelaki + (parseInt(p.jumlah_lelaki, 10) || 0),
        perempuan: acc.perempuan + (parseInt(p.jumlah_perempuan, 10) || 0),
      }), { lelaki: 0, perempuan: 0 })
    : null;

  return (
    <View style={styles.card}>
      <View style={[styles.sectionHeaderRowSpaced, isMobile && { flexWrap: 'wrap', rowGap: 10 }]}>
        <View style={[styles.sectionHeaderRow, isMobile && { flexBasis: '100%' }]}>
          <View style={styles.sectionIconBadge}>
            <HeartHandshake size={16} color={PALETTE.orange} />
          </View>
          <Text style={styles.sectionTitle}>PROGRAM KOMUNITI (PASUKAN APM)</Text>
        </View>
        {isEditing && (
          <TouchableOpacity
            style={[commStyles.addBtn, isMobile ? { flexBasis: '100%', justifyContent: 'center' } : { marginLeft: 'auto' }]}
            onPress={() => onAdd(activeCategory)}
          >
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

      {isSchoolCategory && (
        <View style={commStyles.schoolTotalsBar}>
          <Text style={commStyles.schoolTotalsText}>
            Jumlah Lelaki: <Text style={{ fontWeight: '900' }}>{schoolTotals.lelaki}</Text>
          </Text>
          <Text style={commStyles.schoolTotalsText}>
            Jumlah Perempuan: <Text style={{ fontWeight: '900' }}>{schoolTotals.perempuan}</Text>
          </Text>
          <Text style={commStyles.schoolTotalsText}>
            Jumlah Keseluruhan: <Text style={{ fontWeight: '900' }}>{schoolTotals.lelaki + schoolTotals.perempuan}</Text>
          </Text>
        </View>
      )}

      {filteredProgs.length === 0 ? (
        <View style={commStyles.emptyBox}>
          <HeartHandshake size={24} color={PALETTE.cardLightBorder} />
          <Text style={commStyles.emptyText}>Tiada program direkodkan untuk {activeCategory}.</Text>
        </View>
      ) : (
        <>
          <View style={{ gap: 10 }}>
            {pagedProgs.map((prog) => (
              <TouchableOpacity
                key={prog.id}
                style={commStyles.progCard}
                activeOpacity={0.7}
                onPress={() => (isEditing ? onEdit(prog) : (setViewingProg(prog), setViewVisible(true)))}
              >
                <View style={[commStyles.progAccent, { backgroundColor: activeColor }]} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={commStyles.progLabel}>
                    {SCHOOL_CATEGORIES.includes(prog.category) ? (prog.nama_sekolah || prog.tempat)
                      : CDA_CATEGORIES.includes(prog.category) ? (prog.nama_pasukan || prog.tempat)
                      : prog.tempat}
                  </Text>
                  {SCHOOL_CATEGORIES.includes(prog.category) ? (
                    <Text style={commStyles.progDetail}>
                      No. Pendaftaran: {prog.no_pendaftaran || '-'} · Ditubuhkan: {prog.tarikh_penubuhan || '-'} · L: {prog.jumlah_lelaki ?? 0} P: {prog.jumlah_perempuan ?? 0} (Jumlah: {(parseInt(prog.jumlah_lelaki, 10) || 0) + (parseInt(prog.jumlah_perempuan, 10) || 0)})
                    </Text>
                  ) : CDA_CATEGORIES.includes(prog.category) ? (
                    <Text style={commStyles.progDetail}>
                      Kod: {prog.kod_cda || '-'} · No. Pendaftaran: {prog.no_pendaftaran || '-'} · Berdaftar: {prog.tarikh_berdaftar || '-'}
                    </Text>
                  ) : (
                    <Text style={commStyles.progDetail}>{prog.detail}</Text>
                  )}
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
              </TouchableOpacity>
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

      <Modal visible={viewVisible} transparent animationType="fade" onRequestClose={() => setViewVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[commStyles.viewCategoryBadge, { backgroundColor: CATEGORY_COLORS[viewingProg?.category] || PALETTE.orange }]}>
                  <Text style={commStyles.viewCategoryBadgeText}>{viewingProg?.category}</Text>
                </View>
                <Text style={styles.modalTitle}>{viewingProg?.tempat}</Text>
              </View>
              <TouchableOpacity onPress={() => setViewVisible(false)}>
                <X size={22} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {SCHOOL_CATEGORIES.includes(viewingProg?.category) ? (
                <>
                  <Text style={styles.inputLabel}>Nombor Pendaftaran</Text>
                  <Text style={commStyles.viewDetail}>{viewingProg?.no_pendaftaran || '-'}</Text>
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Tarikh Penubuhan</Text>
                  <Text style={commStyles.viewDetail}>{viewingProg?.tarikh_penubuhan || '-'}</Text>
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Jumlah Lelaki / Perempuan</Text>
                  <Text style={commStyles.viewDetail}>
                    {viewingProg?.jumlah_lelaki ?? 0} / {viewingProg?.jumlah_perempuan ?? 0}
                    {' '}(Jumlah: {(parseInt(viewingProg?.jumlah_lelaki, 10) || 0) + (parseInt(viewingProg?.jumlah_perempuan, 10) || 0)})
                  </Text>
                  {!!viewingProg?.detail && (
                    <>
                      <Text style={[styles.inputLabel, { marginTop: 12 }]}>Keterangan</Text>
                      <Text style={commStyles.viewDetail}>{viewingProg?.detail}</Text>
                    </>
                  )}
                </>
              ) : CDA_CATEGORIES.includes(viewingProg?.category) ? (
                <>
                  <Text style={styles.inputLabel}>Kod CDA</Text>
                  <Text style={commStyles.viewDetail}>{viewingProg?.kod_cda || '-'}</Text>
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Nombor Pendaftaran</Text>
                  <Text style={commStyles.viewDetail}>{viewingProg?.no_pendaftaran || '-'}</Text>
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Nama Organisasi</Text>
                  <Text style={commStyles.viewDetail}>{viewingProg?.nama_organisasi || '-'}</Text>
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Tempoh Sah Penubuhan</Text>
                  <Text style={commStyles.viewDetail}>{viewingProg?.tempoh_sah_penubuhan || '-'}</Text>
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Tarikh Berdaftar</Text>
                  <Text style={commStyles.viewDetail}>{viewingProg?.tarikh_berdaftar || '-'}</Text>
                  {!!viewingProg?.detail && (
                    <>
                      <Text style={[styles.inputLabel, { marginTop: 12 }]}>Keterangan</Text>
                      <Text style={commStyles.viewDetail}>{viewingProg?.detail}</Text>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Keterangan</Text>
                  <Text style={commStyles.viewDetail}>{viewingProg?.detail}</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => !isDeleting && setConfirmVisible(false)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={pentadbiranStyles.confirmBanner}>
              <View style={pentadbiranStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>Padam Program</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                Padam program "{confirmDelete?.tempat}" ini? Tindakan ini tidak boleh dibatalkan.
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
                  const tempat = confirmDelete.tempat;
                  const ok = await onDelete(confirmDelete.id);
                  setIsDeleting(false);
                  setConfirmVisible(false);
                  onNotify?.(ok ? 'success' : 'error', ok ? `"${tempat}" berjaya dipadam.` : `Gagal memadam "${tempat}".`);
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

  viewCategoryBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  viewCategoryBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  viewDetail: { fontSize: 13, color: PALETTE.textDark, lineHeight: 20, fontWeight: '600', opacity: 0.85 },

  schoolTotalsBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16,
    backgroundColor: PALETTE.surface, borderRadius: 10, padding: 12, marginBottom: 14,
  },
  schoolTotalsText: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },
};