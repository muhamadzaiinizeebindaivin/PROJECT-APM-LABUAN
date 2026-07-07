import React, { useState, useEffect, useRef, createElement } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Modal } from 'react-native';
import { FileText, Upload, Download, X, Check } from 'lucide-react-native';
import { supabaseSandbox as supabase } from '../supabaseSandboxClient';

const PDFJS_VERSION = '3.11.174';
const MAX_RECOMMENDED_SIZE_MB = 3;

// Cache en mémoire — survit aux remontages du composant tant que l'app reste ouverte
const loadedPdfCache = new Map(); // url -> hauteur connue

// ── HTML/JS injecté dans l'iframe, chargé depuis un CDN, hors du bundle Metro ──
const buildPdfViewerHtml = () => `
  <!DOCTYPE html>
  <html style="height: 100%; margin: 0;">
    <head>
      <meta charset="utf-8">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: #f8fafc; }
        #pagesWrap { box-sizing: border-box; width: 100%; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
        canvas { width: 100%; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div id="pagesWrap"></div>
      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js';

        function renderAllPages(pdfDoc) {
          var wrap = document.getElementById('pagesWrap');
          wrap.innerHTML = '';
          var padding = 40;
          var containerWidth = (wrap.clientWidth || 800) - padding;

          renderSinglePage(pdfDoc, 1, containerWidth, wrap).then(function() {
            window.parent.postMessage(JSON.stringify({ type: 'FIRST_PAGE_READY', height: wrap.scrollHeight }), '*');
            renderRemainingPages(pdfDoc, containerWidth, wrap);
          });
        }

        function renderRemainingPages(pdfDoc, containerWidth, wrap) {
          if (pdfDoc.numPages <= 1) {
            window.parent.postMessage(JSON.stringify({ type: 'ALL_PAGES_RENDERED', height: wrap.scrollHeight }), '*');
            return;
          }

          var pagePromises = [];
          for (var i = 2; i <= pdfDoc.numPages; i++) {
            pagePromises.push(renderSinglePage(pdfDoc, i, containerWidth, wrap));
          }

          Promise.all(pagePromises).then(function() {
            window.parent.postMessage(JSON.stringify({ type: 'ALL_PAGES_RENDERED', height: wrap.scrollHeight }), '*');
          });
        }

        function renderSinglePage(pdfDoc, pageNum, containerWidth, wrap) {
          return pdfDoc.getPage(pageNum).then(function(page) {
            var unscaled = page.getViewport({ scale: 1 });
            var scale = containerWidth / unscaled.width;
            var viewport = page.getViewport({ scale: scale });

            var canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            wrap.appendChild(canvas);

            return page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise.then(function() {
              window.parent.postMessage(JSON.stringify({ type: 'PROGRESS_HEIGHT', height: wrap.scrollHeight }), '*');
            });
          });
        }

        window.addEventListener('message', function(event) {
          var data = event.data;
          if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { return; }
          }

          if (data.type === 'LOAD_PDF') {
            pdfjsLib.getDocument(data.url).promise.then(function(doc) {
              window.parent.postMessage(JSON.stringify({ type: 'PDF_LOADED', totalPages: doc.numPages }), '*');
              renderAllPages(doc);
            }).catch(function(err) {
              window.parent.postMessage(JSON.stringify({ type: 'PDF_ERROR', message: String(err) }), '*');
            });
          } else if (data.type === 'LOAD_PDF_DATA') {
            pdfjsLib.getDocument({ data: data.buffer }).promise.then(function(doc) {
              window.parent.postMessage(JSON.stringify({ type: 'PDF_LOADED', totalPages: doc.numPages }), '*');
              renderAllPages(doc);
            }).catch(function(err) {
              window.parent.postMessage(JSON.stringify({ type: 'PDF_ERROR', message: String(err) }), '*');
            });
          }
        });
      </script>
    </body>
  </html>
`;

const PDF_VIEWER_SRC = `data:text/html;charset=utf-8,${encodeURIComponent(buildPdfViewerHtml())}`;

