import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../supabaseClient';

const DEFAULT_DATA = {
  welcomeTitle: 'ANGKATAN PERTAHANAN AWAM MALAYSIA (APM) W.P LABUAN',
  welcomeSubtitle: 'Pejabat Pertahanan Awam Daerah Wilayah Persekutuan Labuan.\n"Sedia, Pantas, Berintegriti"',
  visiText: 'Bertindak sebagai responden pertama dalam situasi kecemasan dan bencana dalam memberikan perkhidmatan.',
  misiText: 'Memberi latihan kepada orang awam, menjadikan mereka lebih bersedia dan berupaya menghadapi kecemasan.',
  addressPejabatText: 'Angkatan Pertahanan Awam Malaysia (APM)\nWilayah Persekutuan Labuan\nPejabat Daerah Pertahanan Awam\nJabatan Perdana Menteri\nTingkat 2, Lot 4A2\nWisma Wong Wo Lo\nPeti Surat 81130\n87021 Wilayah Persekutuan Labuan\n087-425155\napmlabuan@civildefence.gov.my',
  addressPkodText: 'Pusat Kawalan Operasi Daerah (PKOD)\nAngkatan Pertahanan Awam Malaysia (APM)\nWilayah Persekutuan Labuan\nJalan Pantai\nPeti Surat 81130\n87021 Wilayah Persekutuan Labuan\n087-415440 / 414293\napmlabuan@civildefence.gov.my\nOperasi 24/7',
};

export function useHomeData(isAuthFlow) {
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('home_data')
        .select('data_json')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPageData(data?.data_json || DEFAULT_DATA);
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
      const { error } = await supabase
        .from('home_data')
        .upsert({ id: 1, data_json: pageData });

      if (error) throw error;
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

  return { loading, pageData, fetchData, handleSave, updateField };
}