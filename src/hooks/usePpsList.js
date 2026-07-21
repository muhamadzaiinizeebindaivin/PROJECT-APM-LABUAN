// src/hooks/usePpsList.js
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Gère la liste des PPS (Pusat Pemindahan Sementara) : chargement,
 * création, modification, suppression, et calcul des statistiques
 * agrégées par type. Extrait de SekretariatScreen.js.
 * Schéma sandbox uniquement — ne touche jamais public.
 */
export function usePpsList() {
  const [ppsList, setPpsList] = useState([]);
  const [ppsStats, setPpsStats] = useState([]);
  const [loadingPPS, setLoadingPPS] = useState(true);
  const [modalPpsVisible, setModalPpsVisible] = useState(false);
  const [formModePps, setFormModePps] = useState('add');
  const [editIdPps, setEditIdPps] = useState(null);
  const [formPps, setFormPps] = useState({
    name: '', zone: '', type: 'Dewan', capacity: '', status: 'OK'
  });

  const calculatePPSStats = (list) => {
    const stats = {
      'Dewan': { qty: 0, capacity: 0 },
      'Sekolah/Kolej': { qty: 0, capacity: 0 },
      'Balairaya': { qty: 0, capacity: 0 },
      'Lain-Lain': { qty: 0, capacity: 0 },
      'TOTAL': { qty: 0, capacity: 0 }
    };

    list.forEach(item => {
      const type = item.type || 'Lain-Lain';
      const cap = parseInt(item.capacity) || 0;

      if (stats[type]) {
        stats[type].qty += 1;
        stats[type].capacity += cap;
      } else {
        stats['Lain-Lain'].qty += 1;
        stats['Lain-Lain'].capacity += cap;
      }

      stats['TOTAL'].qty += 1;
      stats['TOTAL'].capacity += cap;
    });

    setPpsStats([
      { type: 'Dewan', ...stats['Dewan'] },
      { type: 'Sekolah/Kolej', ...stats['Sekolah/Kolej'] },
      { type: 'Balairaya', ...stats['Balairaya'] },
      { type: 'Lain-Lain', ...stats['Lain-Lain'] },
      { type: 'TOTAL', ...stats['TOTAL'] }
    ]);
  };

  const fetchPPS = async () => {
    setLoadingPPS(true);
    const { data, error } = await supabaseSandbox.from('pps_list').select('*').order('name', { ascending: true });

    if (error) {
      console.error('Error fetching PPS:', error);
    } else {
      setPpsList(data || []);
      calculatePPSStats(data || []);
    }
    setLoadingPPS(false);
  };

  useEffect(() => {
    fetchPPS();
    const subscription = supabaseSandbox
      .channel('pps_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'pps_list' }, () => {
        fetchPPS();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setFormModePps('add');
    setFormPps({ name: '', zone: '', type: 'Dewan', capacity: '', status: 'OK' });
    setModalPpsVisible(true);
  };

  const openEditModal = (pps) => {
    setFormModePps('edit');
    setEditIdPps(pps.id);
    setFormPps({ ...pps, capacity: pps.capacity.toString() });
    setModalPpsVisible(true);
  };

  const handleSavePPS = async () => {
    if (!formPps.name || !formPps.capacity) {
      return Alert.alert('Ralat', 'Nama PPS dan Kapasiti wajib diisi.');
    }

    setLoadingPPS(true);
    const payload = {
      name: formPps.name,
      zone: formPps.zone,
      type: formPps.type,
      capacity: parseInt(formPps.capacity) || 0,
      status: formPps.status || 'OK'
    };

    if (formModePps === 'add') {
      const { error } = await supabaseSandbox.from('pps_list').insert([payload]);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'PPS ditambah.'); setModalPpsVisible(false); fetchPPS(); }
    } else {
      const { error } = await supabaseSandbox.from('pps_list').update(payload).eq('id', editIdPps);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'PPS dikemaskini.'); setModalPpsVisible(false); fetchPPS(); }
    }
    setLoadingPPS(false);
  };

  const confirmDeletePPS = (id) => {
    const executeDelete = async () => {
      setLoadingPPS(true);
      const { error } = await supabaseSandbox.from('pps_list').delete().eq('id', id);
      if (error) {
        Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      } else {
        fetchPPS();
      }
      setLoadingPPS(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Pengesahan: Adakah anda pasti mahu memadam PPS ini?')) executeDelete();
    } else {
      Alert.alert('Pengesahan Padam', 'Adakah anda pasti mahu memadam PPS ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  return {
    ppsList, ppsStats, loadingPPS,
    modalPpsVisible, setModalPpsVisible,
    formModePps, formPps, setFormPps,
    openAddModal, openEditModal,
    handleSavePPS, confirmDeletePPS,
  };
}