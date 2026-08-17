// src/hooks/useKejadianPhoto.js
import { useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useKejadianPhoto() {
  const [uploadingKejadianPhoto, setUploadingKejadianPhoto] = useState(false);

  const pickAndUploadKejadianPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return null;

    try {
      setUploadingKejadianPhoto(true);
      const asset = result.assets[0];
      const mimeType = asset.mimeType && asset.mimeType.startsWith('image/')
        ? asset.mimeType
        : 'image/png';
      const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
      const filePath = `kejadian_${Date.now()}.${ext}`;

      let fileBody;
      if (Platform.OS === 'web') {
        const resp = await fetch(asset.uri);
        fileBody = await resp.blob();
      } else {
        fileBody = decode(asset.base64);
      }

      const { error } = await supabaseSandbox.storage
        .from('hotspot-kejadian-photos')
        .upload(filePath, fileBody, {
          contentType: mimeType,
          upsert: true,
        });
      if (error) throw error;

      const { data } = supabaseSandbox.storage
        .from('hotspot-kejadian-photos')
        .getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e) {
      console.error('Upload kejadian photo error:', e);
      alert('Gagal memuat naik gambar.');
      return null;
    } finally {
      setUploadingKejadianPhoto(false);
    }
  };

  return { pickAndUploadKejadianPhoto, uploadingKejadianPhoto };
}