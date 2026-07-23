import React, { useState, useEffect, useRef } from 'react';
import { View, StatusBar, TouchableOpacity, Alert, Platform, Text, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Image } from 'react-native';import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Users, CreditCard, GraduationCap, Truck, ShieldAlert, Briefcase, Info, LogOut, UserCog, ShieldCheck, Building2, Lock, User, ArrowRight, AlertCircle, X } from 'lucide-react-native';
import { PALETTE } from './src/constants/palette';
import { useFonts, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { supabaseSandbox } from './src/supabaseSandboxClient';
import { ROLE_PERMISSIONS } from './src/permissions';
import { FONTS } from './src/styles/tacticalTheme';
import CustomHeader from './src/components/CustomHeader';

// Import Screens
import AdminUserManagementScreen from './src/screens/AdminUserManagementScreen';
import PentadbiranScreen from './src/screens/PentadbiranScreen';
import AngkatanScreen from './src/screens/AngkatanScreen';
import KewanganScreen from './src/screens/KewanganScreen';
import LatihanScreen from './src/screens/LatihanScreen';
import LogistikScreen from './src/screens/LogistikScreen';
import OperasiScreen from './src/screens/OperasiScreen';
import SekretariatScreen from './src/screens/SekretariatScreen';
import HomeScreen from './src/screens/HomeScreen'; 
import DriverScreen from './src/screens/DriverScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import AgencyTrackingScreen from './src/screens/AgencyTrackingScreen';
import PublicNg999Form from './src/screens/PublicNg999Form';
import SetPasswordScreen from './src/screens/SetPasswordScreen';

import { themes } from './theme'; 

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); 


// ==========================================
// STABLE COMPONENTS (defined OUTSIDE App())
// ------------------------------------------
// These used to be defined inside App(). Every time App() re-rendered
// (e.g. setLoginModalVisible(true) when tapping "Log Masuk"), each of these
// was recreated as a brand-new function. React saw <AuthFlow/>/<GuestFlow/>/
// <DepartmentFlow/> etc. as a NEW component type on every render, so it threw
// away the whole Stack/Tab.Navigator subtree and remounted it from scratch —
// that's the "page behind the form refreshes" bug. Defining them here keeps
// their identity stable across renders; only their props change now, so
// React just re-renders them in place instead of remounting.
// ==========================================

// NOTE: CustomHeader (and its HeaderRoleBadge sub-component) now live in
// ./src/components/CustomHeader.js — see the import above. Edit that file
// (and its sibling ./src/components/customHeaderStyles.js) to change the
// header's look; it's reused by every flow (Auth/Department/Driver/Guest/
// Agency) so a change there applies everywhere at once.

