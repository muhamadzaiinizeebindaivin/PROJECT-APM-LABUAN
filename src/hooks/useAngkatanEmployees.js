import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const PANGKAT_HIERARCHY = [
  'Mejar', 'Kapten', 'Leftenan', 'Leftenan Muda', 'Staf Tinggi',
  'Staf Kanan', 'Staf Muda', 'Sarjan', 'Koperal', 'Lans Koperal', 'Prebet',
];
const PYRAMID_COLORS = ['#0B1F33', '#123456', '#1D4E89', '#2E62A0', '#4278B6', '#5C90C7', '#7FA8D6', '#F4762B', '#E8672A', '#D8591F', '#C24E1D'];
const CATEGORY_COLORS = ['#1D4E89', '#F4762B', '#123456', '#D62828', '#5C6773', '#E8843F'];

export const mapMyaspaLabel = (raw) => {
  const norm = String(raw || '').trim().toUpperCase();
  if (norm === 'MYASPA-P') return 'Pengurusan';
  if (norm === 'MYASPA-O') return 'Operasi';
  if (norm === 'ASPA') return 'MYASPA';
  return null;
};

const normalizePangkat = (raw) => String(raw || '').replace(/\(PA\)/i, '').trim().toUpperCase();

export function useAngkatanEmployees() {
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({
    total_anggota: 0, aktif_anggota: 0, male_count: 0, female_count: 0,
    status_lulus: 0, status_lantikan: 0, status_simpanan: 0, status_aktif: 0,
  });
  const [categories, setCategories] = useState([]);
  const [pyramidStats, setPyramidStats] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    try {
      const { data, error } = await supabaseSandbox
        .from('angkatan_employees')
        .select('*')
        .order('nama', { ascending: true });
      if (error) throw error;
      setEmployees(data || []);

      // ── Résumé (compté en direct depuis les employés) ──
      const total = data?.length || 0;
      const male = data?.filter((e) => String(e.jantina || '').toUpperCase() === 'LELAKI').length || 0;
      const female = data?.filter((e) => String(e.jantina || '').toUpperCase() === 'PEREMPUAN').length || 0;
      const norm = (v) => String(v || '').trim().toUpperCase();
      const countAktif = data?.filter((e) => norm(e.status_keaktifan) === 'AKTIF').length || 0;
      const countTidakAktif = data?.filter((e) => norm(e.status_keaktifan) === 'TIDAK AKTIF').length || 0;
      const countSimpanan = data?.filter((e) => norm(e.status_keaktifan) === 'SIMPANAN').length || 0;
      const countSenaraiHitam = data?.filter((e) => norm(e.status_keaktifan) === 'SENARAI HITAM').length || 0;
      setSummary((prev) => ({
        ...prev,
        total_anggota: total,
        aktif_anggota: countAktif,
        male_count: male,
        female_count: female,
        status_lulus: countAktif,
        status_lantikan: countTidakAktif,
        status_simpanan: countSimpanan,
        status_aktif: countSenaraiHitam,
      }));

      // ── Penjawatan Utama (basé sur status_myaspa) — auto-créé si manquant ──
      const myaspaValues = [...new Set((data || []).map((e) => mapMyaspaLabel(e.status_myaspa)).filter(Boolean))];
      const { data: existingCategories } = await supabaseSandbox.from('angkatan_categories').select('*');
      const existingNamesUpper = (existingCategories || []).map((c) => c.name.toUpperCase());
      const missingValues = myaspaValues.filter((v) => !existingNamesUpper.includes(v.toUpperCase()));
      if (missingValues.length > 0) {
        const newRows = missingValues.map((name, i) => ({ name, count: 0, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
        await supabaseSandbox.from('angkatan_categories').insert(newRows);
      }
      const { data: refreshedCategories } = await supabaseSandbox.from('angkatan_categories').select('*').order('id');
      setCategories((refreshedCategories || []).map((cat) => ({
        ...cat,
        count: data?.filter((e) => mapMyaspaLabel(e.status_myaspa)?.toUpperCase() === cat.name.toUpperCase()).length || 0,
      })));

      // ── Struktur Pangkat & Keahlian (pyramide) — auto-créé si manquant ──
      const { data: existingPyramid } = await supabaseSandbox.from('angkatan_pyramid').select('*');
      const existingPyramidNames = (existingPyramid || []).map((p) => normalizePangkat(p.rank));
      const missingRanks = PANGKAT_HIERARCHY.filter((r) => !existingPyramidNames.includes(normalizePangkat(r)));
      if (missingRanks.length > 0) {
        const newPyramidRows = missingRanks.map((rank) => ({
          rank, total: 0,
          color: PYRAMID_COLORS[PANGKAT_HIERARCHY.indexOf(rank) % PYRAMID_COLORS.length],
          display_order: PANGKAT_HIERARCHY.indexOf(rank) + 1,
        }));
        await supabaseSandbox.from('angkatan_pyramid').insert(newPyramidRows);
      }
      const { data: refreshedPyramid } = await supabaseSandbox.from('angkatan_pyramid').select('*').order('display_order', { ascending: true });
      setPyramidStats((refreshedPyramid || []).map((p) => ({
        ...p,
        total: data?.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat(p.rank)).length || 0,
      })));

      // ── Laluan Kerjaya (ranks) — auto-créé si manquant, calculé en direct ──
      const { data: existingRanks } = await supabaseSandbox.from('angkatan_ranks').select('*');
      const existingRankNames = (existingRanks || []).map((r) => normalizePangkat(r.rank));
      const missingRankRows = PANGKAT_HIERARCHY.filter((r) => !existingRankNames.includes(normalizePangkat(r)));
      if (missingRankRows.length > 0) {
        const newRankRows = missingRankRows.map((rank) => ({ rank, lulus: 0, kenaikan: 0, kbp: 0, ptb: 0, aktif: 0, simpanan: 0 }));
        await supabaseSandbox.from('angkatan_ranks').insert(newRankRows);
      }
      const { data: refreshedRanks } = await supabaseSandbox.from('angkatan_ranks').select('*').order('id');
      setRanks((refreshedRanks || []).map((r) => {
        const allInRank = (data || []).filter((e) => normalizePangkat(e.pangkat) === normalizePangkat(r.rank));
        const activeInRank = allInRank.filter((e) => {
          const st = String(e.status_keaktifan || '').trim().toUpperCase();
          return st === 'AKTIF' || st === 'SIMPANAN';
        });
        return {
          ...r,
          kbp: activeInRank.filter((e) => !String(e.senarai_kursus || '').toUpperCase().includes('KURSUS BAKAL PEGAWAI')).length,
          ptb: activeInRank.filter((e) => !String(e.senarai_kursus || '').toUpperCase().includes('PTB')).length,
          aktif: activeInRank.filter((e) => String(e.status_keaktifan || '').trim().toUpperCase() === 'AKTIF').length,
          simpanan: activeInRank.filter((e) => String(e.status_keaktifan || '').trim().toUpperCase() === 'SIMPANAN').length,
        };
      }));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, []);

  const fetchSummaryExtra = useCallback(async () => {
    try {
      const { data } = await supabaseSandbox.from('angkatan_summary').select('*').eq('id', 1).maybeSingle();
      if (data) {
        setSummary((prev) => ({
          ...data,
          total_anggota: prev.total_anggota,
          aktif_anggota: prev.aktif_anggota,
          male_count: prev.male_count,
          female_count: prev.female_count,
          status_lulus: prev.status_lulus,
          status_lantikan: prev.status_lantikan,
          status_simpanan: prev.status_simpanan,
          status_aktif: prev.status_aktif,
        }));
      }
    } catch (error) {
      console.error('Error fetching angkatan_summary:', error);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchSummaryExtra()]);
      setLoading(false);
    })();
  }, [fetchEmployees, fetchSummaryExtra]);

  const saveEmployee = async (employeeForm) => {
    try {
      const { id, ...payload } = employeeForm;
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });
      if (id) {
        const { error } = await supabaseSandbox.from('angkatan_employees').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabaseSandbox.from('angkatan_employees').insert([payload]);
        if (error) throw error;
      }
      await fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error saving employee:', error);
      return false;
    }
  };

  const deleteEmployee = async (id) => {
    try {
      await supabaseSandbox.from('angkatan_employees').delete().eq('id', id);
      await fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  };

  const saveCategory = async (categoryForm) => {
    const payload = { name: categoryForm.name, count: parseInt(categoryForm.count, 10), color: categoryForm.color };
    if (categoryForm.id) await supabaseSandbox.from('angkatan_categories').update(payload).eq('id', categoryForm.id);
    else await supabaseSandbox.from('angkatan_categories').insert([payload]);
    await fetchEmployees();
  };
  const deleteCategoryItem = async (id) => {
    await supabaseSandbox.from('angkatan_categories').delete().eq('id', id);
    await fetchEmployees();
  };

  const savePyramidItem = async (pyramidForm) => {
    const payload = {
      rank: pyramidForm.rank,
      total: parseInt(pyramidForm.total, 10),
      color: pyramidForm.color,
      display_order: parseInt(pyramidForm.display_order, 10),
    };
    if (pyramidForm.id) await supabaseSandbox.from('angkatan_pyramid').update(payload).eq('id', pyramidForm.id);
    else await supabaseSandbox.from('angkatan_pyramid').insert([payload]);
    await fetchEmployees();
  };
  const deletePyramidItem = async (id) => {
    await supabaseSandbox.from('angkatan_pyramid').delete().eq('id', id);
    await fetchEmployees();
  };

  const saveRankItem = async (rankForm) => {
    const payload = {
      rank: rankForm.rank,
      lulus: parseInt(rankForm.lulus, 10),
      kenaikan: parseInt(rankForm.kenaikan, 10),
      kbp: parseInt(rankForm.kbp, 10),
      ptb: parseInt(rankForm.ptb, 10),
      aktif: parseInt(rankForm.aktif, 10),
      simpanan: parseInt(rankForm.simpanan, 10),
    };
    if (rankForm.id) await supabaseSandbox.from('angkatan_ranks').update(payload).eq('id', rankForm.id);
    else await supabaseSandbox.from('angkatan_ranks').insert([payload]);
    await fetchEmployees();
  };
  const deleteRankItem = async (id) => {
    await supabaseSandbox.from('angkatan_ranks').delete().eq('id', id);
    await fetchEmployees();
  };

  const saveSummaryExtra = async (summaryForm) => {
    try {
      const payload = { ...summaryForm };
      delete payload.id;
      const { error } = await supabaseSandbox.from('angkatan_summary').update(payload).eq('id', 1);
      if (error) throw error;
      await fetchSummaryExtra();
      return true;
    } catch (error) {
      console.error('Error saving angkatan_summary:', error);
      return false;
    }
  };
  
  return {
    loading, employees, summary, categories, pyramidStats, ranks,
    fetchEmployees, saveEmployee, deleteEmployee,
    saveCategory, deleteCategoryItem,
    savePyramidItem, deletePyramidItem,
    saveRankItem, deleteRankItem,
    saveSummaryExtra,
  };
}