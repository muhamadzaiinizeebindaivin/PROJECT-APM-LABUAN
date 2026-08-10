import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useAuthSession() {
  const [userRole, setUserRole] = useState(null);
  const [agencyInfo, setAgencyInfo] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogin = (role, extraData = null) => {
    if (role) {
      setUserRole(role.toLowerCase().trim());
      if (extraData) {
        setAgencyInfo(extraData);
      }
    } else {
      setUserRole(null);
      setAgencyInfo(null);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
     try {
      // 1. Vérifie d'abord si une session "agency" (sans compte) existe en localStorage
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        const agencySession = localStorage.getItem('apm_agency_session');
        if (agencySession) {
          handleLogin('agency');
          setIsCheckingSession(false);
          return;
        }
      }

      // 2. Sinon, comportement existant (vérifie la vraie session Supabase Auth)
      const { data: { session }, error: sessionError } = await supabaseSandbox.auth.getSession();

      if (sessionError) {
        console.error('getSession error:', sessionError.message, sessionError.status);
        const isRateLimited = sessionError.status === 429 || /rate limit/i.test(sessionError.message || '');
        if (isRateLimited) {
          // Ne pas déconnecter sur un simple rate limit — réessayer une fois après un court délai
          await new Promise(r => setTimeout(r, 2500));
          const retry = await supabaseSandbox.auth.getSession();
          if (retry.data?.session) {
            return restoreSession();
          }
        }
      }

      if (!session) {
        setUserRole('guest');
        setIsCheckingSession(false);
        return;
      }

      const userId = session.user.id;
      const email = session.user.email;
      const cleanUsername = email ? email.split('@')[0] : null;

      const { data: profile, error: profileError } = await supabaseSandbox
        .from('profiles')
        .select('role, agency_id, username')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('profile fetch error:', profileError.message, profileError.code, profileError.details);
      }

      // Collision précise : une session anonyme (bouton "Operasi" / code d'accès dans
      // LaporKesScreen) a role='operasi' en base pour les besoins de RLS — mais ça ne
      // doit JAMAIS être confondu avec un vrai compte département 'operasi'. On ne
      // cible QUE ce cas précis ici : les autres rôles anonymes ('driver' notamment)
      // n'entrent en collision avec rien et suivent le chemin normal plus bas.
      if (session.user.is_anonymous && profile?.role === 'operasi') {
        handleLogin('operasi_lapor');
        setIsCheckingSession(false);
        return;
      }

      if (profile?.role === 'agency') {
        if (!profile.agency_id) {
          // Profil agency incomplet (agency_id manquant) — on ne peut pas restaurer proprement
          setUserRole('guest');
          setIsCheckingSession(false);
          return;
        }

        const { data: agencyRow, error: agencyError } = await supabaseSandbox
          .from('jpbd_directory')
          .select('id, agency')
          .eq('id', profile.agency_id)
          .maybeSingle();

        if (agencyError || !agencyRow) {
          setUserRole('guest');
          setIsCheckingSession(false);
          return;
        }

        handleLogin('agency', { 
          agencyId: agencyRow.id, 
          agencyName: agencyRow.agency,
          userId: userId,
          username: cleanUsername || profile.username
        });
      } else if (profile?.role) {
        // Rôle réel vérifié en base — plus de mapping par username, plus de catch-all
        handleLogin(profile.role);
      } else {
        // Aucun profil trouvé -> pas d'accès, on ne connecte personne par défaut
        setIsCheckingSession(false);
        return;
      }

      setIsCheckingSession(false);
     } catch (err) {
       console.error('restoreSession error:', err);
       setUserRole('guest');
       setIsCheckingSession(false);
     }
    };

    restoreSession();
  }, []);

  const clearAgencySessionFlag = () => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('apm_agency_session');
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    await supabaseSandbox.auth.signOut();
    clearAgencySessionFlag();
    setUserRole('guest');
    setAgencyInfo(null);
    setLogoutModalVisible(false);
  };

  return {
    userRole, agencyInfo, isCheckingSession,
    logoutModalVisible, setLogoutModalVisible,
    handleLogin, handleLogout, confirmLogout,
    setUserRole, setAgencyInfo,
  };
}