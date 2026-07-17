import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useKpiItems(section) {
  const [kpiItems, setKpiItems] = useState([]);
  const [kpiToDelete, setKpiToDelete] = useState([]);

  const fetchKpi = useCallback(async () => {
    try {
      const { data, error } = await supabaseSandbox
        .from('kpi')
        .select('*')
        .eq('section', section)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setKpiItems(data || []);
    } catch (error) {
      console.error('Error fetching kpi:', error);
    }
  }, [section]);

  useEffect(() => { fetchKpi(); }, [fetchKpi]);

  const updateKpiItem = (index, fields) => {
    setKpiItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...fields };
      return copy;
    });
  };

  const addKpiItem = (initial = {}) => {
    setKpiItems((prev) => [
      ...prev,
      {
        id: null,
        section,
        nama: initial.nama || 'KPI Baru',
        tafsiran: initial.tafsiran || '',
        sasaran: initial.sasaran || '--',
        status: initial.status || 'kuning',
        pencapaian_semasa: initial.pencapaian_semasa || '',
        analisis_tindakan: initial.analisis_tindakan || '',
        sub_seksyen: initial.sub_seksyen || '',
        display_order: prev.length,
      },
    ]);
  };

  const removeKpiItem = (index) => {
    const item = kpiItems[index];
    if (item.id) setKpiToDelete((prev) => [...prev, item.id]);
    setKpiItems((prev) => prev.filter((_, i) => i !== index));
  };

  const saveKpiItems = async () => {
    if (kpiToDelete.length > 0) {
      await supabaseSandbox.from('kpi').delete().in('id', kpiToDelete);
    }
    for (let i = 0; i < kpiItems.length; i++) {
      const item = kpiItems[i];
      const payload = {
        section,
        nama: item.nama,
        tafsiran: item.tafsiran,
        sasaran: item.sasaran,
        status: item.status || 'kuning',
        pencapaian_semasa: item.pencapaian_semasa || '',
        analisis_tindakan: item.analisis_tindakan || '',
        sub_seksyen: item.sub_seksyen || '',
        display_order: i,
      };
      if (item.id) await supabaseSandbox.from('kpi').update(payload).eq('id', item.id);
      else await supabaseSandbox.from('kpi').insert([payload]);
    }
    setKpiToDelete([]);
    fetchKpi();
  };

  return { kpiItems, addKpiItem, removeKpiItem, updateKpiItem, saveKpiItems };
}