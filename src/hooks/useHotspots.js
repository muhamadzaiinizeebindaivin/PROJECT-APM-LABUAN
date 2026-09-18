// src/hooks/useHotspots.js
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Gère la liste des hotspots (banjir/pantai/cerun) : chargement, création,
 * modification, suppression. Extrait de SekretariatScreen.js.
 * Schéma sandbox uniquement — ne touche jamais public.
 */
export function useHotspots(onNotify) {
  const [hotspotList, setHotspotList] = useState([]);
  const [loadingHotspot, setLoadingHotspot] = useState(true);
  const [modalHotspotVisible, setModalHotspotVisible] = useState(false);
  const [formModeHotspot, setFormModeHotspot] = useState('add');
  const [editIdHotspot, setEditIdHotspot] = useState(null);
  const [formHotspot, setFormHotspot] = useState({
    category: 'banjir', ref_no: '', river: '', area: '', latitude: '', longitude: ''
  });

  // Susun ikut Nombor Rujukan (ref_no), bukan created_at — supaya kemaskini
  // sesuatu rekod tidak mengubah kedudukannya dalam senarai.
  const sortByRefNo = (rows) => {
    return [...rows].sort((a, b) => {
      const numA = parseFloat(a.ref_no);
      const numB = parseFloat(b.ref_no);
      const validA = !isNaN(numA);
      const validB = !isNaN(numB);
      if (validA && validB && numA !== numB) return numA - numB;
      if (validA !== validB) return validA ? -1 : 1;
      return String(a.ref_no || '').localeCompare(String(b.ref_no || ''));
    });
  };

  const fetchHotspots = async () => {
    setLoadingHotspot(true);
    const { data, error } = await supabaseSandbox.from('hotspots').select('*');
    if (!error) setHotspotList(sortByRefNo(data || []));
    setLoadingHotspot(false);
  };

  useEffect(() => {
    fetchHotspots();
    const subscription = supabaseSandbox
      .channel(`hotspots_changes_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'hotspots' }, () => {
        fetchHotspots();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = (category) => {
    setFormModeHotspot('add');
    setFormHotspot({ category: category || 'banjir', ref_no: '', river: '', area: '', latitude: '', longitude: '' });
    setModalHotspotVisible(true);
  };

  const openEditModal = (item) => {
    setFormModeHotspot('edit');
    setEditIdHotspot(item.id);
    setFormHotspot({
      category: item.category, ref_no: item.ref_no || '', river: item.river, area: item.area,
      latitude: item.latitude != null ? String(item.latitude) : '',
      longitude: item.longitude != null ? String(item.longitude) : '',
    });
    setModalHotspotVisible(true);
  };

  const handleSaveHotspot = async () => {
    if (!formHotspot.ref_no || !formHotspot.river || !formHotspot.area) {
      return Alert.alert('Ralat', 'Sila masukkan No. Rujukan, maklumat Sungai/Lokasi dan Kawasan.');
    }

    const payload = {
      ...formHotspot,
      latitude: formHotspot.latitude === '' ? null : Number(formHotspot.latitude),
      longitude: formHotspot.longitude === '' ? null : Number(formHotspot.longitude),
    };

    setLoadingHotspot(true);
    if (formModeHotspot === 'add') {
      const { error } = await supabaseSandbox.from('hotspots').insert([payload]);
      if (error) onNotify?.('error', error.message);
      else { onNotify?.('success', 'Hotspot ditambah.'); setModalHotspotVisible(false); fetchHotspots(); }
    } else {
      const { error } = await supabaseSandbox.from('hotspots').update(payload).eq('id', editIdHotspot);
      if (error) onNotify?.('error', error.message);
      else { onNotify?.('success', 'Hotspot dikemaskini.'); setModalHotspotVisible(false); fetchHotspots(); }
    }
    setLoadingHotspot(false);
  };

  const confirmDeleteHotspot = (id) => {
    const executeDelete = async () => {
      setLoadingHotspot(true);
      const { error } = await supabaseSandbox.from('hotspots').delete().eq('id', id);
      if (error) {
        onNotify?.('error', error.message);
      } else {
        onNotify?.('success', 'Hotspot dipadam.');
        fetchHotspots();
      }
      setLoadingHotspot(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Pengesahan: Padam rekod hotspot ini?')) executeDelete();
    } else {
      Alert.alert('Pengesahan Padam', 'Padam rekod hotspot ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  return {
    hotspotList, loadingHotspot,
    modalHotspotVisible, setModalHotspotVisible,
    formModeHotspot, formHotspot, setFormHotspot,
    openAddModal, openEditModal,
    handleSaveHotspot, confirmDeleteHotspot,
  };
}