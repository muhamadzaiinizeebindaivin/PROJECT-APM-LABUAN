// src/hooks/usePpsList.js
import { useState, useEffect } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Gère la liste des PPS (Pusat Pemindahan Sementara) : chargement,
 * création, modification, suppression, et calcul des statistiques
 * agrégées par type. Extrait de SekretariatScreen.js.
 * Schéma sandbox uniquement — ne touche jamais public.
 * onNotify(type, message) est appelé pour les toasts de succès/erreur ;
 * la confirmation de suppression est exposée via un état (pendingDeletePps)
 * pour être rendue en popup stylé côté écran, plus de Alert.alert/window.confirm.
 */
export function usePpsList(onNotify) {
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
      if (error) onNotify?.('error', error.message);
      else { onNotify?.('success', 'PPS ditambah.'); setModalPpsVisible(false); fetchPPS(); }
    } else {
      const { error } = await supabaseSandbox.from('pps_list').update(payload).eq('id', editIdPps);
      if (error) onNotify?.('error', error.message);
      else { onNotify?.('success', 'PPS dikemaskini.'); setModalPpsVisible(false); fetchPPS(); }
    }
    setLoadingPPS(false);
  };

  // ---- Confirmation de suppression (popup stylé côté écran, plus de Alert.alert/window.confirm) ----
  const [pendingDeletePps, setPendingDeletePps] = useState(null);

  const requestDeletePps = (pps) => setPendingDeletePps(pps);
  const cancelDeletePps = () => setPendingDeletePps(null);

  const executeDeletePps = async () => {
    if (!pendingDeletePps) return;
    const id = pendingDeletePps.id;
    setLoadingPPS(true);
    const { error } = await supabaseSandbox.from('pps_list').delete().eq('id', id);
    if (error) {
      onNotify?.('error', error.message);
    } else {
      onNotify?.('success', 'PPS dipadam.');
      fetchPPS();
    }
    setLoadingPPS(false);
    setPendingDeletePps(null);
  };

  return {
    ppsList, ppsStats, loadingPPS,
    modalPpsVisible, setModalPpsVisible,
    formModePps, formPps, setFormPps,
    openAddModal, openEditModal,
    handleSavePPS,
    pendingDeletePps, requestDeletePps, cancelDeletePps, executeDeletePps,
  };
}