import React, { useState, useEffect, useRef, createElement } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Modal } from 'react-native';
import { PALETTE } from '../../constants/palette';
import { FileText, Upload, X, Check } from 'lucide-react-native';
import { supabaseSandbox as supabase } from '../../supabaseSandboxClient';
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
        html, body { margin: 0; padding: 0; height: 100%; background-color: #ffffff; overflow: hidden; }
        #viewport { width: 100%; height: 100%; overflow: hidden; position: relative; }
        #track {
          display: flex; height: 100%; will-change: transform; position: relative; z-index: 1;
          opacity: 0; transition: opacity 0.2s ease;
        }
        #track.ready { opacity: 1; }
        .pageSlide {
          flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
          box-sizing: border-box; overflow: hidden; visibility: hidden;
        }
        .pageSlide.activeSlide { visibility: visible; }
        canvas { display: block; }
        #dots {
          position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
          display: flex; justify-content: center; align-items: center; gap: 6px;
          padding: 6px 10px; border-radius: 999px;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          z-index: 5;
        }
        .dot {
          width: 8px; height: 8px; border-radius: 4px;
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(0,0,0,0.08);
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .dot.active { background: #f97316; border-color: #f97316; width: 22px; }
      </style>
    </head>
    <body>
      <div id="viewport">
        <div id="track"></div>
        <div id="dots"></div>
      </div>
      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js';

        var currentPdfDoc = null;
        var currentIndex = 0;
        var totalPages = 1;
        var autoSlideTimer = null;
        var slideWidthPx = 0;
        var slideHeightPx = 0;
        var resizeTimer = null;

        function renderAllPages(pdfDoc) {
          currentPdfDoc = pdfDoc;
          totalPages = pdfDoc.numPages;
          currentIndex = 0;

          buildDots(totalPages);
          layoutAndRenderAll();
          startAutoSlide();
        }

        // Recalcule les dimensions du cadre + redessine toutes les pages à la nouvelle échelle
        function layoutAndRenderAll() {
          if (!currentPdfDoc) return;

          var viewportEl = document.getElementById('viewport');
          slideWidthPx = viewportEl.clientWidth || 800; // lu AVANT toute écriture DOM, évite un reflow forcé

          var track = document.getElementById('track');
          track.classList.remove('ready'); // masque le track pendant le recalcul, évite tout flash

          track.innerHTML = '';
          track.style.transitionProperty = 'opacity'; // pas de transition sur transform pendant le rebuild
          track.style.width = (slideWidthPx * totalPages) + 'px';
          track.style.transform = 'translateX(-' + (currentIndex * slideWidthPx) + 'px)';

          for (var i = 0; i < totalPages; i++) {
            var slide = document.createElement('div');
            slide.className = 'pageSlide' + (i === currentIndex ? ' activeSlide' : '');
            slide.style.width = slideWidthPx + 'px';
            slide.style.height = slideHeightPx + 'px';
            slide.dataset.pageNum = i + 1;
            track.appendChild(slide);
          }

          window.parent.postMessage(JSON.stringify({ type: 'RENDER_START' }), '*');

          renderSinglePage(currentPdfDoc, 1).then(function() {
            window.parent.postMessage(JSON.stringify({ type: 'HEIGHT_READY', height: slideHeightPx }), '*');

            var pagePromises = [];
            for (var p = 2; p <= totalPages; p++) {
              pagePromises.push(renderSinglePage(currentPdfDoc, p));
            }
            Promise.all(pagePromises).then(function() {
              requestAnimationFrame(function() {
                track.style.transitionProperty = 'transform, opacity';
                track.classList.add('ready');
              });
              window.parent.postMessage(JSON.stringify({ type: 'ALL_PAGES_RENDERED' }), '*');
            });
          });
        }

        function renderSinglePage(pdfDoc, pageNum) {
          return pdfDoc.getPage(pageNum).then(function(page) {
            var unscaled = page.getViewport({ scale: 1 });
            // Échelle calée sur la largeur uniquement : la page remplit toute la largeur du cadre
            var scale = slideWidthPx / unscaled.width;
            var viewport = page.getViewport({ scale: scale });

            if (pageNum === 1) {
              slideHeightPx = viewport.height; // hauteur du cadre = hauteur réelle de la page 1 à cette largeur
            }

            var canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            var slide = document.querySelector('.pageSlide[data-page-num="' + pageNum + '"]');
            if (slide) {
              slide.innerHTML = '';
              slide.appendChild(canvas);
              slide.style.height = viewport.height + 'px';
            }

            return page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
          });
        }

        function buildDots(count) {
          var dotsWrap = document.getElementById('dots');
          dotsWrap.innerHTML = '';
          if (count <= 1) return;
          for (var i = 0; i < count; i++) {
            var dot = document.createElement('div');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', (function(idx) {
              return function() { goToSlide(idx); restartAutoSlide(); };
            })(i));
            dotsWrap.appendChild(dot);
          }
        }

        function goToSlide(index) {
          // index absolu : permet d'avancer ET de revenir en arrière en un clic
          currentIndex = ((index % totalPages) + totalPages) % totalPages;
          var track = document.getElementById('track');
          track.style.transform = 'translateX(-' + (currentIndex * slideWidthPx) + 'px)';

          var slides = track.children;
          for (var s = 0; s < slides.length; s++) {
            slides[s].classList.toggle('activeSlide', s === currentIndex);
          }

          var dots = document.getElementById('dots').children;
          for (var i = 0; i < dots.length; i++) {
            dots[i].className = 'dot' + (i === currentIndex ? ' active' : '');
          }
        }

        function startAutoSlide() {
          if (totalPages <= 1) return;
          stopAutoSlide();
          autoSlideTimer = setInterval(function() {
            goToSlide(currentIndex + 1);
          }, 5000);
        }

        function stopAutoSlide() {
          if (autoSlideTimer) clearInterval(autoSlideTimer);
          autoSlideTimer = null;
        }

        function restartAutoSlide() {
          stopAutoSlide();
          startAutoSlide();
        }

        // Redimensionnement de la fenêtre (y compris zoom navigateur) : on ne redessine PAS le PDF,
        // on redimensionne juste les canvas déjà rendus en CSS — pas de flash/refresh visible.
        function softResizeAll() {
          if (!currentPdfDoc) return;
          var viewportEl = document.getElementById('viewport');
          var newWidth = viewportEl.clientWidth || slideWidthPx;
          if (!newWidth || newWidth === slideWidthPx) return;

          var ratio = newWidth / slideWidthPx;
          slideWidthPx = newWidth;
          slideHeightPx = slideHeightPx * ratio;

          var track = document.getElementById('track');
          track.style.width = (slideWidthPx * totalPages) + 'px';
          track.style.transform = 'translateX(-' + (currentIndex * slideWidthPx) + 'px)';

          var slides = track.children;
          for (var i = 0; i < slides.length; i++) {
            slides[i].style.width = slideWidthPx + 'px';
            slides[i].style.height = slideHeightPx + 'px';
            var canvas = slides[i].querySelector('canvas');
            if (canvas) {
              canvas.style.width = slideWidthPx + 'px';
              canvas.style.height = slideHeightPx + 'px';
            }
          }

          window.parent.postMessage(JSON.stringify({ type: 'HEIGHT_READY', height: slideHeightPx }), '*');
        }

        window.addEventListener('resize', function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(softResizeAll, 100);
        });

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

