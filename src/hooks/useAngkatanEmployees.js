import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

export const PANGKAT_HIERARCHY = [
  'Mejar', 'Kapten', 'Leftenan', 'Leftenan Muda', 'Staf Tinggi',
  'Staf Kanan', 'Staf Muda', 'Sarjan', 'Koperal', 'Lans Koperal', 'Prebet',
];
export const PYRAMID_COLORS = ['#0B1F33', '#123456', '#1D4E89', '#2E62A0', '#4278B6', '#5C90C7', '#7FA8D6', '#F4762B', '#E8672A', '#D8591F', '#C24E1D'];
const CATEGORY_COLORS = ['#1D4E89', '#F4762B', '#123456', '#D62828', '#5C6773', '#E8843F'];

export const mapMyaspaLabel = (raw) => {
  const norm = String(raw || '').trim().toUpperCase();
  if (norm === 'MYASPA-P') return 'Pengurusan';
  if (norm === 'MYASPA-O') return 'Operasi';
  if (norm === 'ASPA') return 'MYASPA';
  return null;
};

export const normalizePangkat = (raw) => String(raw || '').replace(/\(PA\)/i, '').trim().toUpperCase();
export const norm = (v) => String(v || '').trim().toUpperCase();

// Exclut les anggota en "Pindah Keanggotaan (PFA)" du calcul LAYAK UBKP — détecté
// via le champ catatan contenant les deux mots-clés (insensible à la casse).
export const isPindahKeanggotaanPfa = (emp) => {
  const catatan = norm(emp?.catatan);
  return catatan.includes('PINDAH KEANGGOTAAN') && catatan.includes('PFA');
};

// Sépare senarai_kursus en entrées individuelles (une par puce "•" ou saut de
// ligne) — nécessaire car une seule chaîne concaténée peut contenir à la fois
// un cours PTB et un cours KBP distincts ; vérifier BERTAULIAH/WARAN sur tout
// le texte d'un coup disqualifierait à tort quelqu'un qui a bien un vrai KBP
// séparé, juste parce qu'une AUTRE ligne contient "BERTAULIAH"/"WARAN".
const splitCourseEntries = (kursus) => {
  return String(kursus || '')
    .split(/\r?\n|(?=•)/g)
    .map((s) => s.replace(/^•\s*/, '').trim())
    .filter(Boolean);
};

export const hasKbp = (kursus) => {
  return splitCourseEntries(kursus).some((entry) => {
    const k = entry.toUpperCase();
    return (/(BAKAL PEGAWAI|PAKAL PEGAWAI)/.test(k) || k.includes('BAKAL'))
      && !k.includes('BERTAULIAH')
      && !k.includes('WARAN');
  });
};
export const hasPtb = (kursus) => {
  const k = String(kursus || '').toUpperCase();
  return k.includes('BERTAULIAH') || /\bPTB\b/.test(k);
};
export const hasKbpWaran = (kursus) => {
  const k = String(kursus || '').toUpperCase();
  return k.includes('PEGAWAI WARAN');
};

// ── Kenaikan Pangkat (promotion) ──
const classifyAcademic = (raw) => {
  const a = String(raw || '').toUpperCase();
  if (!a || a.includes('TIDAK DIKETAHUI') || a.includes('TIDAK DI KETAHUI')) return null;
  const highKeywords = ['STPM', 'MATRIKULASI', 'DIPLOMA', 'IJAZAH', 'SARJAN', 'DEGREE', 'BACHELOR', 'MASTER', 'SIJIL PERGURUAN'];
  if (highKeywords.some((kw) => a.includes(kw))) return 'STPM_ABOVE';
  const lowKeywords = ['UPSR', 'DARJAH', 'PMR', 'PT3', 'SRP', 'TINGKATAN', 'SPM', 'SVM', 'SKM'];
  if (lowKeywords.some((kw) => a.includes(kw))) return 'SPM_BELOW';
  return null;
};

const yearsSince = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
};

