import React from 'react';
import { View, Text } from 'react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function PromotionHistoryList({ promotionHistoryList }) {
  if (promotionHistoryList.length === 0) return null;
  return (
    <View style={{ marginTop: 15 }}>
      <Text style={{ color: PALETTE.textDark, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>Sejarah Pasukan</Text>
      {promotionHistoryList.map((p) => (
        <View key={p.id} style={styles.certRow}>
          <Text style={{ color: PALETTE.textMutedDark, fontSize: 13 }}>
            Pasukan {p.pasukan_number}: {p.no_siri_watikah || '-'} | Kenaikan: {p.tarikh_kenaikan_pangkat || '-'} | Tamat: {p.tarikh_tamat_watikah || '-'} | Tempoh Aktif: {p.tempoh_aktif_watikah_hari != null ? `${p.tempoh_aktif_watikah_hari} hari` : '-'}
          </Text>
        </View>
      ))}
    </View>
  );
}