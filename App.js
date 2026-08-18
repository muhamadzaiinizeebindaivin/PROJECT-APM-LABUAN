import React, { useState, useRef, useEffect } from 'react';
import { View, StatusBar, Platform, useWindowDimensions, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, Orbitron_600SemiBold, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';

import { ROLE_PERMISSIONS } from './src/permissions';
import { themes } from './theme';

import { useAuthSession } from './src/hooks/useAuthSession';
import { useBackButtonGuard } from './src/hooks/useBackButtonGuard';
import { supabaseSandbox } from './src/supabaseSandboxClient';

import LoginModal from './src/components/LoginModal';
import LogoutModal from './src/components/LogoutModal';
import SemakStatusModal from './src/components/SemakStatusModal';

import AuthFlow from './src/navigation/AuthFlow';
import DepartmentFlow from './src/navigation/DepartmentFlow';
import DriverFlow from './src/navigation/DriverFlow';
import GuestFlow from './src/navigation/GuestFlow';
import AgencyFlow from './src/navigation/AgencyFlow';
import OperasiFlow from './src/navigation/OperasiFlow';

import PublicNg999Form from './src/screens/PublicNg999Form';
import SetPasswordScreen from './src/screens/SetPasswordScreen';
import KemaskiniDataPage from './src/screens/angkatan/KemaskiniDataPage';

export default function App() {
  const { width: appWidth } = useWindowDimensions();
  const isMobile = appWidth < 768;
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigationRef = useRef(null);
  const theme = isDarkMode ? themes.dark : themes.light;

  // Tracking d'affluence global : une ligne insérée à chaque ouverture du
  // site (peu importe la route ou si la personne se connecte ensuite), plus
  // une présence Realtime pour le décompte "en ligne maintenant". Fait une
  // seule fois par onglet, dès le montage — voir useSiteVisitorStats.js
  // pour la lecture de ces stats côté Admin.
  useEffect(() => {
    supabaseSandbox.from('site_visits').insert([{}]).then(({ error }) => {
      if (error) console.error('[site_visits insert error]', error);
    });
  }, []);

  const {
    userRole, isCheckingSession,
    logoutModalVisible, setLogoutModalVisible,
    handleLogin, handleLogout, confirmLogout,
    setUserRole, setAgencyInfo,
  } = useAuthSession();

  useBackButtonGuard(userRole, setUserRole, setAgencyInfo);

  const [isInvitedUser, setIsInvitedUser] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Inter_400Regular,
    Inter_500Medium,
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('type=invite') || hash.includes('type=recovery')) {
        setIsInvitedUser(true);
      }
    }
  }, []);

  // Formulaire public (lien partagé au personnel de terrain, avec code d'accès)
  const isPublicNg999Route = Platform.OS === 'web' && typeof window !== 'undefined' &&
    window.location.search.includes('lapor=ng999');

  // Page Kemaskini Data Anggota, ouverte dans un nouvel onglet depuis
  // AngkatanScreen — page à part pour ne jamais afficher les données
  // d'employé par-dessus la liste dans l'onglet principal. Nécessite d'être
  // connecté (admin/angkatan) : vérifié plus bas, après le chargement de la session.
  const isKemaskiniRoute = Platform.OS === 'web' && typeof window !== 'undefined' &&
    window.location.search.includes('kemaskini=data');

  if (isInvitedUser) {
    return (
      <View style={{ flex: 1 }}>
        <SetPasswordScreen
          onGoToLogin={() => {
            window.location.hash = '';
            setIsInvitedUser(false);
          }}
        />
      </View>
    );
  }

  if (isPublicNg999Route) {
    return <PublicNg999Form />;
  }

  if (isCheckingSession || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (isKemaskiniRoute) {
    return (
      <View style={{ flex: 1 }}>
        <KemaskiniDataPage />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <LoginModal
          visible={loginModalVisible}
          onClose={() => setLoginModalVisible(false)}
          isMobile={isMobile}
          handleLogin={handleLogin}
          onOpenSemakStatus={() => setStatusModalVisible(true)}
        />

        <LogoutModal
          visible={logoutModalVisible}
          onCancel={() => setLogoutModalVisible(false)}
          onConfirm={confirmLogout}
        />

        <SemakStatusModal
          visible={statusModalVisible}
          onClose={() => setStatusModalVisible(false)}
        />

        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        {!userRole ? <AuthFlow theme={theme} handleLogin={handleLogin} /> :
        ROLE_PERMISSIONS[userRole] ? (
          <DepartmentFlow
            userRole={userRole}
            theme={theme}
            handleLogin={handleLogin}
            handleLogout={handleLogout}
            onLoginPress={() => setLoginModalVisible(true)}
            navigationRef={navigationRef}
          />
        ) :
        userRole === 'driver' ? <DriverFlow theme={theme} handleLogout={handleLogout} /> :
        userRole === 'operasi_lapor' ? <OperasiFlow theme={theme} handleLogout={handleLogout} /> :
        userRole === 'agency' ? <AgencyFlow theme={theme} handleLogout={handleLogout} /> :
        <GuestFlow theme={theme} handleLogout={handleLogout} onLoginPress={() => setLoginModalVisible(true)} />}
      </NavigationContainer>
    </>
  );
}