export const RANK_PROMOTION_RULES = {
  'Prebet': { years: 3, academic: 'SPM_BELOW', course: 'PTB' },
  'Lans Koperal': { years: 3, academic: 'SPM_BELOW', course: 'PTB' },
  'Koperal': { years: 3, academic: 'SPM_BELOW', course: 'PTB' },
  'Sarjan': { years: 3, academic: 'STPM_ABOVE', course: 'KBP' },
  'Staf Muda': { years: 1, academic: 'STPM_ABOVE', course: 'KBP' },
  'Staf Kanan': { years: 1, academic: 'STPM_ABOVE', course: 'KBP' },
  'Staf Tinggi': { years: 3, academic: 'STPM_ABOVE', course: 'KBP' },
  'Leftenan Muda': { years: 3, academic: 'STPM_ABOVE', course: 'KBP' },
  'Leftenan': { years: 3, academic: 'STPM_ABOVE', course: 'KBP' },
  'Kapten': { years: 3, academic: 'STPM_ABOVE', course: 'KBP' },
  'Mejar': { years: 3, academic: 'STPM_ABOVE', course: 'KBP' },
  // Mejar : rang plafond, pas de promotion
  // Pegawai Waran II : exclu pour l'instant
};

// TBP (Time Based Promotion) : voie alternative Prebet -> Lans Koperal,
// uniquement basée sur l'ancienneté — aucune condition académique/cours.
export const isEligibleForTBP = (emp) => {
  if (norm(emp.status_keaktifan) !== 'AKTIF') return false;
  const yrs = yearsSince(emp.tarikh_terima_pangkat_terkini);
  return yrs !== null && yrs >= 10;
};

// Diploma et STPM sont considérés comme le même niveau académique pour le
// Fast-Track vers Staf Muda.
const hasDiploma = (raw) => {
  const a = String(raw || '').toUpperCase();
  return a.includes('DIPLOMA') || a.includes('STPM');
};
const hasIjazahOrAbove = (raw) => {
  const a = String(raw || '').toUpperCase();
  return a.includes('IJAZAH') || a.includes('BACHELOR') || a.includes('MASTER');
};

// Laluan fast-track Prebet -> Staf Muda : 3 ans + Diploma + KBP.
export const isEligibleFastTrackStafMuda = (emp) => {
  if (norm(emp.status_keaktifan) !== 'AKTIF') return false;
  const yrs = yearsSince(emp.tarikh_terima_pangkat_terkini);
  if (yrs === null || yrs < 3) return false;
  if (!hasDiploma(emp.akademik_tertinggi)) return false;
  if (!hasKbp(emp.senarai_kursus)) return false;
  return true;
};

// Même critère sans vérifier le cours — pour Layak/Perlu Kursus côté Fast-Track.
export const isEligibleFastTrackStafMudaByYearsAcademic = (emp) => {
  if (norm(emp.status_keaktifan) !== 'AKTIF') return false;
  const yrs = yearsSince(emp.tarikh_terima_pangkat_terkini);
  if (yrs === null || yrs < 3) return false;
  return hasDiploma(emp.akademik_tertinggi);
};

// Laluan fast-track Prebet -> Leftenan Muda : 3 ans + Ijazah Sarjana Muda + KBP.
export const isEligibleFastTrackLeftenanMuda = (emp) => {
  if (norm(emp.status_keaktifan) !== 'AKTIF') return false;
  const yrs = yearsSince(emp.tarikh_terima_pangkat_terkini);
  if (yrs === null || yrs < 3) return false;
  if (!hasIjazahOrAbove(emp.akademik_tertinggi)) return false;
  if (!hasKbp(emp.senarai_kursus)) return false;
  return true;
};

// Même critère sans vérifier le cours — pour Layak/Perlu Kursus côté Fast-Track.
export const isEligibleFastTrackLeftenanMudaByYearsAcademic = (emp) => {
  if (norm(emp.status_keaktifan) !== 'AKTIF') return false;
  const yrs = yearsSince(emp.tarikh_terima_pangkat_terkini);
  if (yrs === null || yrs < 3) return false;
  return hasIjazahOrAbove(emp.akademik_tertinggi);
};

