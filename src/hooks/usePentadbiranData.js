import { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const DEFAULT_DATA = {
  dikemaskini: '',
  cartaOrganisasiUrl: '',
  pecahanUnit: [],
  unitPentadbiran: [],
  waran: [],
  pematuhan: [],
};

export function usePentadbiranData() {
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  // Toujours à jour, contrairement à `pageData` capturé dans une closure au moment du rendu —
  // évite qu'un appel tardif de saveData() écrase des changements plus récents avec des données périmées.
  const pageDataRef = useRef(null);
  useEffect(() => {
    pageDataRef.current = pageData;
  }, [pageData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseSandbox
        .from('pentadbiran_data')
        .select('data_json')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      const initial = data?.data_json || DEFAULT_DATA;
      setPageData(initial);
      pageDataRef.current = initial;
    } catch (error) {
      console.error('Error fetching data:', error);
      setPageData(DEFAULT_DATA);
      pageDataRef.current = DEFAULT_DATA;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveData = async (overrides = {}) => {
    // Lit depuis la ref (toujours la valeur la plus récente), pas depuis `pageData` (peut être périmé)
    const dataToSave = { ...pageDataRef.current, ...overrides };
    const { error } = await supabaseSandbox
      .from('pentadbiran_data')
      .upsert({ id: 1, data_json: dataToSave });
    if (error) throw error;
    pageDataRef.current = dataToSave;
    setPageData(dataToSave);
  };

  const updateField = (field, value) => {
    setPageData((prev) => {
      const next = { ...prev, [field]: value };
      pageDataRef.current = next;
      return next;
    });
  };

  const updateArrayField = (section, index, field, value) => {
    setPageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (field === null) newData[section][index] = value;
      else newData[section][index][field] = value;
      pageDataRef.current = newData;
      return newData;
    });
  };

  const addArrayItem = (section, emptyItem) => {
    setPageData((prev) => {
      const next = { ...prev, [section]: [...prev[section], emptyItem] };
      pageDataRef.current = next;
      return next;
    });
  };

  const removeArrayItem = (section, index) => {
    setPageData((prev) => {
      const list = [...prev[section]];
      list.splice(index, 1);
      const next = { ...prev, [section]: list };
      pageDataRef.current = next;
      return next;
    });
  };

  return { loading, pageData, saveData, updateField, updateArrayField, addArrayItem, removeArrayItem };
}