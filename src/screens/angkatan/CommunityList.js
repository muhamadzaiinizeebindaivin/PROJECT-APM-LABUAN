import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, useWindowDimensions, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Plus, Pencil, Trash2, HeartHandshake, ChevronLeft, ChevronRight, AlertTriangle, X, FileText, Upload, Users } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { pentadbiranStyles } from '../pentadbiran/pentadbiranStyles';
import { SCHOOL_CATEGORIES, CDA_CATEGORIES } from '../../hooks/useAngkatanCommunity';
import { formatDateMY } from './employeeFieldGroups';

const CATEGORIES = ['TUSPA', 'KASPA', 'PISPA', 'SISPA', 'CDA'];
const CATEGORY_COLORS = {
  TUSPA: '#3b82f6',
  KASPA: '#22c55e',
  PISPA: '#8b5cf6',
  SISPA: '#ef4444',
  CDA: '#14b8a6',
};

const PAGE_SIZE = 5;

const MYASPA_LOOKUP_CATEGORIES = ['TUSPA', 'KASPA', 'PISPA', 'SISPA'];

export default function CommunityList({
  communityProgs, isEditing, onAdd, onEdit, onDelete,
  cdaPdfFilename, cdaPdfUploadedAt, onUploadCdaPdf, onDownloadCdaPdf, onViewMembers, getMyaspaCount,
}) {
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const handlePickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled) return;
    const file = result.assets[0];
    setUploadingPdf(true);
    const ok = await onUploadCdaPdf(file);
    setUploadingPdf(false);
    if (ok === false) Alert.alert('Ralat', 'Gagal memuat naik PDF.');
  };
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

      {CDA_CATEGORIES.includes(activeCategory) && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: PALETTE.surface, borderRadius: 10, padding: 12, marginBottom: 14,
        }}>
          <FileText size={16} color={PALETTE.orange} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.textDark }}>
              {cdaPdfFilename || 'Tiada PDF dimuat naik'}
            </Text>
            {!!cdaPdfUploadedAt && (
              <Text style={{ fontSize: 11, color: PALETTE.textMutedDark, marginTop: 2 }}>
                Dimuat naik pada {new Date(cdaPdfUploadedAt).toLocaleString('ms-MY')}
              </Text>
            )}
          </View>
          {!!cdaPdfFilename && (
            <TouchableOpacity onPress={onDownloadCdaPdf}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.blue }}>Lihat PDF</Text>
            </TouchableOpacity>
          )}
          {isEditing && (
            <TouchableOpacity
              onPress={handlePickPdf}
              disabled={uploadingPdf}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: uploadingPdf ? 0.6 : 1 }}
            >
              {uploadingPdf ? <ActivityIndicator size="small" color={PALETTE.orange} /> : <Upload size={14} color={PALETTE.orange} />}
              <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.orange }}>
                {uploadingPdf ? 'Memuat naik...' : (cdaPdfFilename ? 'Ganti PDF' : 'Muat Naik PDF')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isSchoolCategory && (
        <View style={commStyles.schoolTotalsBar}>
          <Text style={commStyles.schoolTotalsText}>
            Jumlah Lelaki: <Text style={{ fontWeight: '900' }}>{schoolTotals.lelaki}</Text>
          </Text>
          <Text style={commStyles.schoolTotalsText}>
            Jumlah Perempuan: <Text style={{ fontWeight: '900' }}>{schoolTotals.perempuan}</Text>
          </Text>
          {MYASPA_LOOKUP_CATEGORIES.includes(activeCategory) && (
            <TouchableOpacity
              onPress={() => onViewMembers(activeCategory)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Users size={14} color={PALETTE.orange} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.orange }}>
                Lihat Senarai Ahli {activeCategory} ({getMyaspaCount(activeCategory)})
              </Text>
            </TouchableOpacity>
          )}
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
                      No. Pendaftaran: {prog.no_pendaftaran || '-'} · Ditubuhkan: {formatDateMY(prog.tarikh_penubuhan) || '-'} · L: {prog.jumlah_lelaki ?? 0} P: {prog.jumlah_perempuan ?? 0} (Jumlah: {(parseInt(prog.jumlah_lelaki, 10) || 0) + (parseInt(prog.jumlah_perempuan, 10) || 0)})
                    </Text>
                  ) : CDA_CATEGORIES.includes(prog.category) ? (
                    <Text style={commStyles.progDetail}>
                      Kod: {prog.kod_cda || '-'} · No. Pendaftaran: {prog.no_pendaftaran || '-'} · Berdaftar: {formatDateMY(prog.tarikh_berdaftar) || '-'}
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
          <View style={[styles.modalContainer, { maxWidth: 720, width: '100%', maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Butiran Program Komuniti</Text>
              <TouchableOpacity onPress={() => setViewVisible(false)}>
                <X size={22} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 700 }} contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Kategori</Text>
              <View style={{ marginBottom: 16, alignItems: 'flex-start' }}>
                <View
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
                    backgroundColor: CATEGORY_COLORS[viewingProg?.category] || PALETTE.orange,
                    borderColor: CATEGORY_COLORS[viewingProg?.category] || PALETTE.orange,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>
                    {viewingProg?.category}
                  </Text>
                </View>
              </View>

              {SCHOOL_CATEGORIES.includes(viewingProg?.category) ? (
                <>
                  <Text style={styles.inputLabel}>Nama Sekolah</Text>
                  <View style={[styles.modalInput, { marginBottom: 16, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{viewingProg?.nama_sekolah || viewingProg?.tempat || '-'}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Nombor Pendaftaran</Text>
                  <View style={[styles.modalInput, { marginBottom: 16, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{viewingProg?.no_pendaftaran || '-'}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Tarikh Penubuhan</Text>
                  <View style={[styles.modalInput, { marginBottom: 16, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{formatDateMY(viewingProg?.tarikh_penubuhan) || '-'}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Jumlah Lelaki / Perempuan</Text>
                  <View style={[styles.modalInput, { marginBottom: 16, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: PALETTE.textDark }}>
                      {viewingProg?.jumlah_lelaki ?? 0} / {viewingProg?.jumlah_perempuan ?? 0}
                      {' '}(Jumlah: {(parseInt(viewingProg?.jumlah_lelaki, 10) || 0) + (parseInt(viewingProg?.jumlah_perempuan, 10) || 0)})
                    </Text>
                  </View>

                  {[
                    { gender: 'lelaki', label: 'Lelaki', tint: '#eff6ff', border: '#bfdbfe', accent: '#2563eb' },
                    { gender: 'perempuan', label: 'Perempuan', tint: '#fdf2f8', border: '#fbcfe8', accent: '#db2777' },
                  ].map(({ gender, label, tint, border, accent }) => {
                    const total = ['melayu', 'cina', 'india', 'lain'].reduce(
                      (sum, k) => sum + (parseInt(viewingProg?.[`${gender}_${k}`], 10) || 0), 0
                    );
                    return (
                      <View
                        key={gender}
                        style={{
                          backgroundColor: tint, borderWidth: 1.5, borderColor: border,
                          borderRadius: 14, padding: 14, marginBottom: 16,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Users size={15} color={accent} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: accent }}>{label}</Text>
                          </View>
                          <View style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: border }}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: accent }}>Jumlah: {total}</Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                          {[['melayu', 'Melayu'], ['cina', 'Cina'], ['india', 'India'], ['lain', 'Lain-lain']].map(([key, raceLabel]) => (
                            <View key={key} style={{ width: '47%' }}>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: PALETTE.textMutedDark, marginBottom: 4 }}>{raceLabel}</Text>
                              <View style={[styles.modalInput, { justifyContent: 'center' }]}>
                                <Text style={{ fontSize: 13, color: PALETTE.textDark }}>{viewingProg?.[`${gender}_${key}`] ?? 0}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })}

                  {!!viewingProg?.detail && (
                    <>
                      <Text style={styles.inputLabel}>Keterangan</Text>
                      <View style={[styles.modalInput, { minHeight: 80, marginBottom: 16 }]}>
                        <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{viewingProg?.detail}</Text>
                      </View>
                    </>
                  )}
                </>
              ) : CDA_CATEGORIES.includes(viewingProg?.category) ? (
                <>
                  <Text style={styles.inputLabel}>Kod CDA</Text>
                  <View style={{ marginBottom: 16, alignItems: 'flex-start' }}>
                    <View style={[styles.pickerChip, styles.pickerChipActive]}>
                      <Text style={[styles.pickerChipText, styles.pickerChipTextActive]}>{viewingProg?.kod_cda || '-'}</Text>
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Nombor Pendaftaran</Text>
                  <View style={[styles.modalInput, { marginBottom: 16, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{viewingProg?.no_pendaftaran || '-'}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Nama Pasukan</Text>
                  <View style={[styles.modalInput, { marginBottom: 16, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{viewingProg?.nama_pasukan || viewingProg?.tempat || '-'}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Nama Organisasi</Text>
                  <View style={[styles.modalInput, { marginBottom: 16, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{viewingProg?.nama_organisasi || '-'}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Tempoh Sah Penubuhan</Text>
                  <View style={[styles.modalInput, { marginBottom: 16, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{viewingProg?.tempoh_sah_penubuhan || '-'}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Tarikh Berdaftar</Text>
                  <View style={[styles.modalInput, { marginBottom: 16, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{formatDateMY(viewingProg?.tarikh_berdaftar) || '-'}</Text>
                  </View>

                  {!!viewingProg?.detail && (
                    <>
                      <Text style={styles.inputLabel}>Keterangan</Text>
                      <View style={[styles.modalInput, { minHeight: 80, marginBottom: 16 }]}>
                        <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{viewingProg?.detail}</Text>
                      </View>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Tempat</Text>
                  <View style={[styles.modalInput, { marginBottom: 16, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{viewingProg?.tempat || '-'}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Keterangan</Text>
                  <View style={[styles.modalInput, { minHeight: 80, marginBottom: 16 }]}>
                    <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{viewingProg?.detail}</Text>
                  </View>
                </>
              )}
            </ScrollView>
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