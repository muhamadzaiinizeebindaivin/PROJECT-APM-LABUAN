// src/styles/tacticalComponents.js
// Composants prêts à poser, basés sur tacticalTheme — importables sur n'importe quel onglet
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TACTICAL_THEME as T, GRADIENTS, SPACING, RADIUS } from './tacticalTheme';

// Carte "héro" pour un gros chiffre clé (ex: Jumlah Anggota)
export const StatHero = ({ label, value, sublabel, icon }) => (
  <LinearGradient
    colors={GRADIENTS.hero}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      borderRadius: RADIUS.xl, padding: SPACING.xl, overflow: 'hidden',
      borderWidth: 1, borderColor: T.border,
    }}
  >
    <View style={{
      position: 'absolute', top: -40, right: -40, width: 140, height: 140,
      borderRadius: 70, backgroundColor: T.accent + '18',
    }} />
    <View style={{
      position: 'absolute', bottom: -20, right: 30, width: 4, height: 90,
      backgroundColor: T.accent, borderRadius: 2, transform: [{ rotate: '20deg' }],
    }} />
    <Text style={{ color: T.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 }}>
      {label}
    </Text>
    <Text style={{ color: T.text, fontSize: 52, fontWeight: '900', letterSpacing: -1.5, marginTop: 4 }}>
      {value}
    </Text>
  </LinearGradient>
);

// En-tête de section avec icône dans un badge dégradé + liseré latéral
export const SectionHeader = ({ title, eyebrow, icon: Icon, rightAction }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <LinearGradient
        colors={GRADIENTS.accent}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          width: 4, height: 22, borderRadius: 2, marginRight: 10,
        }}
      />
      <View>
        {eyebrow ? <Text style={{ color: T.accent, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 }}>{eyebrow}</Text> : null}
        <Text style={{ color: T.text, fontSize: 16, fontWeight: '800' }}>{title}</Text>
      </View>
    </View>
    {rightAction}
  </View>
);

// Bouton plein dégradé
export const GradientButton = ({ label, icon, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={style} activeOpacity={0.85}>
    <LinearGradient
      colors={GRADIENTS.accent}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 11, paddingHorizontal: 18, borderRadius: RADIUS.sm,
      }}
    >
      {icon}
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5, marginLeft: icon ? 6 : 0, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
);

// Badge de statut (succès / danger / neutre) avec bordure teintée
export const StatusBadge = ({ label, tone = 'neutral' }) => {
  const colors = {
    success: { bg: T.success + '18', border: T.success + '55', text: T.success },
    danger: { bg: T.danger + '18', border: T.danger + '55', text: T.danger },
    warning: { bg: T.warning + '18', border: T.warning + '55', text: T.warning },
    neutral: { bg: T.cardAlt, border: T.border, text: T.textSecondary },
  }[tone];
  return (
    <View style={{
      alignSelf: 'flex-start', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill,
    }}>
      <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '800', textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
};

// Carte compacte avec barre d'accent dégradée en haut
export const AccentCard = ({ children, style }) => (
  <View style={[{ backgroundColor: T.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: T.border, overflow: 'hidden' }, style]}>
    <LinearGradient colors={GRADIENTS.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />
    <View style={{ padding: SPACING.lg }}>{children}</View>
  </View>
);

// Barre de progression dégradée (ex: Taburan Jantina)
export const GradientProgressBar = ({ percent, colors = GRADIENTS.accent }) => (
  <View style={{ height: 8, backgroundColor: T.cardAlt, borderRadius: 4, overflow: 'hidden' }}>
    <LinearGradient
      colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      style={{ width: `${percent}%`, height: '100%', borderRadius: 4 }}
    />
  </View>
);