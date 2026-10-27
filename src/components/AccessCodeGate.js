// src/components/AccessCodeGate.js
//
// Écran "Kod Akses" réutilisable : session anonyme + fonction join_* côté base.
// Même apparence que l'écran d'accès Pemandu.
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { PALETTE } from '../constants/palette';
import FlowingBackground from './FlowingBackground';

export default function AccessCodeGate({ kicker = 'APM W.P LABUAN', title, subtitle, rpcName, onVerified, onBack }) {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Sila masukkan kod akses.');
      return;
    }
    setError(null);
    setVerifying(true);

    // Réutilise la session anonyme d'un essai précédent : un code faux ne crée
    // pas un nouvel utilisateur anonyme à chaque tentative
    const { data: { session } } = await supabaseSandbox.auth.getSession();
    if (!session) {
      const { data: authData, error: authError } = await supabaseSandbox.auth.signInAnonymously();
      if (authError || !authData?.user) {
        setError('Gagal memulakan sesi. Sila cuba lagi.');
        setVerifying(false);
        return;
      }
    }

    const { error: joinError } = await supabaseSandbox.rpc(rpcName, { p_code: code.trim() });
    setVerifying(false);
    if (joinError) {
      setError(joinError.message?.includes('Invalid access code') ? 'Kod akses tidak sah.' : 'Gagal mengesahkan kod. Sila cuba lagi.');
      return;
    }
    onVerified();
  };

  return (
    <View style={styles.container}>
      <FlowingBackground />
      <View style={styles.card}>
        <View style={styles.banner}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.bannerTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.bannerSubtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.body}>
          <View style={[styles.inputGroup, focused && styles.inputGroupFocused]}>
            <View style={styles.inputIconWrap}>
              <Lock size={17} color={focused ? PALETTE.orange : '#94a3b8'} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Kod akses"
              placeholderTextColor="#94a3b8"
              value={code}
              onChangeText={setCode}
              secureTextEntry={!showCode}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleVerify}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCode((v) => !v)}>
              {showCode ? <EyeOff size={17} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
            </TouchableOpacity>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, verifying && { opacity: 0.7 }]}
            onPress={handleVerify}
            disabled={verifying}
          >
            {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Sahkan</Text>}
          </TouchableOpacity>

          {onBack && (
            <TouchableOpacity style={styles.backLink} onPress={onBack} disabled={verifying}>
              <ArrowLeft size={14} color={PALETTE.textMutedDark} />
              <Text style={styles.backLinkText}>Kembali ke laman utama</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20,
    backgroundColor: PALETTE.softOrangeBg, position: 'relative', overflow: 'hidden',
  },
  card: {
    width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  banner: { backgroundColor: '#0c0c0e', padding: 24, paddingBottom: 28 },
  kicker: { fontSize: 10, fontWeight: '800', color: PALETTE.orange, letterSpacing: 2, textTransform: 'uppercase' },
  bannerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 3 },
  bannerSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  body: { padding: 24, gap: 4, backgroundColor: '#fff' },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: '#f8fafc', marginBottom: 12,
  },
  inputGroupFocused: { borderColor: PALETTE.orange, backgroundColor: 'rgba(249, 115, 22, 0.04)' },
  inputIconWrap: { marginRight: 10 },
  eyeBtn: { paddingLeft: 10 },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a', outlineStyle: 'none' },
  errorText: { color: '#dc2626', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  submitButton: {
    flexDirection: 'row', backgroundColor: PALETTE.orange, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  backLinkText: { color: PALETTE.textMutedDark, fontSize: 13, fontWeight: '600' },
});
