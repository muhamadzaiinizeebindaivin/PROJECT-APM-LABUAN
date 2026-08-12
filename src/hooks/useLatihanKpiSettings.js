import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const SCHEMA = 'sandbox';

export function useLatihanKpiSettings() {
  const [settings, setSettings] = useState({ agihan_elaun: 0, agihan_sajian: 0 });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('latihan_kpi_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      if (data) setSettings({ agihan_elaun: data.agihan_elaun || 0, agihan_sajian: data.agihan_sajian || 0 });
    } catch (error) {
      console.error('Error fetching latihan_kpi_settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = async (updates) => {
    try {
      const { error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('latihan_kpi_settings')
        .update(updates)
        .eq('id', 1);
      if (error) throw error;
      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error saving latihan_kpi_settings:', error);
      return false;
    }
  };

  return { settings, loading, saveSettings };
}