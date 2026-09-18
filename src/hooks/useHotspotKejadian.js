// src/hooks/useHotspotKejadian.js
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Rekod kejadian (onglet "Rekod" par catégorie dans HotspotSection.js) —
 * lit/écrit sekretariat_bencana_points, filtré par catégorie côté composant.
 */
export function useHotspotKejadian(onNotify) {
  const [kejadianList, setKejadianList] = useState([]);
  const [loadingKejadian, setLoadingKejadian] = useState(true);
  const [modalKejadianVisible, setModalKejadianVisible] = useState(false);
  const [formModeKejadian, setFormModeKejadian] = useState('add');
  const [editIdKejadian, setEditIdKejadian] = useState(null);
  const [formKejadian, setFormKejadian] = useState({
    category: '', jenis_bencana: '', tarikh: '', lokasi: '',
    jumlah_kir: '', jumlah_mangsa: '', jumlah_rumah_terjejas: '', pps: '', description: '',
  });

  const fetchKejadian = async () => {
    setLoadingKejadian(true);
    const { data, error } = await supabaseSandbox
      .from('sekretariat_bencana_points')
      .select('*')
      .order('tarikh', { ascending: false });
    if (!error) setKejadianList(data || []);
    setLoadingKejadian(false);
  };

  useEffect(() => {
    fetchKejadian();
    const subscription = supabaseSandbox
      .channel(`sekretariat_bencana_points_kejadian_changes_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'sekretariat_bencana_points' }, () => {
        fetchKejadian();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddKejadianModal = (categoryKey, categoryLabel) => {
    setFormModeKejadian('add');
    setFormKejadian({ category: categoryKey, jenis_bencana: categoryLabel || '', tarikh: '', lokasi: '', jumlah_kir: '', jumlah_mangsa: '', jumlah_rumah_terjejas: '', pps: '', description: '' });
    setModalKejadianVisible(true);
  };

  const openEditKejadianModal = (item) => {
    setFormModeKejadian('edit');
    setEditIdKejadian(item.id);
    setFormKejadian({
      category: item.category,
      jenis_bencana: item.jenis_bencana || '',
      tarikh: item.tarikh || '',
      lokasi: item.lokasi || '',
      jumlah_kir: item.jumlah_kir != null ? String(item.jumlah_kir) : '',
      jumlah_mangsa: item.jumlah_mangsa != null ? String(item.jumlah_mangsa) : '',
      jumlah_rumah_terjejas: item.jumlah_rumah_terjejas != null ? String(item.jumlah_rumah_terjejas) : '',
      pps: item.pps || '',
      description: item.description || '',
    });
    setModalKejadianVisible(true);
  };

  const handleSaveKejadian = async () => {
    // Tous les champs sont optionnels — l'utilisateur peut compléter plus tard.
    const payload = {
      category: formKejadian.category,
      jenis_bencana: formKejadian.jenis_bencana?.trim() || null,
      tarikh: formKejadian.tarikh || null,
      lokasi: formKejadian.lokasi?.trim() || null,
      jumlah_kir: formKejadian.jumlah_kir === '' ? null : parseInt(formKejadian.jumlah_kir, 10),
      jumlah_mangsa: formKejadian.jumlah_mangsa === '' ? null : parseInt(formKejadian.jumlah_mangsa, 10),
      jumlah_rumah_terjejas: formKejadian.jumlah_rumah_terjejas === '' ? null : parseInt(formKejadian.jumlah_rumah_terjejas, 10),
      pps: formKejadian.pps?.trim() || null,
      description: formKejadian.description?.trim() || null,
    };

    setLoadingKejadian(true);
    if (formModeKejadian === 'add') {
      const { error } = await supabaseSandbox.from('sekretariat_bencana_points').insert([payload]);
      if (error) onNotify?.('error', error.message);
      else { onNotify?.('success', 'Rekod ditambah.'); setModalKejadianVisible(false); fetchKejadian(); }
    } else {
      const { error } = await supabaseSandbox.from('sekretariat_bencana_points').update(payload).eq('id', editIdKejadian);
      if (error) onNotify?.('error', error.message);
      else { onNotify?.('success', 'Rekod dikemaskini.'); setModalKejadianVisible(false); fetchKejadian(); }
    }
    setLoadingKejadian(false);
  };

  const confirmDeleteKejadian = (id) => {
    const executeDelete = async () => {
      setLoadingKejadian(true);
      const { error } = await supabaseSandbox.from('sekretariat_bencana_points').delete().eq('id', id);
      if (error) onNotify?.('error', error.message);
      else { onNotify?.('success', 'Rekod dipadam.'); fetchKejadian(); }
      setLoadingKejadian(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Padam rekod ini?')) executeDelete();
    } else {
      Alert.alert('Pengesahan Padam', 'Padam rekod ini?', [
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
