// src/hooks/useHotspots.js
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Gère la liste des hotspots (banjir/pantai/cerun) : chargement, création,
 * modification, suppression. Extrait de SekretariatScreen.js.
 * Schéma sandbox uniquement — ne touche jamais public.
 */
export function useHotspots() {
  const [hotspotList, setHotspotList] = useState([]);
  const [loadingHotspot, setLoadingHotspot] = useState(true);
  const [modalHotspotVisible, setModalHotspotVisible] = useState(false);
  const [formModeHotspot, setFormModeHotspot] = useState('add');
  const [editIdHotspot, setEditIdHotspot] = useState(null);
  const [formHotspot, setFormHotspot] = useState({
    category: 'banjir', ref_no: '', river: '', area: ''
  });

  const fetchHotspots = async () => {
    setLoadingHotspot(true);
    const { data, error } = await supabaseSandbox.from('hotspots').select('*').order('created_at', { ascending: true });
    if (!error) setHotspotList(data || []);
    setLoadingHotspot(false);
  };

  useEffect(() => {
    fetchHotspots();
    const subscription = supabaseSandbox
      .channel('hotspots_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'hotspots' }, () => {
        fetchHotspots();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setFormModeHotspot('add');
    setFormHotspot({ category: 'banjir', ref_no: '', river: '', area: '' });
    setModalHotspotVisible(true);
  };

  const openEditModal = (item) => {
    setFormModeHotspot('edit');
    setEditIdHotspot(item.id);
    setFormHotspot({ category: item.category, ref_no: item.ref_no || '', river: item.river, area: item.area });
    setModalHotspotVisible(true);
  };

  const handleSaveHotspot = async () => {
    if (!formHotspot.ref_no || !formHotspot.river || !formHotspot.area) {
      return Alert.alert('Ralat', 'Sila masukkan No. Rujukan, maklumat Sungai/Lokasi dan Kawasan.');
    }

    setLoadingHotspot(true);
    if (formModeHotspot === 'add') {
      const { error } = await supabaseSandbox.from('hotspots').insert([formHotspot]);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'Hotspot ditambah.'); setModalHotspotVisible(false); fetchHotspots(); }
    } else {
      const { error } = await supabaseSandbox.from('hotspots').update(formHotspot).eq('id', editIdHotspot);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'Hotspot dikemaskini.'); setModalHotspotVisible(false); fetchHotspots(); }
    }
    setLoadingHotspot(false);
  };

  const confirmDeleteHotspot = (id) => {
    const executeDelete = async () => {
      setLoadingHotspot(true);
      const { error } = await supabaseSandbox.from('hotspots').delete().eq('id', id);
      if (error) {
        Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      } else {
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