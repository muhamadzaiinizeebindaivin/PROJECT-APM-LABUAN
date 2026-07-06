// src/screens/SignUpScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { User, Lock, Building2, ArrowRight, AlertCircle } from 'lucide-react-native';
import { supabaseSandbox as supabase } from '../supabaseSandboxClient';

export default function SignUpScreen({ onSignUpSuccess, onBackToLogin, theme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    setErrorMessage('');

    if (!username || !password || !agencyName) {
      setErrorMessage('Sila isi semua ruangan.');
      return;
    }

    setIsLoading(true);
    try {
      const cleanUsername = username.toLowerCase().trim();
      const cleanAgency = agencyName.trim();
      const formattedEmail = `${cleanUsername}@apm-labuan.com`;

      // 1. Créer le compte auth (auth.users reste global, hors schéma sandbox)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formattedEmail,
        password: password,
      });

      if (authError) {
        setErrorMessage(authError.message.includes('already registered')
          ? 'Nama pengguna ini sudah wujud.'
          : 'Ralat pendaftaran. Sila cuba lagi.');
        setIsLoading(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setErrorMessage('Ralat sistem: Tiada ID pengguna dikembalikan.');
        setIsLoading(false);
        return;
      }

      // 2. Cherche si l'agence existe déjà (insensible à la casse)
      const { data: existingAgency } = await supabase
        .from('jpbd_directory')
        .select('id')
        .ilike('agency', cleanAgency)
        .maybeSingle();

      let agencyId;

      if (existingAgency) {
        agencyId = existingAgency.id;
      } else {
        const { data: newAgency, error: insertError } = await supabase
          .from('jpbd_directory')
          .insert([{ agency: cleanAgency, tracking_status: 'Offline' }])
          .select('id')
          .single();

        if (insertError) {
          setErrorMessage('Ralat mencipta agensi baharu.');
          setIsLoading(false);
          return;
        }
        agencyId = newAgency.id;
      }

      // 3. Créer/lier le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: userId, username: cleanUsername, role: 'agency', agency_id: agencyId }]);

      if (profileError) {
        setErrorMessage('Ralat mencipta profil pengguna.');
        setIsLoading(false);
        return;
      }

      onSignUpSuccess();
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
          <Text style={[styles.title, { color: theme?.text || '#0f172a' }]}>Daftar Akaun Agensi</Text>
          <Text style={[styles.subtitle, { color: theme?.textSecondary || '#64748b' }]}>
            Sistem Pengurusan APM
          </Text>
        </View>

        <View style={styles.inputWrapper}>
          <View style={[styles.inputContainer, { backgroundColor: theme?.card || '#fff', borderColor: theme?.border || '#e2e8f0' }]}>
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

          <View style={[styles.inputContainer, { backgroundColor: theme?.card || '#fff', borderColor: theme?.border || '#e2e8f0' }]}>
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

          <View style={[styles.inputContainer, { backgroundColor: theme?.card || '#fff', borderColor: theme?.border || '#e2e8f0' }]}>
            <Building2 color={theme?.textSecondary || '#64748b'} size={20} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: theme?.text || '#0f172a' }]}
              placeholder="Nama Agensi (cth: Bomba, APM)"
              placeholderTextColor={theme?.textSecondary || '#94a3b8'}
              value={agencyName}
              onChangeText={setAgencyName}
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
            style={[styles.signUpButton, isLoading ? styles.disabled : null]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.signUpButtonText}>Daftar</Text>
                <ArrowRight color="#fff" size={20} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onBackToLogin} style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={{ color: theme?.textSecondary || '#64748b' }}>Sudah ada akaun? Log Masuk</Text>
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
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 14, fontWeight: '600', marginTop: 5 },
  inputWrapper: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 56 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -5, marginLeft: 5 },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  signUpButton: { backgroundColor: '#f97316', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  disabled: { opacity: 0.7 },
  signUpButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});