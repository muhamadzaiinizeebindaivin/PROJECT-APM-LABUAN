import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const SCHEMA = 'sandbox';

const formatDikemaskini = () => {
  const now = new Date();
  const date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${date} ${hours}:${minutes}`;
};

export function useLogistikMeta() {
  const [dikemaskini, setDikemaskini] = useState(null);

  const fetchMeta = useCallback(async () => {
    try {
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('logistik_meta')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      setDikemaskini(data?.dikemaskini || null);
    } catch (error) {
      console.error('Error fetching logistik_meta:', error);
    }
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const touchDikemaskini = async () => {
    const value = formatDikemaskini();
    try {
      const { error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('logistik_meta')
        .update({ dikemaskini: value })
        .eq('id', 1);
      if (error) throw error;
      setDikemaskini(value);
    } catch (error) {
      console.error('Error updating dikemaskini:', error);
    }
  };

  return { dikemaskini, touchDikemaskini };
}