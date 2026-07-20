import React, { useRef, useState, createElement } from 'react';
import { View, Text, TouchableOpacity, Image, Platform, ActivityIndicator, Modal } from 'react-native';
import { Upload, Trash2, ImageIcon, X, Maximize2 } from 'lucide-react-native';
import { supabaseSandbox } from '../../supabaseSandboxClient';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

const STORAGE_BUCKET = 'pentadbiran-assets';

export default function OrgChartPhoto({ isEditing, canEdit, url, onChangeUrl, onSaveUrl }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  const handlePickFile = () => {
    if (Platform.OS === 'web' && fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = Platform.OS === 'web'
      ? window.confirm('Adakah anda pasti mahu memuat naik gambar carta organisasi ini?')
      : true;

    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const path = `carta-organisasi/${Date.now()}-${file.name}`;
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    onChangeUrl('');
    if (onSaveUrl) await onSaveUrl('');
  };

  return (
    <View style={styles.orgChartWrap}>
      {url ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setFullscreen(true)}>
          <Image source={{ uri: url }} style={styles.orgChartImage} resizeMode="contain" />
          <View style={styles.orgChartZoomHint}>
            <Maximize2 size={12} color="#fff" />
            <Text style={styles.orgChartZoomHintText}>Klik untuk besarkan</Text>
          </View>
        </TouchableOpacity>
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

      {!!error && <Text style={styles.orgChartError}>{error}</Text>}

      {Platform.OS === 'web' && canEdit &&
        createElement('input', {
          ref: fileInputRef,
          type: 'file',
          accept: 'image/*',
          style: { display: 'none' },
          onChange: handleFileChange,
        })
      }

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