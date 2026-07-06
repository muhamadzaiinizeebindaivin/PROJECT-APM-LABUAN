import React, { useState } from 'react';
import { View, StatusBar, TouchableOpacity, Alert, Platform, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Users, CreditCard, GraduationCap, Truck, ShieldAlert, Briefcase, Info, LogOut, SaveAllIcon } from 'lucide-react-native';

// Import Screens
import PentadbiranScreen from './src/screens/PentadbiranScreen';
import AngkatanScreen from './src/screens/AngkatanScreen';
import KewanganScreen from './src/screens/KewanganScreen';
import LatihanScreen from './src/screens/LatihanScreen';
import LogistikScreen from './src/screens/LogistikScreen';
import OperasiScreen from './src/screens/OperasiScreen';
import SekretariatScreen from './src/screens/SekretariatScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen'; 
import DriverScreen from './src/screens/DriverScreen';
import SaveManagementScreen from './src/screens/SaveManagementScreen';

import { themes } from './theme'; 

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); 

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? themes.dark : themes.light;

  // --- AUTHENTICATION STATE ---
  const [userRole, setUserRole] = useState(null); 

  const handleLogin = (role) => {
    if (role) {
      setUserRole(role.toLowerCase().trim());
    } else {
      setUserRole(null);
    }
  };


  const handleLogout = () => {
    if (Platform.OS === 'web') {
        const confirm = window.confirm("Adakah anda pasti mahu log keluar?");
        if (confirm) setUserRole(null);
    } else {
        Alert.alert(
        "Log Keluar",
        "Adakah anda pasti mahu log keluar?",
        [
            { text: "Batal", style: "cancel" },
            { text: "Ya", onPress: () => setUserRole(null) }
        ]
        );
    }
  };

  // Components for Headers
  const HeaderLogoutButton = () => (
    <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, elevation: 2 }}>
      <LogOut size={14} color="#fff" />
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11, marginLeft: 6 }}>Log Keluar</Text>
    </TouchableOpacity>
  );

  const HeaderRoleBadge = () => (
    <View style={{ marginRight: 15, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
      <Text style={{ fontSize: 10, fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>
        {userRole || 'GUEST'}
      </Text>
    </View>
  );

  // Shared Tab Styling
  const sharedTabOptions = ({ route }) => ({
    headerShown: true,
    headerLeft: () => <HeaderLogoutButton />,
    headerRight: () => <HeaderRoleBadge />,
    headerStyle: { backgroundColor: theme.background, elevation: 0, shadowOpacity: 0 },
    headerTitleStyle: { fontWeight: '800', color: theme.text, fontSize: 20 },
    tabBarStyle: { backgroundColor: theme.card, borderTopWidth: 0, elevation: 10, height: 65, paddingBottom: 10, paddingTop: 10 },
    tabBarActiveTintColor: '#f97316', 
    tabBarInactiveTintColor: theme.textSecondary,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 4 },
    tabBarIcon: ({ color, focused }) => {
      const icons = {
        Utama: Info, Pentadbiran: LayoutDashboard, Sekretariat: Briefcase,
        Angkatan: Users, Kewangan: CreditCard, Latihan: GraduationCap,
        Logistik: Truck, Operasi: ShieldAlert, Saves: SaveAllIcon
      };
      const Icon = icons[route.name];
      return Icon ? <Icon size={24} color={color} strokeWidth={focused ? 2.5 : 2} /> : null;
    },
  });

  // ==========================================
  // NAVIGATOR FLOWS
  // ==========================================

  const AuthFlow = () => (
    <Stack.Navigator>
      <Stack.Screen name="HomeScreen" options={{ title: 'Dashboard APM Labuan', headerStyle: { backgroundColor: theme.background }, headerTitleStyle: { color: theme.text, fontWeight: 'bold' } }}>
        {(props) => <HomeScreen {...props} theme={theme} isAuthFlow={true} onGuestLogin={() => handleLogin('guest')} onDriverLogin={() => handleLogin('driver')} />}
      </Stack.Screen>
      <Stack.Screen name="Login" options={{ title: 'Log Masuk Portal', headerStyle: { backgroundColor: theme.background }, headerTitleStyle: { color: theme.text, fontWeight: 'bold' }, headerTintColor: theme.text }}>
        {(props) => <LoginScreen {...props} onLogin={handleLogin} theme={theme} />}
      </Stack.Screen>
    </Stack.Navigator>
  );

  const AdminFlow = () => (
    <Tab.Navigator initialRouteName="Utama" screenOptions={sharedTabOptions}>
      <Tab.Screen name="Utama">{(props) => <HomeScreen {...props} theme={theme} isAuthFlow={false} userRole={userRole} />}</Tab.Screen>
      <Tab.Screen name="Pentadbiran" options={{ tabBarActiveTintColor: '#3b82f6' }}>{(props) => <PentadbiranScreen {...props} theme={theme} userRole={userRole} />}</Tab.Screen>
      <Tab.Screen name="Kewangan" options={{ tabBarActiveTintColor: '#3b82f6' }}>{(props) => <KewanganScreen {...props} theme={theme} />}</Tab.Screen>
      <Tab.Screen name="Logistik" options={{ tabBarActiveTintColor: '#3b82f6' }}>{(props) => <LogistikScreen {...props} theme={theme} />}</Tab.Screen>
      <Tab.Screen name="Angkatan" options={{ tabBarActiveTintColor: '#f97316' }}>{(props) => <AngkatanScreen {...props} theme={theme} />}</Tab.Screen>
      <Tab.Screen name="Sekretariat" options={{ tabBarActiveTintColor: '#f97316' }}>{(props) => <SekretariatScreen {...props} theme={theme} userRole={userRole} />}</Tab.Screen>
      <Tab.Screen name="Latihan" options={{ tabBarActiveTintColor: '#f97316' }}>{(props) => <LatihanScreen {...props} theme={theme} />}</Tab.Screen>
      <Tab.Screen name="Operasi" options={{ tabBarActiveTintColor: '#f97316' }}>{(props) => <OperasiScreen {...props} theme={theme} />}</Tab.Screen>
      <Tab.Screen name="Saves" options={{ tabBarActiveTintColor: '#8b5cf6' }}>{(props) => <SaveManagementScreen {...props} theme={theme} />}</Tab.Screen>
    </Tab.Navigator>
  );

  const SekretariatFlow = () => (
    <Tab.Navigator initialRouteName="Utama" screenOptions={sharedTabOptions}>
      <Tab.Screen name="Utama">{(props) => <HomeScreen {...props} theme={theme} isAuthFlow={false} userRole={userRole} />}</Tab.Screen>
      <Tab.Screen name="Sekretariat" options={{ tabBarActiveTintColor: '#f97316' }}>{(props) => <SekretariatScreen {...props} theme={theme} userRole={userRole} />}</Tab.Screen>
    </Tab.Navigator>
  );

  const DriverFlow = () => (
    <Stack.Navigator>
      <Stack.Screen name="DriverApp" options={{ title: 'Pemandu APM', headerStyle: { backgroundColor: theme.background }, headerTitleStyle: { color: theme.text, fontWeight: 'bold' }, headerLeft: () => <HeaderLogoutButton />, headerRight: () => <HeaderRoleBadge /> }}>
        {(props) => <DriverScreen {...props} theme={theme} onLogout={handleLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );

  const GuestFlow = () => (
    <Stack.Navigator>
      <Stack.Screen name="GuestHome" options={{ title: 'Dashboard Awam', headerStyle: { backgroundColor: theme.background }, headerTitleStyle: { color: theme.text, fontWeight: 'bold' }, headerLeft: () => <HeaderLogoutButton />, headerRight: () => <HeaderRoleBadge /> }}>
        {(props) => <HomeScreen {...props} theme={theme} isAuthFlow={false} userRole="guest" onLogout={handleLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );

  // ==========================================
  // ROOT RENDER (THE FIX: ONLY ONE CONTAINER)
  // ==========================================
  return (
    <NavigationContainer>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      
      {!userRole ? <AuthFlow /> : 
       userRole === 'admin' ? <AdminFlow /> :
       (userRole === 'sekretariat' || userRole === 'jpbd') ? <SekretariatFlow /> :
       userRole === 'driver' ? <DriverFlow /> :
       <GuestFlow />}
       
    </NavigationContainer>
  );
}