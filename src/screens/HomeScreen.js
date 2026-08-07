import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, ActivityIndicator } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import AdminEditButton from '../components/AdminEditButton';
import HomepagePdfCard from './home/HomepagePdfCard';
import AuthGate from './home/AuthGate';
import InfoWidgets from './home/InfoWidgets';
import { homeScreenStyles as styles } from './home/homeScreenStyles';
import ActiveAlertsBanner from './home/ActiveAlertsBanner';
import { useHomeData } from '../hooks/useHomeData';
import { PALETTE } from '../constants/palette';
import { LinearGradient } from 'expo-linear-gradient';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';

export default function HomeScreen({ isAuthFlow, onGuestLogin, onDriverLogin, onAgencyLogin, onLoginPress, navigation, userRole, theme }) {
  const [isEditing, setIsEditing] = useState(false);
  // pdfCardHeight retiré — plus besoin d'aligner la hauteur, les deux blocs sont maintenant empilés
  const [savingSection, setSavingSection] = useState(null); // 'hero' | 'addressPejabat' | 'addressPkod' | null
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
  const isConnected = !!userRole && userRole !== 'guest';

  const onSave = async (section) => {
    setSavingSection(section);
    const ok = await handleSave();
    setSavingSection(null);
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

          {notification && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                alignItems: 'center', paddingTop: 10, zIndex: 30,
              }}
            >
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '92%',
                  backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  borderWidth: 1,
                  borderColor: notification.type === 'success' ? '#bbf7d0' : '#fecaca',
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                {notification.type === 'success' ? (
                  <CheckCircle2 size={17} color="#16a34a" />
                ) : (
                  <XCircle size={17} color="#dc2626" />
                )}
                <Text
                  style={{
                    color: notification.type === 'success' ? '#166534' : '#991b1b',
                    fontWeight: '700', fontSize: 13, flexShrink: 1,
                  }}
                >
                  {notification.message}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {isConnected && (
          <View style={{ marginTop: -12 }}>
            <ActiveAlertsBanner />
          </View>
        )}

        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <LinearGradient
            colors={['rgba(29, 78, 216, 0.55)', 'rgba(249, 115, 22, 0.55)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 24, alignItems: 'center' }}
          >
            <View style={{ width: '100%', maxWidth: 1100 }}>
              <HomepagePdfCard
                theme={{ card: PALETTE.inkCard, text: PALETTE.white, textSecondary: PALETTE.mutedLight }}
                userRole={userRole}
                isEditing={isEditing}
                onHeightChange={() => {}}
              />
            </View>
          </LinearGradient>
        </View>

        {pageData && (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <InfoWidgets isEditing={isEditing} pageData={pageData} updateField={updateField} onSave={onSave} saving={saving} savingSection={savingSection} onNotify={showNotification} />
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}