export default function HomepagePdfCard({ theme, userRole }) {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const [iframeReady, setIframeReady] = useState(false);
  const [renderingPages, setRenderingPages] = useState(false);
  const [viewerHeight, setViewerHeight] = useState(400);

  // ── État de l'aperçu avant confirmation d'upload ──
  const [previewFile, setPreviewFile] = useState(null);
  const [previewBuffer, setPreviewBuffer] = useState(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(400);
  const [previewRenderingPages, setPreviewRenderingPages] = useState(false);

  const fileInputRef = useRef(null);
  const iframeRef = useRef(null);
  const previewIframeRef = useRef(null);

  // ── Chargement initial + écoute des changements en temps réel ──
  useEffect(() => {
    fetchPdf();

    const subscription = supabase
      .channel('homepage_pdf_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'homepage_pdf' }, fetchPdf)
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  // ── Écoute les messages renvoyés par l'iframe principale ET l'iframe d'aperçu ──
  useEffect(() => {
    const handleMessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }

      const fromPreview = event.source === previewIframeRef.current?.contentWindow;

      if (fromPreview) {
        if (data.type === 'FIRST_PAGE_READY') {
          setPreviewRenderingPages(false);
          if (data.height) setPreviewHeight(data.height);
        } else if (data.type === 'PROGRESS_HEIGHT' || data.type === 'ALL_PAGES_RENDERED') {
          if (data.height) setPreviewHeight(data.height);
        } else if (data.type === 'PDF_ERROR') {
          setPreviewRenderingPages(false);
        }
        return;
      }

      if (data.type === 'PDF_LOADED') {
        if (!loadedPdfCache.has(pdfData?.file_url)) {
          setRenderingPages(true);
        }
      } else if (data.type === 'FIRST_PAGE_READY') {
        setRenderingPages(false);
        if (data.height) {
          setViewerHeight(data.height);
          if (pdfData?.file_url) loadedPdfCache.set(pdfData.file_url, data.height);
        }
      } else if (data.type === 'PROGRESS_HEIGHT' || data.type === 'ALL_PAGES_RENDERED') {
        if (data.height) {
          setViewerHeight(data.height);
          if (pdfData?.file_url) loadedPdfCache.set(pdfData.file_url, data.height);
        }
      } else if (data.type === 'PDF_ERROR') {
        setError('Gagal memuatkan dokumen PDF.');
        setRenderingPages(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pdfData?.file_url]);

  // ── Demande à l'iframe principale de charger le PDF actuel ──
  useEffect(() => {
    if (iframeReady && pdfData?.file_url) {
      const cachedHeight = loadedPdfCache.get(pdfData.file_url);
      if (cachedHeight) {
        setViewerHeight(cachedHeight);
        setRenderingPages(false);
      } else {
        setRenderingPages(true);
      }
      postToIframe(iframeRef, { type: 'LOAD_PDF', url: pdfData.file_url });
    }
  }, [iframeReady, pdfData?.file_url]);

  // ── Demande à l'iframe d'aperçu de charger le fichier local sélectionné ──
  useEffect(() => {
    if (previewReady && previewBuffer) {
      setPreviewRenderingPages(true);
      // Envoi "brut" (sans JSON.stringify) car un ArrayBuffer ne se sérialise pas en JSON
      postRawToIframe(previewIframeRef, { type: 'LOAD_PDF_DATA', buffer: previewBuffer });
    }
  }, [previewReady, previewBuffer]);

  const postToIframe = (ref, message) => {
    ref.current?.contentWindow?.postMessage(JSON.stringify(message), '*');
  };

  const postRawToIframe = (ref, message) => {
    ref.current?.contentWindow?.postMessage(message, '*');
  };

  const fetchPdf = async () => {
    const { data, error } = await supabase
      .from('homepage_pdf')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!error) setPdfData(data);
    setLoading(false);
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    event.target.value = ''; // permet de re-choisir le même fichier plus tard

    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Sila muat naik fail PDF sahaja.');
      return;
    }

    setError(null);
    const buffer = await file.arrayBuffer();

    setPreviewFile(file);
    setPreviewBuffer(buffer);
    setPreviewReady(false);
    setPreviewHeight(400);
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewBuffer(null);
    setPreviewReady(false);
  };

  const confirmUpload = async () => {
    if (!previewFile) return;

    const sizeMb = previewFile.size / (1024 * 1024);
    if (sizeMb > MAX_RECOMMENDED_SIZE_MB) {
      const proceedAnyway = window.confirm(
        `Fail ini bersaiz ${sizeMb.toFixed(1)} MB, lebih besar daripada saiz disyorkan (${MAX_RECOMMENDED_SIZE_MB} MB). ` +
        `Fail besar akan mengambil masa lebih lama untuk dimuatkan oleh pengguna. Teruskan juga?`
      );
      if (!proceedAnyway) return;
    }

    if (pdfData?.file_url) {
      const confirmReplace = window.confirm(
        `Ini akan menggantikan dokumen sedia ada ("${pdfData.file_name}"). Teruskan?`
      );
      if (!confirmReplace) return;
    }

    await uploadFile(previewFile);
    closePreview();
  };

  const uploadFile = async (file) => {
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: uploadError } = await supabase.storage
      .from('pdf-documents')
      .upload('current.pdf', file, { upsert: true, contentType: 'application/pdf' });

    if (uploadError) {
      setError('Gagal memuat naik: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('pdf-documents').getPublicUrl('current.pdf');

    const { error: dbError } = await supabase
      .from('homepage_pdf')
      .upsert({
        id: 1,
        file_name: file.name,
        file_url: `${urlData.publicUrl}?t=${Date.now()}`, // cache-busting
        uploaded_at: new Date().toISOString(),
        uploaded_by: user?.id,
      });

    setUploading(false);

    if (dbError) {
      setError('Gagal menyimpan rekod: ' + dbError.message);
      return;
    }

    fetchPdf();
  };

  if (loading) return null;

  const hasDocument = Boolean(pdfData?.file_url);
  const canEdit = userRole === 'admin';

  return (
    <View style={[styles.feedCard, { marginBottom: 30 }]}>
      {/* ── En-tête ── */}
      <View style={styles.feedHeader}>
        <View style={styles.feedTagContainer}>
          <FileText size={12} color="#3b82f6" />
          <Text style={styles.feedTag}>DOKUMEN RASMI</Text>
        </View>

        {canEdit && (
          <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFile}>
            <Upload size={13} color="#fff" />
            <Text style={styles.uploadBtnText}>{hasDocument ? 'Ganti PDF' : 'Muat Naik'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Input de fichier caché, uniquement web + admin */}
      {Platform.OS === 'web' && canEdit &&
        createElement('input', {
          ref: fileInputRef,
          type: 'file',
          accept: 'application/pdf',
          style: { display: 'none' },
          onChange: handleFileChange,
        })
      }

      {/* ── Contenu principal ── */}
      {!hasDocument ? (
        <EmptyState
          text={canEdit ? 'Muat naik dokumen PDF untuk dipaparkan di sini.' : 'Tiada dokumen buat masa ini.'}
        />
      ) : Platform.OS !== 'web' ? (
        <EmptyState text="Paparan PDF tidak disokong pada peranti ini." />
      ) : (
        <>
          <View style={styles.pageContainer}>
            {renderingPages && (
              <View style={styles.pageLoader}>
                <ActivityIndicator color="#1E3A8A" />
              </View>
            )}
            {createElement('iframe', {
              ref: iframeRef,
              src: PDF_VIEWER_SRC,
              style: { width: '100%', height: viewerHeight, border: 'none' },
              title: 'Dokumen PDF',
              onLoad: () => setIframeReady(true),
            })}
          </View>

          <TouchableOpacity style={styles.downloadRow} onPress={() => window.open(pdfData.file_url, '_blank')}>
            <Download size={12} color="#64748b" />
            <Text style={styles.downloadText}>{pdfData.file_name} • Muat turun</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ── Modal d'aperçu avant confirmation d'upload ── */}
      <Modal visible={Boolean(previewFile)} transparent animationType="fade" onRequestClose={closePreview}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {previewFile?.name}
              </Text>
              <TouchableOpacity onPress={closePreview}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalPagesWrap}>
              {previewRenderingPages && (
                <View style={styles.pageLoader}>
                  <ActivityIndicator color="#1E3A8A" />
                </View>
              )}
              {previewFile && Platform.OS === 'web' &&
                createElement('iframe', {
                  ref: previewIframeRef,
                  src: PDF_VIEWER_SRC,
                  style: { width: '100%', height: previewHeight, border: 'none' },
                  title: 'Pratonton Dokumen',
                  onLoad: () => setPreviewReady(true),
                })
              }
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closePreview} disabled={uploading}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmUpload} disabled={uploading}>
                {uploading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Check size={16} color="#fff" />
                    <Text style={styles.modalConfirmText}>Sahkan & Muat Naik</Text>
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

const EmptyState = ({ text }) => (
  <View style={styles.emptyContainer}>
    <FileText size={32} color="#cbd5e1" />
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  feedCard: {
    marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 8,
  },
  feedHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fafaf9',
  },
  feedTagContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedTag: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1 },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#22c55e',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  uploadBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  errorText: { color: '#dc2626', fontSize: 11, fontWeight: '600', paddingHorizontal: 20, paddingTop: 12 },

  pageContainer: { width: '100%', backgroundColor: '#f8fafc', position: 'relative' },
  pageLoader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 2, backgroundColor: '#f8fafc' },

  downloadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  downloadText: { fontSize: 11, fontWeight: '600', color: '#64748b' },

  emptyContainer: {
    width: '100%', aspectRatio: 16 / 9, backgroundColor: '#f8fafc',
    justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  emptyText: { fontSize: 12, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 30, fontWeight: '500' },

  // ── Modal d'aperçu ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: {
    width: '100%', maxWidth: 700, maxHeight: '85%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 10,
  },
  modalTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', flex: 1 },
  modalPagesWrap: { maxHeight: 500, overflowY: 'auto', backgroundColor: '#f8fafc', position: 'relative' },
  modalFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f1f5f9' },
  modalCancelText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  modalConfirmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#22c55e',
  },
  modalConfirmText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});