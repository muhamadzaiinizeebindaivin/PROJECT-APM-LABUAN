// src/hooks/useJpbdDirectory.js
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../supabaseClient';

/**
 * Gère la liste JPBD (répertoire d'agences) : chargement, création,
 * modification, suppression. Extrait de SekretariatScreen.js.
 */
export function useJpbdDirectory() {
  const [jpbdList, setJpbdList] = useState([]);
  const [loadingJPBD, setLoadingJPBD] = useState(true);
  const [modalJpbdVisible, setModalJpbdVisible] = useState(false);
  const [formModeJpbd, setFormModeJpbd] = useState('add');
  const [editIdJpbd, setEditIdJpbd] = useState(null);
  const [formJpbd, setFormJpbd] = useState({
    agency: '', officer: '', position: '', grade: '', email: '',
    address: '', office_phone: '', mobile_phone: '', fax: '',
    officers_count: '', members_count: '', logistics_assets: ''
  });

  const fetchJPBD = async () => {
    setLoadingJPBD(true);
    const { data, error } = await supabase.from('jpbd_directory').select('*').order('created_at', { ascending: true });
    if (!error) setJpbdList(data || []);
    setLoadingJPBD(false);
  };

  useEffect(() => {
    fetchJPBD();
    const subscription = supabase
      .channel('jpbd_directory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jpbd_directory' }, () => {
        fetchJPBD();
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setFormModeJpbd('add');
    setFormJpbd({ agency: '', officer: '', position: '', grade: '', email: '', address: '', office_phone: '', mobile_phone: '', fax: '', officers_count: '', members_count: '', logistics_assets: '' });
    setModalJpbdVisible(true);
  };

  const openEditModal = (item) => {
    setFormModeJpbd('edit');
    setEditIdJpbd(item.id);
    setFormJpbd({
      ...item,
      officers_count: item.officers_count?.toString() || '',
      members_count: item.members_count?.toString() || ''
    });
    setModalJpbdVisible(true);
  };

  const handleSaveJPBD = async () => {
    if (!formJpbd.agency) return Alert.alert('Ralat', 'Sila masukkan nama Agensi.');
    setLoadingJPBD(true);

    if (formModeJpbd === 'add') {
      const { error } = await supabase.from('jpbd_directory').insert([formJpbd]);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'Rekod ditambah.'); setModalJpbdVisible(false); fetchJPBD(); }
    } else {
      const { error } = await supabase.from('jpbd_directory').update(formJpbd).eq('id', editIdJpbd);
      if (error) Alert.alert('Ralat', error.message);
      else { Alert.alert('Berjaya', 'Rekod dikemaskini.'); setModalJpbdVisible(false); fetchJPBD(); }
    }
    setLoadingJPBD(false);
  };

  const confirmDeleteJPBD = (id) => {
    const executeDelete = async () => {
      setLoadingJPBD(true);
      const { error } = await supabase.from('jpbd_directory').delete().eq('id', id);
      if (error) {
        Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      } else {
        fetchJPBD();
      }
      setLoadingJPBD(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Pengesahan: Padam rekod agensi ini?')) executeDelete();
    } else {
      Alert.alert('Pengesahan Padam', 'Padam rekod agensi ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  return {
    jpbdList, loadingJPBD,
    modalJpbdVisible, setModalJpbdVisible,
    formModeJpbd, formJpbd, setFormJpbd,
    openAddModal, openEditModal,
    handleSaveJPBD, confirmDeleteJPBD,
  };
}