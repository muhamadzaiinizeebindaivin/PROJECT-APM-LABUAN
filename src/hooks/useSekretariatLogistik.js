import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const LOGISTIK_COLORS = ['#1D4E89', '#F4762B', '#123456', '#D62828', '#5C6773', '#E8843F'];

export function useSekretariatLogistik() {
  const [logistikList, setLogistikList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchLogistik = useCallback(async () => {
    if (!hasLoadedOnce) setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .from('sekretariat_logistik')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setLogistikList(data || []);
    } catch (error) {
      console.error('Error fetching sekretariat_logistik:', error);
      setLogistikList([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce]);

  useEffect(() => { fetchLogistik(); }, [fetchLogistik]);

  const saveLogistikItem = async (form) => {
    try {
      const payload = {
        nama: form.nama?.trim() || '',
        bilangan: parseInt(form.bilangan, 10) || 0,
        icon_key: form.icon_key || 'Package',
      };
      if (form.id) {
        const { error } = await supabaseSandbox.from('sekretariat_logistik').update(payload).eq('id', form.id);
        if (error) throw error;
      } else {
        const color = LOGISTIK_COLORS[logistikList.length % LOGISTIK_COLORS.length];
        const { error } = await supabaseSandbox.from('sekretariat_logistik').insert([{ ...payload, color, display_order: logistikList.length }]);
        if (error) throw error;
      }
      await fetchLogistik();
      return true;
    } catch (error) {
      console.error('Error saving sekretariat_logistik:', error);
      return false;
    }
  };

  const deleteLogistikItem = async (id) => {
    try {
      const { error } = await supabaseSandbox.from('sekretariat_logistik').delete().eq('id', id);
      if (error) throw error;
      await fetchLogistik();
      return true;
    } catch (error) {
      console.error('Error deleting sekretariat_logistik:', error);
      return false;
    }
  };

  const logistikUpdatedAt = logistikList.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { logistikList, loading, fetchLogistik, saveLogistikItem, deleteLogistikItem, logistikUpdatedAt };
}