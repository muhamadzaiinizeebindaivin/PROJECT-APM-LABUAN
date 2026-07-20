import React from 'react';
import { View } from 'react-native';
import { Activity, ShieldCheck } from 'lucide-react-native';
import StatCard from '../../components/StatCard';
import { logistikStyles as styles } from './logistikStyles';
import { PALETTE } from '../../constants/palette';

const themeForStatCard = { card: PALETTE.cardLight, text: PALETTE.textDark, textSecondary: PALETTE.textMutedDark };

export default function StatsRow({ totalAssets, readinessPercent }) {
  return (
    <View style={styles.row}>
      <StatCard
        theme={themeForStatCard}
        icon={Activity}
        iconColor={PALETTE.blue}
        iconBgColor={PALETTE.blueSoft}
        value={totalAssets}
        label="Total Aset"
      />
      <StatCard
        theme={themeForStatCard}
        icon={ShieldCheck}
        iconColor={readinessPercent === 100 ? '#16a34a' : PALETTE.orange}
        iconBgColor={readinessPercent === 100 ? '#f0fdf4' : PALETTE.orangeSoft}
        value={`${readinessPercent}%`}
        label="Siap Siaga"
      />
    </View>
  );
}