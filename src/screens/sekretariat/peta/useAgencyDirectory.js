// src/screens/sekretariat/peta/useAgencyDirectory.js
import { useState, useEffect } from 'react';
import { supabaseSandbox } from '../../../supabaseSandboxClient';
import { PALETTE } from '../../../constants/palette';
import { buildAgencyColorMap } from './petaUtils';

// Liste légère des agences (jpbd_directory), pour la légende et les couleurs/logos
// des marqueurs de la carte. Se met à jour en temps réel.
export function useAgencyDirectory() {
  const [agencyNames, setAgencyNames] = useState([]);

  useEffect(() => {
    const fetchAgencyNames = async () => {
      const { data } = await supabaseSandbox.from('jpbd_directory').select('id, agency, logo_url').order('created_at', { ascending: true });
      setAgencyNames(data || []);
    };
    fetchAgencyNames();
    const subscription = supabaseSandbox
      .channel(`peta_jpbd_directory_changes_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'jpbd_directory' }, () => {
        fetchAgencyNames();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
  }, []);

  const agencyColorMap = buildAgencyColorMap(agencyNames);
  const getAgencyColor = (agencyName) => agencyColorMap[agencyName] || PALETTE.textMutedDark;
  const agencyLogoMap = {};
  agencyNames.forEach((a) => { if (a.logo_url) agencyLogoMap[a.agency] = a.logo_url; });
  const getAgencyLogo = (agencyName) => agencyLogoMap[agencyName] || null;

  return { agencyNames, getAgencyColor, getAgencyLogo };
}
