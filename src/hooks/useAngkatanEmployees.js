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

export const normalizePangkat = (raw) => String(raw || '').replace(/\(PA\)/i, '').trim().toUpperCase();
const norm = (v) => String(v || '').trim().toUpperCase();

export function useAngkatanEmployees() {
  const [employees, setEmployees] = useState([]);
  const [dataUpdatedAt, setDataUpdatedAt] = useState(null);
  const [summary, setSummary] = useState({
    total_anggota: 0, aktif_anggota: 0, male_count: 0, female_count: 0,
    status_lulus: 0, status_lantikan: 0, status_simpanan: 0, status_aktif: 0,
  });
  const [categories, setCategories] = useState([]);
  const [pyramidStats, setPyramidStats] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Charge les tables annexes indépendamment des employés ──
  const fetchAnnexes = useCallback(async () => {
    const [catRes, pyrRes, rankRes] = await Promise.all([
      supabaseSandbox.from('angkatan_categories').select('*').order('id'),
      supabaseSandbox.from('angkatan_pyramid').select('*').order('display_order', { ascending: true }),
      supabaseSandbox.from('angkatan_ranks').select('*').order('display_order', { ascending: true }),
    ]);
    return {
      cats: catRes.data || [],
      pyramid: pyrRes.data || [],
      rankRows: rankRes.data || [],
    };
  }, []);

  // ── Calcule les stats à partir des employés déjà en mémoire ──
  const computeStats = useCallback((data, cats, pyramid, rankRows) => {
    // Résumé
    const total = data.length;
    const male = data.filter((e) => norm(e.jantina) === 'LELAKI').length;
    const female = data.filter((e) => norm(e.jantina) === 'PEREMPUAN').length;
    const countAktif = data.filter((e) => norm(e.status_keaktifan) === 'AKTIF').length;
    const countTidakAktif = data.filter((e) => norm(e.status_keaktifan) === 'TIDAK AKTIF').length;
    const countSimpanan = data.filter((e) => norm(e.status_keaktifan) === 'SIMPANAN').length;
    const countSenaraiHitam = data.filter((e) => norm(e.status_keaktifan) === 'SENARAI HITAM').length;

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

    // Catégories
    setCategories(cats.map((cat) => ({
      ...cat,
      count: data.filter((e) => mapMyaspaLabel(e.status_myaspa)?.toUpperCase() === cat.name.toUpperCase()).length,
    })));

    // Pyramide
    setPyramidStats(pyramid.map((p) => ({
      ...p,
      total: data.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat(p.rank)).length,
    })));

    // Rangs
    const hasKbp = (kursus) => {
      const k = String(kursus || '').toUpperCase();
      return /(BAKAL PEGAWAI|PAKAL PEGAWAI)/.test(k) && !k.includes('BERTAULIAH');
    };
    const hasPtb = (kursus) => {
      const k = String(kursus || '').toUpperCase();
      return k.includes('BERTAULIAH') || /\bPTB\b/.test(k);
    };

    setRanks(rankRows.map((r) => {
      const allInRank = data.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat(r.rank));
      const activeInRank = allInRank.filter((e) => {
        const st = norm(e.status_keaktifan);
        return st === 'AKTIF' || st === 'SIMPANAN';
      });
      return {
        ...r,
        jumlah: activeInRank.length,
        kbp: activeInRank.filter((e) => hasKbp(e.senarai_kursus)).length,
        ptb: activeInRank.filter((e) => hasPtb(e.senarai_kursus)).length,
        aktif: activeInRank.filter((e) => norm(e.status_keaktifan) === 'AKTIF').length,
        simpanan: activeInRank.filter((e) => norm(e.status_keaktifan) === 'SIMPANAN').length,
      };
    }));
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      // Employés + tables annexes en parallèle
      const [empRes, annexes, summaryRes] = await Promise.all([
        supabaseSandbox.from('angkatan_employees').select('*').order('nama', { ascending: true }),
        fetchAnnexes(),
        supabaseSandbox.from('angkatan_summary').select('*').eq('id', 1).maybeSingle(),
      ]);

      if (empRes.error) throw empRes.error;
      const data = empRes.data || [];
      setEmployees(data);

      // Stats calculées en mémoire, zéro requête supplémentaire
      computeStats(data, annexes.cats, annexes.pyramid, annexes.rankRows);

      // Summary extra (trend, etc.)
      if (summaryRes.data) {
        setSummary((prev) => ({
          ...summaryRes.data,
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

      // Timestamp le plus récent parmi toutes les tables Angkatan chargées ici
      const allTimestamps = [
        ...data.map((e) => e.updated_at),
        summaryRes.data?.updated_at,
        ...annexes.cats.map((c) => c.updated_at),
        ...annexes.pyramid.map((p) => p.updated_at),
        ...annexes.rankRows.map((r) => r.updated_at),
      ].filter(Boolean);
      setDataUpdatedAt(allTimestamps.sort().slice(-1)[0] || null);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [fetchAnnexes, computeStats]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchEmployees();
      setLoading(false);
    })();
  }, [fetchEmployees]);

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
    try {
      const payload = {
        rank: pyramidForm.rank,
        total: parseInt(pyramidForm.total, 10),
        color: pyramidForm.color,
        display_order: parseInt(pyramidForm.display_order, 10),
      };
      const { error } = pyramidForm.id
        ? await supabaseSandbox.from('angkatan_pyramid').update(payload).eq('id', pyramidForm.id)
        : await supabaseSandbox.from('angkatan_pyramid').insert([payload]);
      if (error) throw error;
      await fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error saving angkatan_pyramid:', error);
      return false;
    }
  };
  const deletePyramidItem = async (id) => {
    try {
      const { error } = await supabaseSandbox.from('angkatan_pyramid').delete().eq('id', id);
      if (error) throw error;
      await fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error deleting angkatan_pyramid:', error);
      return false;
    }
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
      await fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error saving angkatan_summary:', error);
      return false;
    }
  };

  return {
    loading, employees, summary, categories, pyramidStats, ranks, dataUpdatedAt,
    fetchEmployees, saveEmployee, deleteEmployee,
    saveCategory, deleteCategoryItem,
    savePyramidItem, deletePyramidItem,
    saveRankItem, deleteRankItem,
    saveSummaryExtra,
  };
}