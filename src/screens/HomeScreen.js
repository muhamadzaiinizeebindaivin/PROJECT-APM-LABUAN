// src/screens/HomeScreen.js
import React, { useRef, useEffect, useState } from 'react';
import { 
  View, StyleSheet, TouchableOpacity, 
  Text, Animated, TextInput, ActivityIndicator, Alert 
} from 'react-native';
import { ShieldCheck, User, Truck, Briefcase, Target, Eye, Info, Building2 } from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import AdminEditButton from '../components/AdminEditButton'; 
import HomepagePdfCard from '../components/HomepagePdfCard';

export default function HomeScreen({ theme, isAuthFlow, onGuestLogin, onDriverLogin, onAgencyLogin, navigation, userRole }) {
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
                  <TouchableOpacity style={[styles.button, styles.agencyButton]} onPress={onAgencyLogin}>
                  <Building2 size={20} color="#fff" /><Text style={styles.buttonText}>Agensi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.guestButton]} onPress={onGuestLogin}>
                  <User size={20} color="#fff" /><Text style={styles.buttonText}>Tetamu Awam</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        // --- DASHBOARD ---
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

          <Animated.ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {pageData && (
              <>
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

                <HomepagePdfCard theme={theme} userRole={userRole} />
              </>
            )}

            <View style={styles.footerInfo}>
              <Info size={14} color="#94a3b8" />
              <Text style={styles.footerText}>SediaOps v1.0.8 • APM Labuan Digital Unit</Text>
            </View>
          </Animated.ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
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

  scrollContent: { paddingTop: 10, paddingBottom: 60 },
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
  authContainer: { flex: 1, backgroundColor: '#0f172a' },
  authOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  authGlassBox: { width: '100%', maxWidth: 400, padding: 40, borderRadius: 30, alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  authPortalTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 5 },
  authPortalSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 40 },
  actionContainer: { width: '100%', gap: 15 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, elevation: 3 },
  jpbdButton: { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.5)' },
  agencyButton: { backgroundColor: 'rgba(168, 85, 247, 0.25)', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.5)' },
  guestButton: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 10 },
  footerInfo: { marginTop: 20, paddingBottom: 40, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  footerText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' }
});