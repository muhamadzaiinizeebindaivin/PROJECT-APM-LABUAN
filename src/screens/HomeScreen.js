import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Info } from 'lucide-react-native';
import AdminEditButton from '../components/AdminEditButton';
import HomepagePdfCard from '../components/HomepagePdfCard';
import AuthGate from './home/AuthGate';
import HeroSection from './home/HeroSection';
import InfoWidgets from './home/InfoWidgets';
import AddressWidgets from './home/AddressWidgets';
import { homeScreenStyles as styles } from './home/homeScreenStyles';
import { useHomeData } from '../hooks/useHomeData';
import { PALETTE } from '../constants/palette';
import { ShieldCheck, Truck, Building2 } from 'lucide-react-native';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';

export default function HomeScreen({ isAuthFlow, onGuestLogin, onDriverLogin, onAgencyLogin, onLoginPress, navigation, userRole, theme }) {
  const [isEditing, setIsEditing] = useState(false);
  const { loading, pageData, handleSave, updateField } = useHomeData(isAuthFlow);

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
        <View style={styles.stickyHeader}>
          {!!pageData?.dikemaskini && (
            <View style={styles.stickyHeaderCenter} pointerEvents="none">
              <Text style={styles.stickyHeaderDikemaskini}>DIKEMASKINI {pageData.dikemaskini}</Text>
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
          <View style={styles.pdfColumn}>
            <HomepagePdfCard theme={{ card: PALETTE.inkCard, text: PALETTE.white, textSecondary: PALETTE.mutedLight }} userRole={userRole} />
          </View>

          {pageData && (
            <View style={styles.sideColumn}>
              <InfoWidgets isEditing={isEditing} pageData={pageData} updateField={updateField} />
            </View>
          )}
        </View>

        {pageData && (
          <AddressWidgets isEditing={isEditing} pageData={pageData} updateField={updateField} />
        )}

        <View style={styles.footerInfo}>
          <Info size={14} color={PALETTE.mutedLight} />
          <Text style={styles.footerText}>SediaOps v1.0.8 • APM Labuan Digital Unit</Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}