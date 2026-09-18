// src/hooks/useCatatanSekretariat.js
import { useState, useEffect } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

/**
 * Gère satu nota CATATAN kongsi untuk skrin Sekretariat.
 * Disimpan sebagai satu baris tetap (id = 'sekretariat') dalam jadual
 * sandbox.catatan_sekretariat.
 */
const ROW_ID = 'sekretariat';

export function useCatatanSekretariat() {
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCatatan = async () => {
    setLoading(true);
    const { data, error } = await supabaseSandbox
      .from('catatan_sekretariat')
      .select('*')
      .eq('id', ROW_ID)
      .maybeSingle();
    if (!error) setCatatan(data?.content || '');
    setLoading(false);
  };

  useEffect(() => {
    fetchCatatan();
    const subscription = supabaseSandbox
      .channel(`catatan_sekretariat_changes_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'catatan_sekretariat' }, () => {
        fetchCatatan();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveCatatan = async (text) => {
    setSaving(true);
    const { error } = await supabaseSandbox
      .from('catatan_sekretariat')
      .upsert({ id: ROW_ID, content: text, updated_at: new Date().toISOString() });
    setSaving(false);
    if (!error) setCatatan(text);
    return !error;
  };

  return { catatan, loading, saving, saveCatatan };
}
