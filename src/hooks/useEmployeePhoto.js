import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useEmployeePhoto() {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const pickAndUploadPhoto = async (employeeId) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Kebenaran diperlukan', 'Sila benarkan akses ke galeri foto.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return null;

    try {
      setUploadingPhoto(true);
      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );
      const response = await fetch(manipulated.uri);
      const blob = await response.blob();
      const fileName = `${employeeId || 'new'}_${Date.now()}.jpg`;
      const filePath = `photos/${fileName}`;
      const { error: uploadError } = await supabaseSandbox.storage
        .from('employee-photos')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabaseSandbox.storage.from('employee-photos').getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (error) {
      Alert.alert('Ralat Muat Naik', error.message);
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  return { uploadingPhoto, pickAndUploadPhoto };
}