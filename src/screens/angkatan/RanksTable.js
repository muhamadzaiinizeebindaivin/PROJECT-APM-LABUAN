import React, { useState, useRef, useEffect, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Platform, useWindowDimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ListFilter, Plus, Pencil, Trash2, HelpCircle, X, FileText, Upload, Maximize2, Clock, BookOpen, GraduationCap } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { RANK_PROMOTION_RULES } from '../../hooks/useAngkatanEmployees';
import { angkatanStyles as styles } from './angkatanStyles';
import { RANKS_PDF_VIEWER_SRC } from './ranksPdfViewerTemplate';

const HEADERS = ['PERINGKAT', 'LAYAK UBKP', 'KBP', 'KBP WARAN', 'PTB', 'AKTIF', 'SIMPANAN', 'LIHAT SENARAI PENUH'];
const NON_PROMOTABLE_RANKS = ['Prebet'];
const EXTRA_ROUTE_LABELS = { tbp: 'TBP', fastTrack: 'Fast-Track' };
// Pegawai Waran I/II ne sont pas dans RANK_PROMOTION_RULES (règles dédiées,
// hors chaîne de rangs standard) — leur nom de cours est fourni ici séparément.
const COURSE_LABEL_OVERRIDES = { 'Pegawai Waran I': 'KBP Waran', 'Pegawai Waran II': 'KBP Waran' };
const RuleChip = ({ icon: Icon, label, tone = 'default' }) => {
  const tones = {
    default: { bg: PALETTE.surface, color: PALETTE.textMutedDark },
    orange: { bg: 'rgba(249,115,22,0.12)', color: PALETTE.orange },
    green: { bg: 'rgba(22,163,74,0.12)', color: '#16a34a' },
    muted: { bg: 'rgba(148,163,184,0.15)', color: PALETTE.textMutedDark },
  };
  const t = tones[tone] || tones.default;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
      {Icon && <Icon size={12} color={t.color} />}
      <Text style={{ fontSize: 12, fontWeight: '700', color: t.color }}>{label}</Text>
    </View>
  );
};

