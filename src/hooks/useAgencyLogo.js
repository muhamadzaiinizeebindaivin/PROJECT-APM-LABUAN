// src/hooks/useAgencyLogo.js
import { useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useAgencyLogo() {
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const pickAndUploadLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled) return null;

    try {
      setUploadingLogo(true);
      const asset = result.assets[0];
      const mimeType = asset.mimeType && asset.mimeType.startsWith('image/')
        ? asset.mimeType
        : 'image/png';
      const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
      const filePath = `logo_${Date.now()}.${ext}`;

      // Sur web, on récupère le Blob depuis l'URI ; sinon on décode le base64
      let fileBody;
      if (Platform.OS === 'web') {
        const resp = await fetch(asset.uri);
        fileBody = await resp.blob();
      } else {
        fileBody = decode(asset.base64);
      }

      const { error } = await supabaseSandbox.storage
        .from('agency-logos')
        .upload(filePath, fileBody, {
          contentType: mimeType,
          upsert: true,
        });
      if (error) throw error;

      const { data } = supabaseSandbox.storage
        .from('agency-logos')
        .getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e) {
      console.error('Upload logo error:', e);
      alert('Gagal memuat naik logo.');
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  return { pickAndUploadLogo, uploadingLogo };
}