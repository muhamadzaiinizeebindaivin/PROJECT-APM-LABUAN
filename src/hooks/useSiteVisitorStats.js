// src/hooks/useSiteVisitorStats.js
import { useState, useEffect } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Nombre cumulé d'ouvertures du site (table sandbox.site_visits, une ligne
 * insérée par App.js à chaque chargement, peu importe la route ou si la
 * personne se connecte ensuite).
 */
export function useSiteVisitorStats() {
  const [totalVisits, setTotalVisits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchTotal = async () => {
      const { count, error } = await supabaseSandbox
        .from('site_visits')
        .select('id', { count: 'exact', head: true });
      if (error) console.error('[site_visits count error]', error);
      if (mounted) {
        setTotalVisits(count ?? 0);
        setLoading(false);
      }
    };
    fetchTotal();

    const visitsSubscription = supabaseSandbox
      .channel('site_visits_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'sandbox', table: 'site_visits' }, () => {
        fetchTotal();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabaseSandbox.removeChannel(visitsSubscription);
    };
  }, []);

  return { totalVisits, loading };
}