function AuthFlow({ theme, handleLogin }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeScreen" options={{ title: 'Dashboard APM Labuan', headerStyle: { backgroundColor: theme.background }, headerTitleStyle: { color: theme.text, fontWeight: 'bold' } }}>
        {(props) => <HomeScreen {...props} theme={theme} isAuthFlow={true} onGuestLogin={() => handleLogin('guest')} onDriverLogin={() => handleLogin('driver')} onAgencyLogin={() => handleLogin('agency')} />}
      </Stack.Screen>
      <Stack.Screen name="SignUp" options={{ title: 'Daftar Akaun Agensi', headerStyle: { backgroundColor: theme.background }, headerTitleStyle: { color: theme.text, fontWeight: 'bold' }, headerTintColor: theme.text }}>
        {(props) => (
          <SignUpScreen
            {...props}
            theme={theme}
            onSignUpSuccess={() => props.navigation.navigate('Login')}
            onBackToLogin={() => props.navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function DepartmentFlow({ userRole, theme, handleLogin, handleLogout, onLoginPress }) {
  const sharedTabOptions = ({ route }) => ({
    headerShown: true,
    header: () => (
      <CustomHeader
        title={route.name === 'Utama' ? 'DASHBOARD APM' : route.name}
        theme={theme}
        userRole={userRole}
        onLogout={handleLogout}
        onLoginPress={onLoginPress}
      />
    ),
    tabBarStyle: { backgroundColor: theme.card, borderTopWidth: 3, borderTopColor: '#fdba74', elevation: 10, height: 65, paddingBottom: 10, paddingTop: 10 },
    tabBarActiveTintColor: '#f97316', 
    tabBarInactiveTintColor: theme.textSecondary,
    tabBarLabelStyle: { fontSize: 10, fontFamily: FONTS.bodyMedium, marginTop: 4 },
    tabBarIcon: ({ color, focused }) => {
      const icons = {
        Utama: Info, Pentadbiran: LayoutDashboard, Sekretariat: Briefcase,
        Angkatan: Users, Kewangan: CreditCard, Latihan: GraduationCap,
        Logistik: Truck, Operasi: ShieldAlert,
        'Pengurusan Akaun': UserCog,
      };
      const Icon = icons[route.name];
      return Icon ? <Icon size={24} color={color} strokeWidth={focused ? 2.5 : 2} /> : null;
    },
  });

  const TAB_CONFIG = [
    { name: 'Utama', render: (props) => <HomeScreen {...props} theme={theme} isAuthFlow={false} userRole={userRole} onDriverLogin={() => handleLogin('driver')} onAgencyLogin={() => handleLogin('agency')} onLoginPress={onLoginPress} /> },
    { name: 'Pentadbiran', options: { tabBarActiveTintColor: '#3b82f6' }, render: (props) => <PentadbiranScreen {...props} theme={theme} userRole={userRole} /> },
    { name: 'Kewangan', options: { tabBarActiveTintColor: '#3b82f6' }, render: (props) => <KewanganScreen {...props} theme={theme} userRole={userRole} /> },
    { name: 'Logistik', options: { tabBarActiveTintColor: '#3b82f6' }, render: (props) => <LogistikScreen {...props} theme={theme} userRole={userRole} /> },
    { name: 'Angkatan', options: { tabBarActiveTintColor: '#f97316' }, render: (props) => <AngkatanScreen {...props} theme={theme} userRole={userRole} /> },
    {
      name: 'Sekretariat',
      options: {
        tabBarActiveTintColor: '#f97316',
        unmountOnBlur: true,
        tabBarLabel: (userRole === 'admin' || userRole === 'sekretariat') ? 'Sekretariat' : 'Peta Bencana',
      },
      render: (props) => <SekretariatScreen {...props} theme={theme} userRole={userRole} />
    },
    { name: 'Latihan', options: { tabBarActiveTintColor: '#f97316' }, render: (props) => <LatihanScreen {...props} theme={theme} userRole={userRole} /> },
    {
      name: 'Operasi',
      options: {
        tabBarActiveTintColor: '#f97316',
        unmountOnBlur: true,
        tabBarLabel: (userRole === 'admin' || userRole === 'operasi') ? 'Operasi' : 'Peta Kecemasan',
      },
      render: (props) => <OperasiScreen {...props} theme={theme} userRole={userRole} />
    },
    { name: 'Pengurusan Akaun', options: { tabBarActiveTintColor: '#8b5cf6' }, render: (props) => <AdminUserManagementScreen {...props} theme={theme} /> },
  ];

  const allowedTabs = ROLE_PERMISSIONS[userRole] || [];
  const screens = TAB_CONFIG.filter(s => allowedTabs.includes(s.name));

  return (
    <Tab.Navigator
      initialRouteName="Utama"
      screenOptions={sharedTabOptions}
      sceneContainerStyle={{ backgroundColor: theme.background, flex: 1 }}
    >
      {screens.map(s => (
        <Tab.Screen key={s.name} name={s.name} options={s.options}>
          {s.render}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}

function DriverFlow({ theme, handleLogout }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DriverApp" options={{ header: () => <CustomHeader title="PEMANDU APM" theme={theme} userRole="driver" onLogout={handleLogout} /> }}>
        {(props) => <DriverScreen {...props} onLogout={handleLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function GuestFlow({ theme, handleLogout, onLoginPress }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GuestHome" options={{ header: () => <CustomHeader title="DASHBOARD APM" theme={theme} userRole="guest" onLogout={handleLogout} onLoginPress={onLoginPress} /> }}>
        {(props) => <HomeScreen {...props} theme={theme} isAuthFlow={false} userRole="guest" onLogout={handleLogout} onLoginPress={onLoginPress} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function AgencyFlow({ theme, handleLogout }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AgencyApp" options={{ header: () => <CustomHeader title="AGENSI" theme={theme} userRole="agency" onLogout={handleLogout} /> }}>
        {(props) => (
          <AgencyTrackingScreen
            {...props}
            onLogout={handleLogout}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? themes.dark : themes.light;

  // --- AUTHENTICATION STATE ---
  const [userRole, setUserRole] = useState('guest'); 
  const [agencyInfo, setAgencyInfo] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isInvitedUser, setIsInvitedUser] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleModalLogin = async () => {
    setLoginError('');
    if (!loginUsername || !loginPassword) { setLoginError('Sila isi nama pengguna dan kata laluan.'); return; }
    setLoginLoading(true);
    try {
      const email = loginUsername.toLowerCase().trim().includes('@') ? loginUsername.toLowerCase().trim() : `${loginUsername.toLowerCase().trim()}@apm-labuan.com`;
      const { data, error } = await supabaseSandbox.auth.signInWithPassword({ email, password: loginPassword });
      if (error) { setLoginError('Nama pengguna atau kata laluan salah.'); setLoginPassword(''); setLoginLoading(false); return; }
      const { data: profile } = await supabaseSandbox.from('profiles').select('role').eq('id', data.session.user.id).maybeSingle();
      if (!profile) { setLoginError('Akaun tiada peranan. Hubungi admin.'); await supabaseSandbox.auth.signOut(); setLoginPassword(''); setLoginLoading(false); return; }
      setLoginModalVisible(false);
      setLoginUsername('');
      setLoginPassword('');
      setTimeout(() => handleLogin(profile.role), 300);
    } catch { setLoginError('Ralat sistem. Sila cuba lagi.'); }
    finally { setLoginLoading(false); }
  };

  const closeLoginModal = () => {
    setLoginModalVisible(false);
    setLoginError('');
    setLoginUsername('');
    setLoginPassword('');
  };

  const [fontsLoaded] = useFonts({
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
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

  const handleLogin = (role, extraData = null) => {
    if (role) {
      setUserRole(role.toLowerCase().trim());
      if (extraData) {
        setAgencyInfo(extraData);
      }
    } else {
      setUserRole(null);
      setAgencyInfo(null);
    }
  };

  // --- Bouton "retour" du navigateur : ramener vers l'accueil plutôt que
  // quitter le site quand on est connecté en tant que pemandu/agensi ---
  // Ces deux flows n'ont qu'un seul écran (pas de pile de navigation interne),
  // donc sans ceci, l'historique du navigateur n'a rien à "dépiler" et le
  // bouton retour sort carrément du site.
  const userRoleRef = useRef(userRole);
  useEffect(() => { userRoleRef.current = userRole; }, [userRole]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    // Empile une entrée d'historique dédiée dès qu'on entre en mode pemandu/agensi,
    // pour que le bouton retour ait quelque chose à intercepter.
    if (userRole === 'driver' || userRole === 'agency') {
      window.history.pushState({ apmGuard: true }, '', window.location.href);
    }
  }, [userRole]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handlePopState = () => {
      if (userRoleRef.current === 'driver' || userRoleRef.current === 'agency') {
        setUserRole('guest');
        setAgencyInfo(null);
        // Réempile une entrée pour absorber d'éventuels nouveaux clics sur "retour"
        window.history.pushState({ apmGuard: true }, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Formulaire public (lien partagé au personnel de terrain, avec code d'accès)
  const isPublicNg999Route = Platform.OS === 'web' && typeof window !== 'undefined' &&
    window.location.search.includes('lapor=ng999');

  useEffect(() => {
    const restoreSession = async () => {
      // 1. Vérifie d'abord si une session "agency" (sans compte) existe en localStorage
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        const agencySession = localStorage.getItem('apm_agency_session');
        if (agencySession) {
          handleLogin('agency');
          setIsCheckingSession(false);
          return;
        }
      }

      // 2. Sinon, comportement existant (vérifie la vraie session Supabase Auth)
      const { data: { session } } = await supabaseSandbox.auth.getSession();

      if (!session) {
        setUserRole('guest');
        setIsCheckingSession(false);
        return;
      }

      const userId = session.user.id;
      const email = session.user.email;
      const cleanUsername = email.split('@')[0];

      const { data: profile } = await supabaseSandbox
        .from('profiles')
        .select('role, agency_id')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.role === 'agency') {
        const { data: agencyRow } = await supabaseSandbox
          .from('jpbd_directory')
          .select('id, agency')
          .eq('id', profile.agency_id)
          .single();

        handleLogin('agency', { 
          agencyId: agencyRow.id, 
          agencyName: agencyRow.agency,
          userId: userId,
          username: cleanUsername
        });
      } else if (profile?.role) {
        // Rôle réel vérifié en base — plus de mapping par username, plus de catch-all
        handleLogin(profile.role);
      } else {
        // Aucun profil trouvé -> pas d'accès, on ne connecte personne par défaut
        setIsCheckingSession(false);
        return;
      }

      setIsCheckingSession(false);
    };

    restoreSession();
  }, []);


  const clearAgencySessionFlag = () => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('apm_agency_session');
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    await supabaseSandbox.auth.signOut();
    clearAgencySessionFlag();
    setUserRole('guest');
    setAgencyInfo(null);
    setLogoutModalVisible(false);
  };

  // Components for Headers
  const renderHeaderLeft = () => {
    if (userRole === 'guest') {
      return (
        <View style={{ marginLeft: 15, flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setLoginModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PALETTE.orange, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <ShieldCheck size={14} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: FONTS.bodyMedium, fontSize: 11 }}>Log Masuk</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLogin('driver')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: PALETTE.orange, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Truck size={14} color={PALETTE.orange} />
            <Text style={{ color: PALETTE.orange, fontFamily: FONTS.bodyMedium, fontSize: 11 }}>Pemandu</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLogin('agency')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: PALETTE.orange, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Building2 size={14} color={PALETTE.orange} />
            <Text style={{ color: PALETTE.orange, fontFamily: FONTS.bodyMedium, fontSize: 11 }}>Agensi</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, elevation: 2 }}>
        <LogOut size={14} color="#fff" />
        <Text style={{ color: '#fff', fontFamily: FONTS.bodyMedium, fontSize: 11, marginLeft: 6 }}>Log Keluar</Text>
      </TouchableOpacity>
    );
  };

  // NOTE: AuthFlow / DepartmentFlow / DriverFlow / GuestFlow / AgencyFlow and
  // CustomHeader now live outside App() (see above the component) so their
  // identity stays stable across re-renders — see explanation below.

  if (isInvitedUser) {
    return (
      <View style={{ flex: 1 }}>
        <SetPasswordScreen
          theme={theme}
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

  // ==========================================
  // ROOT RENDER (THE FIX: ONLY ONE CONTAINER)
  // ==========================================
  return (
    <NavigationContainer>
      <Modal visible={loginModalVisible} transparent animationType="fade" onRequestClose={closeLoginModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 560, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20, borderRadius: 24 }}>

            {/* Bandeau header sombre */}
            <View style={{ backgroundColor: '#0c0c0e', padding: 24, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: PALETTE.orange, letterSpacing: 2, textTransform: 'uppercase' }}>APM W.P LABUAN</Text>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 3 }}>Log Masuk Portal</Text>
                  <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Sistem Pengurusan APM W.P Labuan</Text>
                </View>
                <TouchableOpacity onPress={closeLoginModal} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Formulaire */}
            <View style={{ padding: 24, gap: 14, backgroundColor: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: '#f8fafc' }}>
                  <User size={17} color="#94a3b8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a', outlineStyle: 'none' }}
                    placeholder="Nama Pengguna atau E-mel"
                    placeholderTextColor="#94a3b8"
                    value={loginUsername}
                    onChangeText={setLoginUsername}
                    autoCapitalize="none"
                    editable={!loginLoading}
                  />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: '#f8fafc' }}>
                  <Lock size={17} color="#94a3b8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a', outlineStyle: 'none' }}
                    placeholder="Kata Laluan"
                    placeholderTextColor="#94a3b8"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry
                    returnKeyType="done"
                    editable={!loginLoading}
                    onSubmitEditing={handleModalLogin}
                  />
                </View>

                {loginError ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' }}>
                    <AlertCircle size={14} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700', flex: 1 }}>{loginError}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={handleModalLogin}
                  disabled={loginLoading}
                  style={{ backgroundColor: PALETTE.orange, borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loginLoading ? 0.7 : 1, marginTop: 2 }}
                >
                  {loginLoading
                    ? <ActivityIndicator color="#fff" />
                    : <><Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Log Masuk</Text><ArrowRight size={18} color="#fff" /></>
                  }
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>ATAU MASUK SEBAGAI</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
              </View>

              {/* Pemandu & Agensi */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => { handleLogin('driver'); setLoginModalVisible(false); }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: PALETTE.orange, borderRadius: 12, height: 48 }}
                >
                  <Truck size={16} color={PALETTE.orange} />
                  <Text style={{ color: PALETTE.orange, fontWeight: '800', fontSize: 14 }}>Pemandu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { handleLogin('agency'); setLoginModalVisible(false); }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: PALETTE.orange, borderRadius: 12, height: 48 }}
                >
                  <Building2 size={16} color={PALETTE.orange} />
                  <Text style={{ color: PALETTE.orange, fontWeight: '800', fontSize: 14 }}>Agensi</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={logoutModalVisible} transparent animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 }}>

            {/* Bandeau header sombre, même esprit que la modale de login */}
            <View style={{ backgroundColor: '#0c0c0e', padding: 24, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <LogOut size={26} color="#ef4444" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>Log Keluar</Text>
              <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
                Adakah anda pasti mahu log keluar daripada portal SediaOps?
              </Text>
            </View>

            {/* Boutons */}
            <View style={{ flexDirection: 'row', gap: 10, padding: 20, backgroundColor: '#fff' }}>
              <TouchableOpacity
                onPress={() => setLogoutModalVisible(false)}
                style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#64748b', fontWeight: '800', fontSize: 14 }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmLogout}
                style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <LogOut size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Log Keluar</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      {!userRole ? <AuthFlow theme={theme} handleLogin={handleLogin} /> :
      ROLE_PERMISSIONS[userRole] ? (
        <DepartmentFlow
          userRole={userRole}
          theme={theme}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
          onLoginPress={() => setLoginModalVisible(true)}
        />
      ) :
      userRole === 'driver' ? <DriverFlow theme={theme} handleLogout={handleLogout} /> :
      userRole === 'agency' ? <AgencyFlow theme={theme} handleLogout={handleLogout} /> :
      <GuestFlow theme={theme} handleLogout={handleLogout} onLoginPress={() => setLoginModalVisible(true)} />}
    </NavigationContainer>
  );
}