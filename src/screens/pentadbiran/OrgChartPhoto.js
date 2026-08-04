import React, { useRef, useState, createElement } from 'react';
import { View, Text, TouchableOpacity, Image, Platform, ActivityIndicator, Modal, useWindowDimensions } from 'react-native';
import { Upload, Trash2, ImageIcon, X, Maximize2, AlertTriangle } from 'lucide-react-native';
import { supabaseSandbox } from '../../supabaseSandboxClient';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

const STORAGE_BUCKET = 'pentadbiran-assets';

const MAX_ORG_CHART_WIDTH = 1100;

export default function OrgChartPhoto({ isEditing, canEdit, url, onChangeUrl, onSaveUrl }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [confirmUploadVisible, setConfirmUploadVisible] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [containerWidth, setContainerWidth] = useState(1);
  // Ratio réel de l'image, calculé au chargement (fallback raisonnable en attendant)
  const [imgAspect, setImgAspect] = useState(1197 / 673);
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const imgWidth = isMobile ? containerWidth : Math.min(MAX_ORG_CHART_WIDTH, containerWidth);

  const handlePickFile = () => {
    if (Platform.OS === 'web' && fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setConfirmUploadVisible(true);
  };

  const cancelUpload = () => {
    setConfirmUploadVisible(false);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmUploadFile = async () => {
    const file = pendingFile;
    setConfirmUploadVisible(false);
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      // Nettoie le nom de fichier : supprime les accents, remplace tout ce qui n'est pas
      // alphanumérique/point/tiret par "_" — Supabase Storage rejette les clés avec des
      // caractères non-ASCII (accents, apostrophes typographiques) ou des espaces.
      const safeName = file.name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents (é -> e)
        .replace(/[^a-zA-Z0-9.\-]/g, '_'); // remplace le reste (espaces, apostrophes...) par "_"
      const path = `carta-organisasi/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabaseSandbox.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabaseSandbox.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const publicUrl = data.publicUrl;
      onChangeUrl(publicUrl);
      if (onSaveUrl) await onSaveUrl(publicUrl);
    } catch (err) {
      console.error('Error uploading org chart photo:', err);
      setError('Gagal memuat naik gambar.');
    } finally {
      setUploading(false);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setConfirmDeleteVisible(true);
  };

  const confirmRemove = async () => {
    setConfirmDeleteVisible(false);
    onChangeUrl('');
    if (onSaveUrl) await onSaveUrl('');
  };

  return (
    <View style={styles.orgChartWrap}>
      {!!error && <Text style={styles.orgChartError}>{error}</Text>}

      {url ? (
        <View style={{ width: '100%' }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setFullscreen(true)}
            style={{ alignSelf: isMobile ? 'stretch' : 'center' }}
          >
            <Image
              source={{ uri: url }}
              style={[styles.orgChartImage, { width: imgWidth, height: imgWidth / imgAspect }]}
              resizeMode="contain"
              onLoad={(e) => {
                const { width: w, height: h } = e.nativeEvent.source || {};
                if (w && h) setImgAspect(w / h);
              }}
            />
            <View style={styles.orgChartZoomHint}>
              <Maximize2 size={12} color="#fff" />
              <Text style={styles.orgChartZoomHintText}>Klik untuk besarkan</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.orgChartEmpty}>
          <ImageIcon size={28} color={PALETTE.textMutedDark} />
          <Text style={styles.orgChartEmptyText}>
            {canEdit ? 'Belum ada gambar carta organisasi' : 'Tiada gambar buat masa ini'}
          </Text>
        </View>
      )}

      {uploading && (
        <View style={styles.orgChartLoader}>
          <ActivityIndicator color={PALETTE.orange} />
        </View>
      )}

      {canEdit && isEditing && (
        <View style={styles.orgChartActions}>
          <TouchableOpacity style={styles.orgChartActionBtn} onPress={handlePickFile} disabled={uploading}>
            <Upload size={14} color="#fff" />
            <Text style={styles.orgChartActionBtnText}>{url ? 'Tukar Gambar' : 'Muat Naik Gambar'}</Text>
          </TouchableOpacity>

          {!!url && (
            <TouchableOpacity style={styles.orgChartDeleteBtn} onPress={handleRemove} disabled={uploading}>
              <Trash2 size={14} color="#dc2626" />
              <Text style={styles.orgChartDeleteBtnText}>Padam</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {Platform.OS === 'web' && canEdit &&
        createElement('input', {
          ref: fileInputRef,
          type: 'file',
          accept: 'image/*',
          style: { display: 'none' },
          onChange: handleFileChange,
        })
      }

      <Modal visible={confirmDeleteVisible} transparent animationType="fade" onRequestClose={() => setConfirmDeleteVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmBanner}>
              <View style={styles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={styles.confirmTitle}>Padam Gambar</Text>
              <Text style={styles.confirmSubtitle}>
                Adakah anda pasti mahu memadam gambar carta organisasi ini? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmDeleteVisible(false)}>
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmConfirmBtn} onPress={confirmRemove}>
                <Trash2 size={16} color="#fff" />
                <Text style={styles.confirmConfirmText}>Padam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmUploadVisible} transparent animationType="fade" onRequestClose={cancelUpload}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={[styles.confirmBanner, { backgroundColor: '#0c0c0e' }]}>
              <View style={[styles.confirmIconCircle, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                <Upload size={26} color={PALETTE.orange} />
              </View>
              <Text style={styles.confirmTitle}>Muat Naik Gambar</Text>
              <Text style={styles.confirmSubtitle}>
                Adakah anda pasti mahu memuat naik gambar carta organisasi ini?
              </Text>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={cancelUpload}>
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmConfirmBtn, { backgroundColor: PALETTE.orange }]} onPress={confirmUploadFile}>
                <Upload size={16} color="#fff" />
                <Text style={styles.confirmConfirmText}>Muat Naik</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={fullscreen} transparent animationType="fade" onRequestClose={() => setFullscreen(false)}>
        <View style={styles.orgChartFullscreenOverlay}>
          <TouchableOpacity style={styles.orgChartFullscreenClose} onPress={() => setFullscreen(false)}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: url }} style={styles.orgChartFullscreenImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}