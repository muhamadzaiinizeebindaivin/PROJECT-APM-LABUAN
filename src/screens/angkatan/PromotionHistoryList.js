import React from 'react';
import { View, Text } from 'react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function PromotionHistoryList({ employeeForm }) {
  // Ordre identique à l'Excel : Watikah 1 (tamat, tempoh aktif, no siri, sejarah
  // kenaikan), puis Watikah 2 (mêmes 4), puis Watikah 3 (mêmes 4) — colonnes
  // directes sur angkatan_employees (suffixées _1/_2/_3), pas de regroupement.
  const fields = [];
  [1, 2, 3].forEach((n) => {
    fields.push(
      { label: `Tarikh Tamat Watikah ${n}`, value: employeeForm[`tarikh_tamat_watikah_${n}`] },
      { label: `Tempoh Aktif Watikah ${n} (Hari)`, value: employeeForm[`tempoh_aktif_watikah_hari_${n}`] != null ? `${employeeForm[`tempoh_aktif_watikah_hari_${n}`]} hari` : null },
      { label: `No. Siri Watikah Kenaikan Pangkat ${n}`, value: employeeForm[`no_siri_watikah_${n}`] },
      { label: `Sejarah Kenaikan Pegawai Pasukan ${n}`, value: employeeForm[`tarikh_kenaikan_pangkat_${n}`] },
    );
  });

  return (
    <View>
      {fields.map((f) => (
        <View key={f.label} style={{ marginBottom: 18 }}>
          <Text style={styles.fieldLabel}>{f.label}</Text>
          <View style={styles.fieldReadOnlyBox}>
            <Text style={styles.fieldValue}>{f.value || '-'}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}