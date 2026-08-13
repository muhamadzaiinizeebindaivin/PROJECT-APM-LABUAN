import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

export const SCHOOL_CATEGORIES = ['TUSPA', 'KASPA', 'PISPA', 'SISPA'];
export const CDA_CATEGORIES = ['CDA'];

export function useAngkatanCommunity() {
  const [communityProgs, setCommunityProgs] = useState([]);

  const fetchCommunity = useCallback(async () => {
    try {
      const { data, error } = await supabaseSandbox.from('angkatan_community').select('*').order('id');
      if (error) throw error;
      setCommunityProgs(data || []);
    } catch (error) {
      console.error('Error fetching community:', error);
    }
  }, []);

  useEffect(() => { fetchCommunity(); }, [fetchCommunity]);

  const saveCommunityItem = async (form) => {
    const raceKeys = ['melayu', 'cina', 'india', 'lain'];
    const num = (v) => (v !== '' && v != null ? parseInt(v, 10) || 0 : 0);
    const lelakiByRace = Object.fromEntries(raceKeys.map((k) => [`lelaki_${k}`, num(form[`lelaki_${k}`])]));
    const perempuanByRace = Object.fromEntries(raceKeys.map((k) => [`perempuan_${k}`, num(form[`perempuan_${k}`])]));
    const jumlahLelaki = Object.values(lelakiByRace).reduce((a, b) => a + b, 0);
    const jumlahPerempuan = Object.values(perempuanByRace).reduce((a, b) => a + b, 0);

    const payload = {
      category: form.category,
      tempat: form.tempat,
      detail: form.detail,
      nama_sekolah: form.nama_sekolah || null,
      no_pendaftaran: form.no_pendaftaran || null,
      tarikh_penubuhan: form.tarikh_penubuhan || null,
      ...lelakiByRace,
      ...perempuanByRace,
      jumlah_lelaki: jumlahLelaki,
      jumlah_perempuan: jumlahPerempuan,
      kod_cda: form.kod_cda || null,
      nama_pasukan: form.nama_pasukan || null,
      nama_organisasi: form.nama_organisasi || null,
      tempoh_sah_penubuhan: form.tempoh_sah_penubuhan || null,
      tarikh_berdaftar: form.tarikh_berdaftar || null,
    };
    try {
      const { error } = form.id
        ? await supabaseSandbox.from('angkatan_community').update(payload).eq('id', form.id)
        : await supabaseSandbox.from('angkatan_community').insert([payload]);
      if (error) throw error;
      await fetchCommunity();
      return true;
    } catch (error) {
      console.error('Error saving community item:', error);
      return false;
    }
  };
  const deleteCommunityItem = async (id) => {
    try {
      const { error } = await supabaseSandbox.from('angkatan_community').delete().eq('id', id);
      if (error) throw error;
      await fetchCommunity();
      return true;
    } catch (error) {
      console.error('Error deleting community item:', error);
      return false;
    }
  };

  const communityUpdatedAt = communityProgs.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { communityProgs, saveCommunityItem, deleteCommunityItem, communityUpdatedAt };
}