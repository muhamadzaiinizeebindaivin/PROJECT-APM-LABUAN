// src/hooks/useHotspotKejadian.js
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Gère la liste des rekod kejadian (historique d'incidents par catégorie) :
 * chargement, création, modification, suppression.
 * Schéma sandbox uniquement — ne touche jamais public.
 */
export function useHotspotKejadian() {
  const [kejadianList, setKejadianList] = useState([]);
  const [loadingKejadian, setLoadingKejadian] = useState(true);
  const [modalKejadianVisible, setModalKejadianVisible] = useState(false);
  const [formModeKejadian, setFormModeKejadian] = useState('add');
  const [editIdKejadian, setEditIdKejadian] = useState(null);
  const [formKejadian, setFormKejadian] = useState({
    category: 'banjir', tarikh: '', jenis_bencana: '', lokasi: '',
    jumlah_kir: '', jumlah_mangsa: '', pps: '', catatan: ''
  });

  const fetchKejadian = async () => {
    setLoadingKejadian(true);
    const { data, error } = await supabaseSandbox.from('hotspot_kejadian').select('*').order('tarikh', { ascending: false });
    if (!error) setKejadianList(data || []);
    setLoadingKejadian(false);
  };

  useEffect(() => {
    fetchKejadian();
    const subscription = supabaseSandbox
      .channel('hotspot_kejadian_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'hotspot_kejadian' }, () => {
        fetchKejadian();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddKejadianModal = (category, categoryLabel) => {
    setFormModeKejadian('add');
    setFormKejadian({ category, tarikh: '', jenis_bencana: categoryLabel, lokasi: '', jumlah_kir: '', jumlah_mangsa: '', pps: '', catatan: '' });
    setModalKejadianVisible(true);
  };

  const openEditKejadianModal = (item) => {
    setFormModeKejadian('edit');
    setEditIdKejadian(item.id);
    setFormKejadian({
      category: item.category,
      tarikh: item.tarikh || '',
      jenis_bencana: item.jenis_bencana || '',
      lokasi: item.lokasi || '',
      jumlah_kir: item.jumlah_kir != null ? String(item.jumlah_kir) : '',
      jumlah_mangsa: item.jumlah_mangsa != null ? String(item.jumlah_mangsa) : '',
      pps: item.pps || '',
      catatan: item.catatan || '',
    });
    setModalKejadianVisible(true);
  };

  const handleSaveKejadian = async () => {
    const payload = {
      ...formKejadian,
      tarikh: formKejadian.tarikh === '' ? null : formKejadian.tarikh,
      jumlah_kir: formKejadian.jumlah_kir === '' ? null : Number(formKejadian.jumlah_kir),
      jumlah_mangsa: formKejadian.jumlah_mangsa === '' ? null : Number(formKejadian.jumlah_mangsa),
    };

    setLoadingKejadian(true);
    if (formModeKejadian === 'add') {
      const { error } = await supabaseSandbox.from('hotspot_kejadian').insert([payload]);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'Rekod kejadian ditambah.'); setModalKejadianVisible(false); fetchKejadian(); }
    } else {
      const { error } = await supabaseSandbox.from('hotspot_kejadian').update(payload).eq('id', editIdKejadian);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'Rekod kejadian dikemaskini.'); setModalKejadianVisible(false); fetchKejadian(); }
    }
    setLoadingKejadian(false);
  };

  const confirmDeleteKejadian = (id) => {
    const executeDelete = async () => {
      setLoadingKejadian(true);
      const { error } = await supabaseSandbox.from('hotspot_kejadian').delete().eq('id', id);
      if (error) {
        Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      } else {
        fetchKejadian();
      }
      setLoadingKejadian(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Pengesahan: Padam rekod kejadian ini?')) executeDelete();
    } else {
      Alert.alert('Pengesahan Padam', 'Padam rekod kejadian ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  return {
    kejadianList, loadingKejadian,
    modalKejadianVisible, setModalKejadianVisible,
    formModeKejadian, formKejadian, setFormKejadian,
    openAddKejadianModal, openEditKejadianModal,
    handleSaveKejadian, confirmDeleteKejadian,
  };
}