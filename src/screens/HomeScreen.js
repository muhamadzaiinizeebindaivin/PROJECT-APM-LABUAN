import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
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
  const { loading, saving, pageData, updatedAt, handleSave, updateField, restorePageData } = useHomeData(isAuthFlow);

  const editSnapshotRef = useRef(null);

  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message }
  const notificationTimeoutRef = useRef(null);
  const showNotification = (type, message) => {
    setNotification({ type, message });
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 3000);
  };
  useEffect(() => () => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
  }, []);

  const handleEditModeChange = (next) => {
    if (next) {
      editSnapshotRef.current = pageData;
    } else if (editSnapshotRef.current) {
      restorePageData(editSnapshotRef.current);
      editSnapshotRef.current = null;
    }
    setIsEditing(next);
  };

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
    if (ok) {
      editSnapshotRef.current = null; // sauvegardé : plus rien à restaurer si on ferme ensuite
      showNotification('success', 'Maklumat halaman utama telah dikemaskini.');
    } else {
      showNotification('error', 'Gagal menyimpan data.');
    }
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
            <View style={[stickyHeaderStyles.stickyHeaderCenter, { pointerEvents: 'none' }]}>
              <View style={stickyHeaderStyles.stickyHeaderDikemaskiniBadge}>
                <View style={stickyHeaderStyles.stickyHeaderDikemaskiniDot} />
                <Text style={stickyHeaderStyles.stickyHeaderDikemaskini}>DIKEMASKINI {dikemaskini}</Text>
              </View>
            </View>
          )}
          <AdminEditButton isEditMode={isEditing} setIsEditMode={handleEditModeChange} userRole={userRole} />
        </View>
      )}

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {pageData && (
          <HeroSection
            isEditing={isEditing}
            pageData={pageData}
            updateField={updateField}
            onSave={onSave}
            saving={saving}
            onNotify={showNotification}
          />
        )}

        <View style={styles.mainRow}>
          <View
            style={styles.pdfColumn}
            onLayout={(e) => setPdfCardHeight(e.nativeEvent.layout.height)}
          >
            <HomepagePdfCard
              theme={{ card: PALETTE.inkCard, text: PALETTE.white, textSecondary: PALETTE.mutedLight }}
              userRole={userRole}
              isEditing={isEditing}
              onHeightChange={setPdfCardHeight}
            />
          </View>

          {pageData && (
            <View style={[styles.sideColumn, pdfCardHeight ? { height: pdfCardHeight } : null]}>
              <InfoWidgets isEditing={isEditing} pageData={pageData} updateField={updateField} onSave={onSave} saving={saving} onNotify={showNotification} />
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}