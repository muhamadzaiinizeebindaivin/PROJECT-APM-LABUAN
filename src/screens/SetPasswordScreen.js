import React, { useState, useEffect, useRef, createElement } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import { Lock, ShieldCheck, CheckCircle, AlertCircle, LogIn, Check, X, Eye, EyeOff } from 'lucide-react-native';
import { supabaseSandbox as supabase } from '../supabaseSandboxClient';
import { PALETTE } from '../constants/palette';

// Critères de robustesse évalués sur le mot de passe en direct
const PASSWORD_RULES = [
  { key: 'length', label: 'Sekurang-kurangnya 8 aksara', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'Satu huruf besar (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Satu huruf kecil (a-z)', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'Satu nombor (0-9)', test: (v) => /[0-9]/.test(v) },
  { key: 'special', label: 'Satu aksara khas (!@#$...)', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const getPasswordStrength = (value) => {
  const passedCount = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  if (!value) return { score: 0, label: '', color: PALETTE.cardLightBorder };
  if (passedCount <= 2) return { score: passedCount, label: 'Lemah', color: PALETTE.danger };
  if (passedCount <= 4) return { score: passedCount, label: 'Sederhana', color: '#d97706' };
  return { score: passedCount, label: 'Kukuh', color: PALETTE.success };
};

// Rubans dégradés bleu/orange qui ondulent lentement, effet "peinture dans l'eau"
// Injecte les animations CSS une seule fois (pattern déjà utilisé dans JpbdSection.js pour la scrollbar)
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('flowing-ribbons-css')) {
  const style = document.createElement('style');
  style.id = 'flowing-ribbons-css';
  style.textContent = `
    @keyframes ribbonDrift1 {
      0%, 100% { transform: translate(0px, 0px) scale(1); }
      50% { transform: translate(60px, -30px) scale(1.05); }
    }
    @keyframes ribbonDrift2 {
      0%, 100% { transform: translate(0px, 0px) scale(1); }
      50% { transform: translate(-50px, 40px) scale(1.08); }
    }
    @keyframes ribbonDrift3 {
      0%, 100% { transform: translate(0px, 0px) scale(1); }
      50% { transform: translate(40px, 30px) scale(1.04); }
    }
    .ribbon-1 { animation: ribbonDrift1 11s ease-in-out infinite; }
    .ribbon-2 { animation: ribbonDrift2 14s ease-in-out infinite; }
    .ribbon-3 { animation: ribbonDrift3 9s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
}

// Rubans ondulés en SVG (bleu/orange), dérivant lentement en fond
function FlowingBackground() {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={bgStyles.container} pointerEvents="none">
      {createElement('svg', {
        viewBox: '0 0 1200 800',
        preserveAspectRatio: 'xMidYMid slice',
        style: { width: '100%', height: '100%', position: 'absolute' },
      },
        createElement('defs', {},
          createElement('linearGradient', { id: 'ribbonGrad1', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
            createElement('stop', { offset: '0%', stopColor: '#f97316' }),
            createElement('stop', { offset: '50%', stopColor: '#fb923c' }),
            createElement('stop', { offset: '100%', stopColor: '#60a5fa' }),
          ),
          createElement('linearGradient', { id: 'ribbonGrad2', x1: '100%', y1: '0%', x2: '0%', y2: '100%' },
            createElement('stop', { offset: '0%', stopColor: '#2563eb' }),
            createElement('stop', { offset: '50%', stopColor: '#60a5fa' }),
            createElement('stop', { offset: '100%', stopColor: '#f97316' }),
          ),
          createElement('linearGradient', { id: 'ribbonGrad3', x1: '0%', y1: '100%', x2: '100%', y2: '0%' },
            createElement('stop', { offset: '0%', stopColor: '#fb923c' }),
            createElement('stop', { offset: '100%', stopColor: '#2563eb' }),
          ),
        ),
        createElement('path', {
          className: 'ribbon-1',
          d: 'M -100,150 C 200,50 400,250 700,150 C 950,70 1100,180 1300,120 L 1300,220 C 1100,280 950,170 700,250 C 400,350 200,150 -100,250 Z',
          fill: 'url(#ribbonGrad1)',
          opacity: 0.35,
        }),
        createElement('path', {
          className: 'ribbon-2',
          d: 'M -100,420 C 250,320 450,480 750,380 C 1000,300 1150,420 1300,360 L 1300,460 C 1150,520 1000,400 750,480 C 450,580 250,420 -100,520 Z',
          fill: 'url(#ribbonGrad2)',
          opacity: 0.3,
        }),
        createElement('path', {
          className: 'ribbon-3',
          d: 'M -100,650 C 200,580 500,700 800,600 C 1000,540 1150,650 1300,600 L 1300,700 C 1150,750 1000,640 800,700 C 500,800 200,680 -100,750 Z',
          fill: 'url(#ribbonGrad3)',
          opacity: 0.28,
        }),
      )}
    </View>
  );
}

const bgStyles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
});

export default function SetPasswordScreen({ onGoToLogin }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = getPasswordStrength(password);

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

    const failedRules = PASSWORD_RULES.filter((rule) => !rule.test(password));
    if (failedRules.length > 0) {
      setFeedback({ type: 'error', message: `Kata laluan belum memenuhi: ${failedRules.map((r) => r.label).join(', ')}.` });
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
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <FlowingBackground />
        <Image
          source={{ uri: 'https://kceeewyadcskivtmilyf.supabase.co/storage/v1/object/public/logo/apm_labuan.png' }}
          style={styles.logoStandalone}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={PALETTE.orange} />
      </View>
    );
  }

  if (!sessionReady) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', padding: 24 }]}>
        <FlowingBackground />
        <Image
          source={{ uri: 'https://kceeewyadcskivtmilyf.supabase.co/storage/v1/object/public/logo/apm_labuan.png' }}
          style={styles.logoAboveCard}
          resizeMode="contain"
        />
        <Text style={styles.expiredText}>
          Pautan tidak sah atau telah tamat tempoh. Sila hubungi admin untuk jemputan baharu.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { justifyContent: 'center', padding: 24 }]}>
      <FlowingBackground />
      <Image
        source={{ uri: 'https://kceeewyadcskivtmilyf.supabase.co/storage/v1/object/public/logo/apm_labuan.png' }}
        style={styles.logoAboveCard}
        resizeMode="contain"
      />
      <View style={styles.card}>

        {/* Bandeau header sombre, même esprit que la modale de login */}
        <View style={styles.banner}>
          <Text style={styles.kicker}>APM W.P LABUAN</Text>
          {isDone ? (
            <>
              <Text style={styles.bannerTitle}>Kata Laluan Ditetapkan</Text>
              <Text style={styles.bannerSubtitle}>Akaun anda kini sedia digunakan</Text>
            </>
          ) : (
            <>
              <Text style={styles.bannerTitle}>Tetapkan Kata Laluan</Text>
              <Text style={styles.bannerSubtitle}>Selamat datang! Sila cipta kata laluan anda</Text>
            </>
          )}
        </View>

        {/* Formulaire / état final */}
        <View style={styles.body}>
          {isDone ? (
            <>
              <View style={styles.successIconCircle}>
                <CheckCircle size={28} color="#fff" />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={onGoToLogin}>
                <LogIn size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Pergi ke Log Masuk</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {feedback && (
                <View style={[styles.feedbackBox, feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
                  {feedback.type === 'success' ? <CheckCircle size={18} color={PALETTE.success} /> : <AlertCircle size={18} color={PALETTE.danger} />}
                  <Text style={[styles.feedbackText, { color: feedback.type === 'success' ? '#166534' : '#991b1b' }]}>
                    {feedback.message}
                  </Text>
                </View>
              )}

              <View style={[styles.inputGroup, focusedField === 'password' && styles.inputGroupFocused]}>
                <View style={styles.inputIconWrap}>
                  <Lock size={17} color={focusedField === 'password' ? PALETTE.orange : '#94a3b8'} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Kata Laluan Baharu"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={17} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
                </TouchableOpacity>
              </View>

              <Text style={styles.requirementsHint}>
                Kata laluan mesti sekurang-kurangnya 8 aksara, mengandungi huruf besar, huruf kecil, nombor, dan aksara khas.
              </Text>

              {!!password && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthTrack}>
                    <View style={[styles.strengthFill, { width: `${(strength.score / PASSWORD_RULES.length) * 100}%`, backgroundColor: strength.color }]} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>

                  <View style={styles.rulesList}>
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <View key={rule.key} style={styles.ruleRow}>
                          {passed ? <Check size={13} color={PALETTE.success} /> : <X size={13} color="#94a3b8" />}
                          <Text style={[styles.ruleText, passed && styles.ruleTextPassed]}>{rule.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={[styles.inputGroup, focusedField === 'confirm' && styles.inputGroupFocused]}>
                <View style={styles.inputIconWrap}>
                  <Lock size={17} color={focusedField === 'confirm' ? PALETTE.orange : '#94a3b8'} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Sahkan Kata Laluan"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword((v) => !v)}>
                  {showConfirmPassword ? <EyeOff size={17} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSetPassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.saveButtonText}>Simpan Kata Laluan</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PALETTE.softOrangeBg, position: 'relative', overflow: 'hidden' },
  logoAboveCard: {
    width: 400, height: 150,
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoStandalone: {
    width: 120, height: 120,
    marginBottom: 20,
  },

  card: {
    width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },

  banner: { backgroundColor: '#0c0c0e', padding: 24, paddingBottom: 28 },
  kicker: { fontSize: 10, fontWeight: '800', color: PALETTE.orange, letterSpacing: 2, textTransform: 'uppercase' },
  bannerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 3 },
  bannerSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

  body: { padding: 24, gap: 4, backgroundColor: '#fff' },

  successIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: PALETTE.success,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20,
  },

  expiredText: { textAlign: 'center', color: PALETTE.textMutedDark },

  inputGroup: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: '#f8fafc', marginBottom: 12,
  },
  inputGroupFocused: {
    borderColor: PALETTE.orange,
    backgroundColor: 'rgba(249, 115, 22, 0.04)',
  },
  inputIconWrap: { marginRight: 10 },
  eyeBtn: { paddingLeft: 10 },
  input: {
    flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a', outlineStyle: 'none',
  },

  saveButton: {
    flexDirection: 'row', backgroundColor: PALETTE.orange, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10,
  },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  feedbackBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 16 },
  feedbackSuccess: { backgroundColor: PALETTE.successSoft, borderWidth: 1, borderColor: '#bbf7d0' },
  feedbackError: { backgroundColor: PALETTE.dangerSoft, borderWidth: 1, borderColor: '#fecaca' },
  feedbackText: { fontSize: 13, fontWeight: '700', flex: 1 },

  requirementsHint: { fontSize: 12, color: '#94a3b8', marginTop: -6, marginBottom: 12, lineHeight: 17 },

  strengthWrap: { marginTop: -4, marginBottom: 14 },
  strengthTrack: { height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: '800', marginTop: 6 },
  rulesList: { marginTop: 10, gap: 6 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { fontSize: 12, color: '#94a3b8' },
  ruleTextPassed: { color: '#0f172a', fontWeight: '600' },
});