// Voie "Normal" : plus aucune condition académique (retirée de toutes les
// voies normales d'un coup, puisqu'elles passent toutes par cette même
// fonction) — seuls l'ancienneté et le cours restent requis. Les voies
// Fast-Track (isEligibleFastTrackStafMuda/isEligibleFastTrackLeftenanMuda) et
// TBP (isEligibleForTBP) sont des fonctions séparées, non affectées ici.
export const isEligibleForPromotion = (emp, rankLabel) => {
  const rule = RANK_PROMOTION_RULES[rankLabel];
  if (!rule) return false;
  if (norm(emp.status_keaktifan) !== 'AKTIF') return false;
  const yrs = yearsSince(emp.tarikh_terima_pangkat_terkini);
  if (yrs === null || yrs < rule.years) return false;
  if (rule.course === 'PTB' && !hasPtb(emp.senarai_kursus)) return false;
  if (rule.course === 'KBP' && !hasKbp(emp.senarai_kursus)) return false;
  return true;
};

// Même critère que isEligibleForPromotion mais SANS vérifier le cours — sert à
// distinguer "Boleh Dinaikkan" (années + cours) de "Perlu Kursus" (années
// suffisantes, cours manquant seulement) pour chaque rang de la voie Normal.
export const isEligibleByYearsOnly = (emp, rankLabel) => {
  const rule = RANK_PROMOTION_RULES[rankLabel];
  if (!rule) return false;
  if (norm(emp.status_keaktifan) !== 'AKTIF') return false;
  const yrs = yearsSince(emp.tarikh_terima_pangkat_terkini);
  if (yrs === null || yrs < rule.years) return false;
  return true;
};

const countNormalLane = (pool, rankLabel) => {
  const yearsOnly = pool.filter((e) => isEligibleByYearsOnly(e, rankLabel));
  const eligible = yearsOnly.filter((e) => isEligibleForPromotion(e, rankLabel)).length;
  return { eligible, needsCourse: yearsOnly.length - eligible };
};

// Fast-track : n'importe quel rang EN DESSOUS de rankLabel dans la hiérarchie
// (pas uniquement Prebet) — PANGKAT_HIERARCHY va du plus haut (index 0) au
// plus bas, donc "en dessous" = index strictement supérieur.
export const getEmployeesBelowRank = (data, rankLabel) => {
  const targetIdx = PANGKAT_HIERARCHY.findIndex((p) => normalizePangkat(p) === normalizePangkat(rankLabel));
  if (targetIdx === -1) return [];
  return data.filter((e) => {
    const empIdx = PANGKAT_HIERARCHY.findIndex((p) => normalizePangkat(p) === normalizePangkat(e.pangkat));
    return empIdx > targetIdx;
  });
};

// Pegawai Waran II : 3 ans depuis le dernier pangkat + cours KBP WARAN — plus
// de condition académique. Le cours requis est le KBP WARAN, pas le KBP normal
// (hasKbp() exclut d'ailleurs tout texte contenant "WARAN", donc on ne peut pas
// passer par isEligibleForPromotion(emp, 'Sarjan') ici).
export const isEligibleForPegawaiWaranII = (emp) => {
  if (norm(emp.status_keaktifan) !== 'AKTIF') return false;
  const yrs = yearsSince(emp.tarikh_terima_pangkat_terkini);
  if (yrs === null || yrs < 3) return false;
  if (!hasKbpWaran(emp.senarai_kursus)) return false;
  return true;
};

// Même critère sans vérifier le cours — pour distinguer Layak/Perlu Kursus.
export const isEligibleForPegawaiWaranIIByYears = (emp) => {
  if (norm(emp.status_keaktifan) !== 'AKTIF') return false;
  const yrs = yearsSince(emp.tarikh_terima_pangkat_terkini);
  return yrs !== null && yrs >= 3;
};

// Pegawai Waran I : promotion depuis Pegawai Waran II — 3 ans + cours PTB,
// aucune condition académique. Pegawai Waran I est désormais le rang plafond
// (ne mène à rien de plus haut).
export const isEligibleForPegawaiWaranI = (emp) => {
  if (norm(emp.status_keaktifan) !== 'AKTIF') return false;
  const yrs = yearsSince(emp.tarikh_terima_pangkat_terkini);
  if (yrs === null || yrs < 3) return false;
  if (!hasKbpWaran(emp.senarai_kursus)) return false;
  return true;
};

// Même critère sans vérifier le cours — pour distinguer Layak/Perlu Kursus.
export const isEligibleForPegawaiWaranIByYears = (emp) => {
  if (norm(emp.status_keaktifan) !== 'AKTIF') return false;
  const yrs = yearsSince(emp.tarikh_terima_pangkat_terkini);
  return yrs !== null && yrs >= 3;
};

