// src/screens/HomeScreen.js
import React, { useRef, useEffect, useState } from 'react';
import { 
  View, StyleSheet, Image, Dimensions, TouchableOpacity, 
  Text, Platform, Animated, TextInput, ActivityIndicator, Alert 
} from 'react-native';
import { ShieldCheck, User, Truck, Briefcase, Target, Eye, Info, Activity } from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import AdminEditButton from '../components/AdminEditButton'; 

import Slide1 from './slides/Slide1.png'; import Slide2 from './slides/Slide2.png'; import Slide3 from './slides/Slide3.png'; import Slide4 from './slides/Slide4.png';
import Slide5 from './slides/Slide5.png'; import Slide6 from './slides/Slide6.png'; import Slide7 from './slides/Slide7.png'; import Slide8 from './slides/Slide8.png';
import Slide9 from './slides/Slide9.png'; import Slide10 from './slides/Slide10.png'; import Slide11 from './slides/Slide11.png'; import Slide12 from './slides/Slide12.png';
import Slide13 from './slides/Slide13.png'; import Slide14 from './slides/Slide14.png'; import Slide15 from './slides/Slide15.png'; import Slide16 from './slides/Slide16.png';
import Slide17 from './slides/Slide17.png'; import Slide18 from './slides/Slide18.png'; import Slide19 from './slides/Slide19.png'; import Slide20 from './slides/Slide20.png';
import Slide21 from './slides/Slide21.png'; import Slide22 from './slides/Slide22.png'; import Slide23 from './slides/Slide23.png'; import Slide24 from './slides/Slide24.png';
import Slide25 from './slides/Slide25.png'; import Slide26 from './slides/Slide26.png'; import Slide27 from './slides/Slide27.png'; import Slide28 from './slides/Slide28.png';
import Slide29 from './slides/Slide29.png'; import Slide30 from './slides/Slide30.png'; import Slide31 from './slides/Slide31.png'; import Slide32 from './slides/Slide32.png';
import Slide33 from './slides/Slide33.png'; import Slide34 from './slides/Slide34.png'; import Slide35 from './slides/Slide35.png'; import Slide36 from './slides/Slide36.png';
import Slide37 from './slides/Slide37.png'; import Slide38 from './slides/Slide38.png'; import Slide39 from './slides/Slide39.png'; import Slide40 from './slides/Slide40.png';

const FEED_DATA = [
  { id: '1', source: Slide1 }, { id: '2', source: Slide2 }, { id: '3', source: Slide3 }, { id: '4', source: Slide4 },
  { id: '5', source: Slide5 }, { id: '6', source: Slide6 }, { id: '7', source: Slide7 }, { id: '8', source: Slide8 },
  { id: '9', source: Slide9 }, { id: '10', source: Slide10 }, { id: '11', source: Slide11 }, { id: '12', source: Slide12 },
  { id: '13', source: Slide13 }, { id: '14', source: Slide14 }, { id: '15', source: Slide15 }, { id: '16', source: Slide16 },
  { id: '17', source: Slide17 }, { id: '18', source: Slide18 }, { id: '19', source: Slide19 }, { id: '20', source: Slide20 },
  { id: '21', source: Slide21 }, { id: '22', source: Slide22 }, { id: '23', source: Slide23 }, { id: '24', source: Slide24 },
  { id: '25', source: Slide25 }, { id: '26', source: Slide26 }, { id: '27', source: Slide27 }, { id: '28', source: Slide28 },
  { id: '29', source: Slide29 }, { id: '30', source: Slide30 }, { id: '31', source: Slide31 }, { id: '32', source: Slide32 },
  { id: '33', source: Slide33 }, { id: '34', source: Slide34 }, { id: '35', source: Slide35 }, { id: '36', source: Slide36 },
  { id: '37', source: Slide37 }, { id: '38', source: Slide38 }, { id: '39', source: Slide39 }, { id: '40', source: Slide40 }
];

const AnimatedFeedItem = ({ item }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(100)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.feedCard, { opacity, transform: [{ translateY }, { scale }] }]}>
      <View style={styles.feedHeader}>
        <View style={styles.feedTagContainer}>
          <Activity size={12} color="#3b82f6" />
          <Text style={styles.feedTag}>REKOD OPERASI #{item.id.padStart(3, '0')}</Text>
        </View>
      </View>
      <View style={styles.feedImageContainer}>
        <Image source={item.source} style={styles.feedImage} resizeMode="contain" />
      </View>
    </Animated.View>
  );
};