const RuleLane = ({ label, years, course, academicNote, accent }) => (
  <View style={{ flex: 1, minWidth: 220, padding: 14, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: PALETTE.cardLightBorder }}>
    <View style={{ alignSelf: 'flex-start', backgroundColor: `${accent}1A`, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      <RuleChip icon={Clock} label={years} tone="default" />
      {course && <RuleChip icon={BookOpen} label={course} tone="default" />}
      {academicNote && <RuleChip icon={GraduationCap} label={academicNote} tone="muted" />}
    </View>
  </View>
);

const RankRuleCard = ({ title, lanes }) => (
  <View style={{ marginBottom: 4 }}>
    <Text style={{ fontSize: 16, fontWeight: '800', color: PALETTE.textDark, marginBottom: 12 }}>{title}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {lanes.map((lane) => <RuleLane key={lane.label} {...lane} />)}
    </View>
  </View>
);

export default function RanksTable({ranks, isEditing, userRole, onAdd, onEdit, onDelete, onOpenRank, onOpenPromotion, onOpenColumnList, ranksPdfFilename, ranksPdfUploadedAt, ranksPdfUrl, onUploadRanksPdf, onDownloadRanksPdf, onDeleteRanksPdf,}) {
  const canManagePdf = userRole === 'angkatan' || userRole === 'admin';
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const layakUbkpWidth = isMobile ? 260 : 180;
  const [ubkpHelpVisible, setUbkpHelpVisible] = useState(false);
  const [uploadingRanksPdf, setUploadingRanksPdf] = useState(false);
  const [confirmDeletePdf, setConfirmDeletePdf] = useState(false);
  const [isDeletingPdf, setIsDeletingPdf] = useState(false);

  const handleConfirmDeletePdf = async () => {
    setIsDeletingPdf(true);
    const ok = await onDeleteRanksPdf();
    setIsDeletingPdf(false);
    setConfirmDeletePdf(false);
    if (ok === false) Alert.alert('Ralat', 'Gagal memadam PDF.');
  };
  const [helpTab, setHelpTab] = useState('ringkas');

  const mainIframeRef = useRef(null);
  const [mainReady, setMainReady] = useState(false);
  const [mainRendering, setMainRendering] = useState(false);
  const [mainError, setMainError] = useState(null);

  const [fsVisible, setFsVisible] = useState(false);
  const fsIframeRef = useRef(null);
  const [fsReady, setFsReady] = useState(false);
  const [fsRendering, setFsRendering] = useState(false);

  const handlePickRanksPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled) return;
    const file = result.assets[0];
    setUploadingRanksPdf(true);
    const ok = await onUploadRanksPdf(file);
    setUploadingRanksPdf(false);
    if (ok === false) Alert.alert('Ralat', 'Gagal memuat naik PDF.');
  };

  // Écoute les messages du visualiseur PDF (principal ET plein écran), discriminés par event.source
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const handleMessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }
      const fromFs = event.source === fsIframeRef.current?.contentWindow;
      if (fromFs) {
        if (data.type === 'RENDER_START' || data.type === 'PDF_LOADED') setFsRendering(true);
        else if (data.type === 'ALL_PAGES_RENDERED' || data.type === 'PDF_ERROR') setFsRendering(false);
        return;
      }
      if (data.type === 'RENDER_START' || data.type === 'PDF_LOADED') { setMainRendering(true); setMainError(null); }
      else if (data.type === 'ALL_PAGES_RENDERED') setMainRendering(false);
      else if (data.type === 'PDF_ERROR') { setMainRendering(false); setMainError(data.message); }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sans ce reset, mainReady reste "true" (hérité du PDF précédent) quand
  // ranksPdfUrl change — l'effet ci-dessous enverrait alors LOAD_PDF trop tôt,
  // avant que le nouvel iframe (remonté via sa key) ait fini de charger pdf.js
  // et d'enregistrer son listener 'message' → message perdu silencieusement.
  useEffect(() => {
    setMainReady(false);
  }, [ranksPdfUrl, helpTab, ubkpHelpVisible]);

  useEffect(() => {
    if (helpTab === 'detailed' && mainReady && ranksPdfUrl) {
      mainIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: 'LOAD_PDF', url: ranksPdfUrl }), '*');
    }
  }, [helpTab, mainReady, ranksPdfUrl]);

  useEffect(() => {
    if (fsVisible && fsReady && ranksPdfUrl) {
      fsIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: 'LOAD_PDF', url: ranksPdfUrl }), '*');
    }
  }, [fsVisible, fsReady, ranksPdfUrl]);

  useEffect(() => {
    if (!fsVisible) setFsReady(false);
  }, [fsVisible]);

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRowSpaced}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBadge}>
            <ListFilter size={16} color={PALETTE.orange} />
          </View>
          <Text style={styles.sectionTitle}>LALUAN KERJAYA</Text>
        </View>
        {isEditing && (
          <TouchableOpacity style={[styles.addBtn, { marginLeft: 'auto' }]} onPress={onAdd}>
            <Plus size={13} color="#fff" />
            <Text style={styles.addBtnText}>Tambah</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
        <Text style={{ fontSize: 12, color: PALETTE.textMutedDark }}>
          <Text style={{ fontWeight: '800', color: PALETTE.textDark }}>UBKP:</Text> Ujian Bertulis Kenaikan Pangkat
        </Text>
        <Text style={{ fontSize: 12, color: PALETTE.textMutedDark }}>
          <Text style={{ fontWeight: '800', color: PALETTE.textDark }}>KBP:</Text> Kursus Bakal Pegawai
        </Text>
        <Text style={{ fontSize: 12, color: PALETTE.textMutedDark }}>
          <Text style={{ fontWeight: '800', color: PALETTE.textDark }}>PTB:</Text> Pegawai Tak Bertauliah
        </Text>
        <Text style={{ fontSize: 12, color: PALETTE.textMutedDark }}>
          <Text style={{ fontWeight: '800', color: PALETTE.textDark }}>TBP:</Text> Time Based Promotion
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll} contentContainerStyle={styles.tableScrollContent}>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            {[...HEADERS, ...(isEditing ? ['TINDAKAN'] : [])].map((h, i) => (
              h === 'LAYAK UBKP' ? (
                <View key={i} style={{ flex: 1, minWidth: layakUbkpWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, letterSpacing: 0.3 }} numberOfLines={1}>{h}</Text>
                  <TouchableOpacity onPress={() => setUbkpHelpVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <HelpCircle size={13} color={PALETTE.textMutedDark} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text key={i} style={[styles.tableHeaderCell, i === 0 && { textAlign: 'left' }]}>{h}</Text>
              )
            ))}
          </View>
          {ranks.map((item, i) => (
            <View
              key={item.id}
              style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, styles.tableCellRank]}>{item.rank}</Text>
              {NON_PROMOTABLE_RANKS.includes(item.rank) ? (
                <Text style={[styles.tableCell, { minWidth: layakUbkpWidth }]}>-</Text>
              ) : (
                <View style={[styles.tableCell, { gap: 2, minWidth: layakUbkpWidth }]}>
                  <TouchableOpacity onPress={() => onOpenPromotion(item.rank, 'eligible')}>
                    <Text style={{ color: '#16a34a', fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center', fontSize: 11 }}>
                      Layak: {item.kenaikan?.eligible ?? 0}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onOpenPromotion(item.rank, 'needsCourse')}>
                    <Text style={{ color: '#dc2626', fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center', fontSize: 11 }}>
                      Perlu Kursus ({RANK_PROMOTION_RULES[item.rank]?.course || COURSE_LABEL_OVERRIDES[item.rank] || '-'}): {item.kenaikan?.needsCourse ?? 0}
                    </Text>
                  </TouchableOpacity>
                  {item.kenaikan?.tbp !== undefined && (
                    <TouchableOpacity onPress={() => onOpenPromotion(item.rank, 'tbp')}>
                      <Text style={{ color: PALETTE.orange, fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center', fontSize: 11 }}>
                        {EXTRA_ROUTE_LABELS.tbp}: {item.kenaikan.tbp}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {item.kenaikan?.fastTrack !== undefined && (
                    <>
                      <TouchableOpacity onPress={() => onOpenPromotion(item.rank, 'fastTrackEligible')}>
                        <Text style={{ color: '#16a34a', fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center', fontSize: 11 }}>
                          {EXTRA_ROUTE_LABELS.fastTrack} — Layak: {item.kenaikan.fastTrack.eligible}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onOpenPromotion(item.rank, 'fastTrackNeedsCourse')}>
                        <Text style={{ color: '#dc2626', fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center', fontSize: 11 }}>
                          {EXTRA_ROUTE_LABELS.fastTrack} — Perlu Kursus (KBP): {item.kenaikan.fastTrack.needsCourse}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
              <TouchableOpacity style={styles.tableCell} onPress={() => onOpenColumnList(item.rank, 'kbp')}>
                <Text style={{ color: PALETTE.textDark, fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center' }}>{item.kbp}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tableCell} onPress={() => onOpenColumnList(item.rank, 'kbp_waran')}>
                <Text style={{ color: PALETTE.textDark, fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center' }}>{item.kbp_waran}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tableCell} onPress={() => onOpenColumnList(item.rank, 'ptb')}>
                <Text style={{ color: PALETTE.textDark, fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center' }}>{item.ptb}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tableCell} onPress={() => onOpenColumnList(item.rank, 'aktif')}>
                <Text style={{ color: PALETTE.textDark, fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center' }}>{item.aktif}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tableCell} onPress={() => onOpenColumnList(item.rank, 'simpanan')}>
                <Text style={{ color: PALETTE.textDark, fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center' }}>{item.simpanan}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.tableCell} onPress={() => onOpenRank(item.rank)}>
                <Text style={{ color: PALETTE.orange, fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center' }}>Lihat</Text>
              </TouchableOpacity>
              {isEditing && (
                <View style={styles.tableActionCell}>
                  <TouchableOpacity onPress={() => onEdit(item)}>
                    <Pencil size={15} color={PALETTE.orange} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(item.id)}>
                    <Trash2 size={15} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
</ScrollView>

      <Modal visible={ubkpHelpVisible} transparent animationType="fade" onRequestClose={() => setUbkpHelpVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 800, maxHeight: '85%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff' }}>
            <View style={{ backgroundColor: '#0c0c0e', padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>Cara Pengiraan LAYAK UBKP</Text>
              <TouchableOpacity onPress={() => setUbkpHelpVisible(false)}>
                <X size={26} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, padding: 24, paddingBottom: 0 }}>
              {[{ key: 'ringkas', label: 'Penerangan Ringkas' }, { key: 'detailed', label: 'Penerangan Terperinci' }].map(({ key, label }) => {
                const isActive = helpTab === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setHelpTab(key)}
                    style={[
                      { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
                      isActive ? { backgroundColor: PALETTE.orange, borderColor: PALETTE.orange } : { backgroundColor: PALETTE.surface, borderColor: PALETTE.cardLightBorder },
                    ]}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: isActive ? '#fff' : PALETTE.textMutedDark }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
              {helpTab === 'detailed' ? (
                <>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  backgroundColor: PALETTE.surface, borderRadius: 10, padding: 12, marginBottom: 20,
                }}>
                  <FileText size={16} color={PALETTE.orange} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.textDark }}>
                      {ranksPdfFilename || 'Tiada PDF dimuat naik'}
                    </Text>
                    {!!ranksPdfUploadedAt && (
                      <Text style={{ fontSize: 11, color: PALETTE.textMutedDark, marginTop: 2 }}>
                        Dimuat naik pada {new Date(ranksPdfUploadedAt).toLocaleString('ms-MY')}
                      </Text>
                    )}
                  </View>
                  {!!ranksPdfFilename && (
                    <TouchableOpacity onPress={onDownloadRanksPdf}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.blue }}>Muat Turun</Text>
                    </TouchableOpacity>
                  )}
                  {canManagePdf && (
                    <TouchableOpacity
                      onPress={handlePickRanksPdf}
                      disabled={uploadingRanksPdf}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: uploadingRanksPdf ? 0.6 : 1 }}
                    >
                      {uploadingRanksPdf ? <ActivityIndicator size="small" color={PALETTE.orange} /> : <Upload size={14} color={PALETTE.orange} />}
                      <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.orange }}>
                        {uploadingRanksPdf ? 'Memuat naik...' : (ranksPdfFilename ? 'Ganti PDF' : 'Muat Naik PDF')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {canManagePdf && !!ranksPdfFilename && (
                    <TouchableOpacity onPress={() => setConfirmDeletePdf(true)}>
                      <Trash2 size={14} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>
                {!ranksPdfUrl ? null : Platform.OS !== 'web' ? (
                  <TouchableOpacity onPress={onDownloadRanksPdf} style={{ paddingVertical: 30, alignItems: 'center' }}>
                    <Text style={{ color: PALETTE.blue, fontWeight: '700' }}>Buka PDF</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ height: 500, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: PALETTE.cardLightBorder }}>
                    <TouchableOpacity
                      onPress={() => setFsVisible(true)}
                      style={{
                        position: 'absolute', top: 10, right: 10, zIndex: 5,
                        width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Maximize2 size={14} color="#fff" />
                    </TouchableOpacity>
                    {mainRendering && (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', zIndex: 2 }}>
                        <ActivityIndicator color={PALETTE.orange} />
                      </View>
                    )}
                    {!!mainError && (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', zIndex: 2, padding: 16 }}>
                        <Text style={{ color: '#dc2626', fontSize: 12, textAlign: 'center' }}>Gagal memuatkan PDF: {mainError}</Text>
                      </View>
                    )}
                    {createElement('iframe', {
                      key: ranksPdfUrl,
                      ref: mainIframeRef,
                      src: RANKS_PDF_VIEWER_SRC,
                      style: { width: '100%', height: '100%', border: 'none', display: 'block' },
                      title: 'Penerangan Detailed PDF',
                      onLoad: () => setMainReady(true),
                    })}
                  </View>
                )}
                </>
              ) : (
                <>
              <View style={{ padding: 14, backgroundColor: '#fff7ed', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)' }}>
                <Text style={{ fontSize: 14, color: PALETTE.textDark, lineHeight: 22 }}>
                  Bilangan ini menunjukkan anggota di rang <Text style={{ fontWeight: '800' }}>satu peringkat di bawah</Text> pangkat berkenaan, yang telah memenuhi syarat tempoh perkhidmatan untuk dinaikkan pangkat. Bagi setiap rang:
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <RuleChip icon={GraduationCap} label="Layak — tempoh + kursus lengkap" tone="green" />
                  <RuleChip icon={GraduationCap} label="Perlu Kursus — tempoh cukup, kursus belum" tone="orange" />
                </View>
              </View>

              <RankRuleCard
                title="Leftenan, Kapten, Mejar"
                lanes={[{ label: 'Normal', years: '3 Tahun', course: 'KBP', academicNote: 'Tiada Syarat Akademik', accent: PALETTE.blue }]}
              />

              <RankRuleCard
                title="Leftenan Muda"
                lanes={[
                  { label: 'Normal (dari Staf Tinggi)', years: '3 Tahun', course: 'KBP', academicNote: 'Tiada Syarat Akademik', accent: PALETTE.blue },
                  { label: 'Fast-Track', years: '3 Tahun', course: 'KBP', academicNote: 'Ijazah Sarjana Muda+', accent: PALETTE.orange },
                ]}
              />

              <RankRuleCard
                title="Staf Tinggi, Staf Kanan"
                lanes={[{ label: 'Normal', years: '1 Tahun', course: 'KBP', academicNote: 'Tiada Syarat Akademik', accent: PALETTE.blue }]}
              />

              <RankRuleCard
                title="Staf Muda"
                lanes={[
                  { label: 'Normal (dari Sarjan)', years: '3 Tahun', course: 'KBP', academicNote: 'Tiada Syarat Akademik', accent: PALETTE.blue },
                  { label: 'Fast-Track', years: '3 Tahun', course: 'KBP', academicNote: 'Diploma+', accent: PALETTE.orange },
                ]}
              />

              <RankRuleCard
                title="Pegawai Waran I"
                lanes={[{ label: 'Normal (dari Pegawai Waran II) — Pangkat Plafon', years: '3 Tahun', course: 'KBP Waran', academicNote: 'Tiada Syarat Akademik', accent: PALETTE.blue }]}
              />

              <RankRuleCard
                title="Pegawai Waran II"
                lanes={[{ label: 'Normal (dari Sarjan)', years: '3 Tahun', course: 'KBP Waran', academicNote: 'Tiada Syarat Akademik', accent: PALETTE.blue }]}
              />

              <RankRuleCard
                title="Sarjan, Koperal"
                lanes={[{ label: 'Normal', years: '3 Tahun', course: 'PTB', academicNote: 'Tiada Syarat Akademik', accent: PALETTE.blue }]}
              />

              <RankRuleCard
                title="Lans Koperal"
                lanes={[
                  { label: 'Normal (dari Prebet)', years: '3 Tahun', course: 'PTB', academicNote: 'Tiada Syarat Akademik', accent: PALETTE.blue },
                  { label: 'TBP — Time Based Promotion', years: '10 Tahun', course: null, academicNote: 'Tiada Syarat Kursus/Akademik', accent: PALETTE.orange },
                ]}
              />

              <View style={{ padding: 14, backgroundColor: PALETTE.surface, borderRadius: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: PALETTE.textDark, marginBottom: 4 }}>Prebet</Text>
                <Text style={{ fontSize: 13, color: PALETTE.textMutedDark }}>
                  Sentiasa dipaparkan sebagai "-" — pangkat terendah, tiada pangkat di bawahnya.
                </Text>
              </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmDeletePdf} transparent animationType="fade" onRequestClose={() => !isDeletingPdf && setConfirmDeletePdf(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 400, borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff' }}>
            <View style={{ backgroundColor: '#0c0c0e', padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff' }}>Padam PDF</Text>
              <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
                Padam "{ranksPdfFilename}"? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, padding: 20 }}>
              <TouchableOpacity
                onPress={() => setConfirmDeletePdf(false)}
                disabled={isDeletingPdf}
                style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: PALETTE.cardLightBorder, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: PALETTE.textMutedDark, fontWeight: '700' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDeletePdf}
                disabled={isDeletingPdf}
                style={{ flex: 1, height: 44, borderRadius: 10, backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: isDeletingPdf ? 0.7 : 1 }}
              >
                {isDeletingPdf ? <ActivityIndicator size="small" color="#fff" /> : <Trash2 size={16} color="#fff" />}
                <Text style={{ color: '#fff', fontWeight: '700' }}>{isDeletingPdf ? 'Memadam...' : 'Padam'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={fsVisible} transparent animationType="fade" onRequestClose={() => setFsVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(11,12,14,0.95)', justifyContent: 'center', alignItems: 'center', padding: 10 }}>
          <TouchableOpacity
            onPress={() => setFsVisible(false)}
            style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ width: '100%', maxWidth: 900, height: '95%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
            {fsRendering && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', zIndex: 2 }}>
                <ActivityIndicator color={PALETTE.orange} />
              </View>
            )}
            {fsVisible && createElement('iframe', {
              ref: fsIframeRef,
              src: RANKS_PDF_VIEWER_SRC,
              style: { width: '100%', height: '100%', border: 'none', display: 'block' },
              title: 'Penerangan Detailed PDF (Skrin Penuh)',
              onLoad: () => setFsReady(true),
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}