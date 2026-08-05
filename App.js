import React, { useState, useEffect, useRef } from 'react';
import { View, StatusBar, TouchableOpacity, Alert, Platform, Text, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Image, Animated, useWindowDimensions, Linking, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Users, CreditCard, GraduationCap, Truck, ShieldAlert, Briefcase, Info, LogOut, UserCog, ShieldCheck, Building2, Lock, User, ArrowRight, AlertCircle, X, Eye, EyeOff, CheckCircle, Menu, Search, Award, FileText, ExternalLink } from 'lucide-react-native';
import { PALETTE } from './src/constants/palette';
import { useFonts, Orbitron_600SemiBold, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
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
import LaporKesScreen from './src/screens/LaporKesScreen';
import SekretariatScreen from './src/screens/SekretariatScreen';
import HomeScreen from './src/screens/HomeScreen'; 
import DriverScreen from './src/screens/DriverScreen';
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
    </Stack.Navigator>
  );
}

const MOBILE_BREAKPOINT = 768;
const DRAWER_WIDTH = 260;

const TAB_ICONS = {
  Utama: Info, Pentadbiran: LayoutDashboard, Sekretariat: Briefcase,
  Angkatan: Users, Kewangan: CreditCard, Latihan: GraduationCap,
  Logistik: Truck, Operasi: ShieldAlert,
  Admin: UserCog,
};

