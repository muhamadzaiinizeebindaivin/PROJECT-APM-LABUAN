import React, { useState, useRef, useEffect, useCallback, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Modal, ActivityIndicator, Image, Platform, StyleSheet } from 'react-native';
import { FileText, Plus, Trash2, AlertTriangle, Maximize2, X, Upload } from 'lucide-react-native';
import { PDF_VIEWER_SRC } from '../../utils/pdfViewerHtml';
import { PALETTE } from '../../constants/palette';
import { appStyles as styles } from '../../styles/appStyles';
import { pentadbiranStyles } from '../pentadbiran/pentadbiranStyles';
import SectionHeader from '../pentadbiran/SectionHeader';

const CARD_GAP = 16;
const PX_PER_SECOND = 20;
const CARD_PADDING = 16; // petite marge de chaque côté, pour ne pas coller aux bords du conteneur
const MAX_CARD_WIDTH = 900; // évite un PDF/image démesurément grand sur les écrans larges

function PdfPreview({ fileUrl }) {
  const [iframeReady, setIframeReady] = useState(false);
  const [rendering, setRendering] = useState(true);
  const [height, setHeight] = useState(200);
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }
      if (data.type === 'PDF_LOADED' || data.type === 'RENDER_START') setRendering(true);
      else if (data.type === 'HEIGHT_READY') { if (data.height) setHeight(data.height); }
      else if (data.type === 'ALL_PAGES_RENDERED') setRendering(false);
      else if (data.type === 'PDF_ERROR') setRendering(false);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (iframeReady && fileUrl) {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: 'LOAD_PDF', url: fileUrl }), '*');
    }
  }, [iframeReady, fileUrl]);

  return (
    <View style={{ width: '100%', height, position: 'relative', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
      {rendering && (
        <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 2, backgroundColor: '#fff' }}>
          <ActivityIndicator color={PALETTE.orange} />
        </View>
      )}
      {createElement('iframe', {
        ref: iframeRef,
        src: PDF_VIEWER_SRC,
        style: { width: '100%', height: '100%', border: 'none', display: 'block' },
        title: 'Dokumen PDF',
        onLoad: () => setIframeReady(true),
      })}
    </View>
  );
}

function DocCard({ item, isEditing, onReplace, onDelete, width }) {
  const [fullscreen, setFullscreen] = useState(false);
  const isImage = item.file_type === 'image';

  return (
    <View style={{ width }}>
      <View style={pentadbiranStyles.orgChartWrap}>
        {isImage ? (
          <TouchableOpacity activeOpacity={0.9} onPress={() => setFullscreen(true)}>
            <Image source={{ uri: item.file_url }} style={pentadbiranStyles.orgChartImage} resizeMode="contain" />
            <View style={pentadbiranStyles.orgChartZoomHint}>
              <Maximize2 size={12} color="#fff" />
              <Text style={pentadbiranStyles.orgChartZoomHintText}>Klik untuk besarkan</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <PdfPreview fileUrl={item.file_url} />
        )}
      </View>

      {isEditing && (
        <View style={pentadbiranStyles.orgChartActions}>
          <TouchableOpacity style={pentadbiranStyles.orgChartActionBtn} onPress={() => onReplace(item)}>
            <Upload size={14} color="#fff" />
            <Text style={pentadbiranStyles.orgChartActionBtnText}>Tukar Fail</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pentadbiranStyles.orgChartDeleteBtn} onPress={() => onDelete(item)}>
            <Trash2 size={14} color="#dc2626" />
            <Text style={pentadbiranStyles.orgChartDeleteBtnText}>Padam</Text>
          </TouchableOpacity>
        </View>
      )}

      {isImage && (
        <Modal visible={fullscreen} transparent animationType="fade" onRequestClose={() => setFullscreen(false)}>
          <View style={pentadbiranStyles.orgChartFullscreenOverlay}>
            <TouchableOpacity style={pentadbiranStyles.orgChartFullscreenClose} onPress={() => setFullscreen(false)}>
              <X size={22} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: item.file_url }} style={pentadbiranStyles.orgChartFullscreenImage} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </View>
  );
}

