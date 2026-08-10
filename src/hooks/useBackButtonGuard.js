import { useRef, useEffect } from 'react';
import { Platform } from 'react-native';

// Bouton "retour" du navigateur : ramener vers l'accueil plutôt que quitter
// le site quand on est connecté en tant que pemandu/agensi. Ces deux flows
// n'ont qu'un seul écran (pas de pile de navigation interne), donc sans
// ceci, l'historique du navigateur n'a rien à "dépiler" et le bouton retour
// sort carrément du site.
export function useBackButtonGuard(userRole, setUserRole, setAgencyInfo) {
  const userRoleRef = useRef(userRole);
  useEffect(() => { userRoleRef.current = userRole; }, [userRole]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    // Empile une entrée d'historique dédiée dès qu'on entre en mode pemandu/agensi,
    // pour que le bouton retour ait quelque chose à intercepter.
    if (userRole === 'driver' || userRole === 'agency') {
      window.history.pushState({ apmGuard: true }, '', window.location.href);
    }
  }, [userRole]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handlePopState = () => {
      if (userRoleRef.current === 'driver' || userRoleRef.current === 'agency') {
        setUserRole('guest');
        setAgencyInfo(null);
        // Réempile une entrée pour absorber d'éventuels nouveaux clics sur "retour"
        window.history.pushState({ apmGuard: true }, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
}