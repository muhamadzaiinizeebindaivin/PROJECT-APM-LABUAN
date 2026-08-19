import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, Animated, Platform, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Users, CreditCard, GraduationCap, Truck, ShieldAlert, Briefcase, Info, UserCog, X } from 'lucide-react-native';
import { FONTS } from '../styles/tacticalTheme';
import { ROLE_PERMISSIONS } from '../permissions';
import CustomHeader from '../components/CustomHeader';

import HomeScreen from '../screens/HomeScreen';
import PentadbiranScreen from '../screens/PentadbiranScreen';
import AngkatanScreen from '../screens/AngkatanScreen';
import KewanganScreen from '../screens/KewanganScreen';
import LatihanScreen from '../screens/LatihanScreen';
import LogistikScreen from '../screens/LogistikScreen';
import OperasiScreen from '../screens/OperasiScreen';
import SekretariatScreen from '../screens/SekretariatScreen';
import AdminUserManagementScreen from '../screens/AdminUserManagementScreen';

const Tab = createBottomTabNavigator();

const MOBILE_BREAKPOINT = 768;
const DRAWER_WIDTH = 260;

const TAB_ICONS = {
  Utama: Info, Pentadbiran: LayoutDashboard, Sekretariat: Briefcase,
  Angkatan: Users, Kewangan: CreditCard, Latihan: GraduationCap,
  Logistik: Truck, Operasi: ShieldAlert,
  Admin: UserCog,
};

export default function DepartmentFlow({ userRole, theme, handleLogin, handleLogout, onLoginPress, navigationRef }) {
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