export default function SekretariatDocumentsSection({ documents, loading, isEditing, uploading, uploadDocument, deleteDocument, onNotify }) {
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingEditItem, setPendingEditItem] = useState(null); // null = ajout, sinon = remplacement de ce document
  const [confirmSaveVisible, setConfirmSaveVisible] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const displayDeleteItemRef = useRef(null);
  if (confirmDeleteItem !== null) displayDeleteItemRef.current = confirmDeleteItem;
  const [isDeleting, setIsDeleting] = useState(false);

  const triggerFilePicker = (editItem = null) => {
    setPendingEditItem(editItem);
    if (Platform.OS === 'web' && fileInputRef.current) fileInputRef.current.click();
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setConfirmSaveVisible(true);
  };
  const cancelUpload = () => {
    setConfirmSaveVisible(false);
    setPendingFile(null);
    setPendingEditItem(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const confirmSave = async () => {
    const file = pendingFile;
    const editItem = pendingEditItem;
    setConfirmSaveVisible(false);
    const ok = await uploadDocument(file, editItem);
    setPendingFile(null);
    setPendingEditItem(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onNotify?.(ok === false ? 'error' : 'success', ok === false ? 'Gagal memuat naik dokumen.' : (editItem ? 'Fail berjaya ditukar.' : 'Dokumen berjaya ditambah.'));
  };
  const confirmDelete = async () => {
    const item = confirmDeleteItem;
    setIsDeleting(true);
    const ok = await deleteDocument(item);
    setIsDeleting(false);
    setConfirmDeleteItem(null);
    onNotify?.(ok === false ? 'error' : 'success', ok === false ? 'Gagal memadam dokumen.' : 'Dokumen berjaya dipadam.');
  };

  // ── Carrousel auto-scroll (va-et-vient), actif seulement si 2+ documents ──
  const scrollRef = useRef(null);
  const scrollXRef = useRef(0);
  const viewportWidthRef = useRef(1);
  const [viewportWidth, setViewportWidth] = useState(1);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const directionRef = useRef(1);
  const [hovered, setHovered] = useState(false);

  // Pleine largeur sur petit écran, plafonnée à MAX_CARD_WIDTH sur grand écran
  const cardWidth = Math.min(MAX_CARD_WIDTH, Math.max(1, viewportWidth - CARD_PADDING * 2));
  const contentWidth = Math.max(1, documents.length * (cardWidth + CARD_GAP) - CARD_GAP);
  const active = documents.length > 1 && !hovered;

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastFrameTimeRef.current = null;
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    const step = (timestamp) => {
      if (lastFrameTimeRef.current === null) lastFrameTimeRef.current = timestamp;
      const dt = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      const maxScroll = Math.max(0, contentWidth - viewportWidthRef.current);
      if (maxScroll <= 0) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      let next = scrollXRef.current + directionRef.current * PX_PER_SECOND * dt;
      if (next >= maxScroll) { next = maxScroll; directionRef.current = -1; }
      else if (next <= 0) { next = 0; directionRef.current = 1; }

      scrollXRef.current = next;
      scrollRef.current?.scrollTo({ x: next, animated: false });
      scrollX.setValue(next);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [contentWidth, scrollX, stopAutoScroll]);

  useEffect(() => {
    if (active) startAutoScroll();
    else stopAutoScroll();
    return stopAutoScroll;
  }, [active, startAutoScroll, stopAutoScroll]);

  return (
    <View style={pentadbiranStyles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="DOKUMEN & IMEJ" Icon={FileText} rightSlot={
          isEditing && (
            <TouchableOpacity style={styles.addButton} onPress={() => triggerFilePicker(null)} disabled={uploading}>
              <Upload size={16} color={PALETTE.white} />
              <Text style={styles.addButtonText}>{uploading ? 'Memuat naik...' : 'Muat Naik'}</Text>
            </TouchableOpacity>
          )
        } />
      </View>

      {Platform.OS === 'web' && isEditing &&
        createElement('input', {
          ref: fileInputRef,
          type: 'file',
          accept: '.pdf,.jpg,.jpeg,.png,.webp',
          style: { display: 'none' },
          onChange: handleFileChange,
        })
      }

      {loading && <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginVertical: 20 }} />}

      {!loading && documents.length === 0 && (
        <Text style={styles.emptyText}>Tiada dokumen lagi.</Text>
      )}

      {!loading && documents.length === 1 && (
        <View style={{ alignItems: 'center' }} onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}>
          <DocCard item={documents[0]} isEditing={isEditing} onReplace={triggerFilePicker} onDelete={setConfirmDeleteItem} width={cardWidth} />
        </View>
      )}

      {!loading && documents.length > 1 && (
        <View
          onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={{ flexDirection: 'row', gap: CARD_GAP, paddingVertical: 4 }}
          >
            {documents.map((item) => (
              <DocCard key={item.id} item={item} isEditing={isEditing} onReplace={triggerFilePicker} onDelete={setConfirmDeleteItem} width={cardWidth} />
            ))}
          </ScrollView>
        </View>
      )}

      <Modal visible={confirmDeleteItem !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteItem(null)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={pentadbiranStyles.confirmBanner}>
              <View style={pentadbiranStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>Padam Dokumen</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                Padam dokumen ini{displayDeleteItemRef.current?.tajuk ? ` "${displayDeleteItemRef.current.tajuk}"` : ''}? Tindakan ini tidak boleh dibatalkan.
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

      <Modal visible={confirmSaveVisible} transparent animationType="fade" onRequestClose={cancelUpload}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={[pentadbiranStyles.confirmBanner, { backgroundColor: '#0c0c0e' }]}>
              <View style={[pentadbiranStyles.confirmIconCircle, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                <Upload size={26} color={PALETTE.orange} />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>{pendingEditItem ? 'Tukar Fail' : 'Muat Naik Dokumen'}</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                {pendingFile?.name}
              </Text>
            </View>
            <View style={pentadbiranStyles.confirmActions}>
              <TouchableOpacity style={pentadbiranStyles.confirmCancelBtn} onPress={cancelUpload}>
                <Text style={pentadbiranStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[pentadbiranStyles.confirmConfirmBtn, { backgroundColor: PALETTE.orange }]} onPress={confirmSave} disabled={uploading}>
                {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Upload size={16} color="#fff" />}
                <Text style={pentadbiranStyles.confirmConfirmText}>Muat Naik</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}