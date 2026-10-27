// src/screens/JawatankuasaScreen.js
//
// Espace "Sekretariat · Jawatankuasa Pengurusan Bencana Daerah Labuan" :
// accès par code (rôle jawatankuasa, lecture seule), puis le tableau de bord.
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { PALETTE } from '../constants/palette';
import AccessCodeGate from '../components/AccessCodeGate';
import JawatankuasaDashboard from './jawatankuasa/JawatankuasaDashboard';

export default function JawatankuasaScreen({ onBack }) {
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  // Accès déjà validé si la session en cours a le rôle jawatankuasa (rechargement de page)
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabaseSandbox.auth.getSession();
      if (session) {
        const { data: profile } = await supabaseSandbox
          .from('profiles').select('role').eq('id', session.user.id).maybeSingle();
        setVerified(profile?.role === 'jawatankuasa');
      }
      setChecking(false);
    };
    checkAccess();
  }, []);

  // "Kembali" : ferme la session anonyme d'un essai raté avant de revenir à l'accueil
  const handleBack = async () => {
    const { data: { session } } = await supabaseSandbox.auth.getSession();
    if (session?.user?.is_anonymous) await supabaseSandbox.auth.signOut();
    onBack();
  };

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PALETTE.orange} />
      </View>
    );
  }

  if (!verified) {
    return (
      <AccessCodeGate
        title="Kod Akses Sekretariat"
        subtitle="Jawatankuasa Pengurusan Bencana Daerah Labuan"
        rpcName="join_jawatankuasa"
        onVerified={() => setVerified(true)}
        onBack={handleBack}
      />
    );
  }

  return <JawatankuasaDashboard />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: PALETTE.softOrangeBg },
});
