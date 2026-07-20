import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

const SCHEMA = 'sandbox';

export function useLogistikData() {
  const [logistikData, setLogistikData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogistik = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('logistik')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setLogistikData(data);
    } catch (error) {
      console.error('Error fetching logistik:', error);
      Alert.alert('Ralat', 'Gagal memuat turun data logistik.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogistik(); }, [fetchLogistik]);

  const saveAsset = async (payload, editingAsset) => {
    try {
      if (editingAsset) {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('logistik').update(payload).eq('id', editingAsset.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('logistik').insert([payload]);
        if (error) throw error;
      }
      await fetchLogistik();
      return true;
    } catch (error) {
      Alert.alert('Ralat', 'Gagal menyimpan rekod.');
      return false;
    }
  };

  const deleteAsset = (asset) => {
    Alert.alert('Padam Aset', 'Adakah anda pasti mahu memadam aset ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Padam',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabaseSandbox.schema(SCHEMA).from('logistik').delete().eq('id', asset.id);
            if (error) throw error;
            await fetchLogistik();
          } catch (error) {
            Alert.alert('Ralat', 'Gagal memadam aset.');
          }
        },
      },
    ]);
  };

  return { logistikData, loading, saveAsset, deleteAsset };
}