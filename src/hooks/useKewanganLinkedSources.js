// src/hooks/useKewanganLinkedSources.js
//
// Montants des lignes Kewangan liées à d'autres pages (colonne `sumber`) :
//   - 'latihan'  : Elaun Latihan + Sajian, lus depuis la page Latihan
//                  (agihan = latihan_kpi_settings, belanja = total des latihan)
//   - 'myaspa_o' : ligne sumber='myaspa_o' de operasi_budget
//   - 'myaspa_p' : ligne sumber='myaspa_p' de angkatan_budget
// Mise à jour en temps réel : une modification dans Latihan/Operasi/Angkatan
// apparaît directement dans Kewangan.
import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { parseCurrency } from '../utils/currency';

const EMPTY = { agihan: 0, belanja: 0 };

// Somme agihan/belanja des lignes renvoyées (normalement une seule)
const sumRows = (rows) => (rows || []).reduce(
  (acc, r) => ({ agihan: acc.agihan + parseCurrency(r.agihan), belanja: acc.belanja + parseCurrency(r.belanja) }),
  { ...EMPTY }
);

export function useKewanganLinkedSources() {
  const [sources, setSources] = useState({
    latihanElaun: { ...EMPTY },
    latihanSajian: { ...EMPTY },
    myaspaO: { ...EMPTY },
    myaspaP: { ...EMPTY },
  });

  const fetchSources = useCallback(async () => {
    const [latihanRes, settingsRes, operasiRes, angkatanRes] = await Promise.all([
      supabaseSandbox.from('latihan').select('elaun_latihan, kos_sajian'),
      supabaseSandbox.from('latihan_kpi_settings').select('agihan_elaun, agihan_sajian').eq('id', 1).maybeSingle(),
      supabaseSandbox.from('operasi_budget').select('agihan, belanja').eq('sumber', 'myaspa_o'),
      supabaseSandbox.from('angkatan_budget').select('agihan, belanja').eq('sumber', 'myaspa_p'),
    ]);

    [latihanRes, settingsRes, operasiRes, angkatanRes].forEach((res) => {
      if (res.error) console.error('useKewanganLinkedSources:', res.error.message);
    });

    // Même calcul que la carte Elaun & Sajian de la page Latihan (LatihanElaunSajianKpi)
    const latihanList = latihanRes.data || [];
    const totalElaun = latihanList.reduce((sum, item) => sum + (parseFloat(item.elaun_latihan) || 0), 0);
    const totalSajian = latihanList.reduce((sum, item) => sum + (parseFloat(item.kos_sajian) || 0), 0);
    const settings = settingsRes.data || {};

    setSources({
      latihanElaun: { agihan: parseCurrency(settings.agihan_elaun), belanja: totalElaun },
      latihanSajian: { agihan: parseCurrency(settings.agihan_sajian), belanja: totalSajian },
      myaspaO: sumRows(operasiRes.data),
      myaspaP: sumRows(angkatanRes.data),
    });
  }, []);

  useEffect(() => {
    fetchSources();
    const channel = supabaseSandbox
      .channel(`kewangan_linked_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'latihan' }, fetchSources)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'latihan_kpi_settings' }, fetchSources)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'operasi_budget' }, fetchSources)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'angkatan_budget' }, fetchSources)
      .subscribe();
    return () => { supabaseSandbox.removeChannel(channel); };
  }, [fetchSources]);

  return sources;
}
