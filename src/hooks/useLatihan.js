// src/hooks/useLatihan.js
import { useState, useEffect, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Gère la liste des latihan : chargement, création, modification,
 * suppression, et statistiques agrégées. Extrait de LatihanScreen.js.
 * Schéma sandbox uniquement — ne touche jamais public.
 */
export function useLatihan() {
  const [latihanList, setLatihanList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLatihan = async () => {
    setIsLoading(true);
    const { data, error } = await supabaseSandbox.from('latihan').select('*').order('start_date', { ascending: true });
    if (!error) setLatihanList(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchLatihan(); }, []);

  const saveLatihan = async (formData, editingId) => {
    if (!formData.title) {
      const msg = 'Sila masukkan tajuk latihan.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Ralat', msg);
      return false;
    }
    const payload = {
      title: formData.title,
      start_date: formData.start_date.toISOString().split('T')[0],
      end_date: formData.end_date.toISOString().split('T')[0],
      pax: parseInt(formData.pax) || 0,
      status: formData.status,
      note: formData.sasaran.join(', '),
    };
    const { error } = editingId
      ? await supabaseSandbox.from('latihan').update(payload).eq('id', editingId)
      : await supabaseSandbox.from('latihan').insert([payload]);
    if (error) {
      Platform.OS === 'web' ? window.alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      return false;
    }
    await fetchLatihan();
    return true;
  };

  const deleteLatihan = (id) => {
    const executeDelete = async () => {
      await supabaseSandbox.from('latihan').delete().eq('id', id);
      fetchLatihan();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Adakah anda pasti mahu memadam latihan ini?')) executeDelete();
    } else {
      Alert.alert('Padam Latihan?', 'Adakah anda pasti mahu memadam latihan ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  const stats = useMemo(() => {
    const totalEvents = latihanList.length;
    const totalPax = latihanList.reduce((acc, item) => acc + (parseInt(item.pax) || 0), 0);
    const completed = latihanList.filter(i => i.status === 'Berjaya').length;
    const upcoming = latihanList.filter(i => i.status === 'Akan Diadakan').length;
    const failed = latihanList.filter(i => i.status === 'Tidak Berjaya').length;
    const completionRate = totalEvents > 0 ? Math.round((completed / totalEvents) * 100) : 0;

    const monthlyCounts = new Array(12).fill(0);
    latihanList.forEach(item => {
      if (item.start_date) {
        const m = new Date(item.start_date).getMonth();
        if (m >= 0 && m <= 11) monthlyCounts[m]++;
      }
    });

    const audienceGroups = {};
    latihanList.forEach(item => {
      const sasarans = (item.note || 'Tiada Kumpulan Sasaran').split(',').map(s => s.trim()).filter(s => s);
      if (sasarans.length === 0) sasarans.push('Tiada Kumpulan Sasaran');
      sasarans.forEach(key => { audienceGroups[key] = (audienceGroups[key] || 0) + 1; });
    });

    return {
      totalEvents, totalPax, completed, upcoming, failed, completionRate,
      monthlyCounts,
      maxMonthVal: Math.max(...monthlyCounts, 1),
      totalRecordedEvents: monthlyCounts.reduce((a, b) => a + b, 0),
      monthsLabel: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'],
      audienceList: Object.keys(audienceGroups)
        .map(key => ({
          label: key,
          count: audienceGroups[key],
          percent: totalEvents > 0 ? Math.round((audienceGroups[key] / totalEvents) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }, [latihanList]);

  return { latihanList, isLoading, stats, saveLatihan, deleteLatihan };
}