function DepartmentFlow({ userRole, theme, handleLogin, handleLogout, onLoginPress, navigationRef }) {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeRouteName, setActiveRouteName] = useState('Utama');
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: drawerOpen ? 0 : -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [drawerOpen, drawerAnim]);

  const sharedTabOptions = ({ route }) => ({
    headerShown: true,
    header: () => (
      <CustomHeader
        title={route.name === 'Utama' ? 'DASHBOARD APM' : route.name}
        theme={theme}
        userRole={userRole}
        onLogout={handleLogout}
        onLoginPress={onLoginPress}
        onMenuPress={isMobile ? () => setDrawerOpen(true) : undefined}
      />
    ),
    tabBarStyle: isMobile
      ? { display: 'none' }
      : { backgroundColor: theme.card, borderTopWidth: 3, borderTopColor: '#fdba74', elevation: 10, height: 65, paddingBottom: 10, paddingTop: 10 },
    tabBarActiveTintColor: '#f97316', 
    tabBarInactiveTintColor: theme.textSecondary,
    tabBarLabelStyle: { fontSize: 10, fontFamily: FONTS.bodyMedium, marginTop: 4 },
    tabBarIcon: ({ color, focused }) => {
      const Icon = TAB_ICONS[route.name];
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
      },
      render: (props) => <SekretariatScreen {...props} theme={theme} userRole={userRole} />
    },
    { name: 'Latihan', options: { tabBarActiveTintColor: '#f97316' }, render: (props) => <LatihanScreen {...props} theme={theme} userRole={userRole} /> },
    {
      name: 'Operasi',
      options: {
        tabBarActiveTintColor: '#f97316',
        unmountOnBlur: true,
      },
      render: (props) => <OperasiScreen {...props} theme={theme} userRole={userRole} />
    },
    { name: 'Admin', options: { tabBarActiveTintColor: '#8b5cf6' }, render: (props) => <AdminUserManagementScreen {...props} /> },
  ];

  const allowedTabs = ROLE_PERMISSIONS[userRole] || [];
  const screens = TAB_CONFIG.filter(s => allowedTabs.includes(s.name));

  const navigateTo = (name) => {
    setActiveRouteName(name);
    setDrawerOpen(false);
    navigationRef?.current?.navigate(name);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="Utama"
        screenOptions={sharedTabOptions}
        sceneContainerStyle={{ backgroundColor: theme.background, flex: 1 }}
        screenListeners={{
          state: (e) => {
            const routeName = e.data?.state?.routes?.[e.data.state.index]?.name;
            if (routeName) setActiveRouteName(routeName);
          },
        }}
      >
        {screens.map(s => (
          <Tab.Screen key={s.name} name={s.name} options={s.options}>
            {s.render}
          </Tab.Screen>
        ))}
      </Tab.Navigator>

      {/* ── Menu latéral mobile (remplace la barre du bas quand elle est masquée) ── */}
      {isMobile && drawerOpen && (
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 20 }}
          activeOpacity={1}
          onPress={() => setDrawerOpen(false)}
        />
      )}
      {isMobile && (
        <Animated.View
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH,
            backgroundColor: theme.card, zIndex: 21,
            transform: [{ translateX: drawerAnim }],
            shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 12,
            paddingTop: Platform.OS === 'web' ? 20 : 50,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border || '#e2e8f0' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text }}>Menu</Text>
            <TouchableOpacity onPress={() => setDrawerOpen(false)}>
              <X size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          {screens.map((s) => {
            const Icon = TAB_ICONS[s.name];
            const isActive = activeRouteName === s.name;
            return (
              <TouchableOpacity
                key={s.name}
                onPress={() => navigateTo(s.name)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 18, paddingVertical: 14,
                  backgroundColor: isActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                  borderLeftWidth: 3, borderLeftColor: isActive ? '#f97316' : 'transparent',
                }}
              >
                {Icon && <Icon size={20} color={isActive ? '#f97316' : theme.textSecondary} strokeWidth={isActive ? 2.5 : 2} />}
                <Text style={{ fontSize: 14, fontWeight: isActive ? '800' : '600', color: isActive ? '#f97316' : theme.text }}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}
    </View>
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

function OperasiFlow({ theme, handleLogout }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OperasiApp" options={{ header: () => <CustomHeader title="LAPOR KES" theme={theme} userRole="operasi" onLogout={handleLogout} /> }}>
        {(props) => <LaporKesScreen {...props} onLogout={handleLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function App() {
  const { width: appWidth } = useWindowDimensions();
  const isMobile = appWidth < MOBILE_BREAKPOINT;
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigationRef = useRef(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  // --- SEMAK STATUS ---
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusIcInput, setStatusIcInput] = useState('');
  const [icDigits, setIcDigits] = useState(Array(12).fill(''));
  const icBoxRefs = useRef([]);

  const handleIcDigitChange = (index, text) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    setIcDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      setStatusIcInput(next.join(''));
      return next;
    });
    if (digit && index < 11) {
      icBoxRefs.current[index + 1]?.focus();
    }
  };

  const handleIcKeyPress = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !icDigits[index] && index > 0) {
      icBoxRefs.current[index - 1]?.focus();
    }
  };

  const resetIcInput = () => {
    setIcDigits(Array(12).fill(''));
    setStatusIcInput('');
  };
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [statusCooldown, setStatusCooldown] = useState(false);

  const handleForgotPassword = async () => {
    if (!loginUsername.trim()) {
      setLoginError('Sila masukkan e-mel anda.');
      return;
    }
    const email = loginUsername.toLowerCase().trim().includes('@')
      ? loginUsername.toLowerCase().trim()
      : `${loginUsername.toLowerCase().trim()}@apm-labuan.com`;

    setResetLoading(true);
    setLoginError('');
    const { error } = await supabaseSandbox.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setResetLoading(false);

    if (error) {
      setLoginError('Gagal menghantar e-mel. Sila cuba lagi.');
      return;
    }
    setResetSent(true);
  };

  const backToLogin = () => {
    setForgotPasswordMode(false);
    setResetSent(false);
    setLoginError('');
  };

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
    setForgotPasswordMode(false);
    setResetSent(false);
  };

  const handleCheckStatus = async () => {
    if (!statusIcInput.trim()) {
      setStatusError('Sila masukkan nombor kad pengenalan.');
      return;
    }
    setStatusLoading(true);
    setStatusError('');
    setStatusResult(null);
    const { data, error } = await supabaseSandbox.rpc('check_status', { p_ic_no: statusIcInput.trim() });
    setStatusLoading(false);
    if (error) {
      setStatusError('Ralat semasa semakan. Sila cuba lagi.');
      return;
    }
    if (!data) {
      setStatusError('Tiada rekod dijumpai untuk nombor kad pengenalan ini.');
      return;
    }
    setStatusResult(data);
    setStatusCooldown(true);
    setTimeout(() => setStatusCooldown(false), 5000);
  };

  const closeStatusModal = () => {
    setStatusModalVisible(false);
    resetIcInput();
    setStatusError('');
    setStatusResult(null);
  };

  const getStatusBadgeStyle = (value) => {
    if (!value) return { bg: '#f1f5f9', color: '#64748b' };
    const v = value.toLowerCase();
    if (v.includes('tidak')) return { bg: '#fef2f2', color: '#dc2626' };
    if (v.includes('aktif')) return { bg: '#f0fdf4', color: '#16a34a' };
    return { bg: '#f1f5f9', color: '#64748b' };
  };

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
      const cleanUsername = email ? email.split('@')[0] : null;

      const { data: profile } = await supabaseSandbox
        .from('profiles')
        .select('role, agency_id, username')
        .eq('id', userId)
        .maybeSingle();

      // Collision précise : une session anonyme (bouton "Operasi" / code d'accès dans
      // LaporKesScreen) a role='operasi' en base pour les besoins de RLS — mais ça ne
      // doit JAMAIS être confondu avec un vrai compte département 'operasi'. On ne
      // cible QUE ce cas précis ici : les autres rôles anonymes ('driver' notamment)
      // n'entrent en collision avec rien et suivent le chemin normal plus bas.
      if (session.user.is_anonymous && profile?.role === 'operasi') {
        handleLogin('operasi_lapor');
        setIsCheckingSession(false);
        return;
      }

      if (profile?.role === 'agency') {
        if (!profile.agency_id) {
          // Profil agency incomplet (agency_id manquant) — on ne peut pas restaurer proprement
          setUserRole('guest');
          setIsCheckingSession(false);
          return;
        }

        const { data: agencyRow, error: agencyError } = await supabaseSandbox
          .from('jpbd_directory')
          .select('id, agency')
          .eq('id', profile.agency_id)
          .maybeSingle();

        if (agencyError || !agencyRow) {
          setUserRole('guest');
          setIsCheckingSession(false);
          return;
        }

        handleLogin('agency', { 
          agencyId: agencyRow.id, 
          agencyName: agencyRow.agency,
          userId: userId,
          username: cleanUsername || profile.username
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
    <NavigationContainer ref={navigationRef}>
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
                {!forgotPasswordMode && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: '#f8fafc' }}>
                    <Lock size={17} color="#94a3b8" style={{ marginRight: 10 }} />
                    <TextInput
                      style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a', outlineStyle: 'none' }}
                      placeholder="Kata Laluan"
                      placeholderTextColor="#94a3b8"
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry={!showLoginPassword}
                      returnKeyType="done"
                      editable={!loginLoading}
                      onSubmitEditing={handleModalLogin}
                    />
                    <TouchableOpacity onPress={() => setShowLoginPassword((v) => !v)} style={{ paddingLeft: 8 }}>
                      {showLoginPassword ? <EyeOff size={17} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity onPress={() => (forgotPasswordMode ? backToLogin() : setForgotPasswordMode(true))} style={{ alignSelf: 'flex-end' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.orange }}>
                    {forgotPasswordMode ? '← Kembali ke Log Masuk' : 'Lupa kata laluan?'}
                  </Text>
                </TouchableOpacity>

                {resetSent ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' }}>
                    <CheckCircle size={14} color="#16a34a" />
                    <Text style={{ color: '#166534', fontSize: 12, fontWeight: '700', flex: 1 }}>
                      E-mel tetapan semula kata laluan telah dihantar. Sila semak peti masuk anda.
                    </Text>
                  </View>
                ) : null}

                {loginError ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' }}>
                    <AlertCircle size={14} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700', flex: 1 }}>{loginError}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={forgotPasswordMode ? handleForgotPassword : handleModalLogin}
                  disabled={forgotPasswordMode ? resetLoading : loginLoading}
                  style={{ backgroundColor: PALETTE.orange, borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (forgotPasswordMode ? resetLoading : loginLoading) ? 0.7 : 1, marginTop: 2 }}
                >
                  {forgotPasswordMode ? (
                    resetLoading
                      ? <ActivityIndicator color="#fff" />
                      : <><Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Hantar E-mel Tetapan Semula</Text><ArrowRight size={18} color="#fff" /></>
                  ) : (
                    loginLoading
                      ? <ActivityIndicator color="#fff" />
                      : <><Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Log Masuk</Text><ArrowRight size={18} color="#fff" /></>
                  )}
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>ATAU MASUK SEBAGAI</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
              </View>

              {/* Pemandu, Agensi, Operasi & Semak Status */}
              <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 4 }}>
                <TouchableOpacity
                  onPress={() => { handleLogin('driver'); setLoginModalVisible(false); }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: PALETTE.orange, borderRadius: 12, height: 48 }}
                >
                  {!isMobile && <Truck size={16} color={PALETTE.orange} />}
                  <Text style={{ color: PALETTE.orange, fontWeight: '800', fontSize: 12 }}>Pemandu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { handleLogin('agency'); setLoginModalVisible(false); }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: PALETTE.orange, borderRadius: 12, height: 48 }}
                >
                  {!isMobile && <Building2 size={16} color={PALETTE.orange} />}
                  <Text style={{ color: PALETTE.orange, fontWeight: '800', fontSize: 12 }}>Agensi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { handleLogin('operasi_lapor'); setLoginModalVisible(false); }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: PALETTE.orange, borderRadius: 12, height: 48 }}
                >
                  {!isMobile && <ShieldAlert size={16} color={PALETTE.orange} />}
                  <Text style={{ color: PALETTE.orange, fontWeight: '800', fontSize: 12 }}>Operasi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setLoginModalVisible(false); setStatusModalVisible(true); }}
                  style={[
                    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: PALETTE.orange, borderRadius: 12 },
                    isMobile ? { minHeight: 48, paddingVertical: 6 } : { height: 48 },
                  ]}
                >
                  {!isMobile && <Search size={16} color={PALETTE.orange} />}
                  <Text style={{ color: PALETTE.orange, fontWeight: '800', fontSize: 12, textAlign: 'center' }}>Semak Status</Text>
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

      <Modal visible={statusModalVisible} transparent animationType="fade" onRequestClose={closeStatusModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 640, maxHeight: '85%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff' }}>
            <View style={{ backgroundColor: '#0c0c0e', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff' }}>Semak Status</Text>
              <TouchableOpacity onPress={closeStatusModal}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              {!statusResult && (
                <>
                  <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 4 }}>
                    Masukkan nombor kad pengenalan (IC) untuk menyemak status.
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 2 : 4, marginBottom: 12 }}>
                    {icDigits.map((digit, index) => (
                      <React.Fragment key={index}>
                        <TextInput
                          ref={(el) => { icBoxRefs.current[index] = el; }}
                          style={{
                            width: isMobile ? 19 : 26, height: isMobile ? 32 : 40, borderWidth: 1.5,
                            borderColor: digit ? PALETTE.orange : '#e2e8f0',
                            borderRadius: isMobile ? 6 : 8, backgroundColor: '#f8fafc',
                            textAlign: 'center', fontSize: isMobile ? 13 : 16, fontWeight: '800', color: '#0f172a',
                            outlineStyle: 'none', padding: 0,
                          }}
                          value={digit}
                          onChangeText={(t) => handleIcDigitChange(index, t)}
                          onKeyPress={(e) => handleIcKeyPress(index, e)}
                          keyboardType="number-pad"
                          maxLength={1}
                          editable={!statusLoading}
                          onSubmitEditing={index === 11 ? handleCheckStatus : undefined}
                        />
                        {(index === 5 || index === 7) && (
                          <Text style={{ fontSize: isMobile ? 13 : 16, fontWeight: '800', color: '#94a3b8', marginHorizontal: isMobile ? 1 : 2 }}>-</Text>
                        )}
                      </React.Fragment>
                    ))}
                  </View>

                  {statusError ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca', marginBottom: 12 }}>
                      <AlertCircle size={14} color="#ef4444" />
                      <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700', flex: 1 }}>{statusError}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    onPress={handleCheckStatus}
                    disabled={statusLoading || statusCooldown}
                    style={{ backgroundColor: PALETTE.orange, borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (statusLoading || statusCooldown) ? 0.7 : 1 }}
                  >
                    {statusLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Semak</Text>}
                  </TouchableOpacity>
                </>
              )}

              {statusResult && (
                <View style={{ gap: 16 }}>
                  <View style={{ backgroundColor: '#fff7ed', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fed7aa' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.orange, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nama</Text>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', marginTop: 2 }}>{statusResult.nama || '-'}</Text>
                    <View style={{ height: 1, backgroundColor: '#fed7aa', marginVertical: 10 }} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.orange, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nombor Badan</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginTop: 2 }}>{statusResult.no_anggota || '-'}</Text>
                  </View>

                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <ShieldCheck size={14} color="#64748b" />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Insurans</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Kelompok/Individu</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.insurans?.insuran_kelompok_individu || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Status Aktif</Text>
                      <View style={{ backgroundColor: getStatusBadgeStyle(statusResult.insurans?.insuran_aktif_tidak).bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: getStatusBadgeStyle(statusResult.insurans?.insuran_aktif_tidak).color }}>{statusResult.insurans?.insuran_aktif_tidak || '-'}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Tamat</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.insurans?.tarikh_tamat_insuran || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Baki Hari Aktif</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.insurans?.tempoh_baki_aktif_insuran_hari ?? '-'}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <CreditCard size={14} color="#64748b" />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Kad</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Aktif</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.kad?.tarikh_aktif_kad || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Tamat</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.kad?.tarikh_tamat_kad || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Baki Hari Aktif</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.kad?.tempoh_baki_aktif_kad_hari ?? '-'}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <ShieldCheck size={14} color="#64748b" />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Perkeso</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Jabatan/Individu</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.perkeso?.perkeso_jabatan_individu || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Status Aktif</Text>
                      <View style={{ backgroundColor: getStatusBadgeStyle(statusResult.perkeso?.perkeso_aktif_tidak).bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: getStatusBadgeStyle(statusResult.perkeso?.perkeso_aktif_tidak).color }}>{statusResult.perkeso?.perkeso_aktif_tidak || '-'}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Tamat</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.perkeso?.tarikh_tamat_perkeso || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Baki Hari Caruman</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.perkeso?.tempoh_baki_caruman_perkeso_hari ?? '-'}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Award size={14} color="#64748b" />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pelantikan</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Lantikan</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.pelantikan?.tarikh_lantikan || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Menyertai APM</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.pelantikan?.tarikh_menyertai_apm || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Pelantikan Pasukan Pertama</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.pelantikan?.tarikh_pelantikan_pasukan_pertama || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>No. Siri Watikah Pelantikan Pertama</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.pelantikan?.no_siri_watikah_pelantikan_pertama || '-'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Terima Pangkat Terkini</Text>
                      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.pelantikan?.tarikh_terima_pangkat_terkini || '-'}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <FileText size={14} color="#64748b" />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sijil</Text>
                    </View>
                    {(statusResult.sijil || []).length === 0 ? (
                      <Text style={{ fontSize: 13, color: '#94a3b8' }}>Tiada sijil direkodkan.</Text>
                    ) : (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {statusResult.sijil.map((s, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => s.google_drive_link && Linking.openURL(s.google_drive_link)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.orange }}>{s.nom_certificat || 'Sijil'}</Text>
                            {s.google_drive_link ? <ExternalLink size={12} color={PALETTE.orange} /> : null}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <GraduationCap size={14} color="#64748b" />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Kursus</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: '#0f172a', lineHeight: 19 }}>{statusResult.kursus || '-'}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => { setStatusResult(null); resetIcInput(); }}
                    style={{ borderRadius: 12, height: 46, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#64748b', fontWeight: '800', fontSize: 13 }}>Semak IC Lain</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
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
          navigationRef={navigationRef}
        />
      ) :
      userRole === 'driver' ? <DriverFlow theme={theme} handleLogout={handleLogout} /> :
      userRole === 'operasi_lapor' ? <OperasiFlow theme={theme} handleLogout={handleLogout} /> :
      userRole === 'agency' ? <AgencyFlow theme={theme} handleLogout={handleLogout} /> :
      <GuestFlow theme={theme} handleLogout={handleLogout} onLoginPress={() => setLoginModalVisible(true)} />}
    </NavigationContainer>
  );
}