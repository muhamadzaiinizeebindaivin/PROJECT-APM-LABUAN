import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

const SCHEMA = 'sandbox';

const DEFAULT_DATA = {
  addressPejabat: {
    orgName: 'Angkatan Pertahanan Awam Malaysia (APM)\nWilayah Persekutuan Labuan\nPejabat Daerah Pertahanan Awam\nJabatan Perdana Menteri',
    address: 'Tingkat 2, Lot 4A2\nWisma Wong Wo Lo\nPeti Surat 81130\n87021 Wilayah Persekutuan Labuan',
    phone: '087-425155',
    email: 'apmlabuan@civildefence.gov.my',
    note: '',
  },
  addressPkod: {
    orgName: 'Pusat Kawalan Operasi Daerah (PKOD)\nAngkatan Pertahanan Awam Malaysia (APM)\nWilayah Persekutuan Labuan',
    address: 'Jalan Pantai\nPeti Surat 81130\n87021 Wilayah Persekutuan Labuan',
    phone: '087-415440 / 414293',
    email: 'apmlabuan@civildefence.gov.my',
    note: 'Operasi 24/7',
  },
};

export function useHomeData(isAuthFlow) {
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('home_data')
        .select('data_json, updated_at')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPageData({ ...DEFAULT_DATA, ...(data?.data_json || {}) });
      setUpdatedAt(data?.updated_at || null);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setPageData(DEFAULT_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthFlow) fetchData();
  }, [isAuthFlow, fetchData]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('home_data')
        .upsert({ id: 1, data_json: pageData })
        .select('updated_at')
        .single();

      if (error) throw error;
      setUpdatedAt(data?.updated_at || null);
      Alert.alert('Berjaya', 'Maklumat halaman utama telah dikemaskini.');
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Ralat', 'Gagal menyimpan data.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setPageData(prev => ({ ...prev, [field]: value }));
  };

  return { loading, pageData, updatedAt, fetchData, handleSave, updateField };
}