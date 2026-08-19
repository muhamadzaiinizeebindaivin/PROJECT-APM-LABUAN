import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, KeyboardAvoidingView, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Lock, User, ArrowRight, AlertCircle, X, Eye, EyeOff, CheckCircle, Truck, Building2, ShieldAlert, Search, ClipboardEdit } from 'lucide-react-native';
import { PALETTE } from '../constants/palette';
import { supabaseSandbox } from '../supabaseSandboxClient';

export default function LoginModal({ visible, onClose, isMobile, handleLogin, onOpenSemakStatus }) {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

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

  const closeLoginModal = () => {
    onClose();
    setLoginError('');
    setLoginUsername('');
    setLoginPassword('');
    setForgotPasswordMode(false);
    setResetSent(false);
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
      onClose();
      setLoginUsername('');
      setLoginPassword('');
      setTimeout(() => handleLogin(profile.role), 300);
    } catch { setLoginError('Ralat sistem. Sila cuba lagi.'); }
    finally { setLoginLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeLoginModal}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 720, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20, borderRadius: 24 }}>

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
                onPress={() => { handleLogin('driver'); onClose(); }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: PALETTE.orange, borderRadius: 12, height: 48 }}
              >
                {!isMobile && <Truck size={16} color={PALETTE.orange} />}
                <Text style={{ color: PALETTE.orange, fontWeight: '800', fontSize: 12 }}>Pemandu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { handleLogin('agency'); onClose(); }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: PALETTE.orange, borderRadius: 12, height: 48 }}
              >
                {!isMobile && <Building2 size={16} color={PALETTE.orange} />}
                <Text style={{ color: PALETTE.orange, fontWeight: '800', fontSize: 12 }}>Agensi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { handleLogin('operasi_lapor'); onClose(); }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: PALETTE.orange, borderRadius: 12, height: 48 }}
              >
                {!isMobile && <ShieldAlert size={16} color={PALETTE.orange} />}
                <Text style={{ color: PALETTE.orange, fontWeight: '800', fontSize: 12 }}>Operasi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { onClose(); onOpenSemakStatus(); }}
                style={[
                  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: PALETTE.orange, borderRadius: 12 },
                  isMobile ? { minHeight: 48, paddingVertical: 6 } : { height: 48 },
                ]}
              >
                {!isMobile && <Search size={16} color={PALETTE.orange} />}
                <Text style={{ color: PALETTE.orange, fontWeight: '800', fontSize: 12, textAlign: 'center' }}>Semak Status</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web') {
                    window.open('?kemaskini=data', '_blank');
                  }
                  onClose();
                }}
                style={[
                  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: PALETTE.orange, borderRadius: 12 },
                  isMobile ? { minHeight: 48, paddingVertical: 6 } : { height: 48 },
                ]}
              >
                {!isMobile && <ClipboardEdit size={16} color={PALETTE.orange} />}
                <Text style={{ color: PALETTE.orange, fontWeight: '800', fontSize: 12, textAlign: 'center' }}>Borang</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}