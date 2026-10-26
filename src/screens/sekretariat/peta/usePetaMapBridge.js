// src/screens/sekretariat/peta/usePetaMapBridge.js
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import pemantauanTrackerIconAsset from '../../../../assets/pemantauan-tracker-icon.png';
import { PALETTE } from '../../../constants/palette';

const PEMANTAUAN_TRACKER_ICON_URL = Asset.fromModule(pemantauanTrackerIconAsset).uri;

/**
 * Pont entre l'écran et la carte Leaflet qui tourne dans une <iframe> (web uniquement).
 *
 * - attend le message MAP_READY de l'iframe avant d'envoyer quoi que ce soit ;
 * - pousse les données à jour vers la carte (agences/pemantauan en ligne,
 *   titik bencana actifs, titik pemantauan actifs) à chaque changement ;
 * - transmet à `onMapMessage` les messages venant de la carte (clic, demandes
 *   de suppression/modification…). Le dernier handler est toujours utilisé,
 *   sans réabonner l'écouteur à chaque rendu.
 */
export function usePetaMapBridge({
  iframeRef, onMapMessage,
  onlineAgencies, onlinePemantauan, getAgencyColor, getAgencyLogo, agencyNames,
  bencanaPoints, hotspotCategories, pemantauanPoints,
}) {
  const [mapReady, setMapReady] = useState(false);

  const postToMap = (message) => {
    iframeRef?.current?.contentWindow?.postMessage(JSON.stringify(message), '*');
  };

  // L'iframe signale quand la carte est initialisée
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const onMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === 'MAP_READY') setMapReady(true);
      } catch (e) { /* messages non-JSON (HMR etc.) */ }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Messages de la carte → écran
  const handlerRef = useRef(onMapMessage);
  handlerRef.current = onMapMessage;
  useEffect(() => {
    // `window` n'existe pas sur mobile natif : écouteur branché sur le web uniquement
    if (Platform.OS !== 'web') return undefined;
    const handleMapMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        handlerRef.current(JSON.parse(event.data));
      } catch (e) { /* message non-JSON */ }
    };
    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, [iframeRef]);

  // Agences + équipes pemantauan en ligne
  useEffect(() => {
    if (!mapReady || !iframeRef?.current?.contentWindow) return;
    const agencyPayload = onlineAgencies.map((a) => ({
      id: a.id,
      name: a.member_name,
      agency: a.jpbd_directory?.agency || '',
      lat: a.latitude,
      lng: a.longitude,
      color: getAgencyColor(a.jpbd_directory?.agency || ''),
      logo: getAgencyLogo(a.jpbd_directory?.agency || ''),
      updated: a.last_updated ? new Date(a.last_updated).toLocaleTimeString() : '',
    }));
    const pemantauanPayload = onlinePemantauan.map((p) => ({
      id: p.id,
      name: p.member_name,
      agency: 'Pemantauan',
      lat: p.latitude,
      lng: p.longitude,
      color: PALETTE.yellow,
      logo: PEMANTAUAN_TRACKER_ICON_URL,
      updated: p.last_updated ? new Date(p.last_updated).toLocaleTimeString() : '',
    }));
    postToMap({ type: 'UPDATE_AGENCIES', payload: [...agencyPayload, ...pemantauanPayload] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineAgencies, onlinePemantauan, agencyNames, mapReady]);

  // Titik bencana actifs
  useEffect(() => {
    if (!mapReady || !iframeRef?.current?.contentWindow) return;
    const payload = bencanaPoints
      .filter((b) => b.status !== 'resolved' && b.latitude != null && b.longitude != null)
      .map((b) => {
        const cat = hotspotCategories.find((c) => c.key === b.category);
        return {
          id: b.id,
          category: b.category,
          categoryLabel: cat?.label || b.category,
          icon: cat?.icon || 'MapPin',
          color: cat?.color || '#f97316',
          description: b.description || '',
          lokasi: b.lokasi || '',
          pps: b.pps || '',
          jumlah_kir: b.jumlah_kir,
          jumlah_mangsa: b.jumlah_mangsa,
          lat: b.latitude, lng: b.longitude, created_at: b.created_at,
        };
      });
    postToMap({ type: 'UPDATE_BENCANA', payload });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bencanaPoints, hotspotCategories, mapReady]);

  // Titik pemantauan actifs
  useEffect(() => {
    if (!mapReady || !iframeRef?.current?.contentWindow) return;
    const payload = pemantauanPoints
      .filter((p) => p.status !== 'resolved' && p.latitude != null && p.longitude != null)
      .map((p) => ({
        id: p.id,
        lokasi: p.lokasi || '',
        jumlah_rumah_terjejas: p.jumlah_rumah_terjejas ?? 0,
        pps: p.pps || '',
        agensi_di_lapangan: p.agensi_di_lapangan || '',
        bacaan_air: p.bacaan_air || '',
        lat: p.latitude, lng: p.longitude, created_at: p.created_at,
      }));
    postToMap({ type: 'UPDATE_PEMANTAUAN_POINTS', payload });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pemantauanPoints, mapReady]);

  return { mapReady, postToMap };
}