export default function HomeScreen({ theme, isAuthFlow, onGuestLogin, onDriverLogin, navigation, userRole }) {
  const scrollY = useRef(new Animated.Value(0)).current;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  const defaultData = {
    welcomeTitle: 'ANGKATAN PERTAHANAN AWAM MALAYSIA (APM) W.P LABUAN',
    welcomeSubtitle: 'Pejabat Pertahanan Awam Daerah Wilayah Persekutuan Labuan.\n"Sedia, Pantas, Berintegriti"',
    visiText: 'Bertindak sebagai responden pertama dalam situasi kecemasan dan bencana dalam memberikan perkhidmatan.',
    misiText: 'Memberi latihan kepada orang awam, menjadikan mereka lebih bersedia dan berupaya menghadapi kecemasan.',
  };

  useEffect(() => {
    if (!isAuthFlow) {
      fetchData();
    }
  }, [isAuthFlow]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('home_data')
        .select('data_json')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPageData(data?.data_json || defaultData);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setPageData(defaultData);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('home_data')
        .upsert({ id: 1, data_json: pageData });

      if (error) throw error;
      
      Alert.alert('Berjaya', 'Maklumat halaman utama telah dikemaskini.');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Ralat', 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setPageData(prev => ({ ...prev, [field]: value }));
  };

  const renderDashboardHeader = () => {
    const headerTranslateY = scrollY.interpolate({
      inputRange: [0, 300],
      outputRange: [0, -100],
      extrapolate: 'clamp',
    });

    if (!pageData) return null;

    return (
      <Animated.View style={[styles.dashboardHeader, { transform: [{ translateY: headerTranslateY }] }]}>
        
        {/* Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: theme?.card || '#ffffff' }]}>
          {isEditing ? (
            <>
              <TextInput 
                style={[styles.input, styles.welcomeTitleInput]} 
                value={pageData.welcomeTitle} 
                onChangeText={(text) => updateField('welcomeTitle', text)} 
                multiline
              />
              <TextInput 
                style={[styles.input, styles.welcomeSubtitleInput]} 
                value={pageData.welcomeSubtitle} 
                onChangeText={(text) => updateField('welcomeSubtitle', text)} 
                multiline
              />
            </>
          ) : (
            <>
              <Text style={[styles.welcomeTitle, { color: theme?.text }]}>{pageData.welcomeTitle}</Text>
              <Text style={[styles.welcomeSubtitle, { color: theme?.textSecondary }]}>{pageData.welcomeSubtitle}</Text>
            </>
          )}
        </View>

        {/* Info Widgets */}
        <View style={styles.infoRowContainer}>
          <View style={[styles.infoWidget, { backgroundColor: theme?.card || '#fff' }]}>
            <View style={[styles.iconCircleInfo, { backgroundColor: '#eff6ff' }]}><Eye size={20} color="#3b82f6" /></View>
            <Text style={styles.infoTitle}>PERANAN UTAMA</Text>
            {isEditing ? (
              <TextInput 
                style={[styles.input, styles.infoBodyInput]} 
                value={pageData.visiText} 
                onChangeText={(text) => updateField('visiText', text)} 
                multiline
              />
            ) : (
              <Text style={[styles.infoBody, { color: theme?.textSecondary }]}>{pageData.visiText}</Text>
            )}
          </View>

          <View style={[styles.infoWidget, { backgroundColor: theme?.card || '#fff' }]}>
            <View style={[styles.iconCircleInfo, { backgroundColor: '#f0fdf4' }]}><Target size={20} color="#22c55e" /></View>
            <Text style={styles.infoTitle}>KEMANUSIAAN</Text>
            {isEditing ? (
              <TextInput 
                style={[styles.input, styles.infoBodyInput]} 
                value={pageData.misiText} 
                onChangeText={(text) => updateField('misiText', text)} 
                multiline
              />
            ) : (
              <Text style={[styles.infoBody, { color: theme?.textSecondary }]}>{pageData.misiText}</Text>
            )}
          </View>
        </View>

        {/* Feed Divider Title */}
        <View style={styles.feedDivider}>
          <Text style={[styles.feedDividerTitle, { color: theme?.text }]}>Ringkasan & Taklimat Semasa</Text>
          <Text style={styles.feedDividerSub}></Text>
        </View>

      </Animated.View>
    );
  };

  if (loading && !isAuthFlow) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme?.background || '#f1f5f9' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme?.background || '#f1f5f9' }]}>
      
      {isAuthFlow ? (
        // --- AUTHENTICATION SCREEN ---
        <View style={styles.authContainer}>
          <Image source={Slide1} style={styles.backgroundImage} resizeMode="cover" blurRadius={8} />
          <View style={styles.authOverlay}>
            <View style={styles.authGlassBox}>
              <Text style={styles.authPortalTitle}>DASHBOARD</Text>
              <Text style={styles.authPortalSub}>APM WP LABUAN</Text>
              
              <View style={styles.actionContainer}>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#f97316' }]} onPress={() => navigation.navigate('Login')}>
                  <ShieldCheck size={20} color="#fff" /><Text style={styles.buttonText}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#3b82f6' }]} onPress={onDriverLogin}>
                  <Truck size={20} color="#fff" /><Text style={styles.buttonText}>Pemandu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.jpbdButton]} onPress={() => navigation.navigate('Login')}>
                  <Briefcase size={20} color="#fff" /><Text style={styles.buttonText}>Sekretariat JPBD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.guestButton]} onPress={onGuestLogin}>
                  <User size={20} color="#fff" /><Text style={styles.buttonText}>Tetamu Awam</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        // --- DASHBOARD FEED WITH SCROLL ANIMATIONS ---
        <>
          {/* STICKY HEADER FOR ADMIN EDIT MODE */}
          {userRole === 'admin' && (
            <View style={styles.stickyHeader}>
              {isEditing && (
                <TouchableOpacity 
                  style={styles.stickySaveBtn}
                  onPress={handleSave}
                >
                  <Text style={styles.stickySaveBtnText}>💾 Simpan Perubahan</Text>
                </TouchableOpacity>
              )}
              <AdminEditButton 
                isEditMode={isEditing} 
                setIsEditMode={setIsEditing} 
                userRole={userRole} 
              />
            </View>
          )}

          <Animated.FlatList
            data={FEED_DATA}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <AnimatedFeedItem item={item} />}
            ListHeaderComponent={renderDashboardHeader}
            ListFooterComponent={() => (
              <View style={styles.footerInfo}>
                 <Info size={14} color="#94a3b8" />
                 <Text style={styles.footerText}>SediaOps v1.0.8 • APM Labuan Digital Unit</Text>
              </View>
            )}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16} 
            initialNumToRender={5} 
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // New Sticky Header Styles
  stickyHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    zIndex: 10,
    elevation: 4, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    gap: 10
  },
  stickySaveBtn: {
    backgroundColor: '#27ae60', 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 8
  },
  stickySaveBtnText: {
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14
  },

  flatListContent: { paddingBottom: 60, paddingTop: 10 },
  dashboardHeader: { paddingBottom: 10 },
  heroCard: { margin: 20, padding: 30, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  welcomeTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 10, letterSpacing: -0.5 },
  welcomeSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, backgroundColor: '#f8fafc', color: '#0f172a' },
  welcomeTitleInput: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  welcomeSubtitleInput: { fontSize: 13, textAlign: 'center' },
  infoBodyInput: { fontSize: 12, minHeight: 60, textAlignVertical: 'top' },
  infoRowContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginBottom: 30 },
  infoWidget: { flex: 1, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  iconCircleInfo: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  infoTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 6, color: '#475569' },
  infoBody: { fontSize: 12, fontWeight: '500', lineHeight: 18 },
  feedDivider: { paddingHorizontal: 25, marginTop: 10, marginBottom: 20 },
  feedDividerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  feedDividerSub: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 4 },
  feedCard: { marginHorizontal: 20, marginBottom: 30, backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  feedHeader: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fafaf9' },
  feedTagContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedTag: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  feedImageContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#f8fafc' },
  feedImage: { width: '100%', height: '100%' },
  authContainer: { flex: 1, backgroundColor: '#0f172a' },
  backgroundImage: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  authOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  authGlassBox: { width: '100%', maxWidth: 400, padding: 40, borderRadius: 30, alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  authPortalTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 5 },
  authPortalSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 40 },
  actionContainer: { width: '100%', gap: 15 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, elevation: 3 },
  jpbdButton: { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.5)' },
  guestButton: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 10 },
  footerInfo: { marginTop: 20, paddingBottom: 40, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  footerText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' }
});