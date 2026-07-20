import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { Save } from 'lucide-react-native';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

export default function SectionSaveButton({ onSave, urgent = false }) {
  const [saving, setSaving] = useState(false);

  const handlePress = async () => {
    setSaving(true);
    const ok = await onSave();
    setSaving(false);
    if (ok) Alert.alert('Berjaya', 'Bahagian ini telah disimpan.');
  };

  return (
    <TouchableOpacity
      style={[styles.sectionSaveBtn, urgent && styles.sectionSaveBtnUrgent]}
      onPress={handlePress}
      disabled={saving}
    >
      {saving ? <ActivityIndicator color="#fff" size="small" /> : <Save size={14} color="#fff" />}
      <Text style={styles.sectionSaveBtnText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
    </TouchableOpacity>
  );
}