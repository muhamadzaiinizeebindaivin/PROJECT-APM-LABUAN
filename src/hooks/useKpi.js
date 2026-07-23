// src/hooks/useKpi.js
import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useKpi(section) {
  const [kpiList, setKpiList] = useState([]);
  const [loadingKpi, setLoadingKpi] = useState(true);

  const fetchKpi = async () => {
    setLoadingKpi(true);
    const { data, error } = await supabaseSandbox
      .from('kpi')
      .select('*')
      .eq('section', section)
      .order('display_order', { ascending: true });
    if (!error) setKpiList(data || []);
    setLoadingKpi(false);
  };

  useEffect(() => { fetchKpi(); }, [section]);

  const saveKpiItem = async (form, editItem) => {
    const payload = {
      section,
      nama: form.nama?.trim() || '',
      tafsiran: form.tafsiran?.trim() || '',
      sasaran: form.sasaran?.trim() || '--',
      status: form.status || 'kuning',
      pencapaian_semasa: form.pencapaian_semasa?.trim() || '',
      analisis_tindakan: form.analisis_tindakan?.trim() || '',
      sub_seksyen: form.sub_seksyen?.trim() || '',
    };
    const isEdit = editItem && editItem.id;
    const { error } = isEdit
      ? await supabaseSandbox.from('kpi').update(payload).eq('id', editItem.id)
      : await supabaseSandbox.from('kpi').insert([{ ...payload, display_order: kpiList.length }]);
    if (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      return false;
    }
    await fetchKpi();
    return true;
  };

  const deleteKpiItem = async (item) => {
    const doDelete = async () => {
      await supabaseSandbox.from('kpi').delete().eq('id', item.id);
      fetchKpi();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Padam KPI "${item.nama}"?`)) doDelete();
    } else {
      Alert.alert('Pengesahan Padam', `Padam KPI "${item.nama}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const reorderKpi = async (reordered) => {
    setKpiList(reordered);
    await Promise.all(
      reordered.map((item, index) =>
        supabaseSandbox.from('kpi').update({ display_order: index }).eq('id', item.id)
      )
    );
  };

  const kpiUpdatedAt = kpiList.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { kpiList, loadingKpi, saveKpiItem, deleteKpiItem, reorderKpi, kpiUpdatedAt };
}