const countByYearsAndCourse = (pool, yearsOnlyFn, fullFn) => {
  const yearsOnly = pool.filter(yearsOnlyFn);
  const eligible = yearsOnly.filter(fullFn).length;
  return { eligible, needsCourse: yearsOnly.length - eligible };
};

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
    // Comparaison directe sur un mot-clé fixe (myaspa_key), indépendant du
    // nom affiché — renommer la catégorie ne peut plus casser le comptage,
    // et deux catégories ne peuvent plus se "voler" mutuellement des
    // employés comme avec l'ancienne correspondance floue sur le nom.
    setCategories(cats.map((cat) => ({
      ...cat,
      count: cat.myaspa_key
        ? data.filter((e) => norm(e.status_myaspa) === norm(cat.myaspa_key)).length
        : 0,
    })));

    // Pyramide
    setPyramidStats(pyramid.map((p) => {
      const keyword = normalizePangkat(p.match_keyword || p.rank);
      const matched = keyword ? data.filter((e) => normalizePangkat(e.pangkat).includes(keyword)) : [];
      const statusBreakdown = matched.reduce((acc, e) => {
        const s = norm(e.status_keaktifan);
        if (s === 'AKTIF') acc.aktif += 1;
        else if (s === 'SIMPANAN') acc.simpanan += 1;
        else if (s === 'SENARAI HITAM') acc.senaraiHitam += 1;
        else if (s === 'BERSARA') acc.bersara += 1;
        else if (s === 'MENINGGAL') acc.meninggal += 1;
        else acc.lainLain += 1; // tout statut non reconnu — évite un écart silencieux avec le total
        return acc;
      }, { aktif: 0, simpanan: 0, senaraiHitam: 0, bersara: 0, meninggal: 0, lainLain: 0 });

      return {
        ...p,
        total: matched.length,
        statusBreakdown,
      };
    }));

    // Rangs
    setRanks(rankRows.map((r) => {
      const allInRank = data.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat(r.rank));
      const activeInRank = allInRank.filter((e) => {
        const st = norm(e.status_keaktifan);
        return st === 'AKTIF' || st === 'SIMPANAN';
      });

      // LAYAK UBKP = nombre d'employés du rang JUSTE EN DESSOUS de r (dans la
      // hiérarchie) qui remplissent les conditions pour être promus DANS r.
      // Le rang le plus bas (Prebet) n'a rien en dessous -> toujours 0.
      // Pegawai Waran II n'est pas dans PANGKAT_HIERARCHY (rang plafond, hors
      // parcours normal) -> règle dédiée basée sur les Sarjan (isEligibleForPegawaiWaranII).
      let kenaikan;
      const normRank = normalizePangkat(r.rank);
      // Exclus des calculs LAYAK UBKP uniquement (pas des colonnes KBP/PTB/Aktif/Simpanan ci-dessous)
      const promotionPoolData = data.filter((e) => !isPindahKeanggotaanPfa(e));
      const prebetHolders = () => promotionPoolData.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat('Prebet'));

      if (normRank === normalizePangkat('Pegawai Waran II')) {
        kenaikan = countByYearsAndCourse(
          promotionPoolData.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat('Sarjan')),
          isEligibleForPegawaiWaranIIByYears,
          isEligibleForPegawaiWaranII
        );
      } else if (normRank === normalizePangkat('Pegawai Waran I')) {
        kenaikan = countByYearsAndCourse(
          promotionPoolData.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat('Pegawai Waran II')),
          isEligibleForPegawaiWaranIByYears,
          isEligibleForPegawaiWaranI
        );
      } else if (normRank === normalizePangkat('Lans Koperal')) {
        kenaikan = {
          ...countNormalLane(prebetHolders(), 'Lans Koperal'),
          tbp: prebetHolders().filter((e) => isEligibleForTBP(e)).length,
        };
      } else if (normRank === normalizePangkat('Staf Muda')) {
        kenaikan = {
          ...countNormalLane(promotionPoolData.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat('Sarjan')), 'Staf Muda'),
          fastTrack: countByYearsAndCourse(
            getEmployeesBelowRank(promotionPoolData, 'Staf Muda'),
            isEligibleFastTrackStafMudaByYearsAcademic,
            isEligibleFastTrackStafMuda
          ),
        };
      } else if (normRank === normalizePangkat('Leftenan Muda')) {
        kenaikan = {
          ...countNormalLane(promotionPoolData.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat('Staf Tinggi')), 'Leftenan Muda'),
          fastTrack: countByYearsAndCourse(
            getEmployeesBelowRank(promotionPoolData, 'Leftenan Muda'),
            isEligibleFastTrackLeftenanMudaByYearsAcademic,
            isEligibleFastTrackLeftenanMuda
          ),
        };
      } else {
        const rankIdx = PANGKAT_HIERARCHY.findIndex((p) => normRank === normalizePangkat(p));
        const lowerRank = rankIdx > -1 && rankIdx + 1 < PANGKAT_HIERARCHY.length ? PANGKAT_HIERARCHY[rankIdx + 1] : undefined;
        kenaikan = lowerRank
          ? countNormalLane(promotionPoolData.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat(lowerRank)), r.rank)
          : { eligible: 0, needsCourse: 0 };
      }

      return {
        ...r,
        jumlah: activeInRank.length,
        kbp: activeInRank.filter((e) => hasKbp(e.senarai_kursus)).length,
        kbp_waran: activeInRank.filter((e) => hasKbpWaran(e.senarai_kursus)).length,
        ptb: activeInRank.filter((e) => hasPtb(e.senarai_kursus)).length,
        aktif: activeInRank.filter((e) => norm(e.status_keaktifan) === 'AKTIF').length,
        simpanan: activeInRank.filter((e) => norm(e.status_keaktifan) === 'SIMPANAN').length,
        kenaikan,
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

  // Synchronisation en temps réel — reflète les changements de catégorie faits
  // depuis un autre onglet/session sans attendre un refresh manuel.
  useEffect(() => {
    const subscription = supabaseSandbox
      .channel('angkatan_categories_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'angkatan_categories' }, () => {
        fetchEmployees();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    try {
      const payload = { name: categoryForm.name, count: parseInt(categoryForm.count, 10), color: categoryForm.color, myaspa_key: categoryForm.myaspa_key?.trim() || null };
      const { error } = categoryForm.id
        ? await supabaseSandbox.from('angkatan_categories').update(payload).eq('id', categoryForm.id)
        : await supabaseSandbox.from('angkatan_categories').insert([payload]);
      if (error) throw error;
      await fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error saving category:', error);
      return false;
    }
  };
  const deleteCategoryItem = async (id) => {
    try {
      const { error } = await supabaseSandbox.from('angkatan_categories').delete().eq('id', id);
      if (error) throw error;
      await fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  };

  const savePyramidItem = async (pyramidForm) => {
    try {
      const payload = {
        rank: pyramidForm.rank,
        color: pyramidForm.color,
        match_keyword: pyramidForm.match_keyword || pyramidForm.rank,
      };
      if (pyramidForm.id) {
        const { error } = await supabaseSandbox.from('angkatan_pyramid').update(payload).eq('id', pyramidForm.id);
        if (error) throw error;
      } else {
        // Nouveau : ajouté à la fin de l'ordre actuel — le réordonnancement se
        // fait ensuite par glisser (les flèches haut/bas), plus par saisie manuelle.
        const nextOrder = pyramidStats.reduce((max, p) => Math.max(max, p.display_order || 0), 0) + 1;
        const { error } = await supabaseSandbox.from('angkatan_pyramid').insert([{ ...payload, display_order: nextOrder }]);
        if (error) throw error;
      }
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

  const reorderPyramidItems = async (reorderedList) => {
    try {
      await Promise.all(
        reorderedList.map((item, index) =>
          supabaseSandbox.from('angkatan_pyramid').update({ display_order: index + 1 }).eq('id', item.id)
        )
      );
      await fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error reordering angkatan_pyramid:', error);
      return false;
    }
  };

  const saveRankItem = async (rankForm) => {
    const payload = {
      rank: rankForm.rank,
      lulus: parseInt(rankForm.lulus, 10),
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
    savePyramidItem, deletePyramidItem, reorderPyramidItems,
    saveRankItem, deleteRankItem,
    saveSummaryExtra,
  };
}