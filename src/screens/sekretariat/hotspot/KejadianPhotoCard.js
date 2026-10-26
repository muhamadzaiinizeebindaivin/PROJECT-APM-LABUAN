// src/screens/sekretariat/hotspot/KejadianPhotoCard.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { X, Maximize2, Camera } from 'lucide-react-native';
import { PALETTE } from '../../../constants/palette';
import { hotspotStyles } from './hotspotStyles';

export default function KejadianPhotoCard({ photoUrl, canEdit, uploading, onUpload }) {
  const [fullscreen, setFullscreen] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  if (!photoUrl) {
    return canEdit ? (
      <TouchableOpacity style={hotspotStyles.photoUploadEmpty} onPress={onUpload} disabled={uploading} activeOpacity={0.8}>
        {uploading ? <ActivityIndicator color={PALETTE.orange} /> : (
          <>
            <Camera size={28} color={PALETTE.orange} />
            <Text style={hotspotStyles.photoUploadEmptyText}>Muat Naik Gambar Kejadian Biasa</Text>
          </>
        )}
      </TouchableOpacity>
    ) : (
      <View style={hotspotStyles.photoEmptyReadOnly}>
        <Camera size={22} color={PALETTE.textMutedDark} />
        <Text style={hotspotStyles.photoEmptyReadOnlyText}>Belum ada gambar untuk kategori ini buat masa ini.</Text>
      </View>
    );
  }

  return (
    <View style={hotspotStyles.mapCard}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setFullscreen(true)} style={{ width: '100%' }}>
        <Image
          source={{ uri: photoUrl }}
          style={[hotspotStyles.mapImage, { height: isMobile ? 220 : 420 }]}
          resizeMode="contain"
        />
        <View style={hotspotStyles.mapZoomHint}>
          <Maximize2 size={12} color="#fff" />
          <Text style={hotspotStyles.mapZoomHintText}>Klik untuk besarkan</Text>
        </View>
      </TouchableOpacity>
      <Text style={hotspotStyles.mapCaption}>Gambar Kejadian Biasa</Text>

      {canEdit ? (
        <TouchableOpacity style={hotspotStyles.photoReplaceBtn} onPress={onUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator size="small" color={PALETTE.orange} /> : (
            <>
              <Camera size={14} color={PALETTE.orange} />
              <Text style={hotspotStyles.photoReplaceBtnText}>Tukar Gambar</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      <Modal visible={fullscreen} transparent animationType="fade" onRequestClose={() => setFullscreen(false)}>
        <View style={hotspotStyles.mapFullscreenOverlay}>
          <TouchableOpacity style={hotspotStyles.mapFullscreenClose} onPress={() => setFullscreen(false)}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: photoUrl }} style={hotspotStyles.mapFullscreenImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}
