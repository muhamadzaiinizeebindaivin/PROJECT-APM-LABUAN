import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Lock, ShieldCheck, CheckCircle, AlertCircle, LogIn } from 'lucide-react-native';
import { supabaseSandbox as supabase } from '../supabaseSandboxClient';

export default function SetPasswordScreen({ theme, onGoToLogin }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionReady(!!session);
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  const handleSetPassword = async () => {
    setFeedback(null);

    if (!password || password.length < 6) {
      setFeedback({ type: 'error', message: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.' });
      return;
    }
    if (password !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Kata laluan tidak sepadan.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setFeedback({ type: 'error', message: error.message });
      return;
    }

    setIsDone(true);
    setFeedback({ type: 'success', message: 'Kata laluan berjaya ditetapkan! Anda kini boleh log masuk.' });
  };

  if (checkingSession) {
    return (
      <View style={[styles.container, { backgroundColor: theme?.background || '#f8fafc', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (!sessionReady) {
    return (
      <View style={[styles.container, { backgroundColor: theme?.background || '#f8fafc', justifyContent: 'center' }]}>
        <Text style={{ textAlign: 'center', color: '#64748b' }}>
          Pautan tidak sah atau telah tamat tempoh. Sila hubungi admin untuk jemputan baharu.
        </Text>
      </View>
    );
  }

  // ── Écran verrouillé après succès ──
  if (isDone) {
    return (
      <View style={[styles.container, { backgroundColor: theme?.background || '#f8fafc', justifyContent: 'center' }]}>
        <View style={[styles.iconCircle, { backgroundColor: '#16a34a' }]}>
          <CheckCircle size={32} color="#fff" />
        </View>
        <Text style={styles.title}>Kata Laluan Ditetapkan</Text>
        <Text style={styles.subtitle}>Akaun anda kini sedia digunakan. Sila log masuk untuk meneruskan.</Text>

        <TouchableOpacity style={styles.saveButton} onPress={onGoToLogin}>
          <LogIn size={18} color="#fff" />
          <Text style={styles.saveButtonText}>Pergi ke Log Masuk</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme?.background || '#f8fafc', justifyContent: 'center' }]}>
      <View style={styles.iconCircle}>
        <ShieldCheck size={32} color="#fff" />
      </View>
      <Text style={styles.title}>Tetapkan Kata Laluan</Text>
      <Text style={styles.subtitle}>Selamat datang! Sila cipta kata laluan anda.</Text>

      {feedback && (
        <View style={[styles.feedbackBox, feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
          {feedback.type === 'success' ? <CheckCircle size={18} color="#16a34a" /> : <AlertCircle size={18} color="#dc2626" />}
          <Text style={[styles.feedbackText, { color: feedback.type === 'success' ? '#166534' : '#991b1b' }]}>
            {feedback.message}
          </Text>
        </View>
      )}

      <View style={[styles.inputGroup, focusedField === 'password' && styles.inputGroupFocused]}>
        <View style={styles.inputIconWrap}>
          <Lock size={18} color={focusedField === 'password' ? '#1E3A8A' : '#94a3b8'} />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Kata Laluan Baharu"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <View style={[styles.inputGroup, focusedField === 'confirm' && styles.inputGroupFocused]}>
        <View style={styles.inputIconWrap}>
          <Lock size={18} color={focusedField === 'confirm' ? '#1E3A8A' : '#94a3b8'} />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Sahkan Kata Laluan"
          placeholderTextColor="#94a3b8"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          onFocus={() => setFocusedField('confirm')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSetPassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Simpan Kata Laluan</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#1E3A8A',
    justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20
  },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 6, marginBottom: 24 },

  inputGroup: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, marginBottom: 12, backgroundColor: '#f8fafc', overflow: 'hidden'
  },
  inputGroupFocused: {
    borderColor: '#1E3A8A',
    backgroundColor: '#eff6ff',
  },
  inputIconWrap: { paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  input: {
    flex: 1, paddingVertical: 14, paddingRight: 14, fontSize: 14, fontWeight: '600',
    color: '#0f172a', caretColor: '#1E3A8A', outlineStyle: 'none'
  },

  saveButton: {
    flexDirection: 'row', backgroundColor: '#1E3A8A', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10
  },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  feedbackBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 16 },
  feedbackSuccess: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  feedbackError: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  feedbackText: { fontSize: 13, fontWeight: '700', flex: 1 },
});