import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

const DEFAULT_DATA = {
  dikemaskini: '23/2/2026',
  pecahanUnit: ['Unit Pentadbiran', 'Unit Kewangan', 'Unit Aset, Stok dan Logistik'],
  unitPentadbiran: [
    { name: '1. Norhana binti Sabudin (Gred N2)', role: '(Pembantu Tadbir Perkeranian/Operasi)' },
    { name: '2. Fatin Othman (Gred N1)', role: '(Sumber Manusia)' },
    { name: '3. Mohd Rizuan Bin Abdullah (Gred H1)', role: '(Rekod dan ICT)' },
  ],
  waran: [
    { label: 'PERJAWATAN', kp9: '1', kp5: '1', kp2: '1', n2: '1', kp1: '4', n1: '1', h1: '1', jumlah: '14' },
    { label: 'PENGISIAN', kp9: '1', kp5: '0', kp2: '1', n2: '1', kp1: '2', n1: '1', h1: '1', jumlah: '11' },
    { label: 'KOSONG', kp9: '0', kp5: '1', kp2: '0', n2: '0', kp1: '2', n1: '0', h1: '0', jumlah: '3' },
  ],
  pdpa: [
    { label: 'Projek pembinaan Pejabat Awam Wilayah Persekutuan Labuan di bawah RP1 RMLK 13', percent: '11' },
    { label: 'Cadangan projek pembinaan satu (1) unit Multi Purpose Trailer (MPT-X1)', percent: '5' },
  ],
  tanggungjawab: [
    { name: 'Mej. (PA) Wan Jabir Bin Wan Mohd Badrudin', kursus: '3', tapisan: '0000' },
    { name: '-', kursus: '0', tapisan: '0000' },
  ],
  pematuhan: [
    { score: '87', title: 'Keselamatan Perlindungan', desc: 'Pejabat Ketua Pegawai Keselamatan Kerajaan Malaysia (CGSO)' },
    { score: '90', title: 'Keselamatan Dan Kesihatan Pekerjaan', desc: 'Jabatan Keselamatan Dan Kesihatan Pekerjaan (DOSH)' },
  ],
};

export function usePentadbiranData() {
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseSandbox
        .from('pentadbiran_data')
        .select('data_json')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPageData(data?.data_json || DEFAULT_DATA);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPageData(DEFAULT_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveData = async (overrides = {}) => {
    const dataToSave = { ...pageData, ...overrides };
    const { error } = await supabaseSandbox
      .from('pentadbiran_data')
      .upsert({ id: 1, data_json: dataToSave });
    if (error) throw error;
    setPageData(dataToSave);
  };

  const updateField = (field, value) => {
    setPageData((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (section, index, field, value) => {
    setPageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (field === null) newData[section][index] = value;
      else newData[section][index][field] = value;
      return newData;
    });
  };

  const addArrayItem = (section, emptyItem) => {
    setPageData((prev) => ({ ...prev, [section]: [...prev[section], emptyItem] }));
  };

  const removeArrayItem = (section, index) => {
    setPageData((prev) => {
      const next = [...prev[section]];
      next.splice(index, 1);
      return { ...prev, [section]: next };
    });
  };

  return { loading, pageData, saveData, updateField, updateArrayField, addArrayItem, removeArrayItem };
}