export default function HomepagePdfCard({ theme, userRole, isEditing, onHeightChange }) {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const PDF_ASPECT_RATIO = 1197 / 673;

  const [iframeReady, setIframeReady] = useState(false);
  const [renderingPages, setRenderingPages] = useState(false);
  const [pdfHeight, setPdfHeight] = useState(null);
  const [containerWidth, setContainerWidth] = useState(null);

  const estimatedHeight = containerWidth ? containerWidth / PDF_ASPECT_RATIO : null;
  const displayHeight = pdfHeight || estimatedHeight;

  // ── État de l'aperçu avant confirmation d'upload ──
  const [previewFile, setPreviewFile] = useState(null);
  const [previewBuffer, setPreviewBuffer] = useState(null);
  const [confirmReplaceVisible, setConfirmReplaceVisible] = useState(false);
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
        if (data.type === 'PDF_LOADED' || data.type === 'RENDER_START') {
          setPreviewRenderingPages(true);
        } else if (data.type === 'HEIGHT_READY') {
          if (data.height) setPreviewHeight(data.height);
        } else if (data.type === 'ALL_PAGES_RENDERED') {
          setPreviewRenderingPages(false);
        } else if (data.type === 'PDF_ERROR') {
          setPreviewRenderingPages(false);
        }
        return;
      }

      if (data.type === 'PDF_LOADED' || data.type === 'RENDER_START') {
        setRenderingPages(true);
      } else if (data.type === 'HEIGHT_READY') {
        if (data.height) {
          setPdfHeight(data.height);
          if (pdfData?.file_url) loadedPdfCache.set(pdfData.file_url, data.height);
        }
      } else if (data.type === 'ALL_PAGES_RENDERED') {
        setRenderingPages(false);
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
        setPdfHeight(cachedHeight);
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
      setConfirmReplaceVisible(true);
      return;
    }

    await uploadFile(previewFile);
    closePreview();
  };

  const handleConfirmReplace = async () => {
    setConfirmReplaceVisible(false);
    await uploadFile(previewFile);
    closePreview();
  };

  // Fait remonter la hauteur exacte du bloc PDF (contenu + bordure de feedCard) dès qu'elle change,
  // pour que HomeScreen puisse synchroniser la hauteur des deux cartes d'adresse sans approximation.
  useEffect(() => {
    if (pdfData?.file_url && displayHeight) {
      onHeightChange?.(displayHeight + 2); // +2 = borderWidth:1 (haut + bas) de feedCard
    }
  }, [displayHeight, pdfData?.file_url, onHeightChange]);

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
  const canEdit = userRole === 'admin' && isEditing;

  return (
    <View style={styles.feedCard}>
      {/* ── Bouton admin flottant ── */}
      {canEdit && (
        <TouchableOpacity style={styles.uploadBtnFloating} onPress={handlePickFile}>
          <Upload size={13} color="#fff" />
          <Text style={styles.uploadBtnText}>{hasDocument ? 'Ganti PDF' : 'Muat Naik'}</Text>
        </TouchableOpacity>
      )}

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
        <View
          style={[styles.pageContainer, displayHeight ? { height: displayHeight } : null]}
          onLayout={(e) => {
            if (!containerWidth) setContainerWidth(e.nativeEvent.layout.width);
          }}
        >
          {renderingPages && (
            <View style={styles.pageLoader}>
              <ActivityIndicator color="#1E3A8A" />
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

      {/* Modal confirmation remplacement PDF */}
      <Modal visible={confirmReplaceVisible} transparent animationType="fade" onRequestClose={() => setConfirmReplaceVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmBanner}>
              <View style={styles.confirmIconCircle}>
                <Upload size={26} color={PALETTE.orange} />
              </View>
              <Text style={styles.confirmTitle}>Ganti Dokumen PDF</Text>
              <Text style={styles.confirmSubtitle}>
                Ini akan menggantikan dokumen sedia ada ("{pdfData?.file_name}"). Teruskan?
              </Text>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmReplaceVisible(false)}>
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmConfirmBtn} onPress={handleConfirmReplace} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Check size={16} color="#fff" />
                    <Text style={styles.confirmConfirmText}>Ganti</Text>
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
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    overflow: 'hidden', position: 'relative', borderRadius: 18,
  },
  uploadBtnFloating: {
    position: 'absolute', top: 12, right: 12, zIndex: 6,
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#22c55e',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#22c55e',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  uploadBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  errorText: { color: '#dc2626', fontSize: 11, fontWeight: '600', paddingHorizontal: 20, paddingTop: 12 },

  pageContainer: { width: '100%', minHeight: 200, backgroundColor: PALETTE.cardLight, position: 'relative' },
  pageLoader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 2, backgroundColor: PALETTE.cardLight },

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

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: {
    width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
  },
  confirmBanner: { backgroundColor: '#0c0c0e', padding: 24, alignItems: 'center' },
  confirmIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(249, 115, 22, 0.15)',
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
    flex: 1, height: 48, borderRadius: 12, backgroundColor: PALETTE.orange,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});