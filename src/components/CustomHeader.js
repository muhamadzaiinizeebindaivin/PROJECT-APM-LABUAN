import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, LogOut } from 'lucide-react-native';
import { FONTS } from '../styles/tacticalTheme';
import { PALETTE } from '../constants/palette';
import { customHeaderStyles as styles } from './customHeaderStyles';

// Dégradé du header : orange (marque APM) vers bleu.
// Modifie ces deux couleurs pour ajuster le dégradé.
const HEADER_GRADIENT = [PALETTE.orange, '#2563eb'];

function HeaderRoleBadge({ userRole }) {
  return (
    <View style={styles.roleBadge}>
      <View style={styles.roleBadgeDot} />
      <Text style={[styles.roleBadgeText, { fontFamily: FONTS.displayBold }]}>
        {userRole || 'GUEST'}
      </Text>
    </View>
  );
}

export default function CustomHeader({ title, theme, userRole, onLogout, onLoginPress }) {
  return (
    <LinearGradient
      colors={HEADER_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.brandRow}>
        <View style={[styles.logoWrapper, styles.logoBadge]}>
          <Image
            source={{ uri: 'https://kceeewyadcskivtmilyf.supabase.co/storage/v1/object/public/logo/apm_labuan.png' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text
          style={[styles.title, { fontFamily: FONTS.displayBold }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        {userRole === 'guest' || !userRole ? (
          <TouchableOpacity onPress={onLoginPress} style={styles.loginButton} activeOpacity={0.8}>
            <ShieldCheck size={14} color={PALETTE.orange} />
            <Text style={[styles.loginButtonText, { fontFamily: FONTS.bodyMedium }]}>
              Log Masuk
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <HeaderRoleBadge userRole={userRole} />
            <TouchableOpacity onPress={onLogout} style={styles.logoutButton} activeOpacity={0.8}>
              <LogOut size={14} color="#ef4444" />
              <Text style={[styles.logoutButtonText, { fontFamily: FONTS.bodyMedium }]}>
                Log Keluar
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </LinearGradient>
  );
}
