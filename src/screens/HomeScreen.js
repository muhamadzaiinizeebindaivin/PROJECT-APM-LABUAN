import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Info } from 'lucide-react-native';
import AdminEditButton from '../components/AdminEditButton';
import HomepagePdfCard from '../components/HomepagePdfCard';
import AuthGate from './home/AuthGate';
import HeroSection from './home/HeroSection';
import InfoWidgets from './home/InfoWidgets';
import { homeScreenStyles as styles } from './home/homeScreenStyles';
import { useHomeData } from '../hooks/useHomeData';
import { PALETTE } from '../constants/palette';
import { ShieldCheck, Truck, Building2 } from 'lucide-react-native';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';

export default function HomeScreen({ isAuthFlow, onGuestLogin, onDriverLogin, onAgencyLogin, onLoginPress, navigation, userRole, theme }) {
  const [isEditing, setIsEditing] = useState(false);
  const [pdfCardHeight, setPdfCardHeight] = useState(null);
  const { loading, pageData, updatedAt, handleSave, updateField } = useHomeData(isAuthFlow);

  // Convertit un timestamp ISO (colonne updated_at) au format d'affichage DD/M/YYYY HH:MM
  const formatTimestamp = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${date} ${hours}:${minutes}`;
  };
  const dikemaskini = formatTimestamp(updatedAt);

  const onSave = async () => {
    const ok = await handleSave();
    if (ok) setIsEditing(false);
  };

  if (isAuthFlow) {
    return (
      <AuthGate
        navigation={navigation}
        onDriverLogin={onDriverLogin}
        onAgencyLogin={onAgencyLogin}
        onGuestLogin={onGuestLogin}
        onLoginPress={onLoginPress}
      />
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PALETTE.orange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {userRole === 'admin' && (
        <View style={stickyHeaderStyles.stickyHeader}>
          {!!dikemaskini && (
            <View style={stickyHeaderStyles.stickyHeaderCenter} pointerEvents="none">
              <Text style={stickyHeaderStyles.stickyHeaderDikemaskini}>DIKEMASKINI {dikemaskini}</Text>
            </View>
          )}
          {isEditing && (
            <TouchableOpacity style={styles.stickySaveBtn} onPress={onSave}>
              <Text style={styles.stickySaveBtnText}>💾 Simpan Perubahan</Text>
            </TouchableOpacity>
          )}
          <AdminEditButton isEditMode={isEditing} setIsEditMode={setIsEditing} userRole={userRole} />
        </View>
      )}

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {pageData && (
          <HeroSection />
        )}

        <View style={styles.mainRow}>
          <View
            style={styles.pdfColumn}
            onLayout={(e) => setPdfCardHeight(e.nativeEvent.layout.height)}
          >
            <HomepagePdfCard
              theme={{ card: PALETTE.inkCard, text: PALETTE.white, textSecondary: PALETTE.mutedLight }}
              userRole={userRole}
              onHeightChange={setPdfCardHeight}
            />
          </View>

          {pageData && (
            <View style={[styles.sideColumn, pdfCardHeight ? { height: pdfCardHeight } : null]}>
              <InfoWidgets isEditing={isEditing} pageData={pageData} updateField={updateField} />
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}