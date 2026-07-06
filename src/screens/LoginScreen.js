// src/screen/LoginScreen.js
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react-native';
// import { supabase } from '../supabaseClient';
import { supabaseSandbox as supabase } from '../supabaseSandboxClient';

export default function LoginScreen({ onLogin, theme, onNavigateToSignUp }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async () => {
    setErrorMessage('');
    
    if (!username || !password) {
      setErrorMessage('Sila isi nama pengguna dan kata laluan.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanUsername = username.toLowerCase().trim();
      const formattedEmail = `${cleanUsername}@apm-labuan.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password: password,
      });

      if (error) {
        setErrorMessage('Nama pengguna atau kata laluan salah.');
        setPassword(''); 
      } else if (data.session) {
          const userId = data.session.user.id;

          // Vérifie d'abord si un profil "agency" existe (sandbox.profiles)
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, agency_id')
            .eq('id', userId)
            .maybeSingle();

          if (profile?.role === 'agency') {
            const { data: agencyRow } = await supabase
              .from('jpbd_directory')
              .select('id, agency')
              .eq('id', profile.agency_id)
              .single();

            onLogin('agency', { 
              agencyId: agencyRow.id, 
              agencyName: agencyRow.agency,
              userId: userId,
              username: cleanUsername
            });
            setIsLoading(false);
            return;
          }

          // Comportement existant inchangé pour admin/sekretariat/driver/guest
          let assignedRole = 'guest';

          if (cleanUsername === 'admin' || cleanUsername === 'pengarah' || cleanUsername === 'fatin') {
            assignedRole = 'admin';
          } else if (cleanUsername === 'sekretariat' || cleanUsername === 'jpbd') {
            assignedRole = 'sekretariat';
          } else if (cleanUsername === 'driver' || cleanUsername === 'pemandu') {
            assignedRole = 'driver';
          } else {
            assignedRole = 'admin';
          }

          onLogin(assignedRole);
        }
    } catch (err) {
      setErrorMessage('Ralat sistem. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme?.background || '#f8fafc' }]}
    >
      <View style={styles.contentContainer}>
        
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <ShieldCheck color="#f97316" size={40} strokeWidth={2.5} />
          </View>
          <Text style={[styles.title, { color: theme?.text || '#0f172a' }]}>Log Masuk Portal</Text>
          <Text style={[styles.subtitle, { color: theme?.textSecondary || '#64748b' }]}>
            Sistem Pengurusan APM
          </Text>
        </View>

        <View style={styles.inputWrapper}>
          <View style={[styles.inputContainer, { backgroundColor: theme?.card || '#ffffff', borderColor: theme?.border || '#e2e8f0' }]}>
            <User color={theme?.textSecondary || '#64748b'} size={20} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: theme?.text || '#0f172a' }]}
              placeholder="Nama Pengguna"
              placeholderTextColor={theme?.textSecondary || '#94a3b8'}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme?.card || '#ffffff', borderColor: theme?.border || '#e2e8f0' }]}>
            <Lock color={theme?.textSecondary || '#64748b'} size={20} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: theme?.text || '#0f172a' }]}
              placeholder="Kata Laluan"
              placeholderTextColor={theme?.textSecondary || '#94a3b8'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <AlertCircle color="#ef4444" size={14} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.loginButton, isLoading ? styles.loginButtonDisabled : null]}
            onPress={handleAdminLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Log Masuk</Text>
                <ArrowRight color="#fff" size={20} />
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onNavigateToSignUp?.()} 
            style={{ alignItems: 'center', marginTop: 10 }}>
          <Text style={{ color: theme?.textSecondary || '#64748b' }}>Tiada akaun agensi? Daftar</Text>
        </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  contentContainer: { gap: 30 },
  header: { alignItems: 'center', marginBottom: 10 },
  logoCircle: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center', marginBottom: 20 
  },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  subtitle: { fontSize: 14, fontWeight: '600', marginTop: 5 },
  inputWrapper: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 56 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -5, marginLeft: 5 },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  loginButton: { backgroundColor: '#f97316', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});