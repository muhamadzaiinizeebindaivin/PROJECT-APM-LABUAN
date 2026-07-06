import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { supabase } from '../supabaseClient';

export default function LoginScreen({ onLogin, theme }) {
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
      const formattedEmail = `${cleanUsername}@apm.local`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password: password,
      });

      if (error) {
        setErrorMessage('Nama pengguna atau kata laluan salah.');
        setPassword(''); 
      } else if (data.session) {
        
        // 🚨 THE FIX: Map the username to the correct role
        let assignedRole = 'guest';
        
        // Add any usernames here that should get full Admin access
        if (cleanUsername === 'admin' || cleanUsername === 'pengarah' || cleanUsername === 'fatin') {
          assignedRole = 'admin';
        } 
        // Add usernames for Sekretariat view
        else if (cleanUsername === 'sekretariat' || cleanUsername === 'jpbd') {
          assignedRole = 'sekretariat';
        } 
        // Add usernames for Drivers
        else if (cleanUsername === 'driver' || cleanUsername === 'pemandu') {
          assignedRole = 'driver';
        } 
        // Catch-all: If they successfully log in but aren't listed above, give them admin anyway for testing
        else {
          assignedRole = 'admin'; 
        }

        // Pass the ROLE, not the username, back to App.js
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