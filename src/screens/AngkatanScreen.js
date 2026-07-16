//src/screens/AngkatanScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert, FlatList } from 'react-native';
import { TrendingDown, TrendingUp, Minus, Users2, ShieldCheck, ListFilter, Search, Edit2, Plus, Trash2, X } from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { Image, Linking, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { User, Award, ExternalLink, Upload } from 'lucide-react-native';
import Svg, { Polygon, Polyline, Circle, Text as SvgText, Line } from 'react-native-svg';
import { useExcelImport } from '../hooks/useExcelImport';
import ExcelImportModal from '../components/ExcelImportModal';
import * as DATA from '../../data';
import AdminEditButton from '../components/AdminEditButton';

const EMPLOYEE_TABS = ['Identiti', 'Perkhidmatan', 'Insurans', 'Kenaikan Pangkat', 'Waris'];

const FIELD_GROUPS = {
  Identiti: [
    { key: 'nama', label: 'Nama', type: 'text' },
    { key: 'ic_no', label: 'No. IC', type: 'ic' },
    { key: 'pangkat', label: 'Pangkat', type: 'text' },
    { key: 'jantina', label: 'Jantina', type: 'jantina_picker' },
    { key: 'umur', label: 'Umur', type: 'text' },
    { key: 'contact', label: 'No. Telefon', type: 'text' },
    { key: 'alamat_email', label: 'Alamat E-mel', type: 'text' },
    { key: 'alamat_tempat_tinggal', label: 'Alamat Tempat Tinggal', type: 'text' },
    { key: 'jenis_darah', label: 'Jenis Darah', type: 'text' },
    { key: 'negeri', label: 'Negeri', type: 'text' },
    { key: 'daerah', label: 'Daerah', type: 'text' },
    { key: 'no_anggota', label: 'No. Anggota', type: 'text' },
    { key: 'akademik_tertinggi', label: 'Akademik Tertinggi', type: 'text' },
    { key: 'tugas_hakiki', label: 'Tugas Hakiki', type: 'text' },
    { key: 'kompeni', label: 'Kompeni', type: 'text' },
    { key: 'senarai_hitam', label: 'Senarai Hitam', type: 'boolean' },
  ],
  Perkhidmatan: [
    { key: 'tarikh_lantikan', label: 'Tarikh Lantikan', type: 'date' },
    { key: 'tarikh_terima_pangkat_terkini', label: 'Tarikh Terima Pangkat Terkini', type: 'date' },
    { key: 'tarikh_menyertai_apm', label: 'Tarikh Menyertai APM', type: 'date' },
    { key: 'tempoh_berkhidmat', label: 'Tempoh Berkhidmat (Tahun)', type: 'text' },
    { key: 'tarikh_aktif_kad', label: 'Tarikh Aktif Kad', type: 'date' },
    { key: 'tarikh_tamat_kad', label: 'Tarikh Tamat Kad', type: 'date' },
    { key: 'tempoh_baki_aktif_kad_hari', label: 'Tempoh Baki Aktif Kad (Hari)', type: 'text' },
    { key: 'status_myaspa', label: 'Status MyASPA', type: 'text' },
    { key: 'status_keaktifan', label: 'Status Keaktifan', type: 'text' },
    { key: 'senarai_kursus', label: 'Senarai Kursus', type: 'text' },
    { key: 'senarai_penganugerahan', label: 'Senarai Penganugerahan', type: 'text' },
  ],
  Insurans: [
    { key: 'insuran_kelompok_individu', label: 'Insuran (Kelompok/Individu)', type: 'text' },
    { key: 'insuran_aktif_tidak', label: 'Insuran (Aktif/Tidak)', type: 'text' },
    { key: 'tarikh_tamat_insuran', label: 'Tarikh Tamat Insuran', type: 'date' },
    { key: 'tempoh_baki_aktif_insuran_hari', label: 'Tempoh Baki Aktif Insuran (Hari)', type: 'text' },
    { key: 'perkeso_jabatan_individu', label: 'Perkeso (Jabatan/Individu)', type: 'text' },
    { key: 'perkeso_aktif_tidak', label: 'Perkeso (Aktif/Tidak)', type: 'text' },
    { key: 'tarikh_tamat_perkeso', label: 'Tarikh Tamat Perkeso', type: 'date' },
    { key: 'tempoh_baki_caruman_perkeso_hari', label: 'Tempoh Baki Caruman Perkeso (Hari)', type: 'text' },
  ],
  'Kenaikan Pangkat': [
    { key: 'no_rujukan_surat_lkpl', label: 'No. Rujukan Surat L/KPL', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_lkpl', label: 'Tarikh Kenaikan Pangkat L/KPL', type: 'date' },
    { key: 'no_rujukan_surat_kpl', label: 'No. Rujukan Surat KPL', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_kpl', label: 'Tarikh Kenaikan Pangkat KPL', type: 'date' },
    { key: 'no_rujukan_surat_sjn', label: 'No. Rujukan Surat SJN', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_sjn', label: 'Tarikh Kenaikan Pangkat SJN', type: 'date' },
    { key: 'no_siri_watikah_pwi', label: 'No. Siri Watikah PW I', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_pwi', label: 'Tarikh Kenaikan Pangkat PWI', type: 'date' },
    { key: 'no_siri_watikah_pwii', label: 'No. Siri Watikah PW II', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_pwii', label: 'Tarikh Kenaikan Pangkat PW II', type: 'date' },
    { key: 'no_siri_watikah_pelantikan_pertama', label: 'No. Siri Watikah Pelantikan Pertama', type: 'text' },
    { key: 'tarikh_pelantikan_pasukan_pertama', label: 'Tarikh Pelantikan Pasukan Pertama', type: 'date' },
    { key: 'tarikh_tamat_watikah_4', label: 'Tarikh Tamat Watikah 4', type: 'date' },
    { key: 'tempoh_aktif_watikah_4_hari', label: 'Tempoh Aktif Watikah 4 (Hari)', type: 'text' },
    { key: 'sejarah_penyambungan_1', label: 'Sejarah Penyambungan 1', type: 'date' },
    { key: 'tarikh_tamat_surat_penyambungan_1', label: 'Tarikh Tamat Surat Penyambungan 1', type: 'date' },
    { key: 'tempoh_aktif_watikah_5_hari', label: 'Tempoh Aktif Watikah 5 (Hari)', type: 'text' },
    { key: 'sejarah_penyambungan_2', label: 'Sejarah Penyambungan 2', type: 'date' },
    { key: 'tarikh_tamat_surat_penyambungan_2', label: 'Tarikh Tamat Surat Penyambungan 2', type: 'date' },
    { key: 'tempoh_aktif_watikah_6_hari', label: 'Tempoh Aktif Watikah 6 (Hari)', type: 'text' },
    { key: 'penyambungan_terkini', label: 'Penyambungan Terkini', type: 'date' },
    { key: 'tarikh_tamat_surat_penyambungan_terkini', label: 'Tarikh Tamat Surat Penyambungan Terkini', type: 'date' },
    { key: 'tempoh_aktif_watikah_terkini_hari', label: 'Tempoh Aktif Watikah Terkini (Hari)', type: 'text' },
  ],
  Waris: [
    { key: 'nama_waris', label: 'Nama Waris', type: 'text' },
    { key: 'hubungan_waris', label: 'Hubungan Waris', type: 'text' },
    { key: 'no_telefon_waris', label: 'No. Telefon Waris', type: 'text' },
    { key: 'catatan', label: 'Catatan', type: 'text' },
  ],
};

const emptyEmployeeForm = () => {
  const obj = { id: null };
  const keys = new Set(['nama', 'ic_no', 'pangkat', 'jantina', 'tarikh_lantikan', 'contact', 'photo_url', 'senarai_hitam']);
  Object.values(FIELD_GROUPS).forEach((group) => group.forEach((f) => keys.add(f.key)));
  keys.forEach((k) => { obj[k] = k === 'senarai_hitam' ? false : ''; });
  return obj;
};

export default function AngkatanScreen({ theme, userRole }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // States for DB Data
  const [summary, setSummary] = useState({
    total_anggota: 0, aktif_anggota: 0, male_count: 0, female_count: 0,
    status_lulus: 0, status_lantikan: 0, status_simpanan: 0, status_aktif: 0
  });
  const [categories, setCategories] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [communityProgs, setCommunityProgs] = useState([]);
  const [pyramidStats, setPyramidStats] = useState([]);

  // Modal States
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showPyramidModal, setShowPyramidModal] = useState(false);

  // Form States
  const [summaryForm, setSummaryForm] = useState({});
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '', count: '', color: '#0ea5e9' });
  const [rankForm, setRankForm] = useState({ id: null, rank: '', lulus: '', kenaikan: '', kbp: '', ptb: '', aktif: '', simpanan: '' });
  const [communityForm, setCommunityForm] = useState({ id: null, category: '', label: '', detail: '', color: '#3b82f6' });
  const [pyramidForm, setPyramidForm] = useState({ id: null, rank: '', total: '', color: '#1e40af', display_order: '' });

  // States for Employees
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const EMPLOYEES_PER_PAGE = 50;
  const [showCategoryEmployeesModal, setShowCategoryEmployeesModal] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [categoryEmployeesPage, setCategoryEmployeesPage] = useState(1);
  const mapMyaspaLabel = (raw) => {
    const norm = String(raw || '').trim().toUpperCase();
    if (norm === 'MYASPA-P') return 'Pengurusan';
    if (norm === 'MYASPA-O') return 'Operasi';
    if (norm === 'ASPA') return 'MYASPA';
    return null;
  };
  const [showEmployeeDetailModal, setShowEmployeeDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm());
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeDatePickerField, setActiveDatePickerField] = useState(null);
  const [certOnlyMode, setCertOnlyMode] = useState(false);
  const [showFullDetail, setShowFullDetail] = useState(false);
  const [activeEmployeeTab, setActiveEmployeeTab] = useState('Identiti');
  const [promotionHistoryList, setPromotionHistoryList] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [certForm, setCertForm] = useState({ id: null, nom_certificat: '', google_drive_link: '' });
  const [showCertModal, setShowCertModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const excelImportHook = useExcelImport();

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, rankRes, commRes, pyrRes] = await Promise.all([
        supabase.from('angkatan_summary').select('*').eq('id', 1).maybeSingle(),
        supabaseSandbox.from('angkatan_categories').select('*').order('id'),
        supabase.from('angkatan_ranks').select('*').order('id'),
        supabase.from('angkatan_community').select('*').order('id'),
        supabaseSandbox.from('angkatan_pyramid').select('*').order('display_order', { ascending: true })
      ]);

      if (sumRes.data) setSummary(prev => ({
        ...sumRes.data,
        total_anggota: prev.total_anggota,
        aktif_anggota: prev.aktif_anggota,
        male_count: prev.male_count,
        female_count: prev.female_count,
        status_lulus: prev.status_lulus,
        status_lantikan: prev.status_lantikan,
        status_simpanan: prev.status_simpanan,
        status_aktif: prev.status_aktif
      }));
      // if (catRes.data) setCategories(catRes.data);
      if (rankRes.data) setRanks(rankRes.data);
      if (commRes.data) setCommunityProgs(commRes.data);
      if (pyrRes.data) setPyramidStats(pyrRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD Functions: Summary ---
  const handleSaveSummary = async () => {
    try {
      const payload = { ...summaryForm, total_anggota: summary.total_anggota, aktif_anggota: summary.aktif_anggota };
      const { error } = await supabase.from('angkatan_summary').update(payload).eq('id', 1);
      if (error) throw error;
      setSummary(summaryForm);
      setShowSummaryModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  // --- CRUD Functions: Categories ---
  const handleSaveCategory = async () => {
    try {
      const payload = { name: categoryForm.name, count: parseInt(categoryForm.count), color: categoryForm.color };
      if (categoryForm.id) {
        await supabaseSandbox.from('angkatan_categories').update(payload).eq('id', categoryForm.id);
      } else {
        await supabaseSandbox.from('angkatan_categories').insert([payload]);
      }
      fetchData(); setShowCategoryModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  const handleDeleteCategory = async (id) => {
    try { await supabaseSandbox.from('angkatan_categories').delete().eq('id', id); fetchData(); }
    catch (error) { Alert.alert('Ralat', error.message); }
  };

  // --- CRUD Functions: Community ---
  const handleSaveCommunity = async () => {
    try {
      const payload = { category: communityForm.category, label: communityForm.label, detail: communityForm.detail, color: communityForm.color };
      if (communityForm.id) {
        await supabase.from('angkatan_community').update(payload).eq('id', communityForm.id);
      } else {
        await supabase.from('angkatan_community').insert([payload]);
      }
      fetchData(); setShowCommunityModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  const handleDeleteCommunity = async (id) => {
    try { await supabase.from('angkatan_community').delete().eq('id', id); fetchData(); }
    catch (error) { Alert.alert('Ralat', error.message); }
  };

  // --- CRUD Functions: Pyramid ---
  const handleSavePyramid = async () => {
    try {
      const payload = { 
        rank: pyramidForm.rank, 
        total: parseInt(pyramidForm.total), 
        color: pyramidForm.color,
        display_order: parseInt(pyramidForm.display_order)
      };
      if (pyramidForm.id) {
        await supabaseSandbox.from('angkatan_pyramid').update(payload).eq('id', pyramidForm.id);
      } else {
        await supabaseSandbox.from('angkatan_pyramid').insert([payload]);
      }
      fetchData(); setShowPyramidModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  const handleDeletePyramid = async (id) => {
    try {
      await supabaseSandbox.from('angkatan_pyramid').delete().eq('id', id);
      fetchData();
      setShowPyramidModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  // --- CRUD Functions: Ranks ---
  const handleSaveRank = async () => {
    try {
      const payload = {
        rank: rankForm.rank, lulus: parseInt(rankForm.lulus), kenaikan: parseInt(rankForm.kenaikan),
        kbp: parseInt(rankForm.kbp), ptb: parseInt(rankForm.ptb), aktif: parseInt(rankForm.aktif), simpanan: parseInt(rankForm.simpanan)
      };
      if (rankForm.id) { await supabase.from('angkatan_ranks').update(payload).eq('id', rankForm.id); }
      else { await supabase.from('angkatan_ranks').insert([payload]); }
      fetchData(); setShowRankModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  const handleDeleteRank = async (id) => {
    try { await supabase.from('angkatan_ranks').delete().eq('id', id); fetchData(); }
    catch (error) { Alert.alert('Ralat', error.message); }
  };

  // --- CRUD Functions: Employees (sandbox) ---
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabaseSandbox
        .from('angkatan_employees')
        .select('*')
        .order('nama', { ascending: true });
      if (error) throw error;
      setEmployees(data || []);

      const total = data?.length || 0;
      const male = data?.filter(e => String(e.jantina || '').toUpperCase() === 'LELAKI').length || 0;
      const female = data?.filter(e => String(e.jantina || '').toUpperCase() === 'PEREMPUAN').length || 0;
      const norm = (v) => String(v || '').trim().toUpperCase();
      const countAktif = data?.filter(e => norm(e.status_keaktifan) === 'AKTIF').length || 0;
      const countTidakAktif = data?.filter(e => norm(e.status_keaktifan) === 'TIDAK AKTIF').length || 0;
      const countSimpanan = data?.filter(e => norm(e.status_keaktifan) === 'SIMPANAN').length || 0;
      const countSenaraiHitam = data?.filter(e => norm(e.status_keaktifan) === 'SENARAI HITAM').length || 0;
      setSummary(prev => ({
        ...prev,
        total_anggota: total,
        aktif_anggota: countAktif,
        male_count: male,
        female_count: female,
        status_lulus: countAktif,
        status_lantikan: countTidakAktif,
        status_simpanan: countSimpanan,
        status_aktif: countSenaraiHitam
      }));

      // Penjawatan Utama : baser sur status_myaspa, avec libellés lisibles
      const myaspaValues = [...new Set((data || [])
        .map((e) => mapMyaspaLabel(e.status_myaspa))
        .filter(Boolean))];

      const { data: existingCategories } = await supabaseSandbox.from('angkatan_categories').select('*');
      const existingNames = (existingCategories || []).map((c) => c.name);
      const defaultColors = ['#0ea5e9', '#f97316', '#22c55e', '#6366f1', '#db2777', '#8b5cf6'];

      const existingNamesUpper = existingNames.map((n) => n.toUpperCase());
      const missingValues = myaspaValues.filter((v) => !existingNamesUpper.includes(v.toUpperCase()));
      if (missingValues.length > 0) {
        const newRows = missingValues.map((name, i) => ({
          name,
          count: 0,
          color: defaultColors[i % defaultColors.length],
        }));
        await supabaseSandbox.from('angkatan_categories').insert(newRows);
      }

      const { data: refreshedCategories } = await supabaseSandbox.from('angkatan_categories').select('*').order('id');
      const updatedCategories = (refreshedCategories || []).map((cat) => ({
        ...cat,
        count: data?.filter((e) => mapMyaspaLabel(e.status_myaspa)?.toUpperCase() === cat.name.toUpperCase()).length || 0,
      }));
      setCategories(updatedCategories);
      // Struktur Pangkat & Keahlian : baser sur Pangkat, dans l'ordre hiérarchique
      const PANGKAT_HIERARCHY = [
        'Mejar', 'Kapten', 'Leftenan', 'Leftenan Muda', 'Staf Tinggi',
        'Staf Kanan', 'Staf Muda', 'Sarjan', 'Koperal', 'Lans Koperal', 'Prebet'
      ];
      const pyramidColors = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#f59e0b', '#f97316', '#ea580c', '#c2410c'];
      const normalizePangkat = (raw) => String(raw || '').replace(/\(PA\)/i, '').trim().toUpperCase();

      const { data: existingPyramid } = await supabaseSandbox.from('angkatan_pyramid').select('*');
      const existingPyramidNames = (existingPyramid || []).map((p) => normalizePangkat(p.rank));

      const missingRanks = PANGKAT_HIERARCHY.filter((r) => !existingPyramidNames.includes(normalizePangkat(r)));
      if (missingRanks.length > 0) {
        const newPyramidRows = missingRanks.map((rank) => ({
          rank,
          total: 0,
          color: pyramidColors[PANGKAT_HIERARCHY.indexOf(rank) % pyramidColors.length],
          display_order: PANGKAT_HIERARCHY.indexOf(rank) + 1,
        }));
        await supabaseSandbox.from('angkatan_pyramid').insert(newPyramidRows);
      }

      const { data: refreshedPyramid } = await supabaseSandbox.from('angkatan_pyramid').select('*').order('display_order', { ascending: true });
      const updatedPyramid = (refreshedPyramid || []).map((p) => ({
        ...p,
        total: data?.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat(p.rank)).length || 0,
      }));
      setPyramidStats(updatedPyramid);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchCertificates = async (employeeId) => {
    try {
      const { data, error } = await supabaseSandbox
        .from('angkatan_certificates')
        .select('*')
        .eq('employee_id', employeeId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  const fetchPromotionHistory = async (employeeId) => {
    try {
      const { data, error } = await supabaseSandbox
        .from('angkatan_promotion_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('pasukan_number', { ascending: true });
      if (error) throw error;
      setPromotionHistoryList(data || []);
    } catch (error) {
      console.error('Error fetching promotion history:', error);
    }
  };

  const openEmployeeDetail = (emp) => {
    setSelectedEmployee(emp);
    setEmployeeForm({ ...emptyEmployeeForm(), ...emp });
    setCertOnlyMode(false);
    setShowFullDetail(false);
    setActiveEmployeeTab('Identiti');
    fetchCertificates(emp.id);
    fetchPromotionHistory(emp.id);
    setShowEmployeeDetailModal(true);
  };

  const openCertificatesOnly = (emp) => {
    setSelectedEmployee(emp);
    setEmployeeForm({ ...emp, tarikh_lantikan: emp.tarikh_lantikan || '' });
    setCertOnlyMode(true);
    fetchCertificates(emp.id);
    setShowEmployeeDetailModal(true);
  };

  const handleSaveEmployee = async () => {
    try {
      const { id: _id, ...payload } = employeeForm;
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });
      if (employeeForm.id) {
        const { error } = await supabaseSandbox.from('angkatan_employees').update(payload).eq('id', employeeForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseSandbox.from('angkatan_employees').insert([payload]);
        if (error) throw error;
      }
      fetchEmployees();
      setShowEmployeeDetailModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  const handleDeleteEmployee = (id) => {
    const doDelete = async () => {
      try {
        await supabaseSandbox.from('angkatan_employees').delete().eq('id', id);
        fetchEmployees();
        setShowEmployeeDetailModal(false);
      } catch (error) { Alert.alert('Ralat', error.message); }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Adakah anda pasti mahu memadam rekod anggota ini? Tindakan ini tidak boleh dibatalkan.')) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Padam Anggota',
        'Adakah anda pasti mahu memadam rekod anggota ini? Tindakan ini tidak boleh dibatalkan.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Padam', style: 'destructive', onPress: doDelete }
        ]
      );
    }
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Kebenaran diperlukan', 'Sila benarkan akses ke galeri foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    try {
      setUploadingPhoto(true);
      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );
      const response = await fetch(manipulated.uri);
      const blob = await response.blob();
      const fileName = `${employeeForm.id || 'new'}_${Date.now()}.jpg`;
      const filePath = `photos/${fileName}`;
      const { error: uploadError } = await supabaseSandbox.storage
        .from('employee-photos')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabaseSandbox.storage
        .from('employee-photos')
        .getPublicUrl(filePath);
      setEmployeeForm({ ...employeeForm, photo_url: urlData.publicUrl });
    } catch (error) {
      Alert.alert('Ralat Muat Naik', error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // --- CRUD Functions: Certificates (sandbox) ---
  const handleSaveCertificate = async () => {
    try {
      const payload = {
        employee_id: selectedEmployee.id,
        nom_certificat: certForm.nom_certificat,
        google_drive_link: certForm.google_drive_link
      };
      if (certForm.id) {
        await supabaseSandbox.from('angkatan_certificates').update(payload).eq('id', certForm.id);
      } else {
        await supabaseSandbox.from('angkatan_certificates').insert([payload]);
      }
      fetchCertificates(selectedEmployee.id);
      setShowCertModal(false);
      setCertForm({ id: null, nom_certificat: '', google_drive_link: '' });
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  const handleDeleteCertificate = async (id) => {
    try {
      await supabaseSandbox.from('angkatan_certificates').delete().eq('id', id);
      fetchCertificates(selectedEmployee.id);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  const openCertificateLink = (link) => {
    Linking.openURL(link).catch(() => Alert.alert('Ralat', 'Tidak dapat membuka pautan.'));
  };

  const filteredRankData = ranks.filter(item => item.rank.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredEmployees = employees.filter(emp => emp.nama.toLowerCase().includes(employeeSearch.toLowerCase()));
  const totalEmployeePages = Math.max(1, Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE));
  const paginatedEmployees = filteredEmployees.slice((employeePage - 1) * EMPLOYEES_PER_PAGE, employeePage * EMPLOYEES_PER_PAGE);
  const categoryFilteredEmployees = selectedCategoryName
    ? employees.filter((e) => mapMyaspaLabel(e.status_myaspa)?.toUpperCase() === selectedCategoryName.toUpperCase())
    : [];
  const totalCategoryPages = Math.max(1, Math.ceil(categoryFilteredEmployees.length / EMPLOYEES_PER_PAGE));
  const paginatedCategoryEmployees = categoryFilteredEmployees.slice(
    (categoryEmployeesPage - 1) * EMPLOYEES_PER_PAGE,
    categoryEmployeesPage * EMPLOYEES_PER_PAGE
  );

  const openCategoryEmployees = (categoryName) => {
    setSelectedCategoryName(categoryName);
    setCategoryEmployeesPage(1);
    setShowCategoryEmployeesModal(true);
  };
  const renderField = (f) => (
    <View key={f.key} style={[styles.inputGroup, { marginBottom: 18 }]}>
      <Text style={{ color: theme.textSecondary, marginBottom: 6, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 }}>{f.label}</Text>
      {isEditing ? (
        f.type === 'date' ? (
          Platform.OS === 'web' ? (
            <input
              type="date"
              value={employeeForm[f.key] || ''}
              onChange={(e) => setEmployeeForm({ ...employeeForm, [f.key]: e.target.value })}
              style={{
                borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 12,
                fontSize: 14, backgroundColor: theme.background, color: theme.text,
                border: `1px solid ${theme.border}`, width: '100%', boxSizing: 'border-box'
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setActiveDatePickerField(f.key)}
                style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, justifyContent: 'center' }]}
              >
                <Text style={{ color: employeeForm[f.key] ? theme.text : theme.textSecondary }}>
                  {employeeForm[f.key] || 'Pilih tarikh'}
                </Text>
              </TouchableOpacity>
              {activeDatePickerField === f.key ? (
                <DateTimePicker
                  value={employeeForm[f.key] ? new Date(employeeForm[f.key]) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setActiveDatePickerField(null);
                    if (selectedDate) {
                      setEmployeeForm({ ...employeeForm, [f.key]: selectedDate.toISOString().split('T')[0] });
                    }
                  }}
                />
              ) : null}
            </>
          )
        ) : f.type === 'ic' ? (
          <TextInput
            style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={String(employeeForm[f.key] || '')}
            onChangeText={(t) => setEmployeeForm({ ...employeeForm, [f.key]: formatICNumber(t) })}
            keyboardType="numeric"
            maxLength={14}
          />
        ) : f.type === 'status_picker' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Lulus Ujian', 'Lantikan Baru', 'Simpanan', 'Aktif Penugasan'].map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setEmployeeForm({ ...employeeForm, status: opt })}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                  backgroundColor: employeeForm.status === opt ? theme.accent : theme.background,
                  borderWidth: 1, borderColor: employeeForm.status === opt ? theme.accent : theme.border
                }}
              >
                <Text style={{ color: employeeForm.status === opt ? '#fff' : theme.text, fontSize: 12, fontWeight: '600' }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : f.type === 'jantina_picker' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['Lelaki', 'Perempuan'].map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setEmployeeForm({ ...employeeForm, jantina: opt })}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
                  backgroundColor: employeeForm.jantina === opt ? theme.accent : theme.background,
                  borderWidth: 1, borderColor: employeeForm.jantina === opt ? theme.accent : theme.border
                }}
              >
                <Text style={{ color: employeeForm.jantina === opt ? '#fff' : theme.text, fontSize: 13, fontWeight: '600' }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : f.type === 'boolean' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[{ label: 'Tidak', val: false }, { label: 'Ya', val: true }].map((opt) => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setEmployeeForm({ ...employeeForm, [f.key]: opt.val })}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
                  backgroundColor: employeeForm[f.key] === opt.val ? (opt.val ? '#ef4444' : theme.accent) : theme.background,
                  borderWidth: 1, borderColor: theme.border
                }}
              >
                <Text style={{ color: employeeForm[f.key] === opt.val ? '#fff' : theme.text, fontSize: 13, fontWeight: '600' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TextInput
            style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={String(employeeForm[f.key] || '')}
            onChangeText={(t) => setEmployeeForm({ ...employeeForm, [f.key]: t })}
          />
        )
      ) : (
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>
          {f.type === 'boolean' ? (employeeForm[f.key] ? 'Ya' : 'Tidak') : (employeeForm[f.key] || '-')}
        </Text>
      )}
    </View>
  );
  const formatICNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    let formatted = digits;
    if (digits.length > 6) {
      formatted = `${digits.slice(0, 6)}-${digits.slice(6)}`;
    }
    if (digits.length > 8) {
      formatted = `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
    }
    return formatted;
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={theme.accent} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* UNIVERSAL ADMIN EDIT BUTTON */}
        <AdminEditButton 
          isEditMode={isEditing} 
          setIsEditMode={setIsEditing} 
          userRole={userRole} 
        />

        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Dashboard Angkatan</Text>
        </View>

        <View style={styles.contentGrid}>
          <View style={styles.row}>
            <View style={[styles.card, { backgroundColor: theme.card, flex: 1, width: '100%' }]}>
              {isEditing ? (
                <TouchableOpacity style={styles.editBadge} onPress={() => { setSummaryForm(summary); setShowSummaryModal(true); }}>
                  <Edit2 size={14} color="#fff" />
                </TouchableOpacity>
              ) : null}
              <Text style={[styles.bigNumber, { color: '#f97316' }]}>{summary.total_anggota}</Text>
              <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Jumlah Anggota</Text>
              <View style={styles.activeBadge}>
                <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>{summary.aktif_anggota} Aktif</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.card, { backgroundColor: theme.card, flex: 1 }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Penjawatan Utama</Text>
                {isEditing ? (
                  <TouchableOpacity onPress={() => { setCategoryForm({ id: null, name: '', count: '', color: '#0ea5e9' }); setShowCategoryModal(true); }}>
                    <Plus size={20} color={theme.accent} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.listItem}
                  onPress={() => openCategoryEmployees(cat.name)}
                >
                  <View style={[styles.dot, { backgroundColor: cat.color }]} />
                  <Text style={{ color: theme.textSecondary, flex: 1, marginLeft: 10 }}>{cat.name}</Text>
                  <Text style={{ color: theme.text, fontWeight: '700', marginRight: 10 }}>{cat.count}</Text>
                  {isEditing ? (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); setCategoryForm({ ...cat, count: String(cat.count) }); setShowCategoryModal(true); }}>
                        <Edit2 size={16} color="#22c55e" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); handleDeleteCategory(cat.id); }}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: theme.card, flex: 1 }]}>
              {isEditing ? (
                <TouchableOpacity style={styles.editBadge} onPress={() => { setSummaryForm(summary); setShowSummaryModal(true); }}>
                  <Edit2 size={14} color="#fff" />
                </TouchableOpacity>
              ) : null}
              <Text style={[styles.cardTitle, { color: theme.text }]}>Taburan Jantina</Text>
              <View style={styles.genderContainer}>
                <View style={styles.genderRow}>
                   <View style={styles.genderIconCircle}><Users2 size={24} color={theme.accent} /></View>
                   <View style={{ flex: 1 }}>
                      <View style={styles.genderHeader}>
                        <Text style={[styles.genderLabel, { color: theme.text }]}>Lelaki</Text>
                        <Text style={[styles.genderValue, { color: theme.text }]}>{summary.male_count}</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '66%', backgroundColor: '#3b82f6' }]} />
                      </View>
                   </View>
                </View>

                <View style={styles.genderRow}>
                   <View style={[styles.genderIconCircle, { backgroundColor: '#fdf2f8' }]}>
                     <Users2 size={24} color="#db2777" />
                   </View>
                   <View style={{ flex: 1 }}>
                      <View style={styles.genderHeader}>
                        <Text style={[styles.genderLabel, { color: theme.text }]}>Wanita</Text>
                        <Text style={[styles.genderValue, { color: theme.text }]}>{summary.female_count}</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '33%', backgroundColor: '#db2777' }]} />
                      </View>
                   </View>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
             {isEditing ? (
                <TouchableOpacity style={styles.editBadge} onPress={() => { setSummaryForm(summary); setShowSummaryModal(true); }}>
                  <Edit2 size={14} color="#fff" />
                </TouchableOpacity>
              ) : null}
             <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
               <ShieldCheck size={20} color={theme.accent} />
               <Text style={[styles.cardTitle, { color: theme.text, marginLeft: 10, marginBottom: 0 }]}>Status Anggota</Text>
             </View>
             <View style={styles.statusGrid}>
               <StatusBox label="Aktif" value={summary.status_lulus} color="#22c55e" theme={theme} />
               <StatusBox label="Tidak Aktif" value={summary.status_lantikan} color="#f97316" theme={theme} />
               <StatusBox label="Simpanan" value={summary.status_simpanan} color="#6366f1" theme={theme} />
               <StatusBox label="Senarai Hitam" value={summary.status_aktif} color="#ef4444" theme={theme} />
             </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.tableHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ListFilter size={20} color={theme.accent} />
                <Text style={[styles.cardTitle, { color: theme.text, marginLeft: 10, marginBottom: 0 }]}>Laluan Kerjaya</Text>
                {isEditing ? (
                  <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => { setRankForm({ id: null, rank: '', lulus: '', kenaikan: '', kbp: '', ptb: '', aktif: '', simpanan: '' }); setShowRankModal(true); }}>
                    <View style={styles.addInlineBtn}><Plus size={16} color="#fff" /><Text style={styles.addInlineBtnText}>Tambah</Text></View>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
                <Search size={16} color={theme.textSecondary} />
                <TextInput placeholder="Cari Pangkat..." placeholderTextColor={theme.textSecondary} style={[styles.searchInput, { color: theme.text }]} value={searchQuery} onChangeText={setSearchQuery} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={[styles.table, { borderColor: theme.border }]}>
                <View style={[styles.tableRow, { backgroundColor: theme.background }]}>
                  {['PERINGKAT', 'LULUS', 'NAIK', 'KBP', 'PTB', 'AKTIF', 'SIMPANAN', ...(isEditing ? ['TINDAKAN'] : [])].map((h, i) => (
                    <Text key={i} style={[styles.tableHeaderCell, { color: theme.text }]}>{h}</Text>
                  ))}
                </View>
                {filteredRankData.map((item) => (
                  <View key={item.id} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.tableCell, { fontWeight: '700', color: theme.text, textAlign: 'left', width: 140 }]}>{item.rank}</Text>
                    <Text style={[styles.tableCell, { color: theme.textSecondary }]}>{item.lulus}</Text>
                    <Text style={[styles.tableCell, { color: theme.textSecondary }]}>{item.kenaikan}</Text>
                    <Text style={[styles.tableCell, { color: theme.textSecondary }]}>{item.kbp}</Text>
                    <Text style={[styles.tableCell, { color: theme.textSecondary }]}>{item.ptb}</Text>
                    <Text style={[styles.tableCell, { color: '#22c55e', fontWeight: '700' }]}>{item.aktif}</Text>
                    <Text style={[styles.tableCell, { color: theme.accent, fontWeight: '700' }]}>{item.simpanan}</Text>
                    {isEditing ? (
                      <View style={[styles.tableCell, { flexDirection: 'row', justifyContent: 'center', gap: 10 }]}>
                        <TouchableOpacity onPress={() => { setRankForm({ ...item, lulus: String(item.lulus), kenaikan: String(item.kenaikan), kbp: String(item.kbp), ptb: String(item.ptb), aktif: String(item.aktif), simpanan: String(item.simpanan) }); setShowRankModal(true); }}><Edit2 size={16} color="#22c55e" /></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteRank(item.id)}><Trash2 size={16} color="#ef4444" /></TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Program Komuniti (Pasukan APM)</Text>
              {isEditing ? (
                <TouchableOpacity onPress={() => { setCommunityForm({ id: null, category: '', label: '', detail: '', color: '#3b82f6' }); setShowCommunityModal(true); }}>
                  <Plus size={20} color={theme.accent} />
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={{ marginTop: 10 }}>
              {communityProgs.map((prog) => (
                <View key={prog.id} style={[styles.communityItem, { borderBottomColor: theme.border }]}>
                  <View style={[styles.programBadge, { backgroundColor: prog.color }]}><Text style={styles.programBadgeText}>{prog.category}</Text></View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>{prog.label}</Text>
                    <Text style={{ color: theme.textSecondary, marginTop: 4 }}>{prog.detail}</Text>
                  </View>
                  {isEditing ? (
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                      <TouchableOpacity onPress={() => { setCommunityForm(prog); setShowCommunityModal(true); }}><Edit2 size={18} color="#22c55e" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteCommunity(prog.id)}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>Struktur Pangkat & Keahlian</Text>
              {isEditing ? (
                <TouchableOpacity onPress={() => { setPyramidForm({ id: null, rank: '', total: '', color: '#1e40af', display_order: '' }); setShowPyramidModal(true); }}>
                  <Plus size={20} color={theme.accent} />
                </TouchableOpacity>
              ) : null}
            </View>
              <View style={{ marginTop: 20 }}>
                {(() => {
                  const maxTotal = Math.max(1, ...pyramidStats.map((p) => p.total || 0));
                  const maxLog = Math.log(maxTotal + 1);
                  return pyramidStats.map((item) => {
                    const val = item.total || 0;
                    const barWidthPercent = maxLog > 0 ? (Math.log(val + 1) / maxLog) * 100 : 0;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        disabled={!isEditing}
                        onPress={() => { setPyramidForm({ ...item, total: String(item.total), display_order: String(item.display_order) }); setShowPyramidModal(true); }}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                      >
                        <Text style={{ width: 100, fontSize: 12, color: theme.textSecondary, fontWeight: '600' }} numberOfLines={1}>
                          {item.rank}
                        </Text>
                        <View style={{ flex: 1, height: 26, backgroundColor: theme.background, borderRadius: 6, overflow: 'hidden', alignItems: 'center' }}>
                          {val > 0 ? (
                            <View style={{ width: `${Math.max(barWidthPercent, 2)}%`, height: '100%', backgroundColor: item.color, borderRadius: 6 }} />
                          ) : null}
                        </View>
                        <Text style={{ marginLeft: 8, fontSize: 12, color: theme.text, fontWeight: '700', width: 30 }}>{val}</Text>
                        {isEditing ? <Edit2 size={12} color={theme.textSecondary} style={{ marginLeft: 8 }} /> : null}
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>
            </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.tableHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <User size={20} color={theme.accent} />
                <Text style={[styles.cardTitle, { color: theme.text, marginLeft: 10, marginBottom: 0 }]}>
                  Senarai Anggota ({filteredEmployees.length})
                </Text>
                {isEditing ? (
                  <View style={{ flexDirection: 'row', marginLeft: 15, gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedEmployee(null);
                        setEmployeeForm(emptyEmployeeForm());
                        setShowFullDetail(true);
                        setActiveEmployeeTab('Identiti');
                        setCertificates([]);
                        setShowEmployeeDetailModal(true);
                      }}
                    >
                      <View style={styles.addInlineBtn}><Plus size={16} color="#fff" /><Text style={styles.addInlineBtnText}>Tambah</Text></View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowExcelImportModal(true)}>
                      <View style={[styles.addInlineBtn, { backgroundColor: '#22c55e' }]}>
                        <Upload size={16} color="#fff" /><Text style={styles.addInlineBtnText}>Import Excel</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
              <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
                <Search size={16} color={theme.textSecondary} />
                <TextInput
                  placeholder="Cari nama anggota..."
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.searchInput, { color: theme.text }]}
                  value={employeeSearch}
                  onChangeText={(t) => { setEmployeeSearch(t); setEmployeePage(1); }}
                />
              </View>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontStyle: 'italic', marginBottom: 10 }}>
              Ketik pada profil untuk lihat lebih maklumat
            </Text>
            <FlatList
              data={paginatedEmployees}
              keyExtractor={(emp) => emp.id}
              scrollEnabled={false}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={5}
              removeClippedSubviews={true}
              renderItem={({ item: emp }) => (
                <TouchableOpacity
                  style={[styles.employeeRow, { borderBottomColor: theme.border }]}
                  onPress={() => openEmployeeDetail(emp)}
                >
                  {emp.photo_url ? (
                    <Image source={{ uri: emp.photo_url }} style={styles.employeeAvatar} />
                  ) : (
                    <View style={[styles.employeeAvatar, styles.employeeAvatarPlaceholder]}>
                      <User size={20} color="#94a3b8" />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>{emp.nama}</Text>
                      <View style={[styles.employeeStatusBadge, { backgroundColor: String(emp.status_keaktifan).toUpperCase() === 'AKTIF' ? '#22c55e15' : '#f1f5f9', marginLeft: 10, paddingVertical: 3, paddingHorizontal: 8 }]}>
                        <Text style={{ color: String(emp.status_keaktifan).toUpperCase() === 'AKTIF' ? '#22c55e' : theme.textSecondary, fontSize: 10, fontWeight: '700' }}>
                          {emp.status_keaktifan}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{emp.pangkat}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.lihatSijilBtn}
                    onPress={(e) => { e.stopPropagation ? e.stopPropagation() : null; openCertificatesOnly(emp); }}
                  >
                    <Award size={14} color={theme.accent} />
                    <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '700', marginLeft: 5 }}>Lihat Sijil</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, gap: 15 }}>
              <TouchableOpacity
                disabled={employeePage === 1}
                onPress={() => setEmployeePage((p) => Math.max(1, p - 1))}
                style={{ opacity: employeePage === 1 ? 0.3 : 1, padding: 8 }}
              >
                <Text style={{ color: theme.accent, fontWeight: '700' }}>← Sebelum</Text>
              </TouchableOpacity>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                Muka {employeePage} / {totalEmployeePages} ({filteredEmployees.length} rekod)
              </Text>
              <TouchableOpacity
                disabled={employeePage === totalEmployeePages}
                onPress={() => setEmployeePage((p) => Math.min(totalEmployeePages, p + 1))}
                style={{ opacity: employeePage === totalEmployeePages ? 0.3 : 1, padding: 8 }}
              >
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Seterusnya →</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* --- MODALS --- */}
      <Modal visible={showSummaryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Kemaskini Rumusan</Text>
          <ScrollView showsVerticalScrollIndicator={false}>{Object.keys(summaryForm).filter(k => !['id', 'total_anggota', 'aktif_anggota', 'male_count', 'female_count', 'status_lulus', 'status_lantikan', 'status_simpanan', 'status_aktif'].includes(k)).map((key) => (
            <View key={key} style={styles.inputGroup}>
              <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{key.replace('_', ' ').toUpperCase()}</Text>
              <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={String(summaryForm[key] || '')} onChangeText={(text) => setSummaryForm({ ...summaryForm, [key]: parseInt(text) || 0 })} />
            </View>
          ))}</ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowSummaryModal(false)} style={[styles.modalBtn, { backgroundColor: theme.background }]}><Text style={{ color: theme.text }}>Batal</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSaveSummary} style={[styles.modalBtn, { backgroundColor: theme.accent }]}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Simpan</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={showCategoryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{categoryForm.id ? 'Edit' : 'Tambah'} Penjawatan</Text>
          <TextInput placeholder="Nama" placeholderTextColor={theme.textSecondary} style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 15 }]} value={categoryForm.name} onChangeText={(t) => setCategoryForm({...categoryForm, name: t})} />
          <TextInput placeholder="Jumlah" keyboardType="numeric" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]} value={categoryForm.count} onChangeText={(t) => setCategoryForm({...categoryForm, count: t})} />
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.modalBtn}><Text style={{ color: theme.text }}>Batal</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSaveCategory} style={[styles.modalBtn, { backgroundColor: theme.accent }]}><Text style={{ color: '#fff' }}>Simpan</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={showCommunityModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Kemaskini Program Komuniti</Text>
          <TextInput placeholder="Kategori (Contoh: TUSPA)" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={communityForm.category} onChangeText={(t) => setCommunityForm({...communityForm, category: t})} />
          <TextInput placeholder="Nama Sekolah/Institusi" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={communityForm.label} onChangeText={(t) => setCommunityForm({...communityForm, label: t})} />
          <TextInput placeholder="Detail (Contoh: 30 Orang)" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={communityForm.detail} onChangeText={(t) => setCommunityForm({...communityForm, detail: t})} />
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowCommunityModal(false)} style={styles.modalBtn}><Text style={{ color: theme.text }}>Batal</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSaveCommunity} style={[styles.modalBtn, { backgroundColor: theme.accent }]}><Text style={{ color: '#fff' }}>Simpan</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={showPyramidModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{pyramidForm.id ? 'Kemaskini' : 'Tambah'} Pangkat Piramid</Text>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Nama Pangkat</Text>
          <TextInput placeholder="Cth: SK." style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={pyramidForm.rank} onChangeText={(t) => setPyramidForm({...pyramidForm, rank: t})} />
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Jumlah Anggota</Text>
          <TextInput placeholder="Jumlah" keyboardType="numeric" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={String(pyramidForm.total)} onChangeText={(t) => setPyramidForm({...pyramidForm, total: t})} />
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Urutan (1 = Paling Atas)</Text>
          <TextInput placeholder="Cth: 1" keyboardType="numeric" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={String(pyramidForm.display_order)} onChangeText={(t) => setPyramidForm({...pyramidForm, display_order: t})} />
          <View style={styles.modalActions}>
            {pyramidForm.id ? (
              <TouchableOpacity onPress={() => handleDeletePyramid(pyramidForm.id)} style={[styles.modalBtn, { backgroundColor: '#ef4444', marginRight: 'auto' }]}><Text style={{ color: '#fff' }}>Padam</Text></TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => setShowPyramidModal(false)} style={styles.modalBtn}><Text style={{ color: theme.text }}>Batal</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSavePyramid} style={[styles.modalBtn, { backgroundColor: theme.accent }]}><Text style={{ color: '#fff' }}>Simpan</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={showRankModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Kemaskini Rekod Pangkat</Text>
          <ScrollView showsVerticalScrollIndicator={false}>{['rank', 'lulus', 'kenaikan', 'kbp', 'ptb', 'aktif', 'simpanan'].map((key) => (
            <TextInput key={key} placeholder={key.toUpperCase()} style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={rankForm[key]} onChangeText={(text) => setRankForm({ ...rankForm, [key]: text })} />
          ))}</ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowRankModal(false)} style={styles.modalBtn}><Text style={{ color: theme.text }}>Batal</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSaveRank} style={[styles.modalBtn, { backgroundColor: theme.accent }]}><Text style={{ color: '#fff' }}>Simpan</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={showEmployeeDetailModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, maxWidth: 640, maxHeight: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 0 }]}>
                {certOnlyMode ? 'Sijil / Sertifikat' : (employeeForm.id ? 'Butiran Anggota' : 'Tambah Anggota')}
              </Text>
              {employeeForm.id && isEditing && !certOnlyMode ? (
                <TouchableOpacity
                  onPress={() => handleDeleteEmployee(employeeForm.id)}
                  style={{ padding: 6 }}
                >
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              ) : null}
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {!certOnlyMode ? (
                <View style={{ alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <View style={{
                    padding: 4, borderRadius: 60, borderWidth: 2, borderColor: theme.accent, marginBottom: 12
                  }}>
                    {employeeForm.photo_url ? (
                      <Image source={{ uri: employeeForm.photo_url }} style={styles.profilePhotoLarge} />
                    ) : (
                      <View style={[styles.profilePhotoLarge, styles.employeeAvatarPlaceholder]}>
                        <User size={40} color="#94a3b8" />
                      </View>
                    )}
                  </View>
                  <Text style={{ color: theme.text, fontSize: 19, fontWeight: '800' }}>{employeeForm.nama || 'Nama Baru'}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>{employeeForm.pangkat || '-'}</Text>
                  {employeeForm.status_keaktifan ? (
                    <View style={{
                      marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
                      backgroundColor: String(employeeForm.status_keaktifan).toUpperCase() === 'AKTIF' ? '#22c55e15' : '#f1f5f9'
                    }}>
                      <Text style={{
                        fontSize: 11, fontWeight: '700',
                        color: String(employeeForm.status_keaktifan).toUpperCase() === 'AKTIF' ? '#22c55e' : theme.textSecondary
                      }}>
                        {employeeForm.status_keaktifan}
                      </Text>
                    </View>
                  ) : null}
                  {isEditing ? (
                    <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto} style={{ marginTop: 12 }}>
                      <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 13 }}>
                        {uploadingPhoto ? 'Memuat naik...' : 'Tukar Foto'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16, textAlign: 'center', marginBottom: 15 }}>
                  {employeeForm.nama}
                </Text>
              )}

              {!certOnlyMode && !isEditing && !showFullDetail ? (
                <>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'No. IC', value: employeeForm.ic_no },
                      { label: 'No. Anggota', value: employeeForm.no_anggota },
                      { label: 'No. Telefon', value: employeeForm.contact },
                      { label: 'Jantina', value: employeeForm.jantina },
                    ].map((item) => (
                      <View key={item.label} style={{ flexBasis: '47%', backgroundColor: theme.background, padding: 12, borderRadius: 10 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 4 }}>{item.label}</Text>
                        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{item.value || '-'}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowFullDetail(true)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: theme.accent + '15', paddingVertical: 12, borderRadius: 10, marginBottom: 10
                    }}
                  >
                    <Text style={{ color: theme.accent, fontWeight: '700' }}>Lihat Semua Maklumat →</Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {!certOnlyMode && (isEditing || showFullDetail) ? (
                <>
                  <View style={{
                    flexDirection: 'row', backgroundColor: theme.background, borderRadius: 12,
                    padding: 4, marginBottom: 20
                  }}>
                    {EMPLOYEE_TABS.map((tab) => (
                      <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveEmployeeTab(tab)}
                        style={{
                          flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center',
                          backgroundColor: activeEmployeeTab === tab ? theme.card : 'transparent',
                          shadowColor: activeEmployeeTab === tab ? '#000' : 'transparent',
                          shadowOpacity: activeEmployeeTab === tab ? 0.08 : 0,
                          shadowRadius: 4, elevation: activeEmployeeTab === tab ? 2 : 0,
                        }}
                      >
                        <Text style={{
                          color: activeEmployeeTab === tab ? theme.accent : theme.textSecondary,
                          fontSize: 10.5, fontWeight: activeEmployeeTab === tab ? '800' : '600', textAlign: 'center'
                        }}>{tab}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {FIELD_GROUPS[activeEmployeeTab].map(renderField)}

                  {activeEmployeeTab === 'Kenaikan Pangkat' && promotionHistoryList.length > 0 ? (
                    <View style={{ marginTop: 15 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>
                        Sejarah Pasukan
                      </Text>
                      {promotionHistoryList.map((p) => (
                        <View key={p.id} style={[styles.certRow, { borderBottomColor: theme.border }]}>
                          <Text style={{ color: theme.text, fontSize: 13 }}>
                            Pasukan {p.pasukan_number}: {p.no_siri_watikah || '-'} | Kenaikan: {p.tarikh_kenaikan_pangkat || '-'} | Tamat: {p.tarikh_tamat_watikah || '-'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {!isEditing ? (
                    <TouchableOpacity onPress={() => setShowFullDetail(false)} style={{ marginTop: 15 }}>
                      <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>← Kembali ke ringkasan</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : null}
              {employeeForm.id ? (
                <View style={{ marginTop: 10 }}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Award size={18} color={theme.accent} />
                      <Text style={[styles.cardTitle, { color: theme.text, fontSize: 16, marginLeft: 8, marginBottom: 0 }]}>
                        Sijil / Sertifikat
                      </Text>
                    </View>
                    {isEditing ? (
                      <TouchableOpacity onPress={() => { setCertForm({ id: null, nom_certificat: '', google_drive_link: '' }); setShowCertModal(true); }}>
                        <Plus size={20} color={theme.accent} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {certificates.length === 0 ? (
                    <Text style={{ color: theme.textSecondary, fontSize: 13, fontStyle: 'italic' }}>Tiada sijil direkodkan.</Text>
                  ) : certificates.map((cert) => (
                    <View key={cert.id} style={[styles.certRow, { borderBottomColor: theme.border }]}>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                        onPress={() => openCertificateLink(cert.google_drive_link)}
                      >
                        <ExternalLink size={16} color={theme.accent} />
                        <Text style={{ color: theme.text, marginLeft: 10, fontWeight: '600' }}>{cert.nom_certificat}</Text>
                      </TouchableOpacity>
                      {isEditing ? (
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          <TouchableOpacity onPress={() => { setCertForm(cert); setShowCertModal(true); }}>
                            <Edit2 size={16} color="#22c55e" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteCertificate(cert.id)}>
                            <Trash2 size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowEmployeeDetailModal(false)} style={styles.modalBtn}>
                <Text style={{ color: theme.text }}>Tutup</Text>
              </TouchableOpacity>
              {isEditing && !certOnlyMode ? (
                <TouchableOpacity onPress={handleSaveEmployee} style={[styles.modalBtn, { backgroundColor: theme.accent }]}>
                  <Text style={{ color: '#fff' }}>Simpan</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showCertModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{certForm.id ? 'Kemaskini' : 'Tambah'} Sijil</Text>
            <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Nama Sijil</Text>
            <TextInput
              placeholder="Cth: Sijil Pertolongan Cemas"
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 15 }]}
              value={certForm.nom_certificat}
              onChangeText={(t) => setCertForm({ ...certForm, nom_certificat: t })}
            />
            <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Pautan Google Drive</Text>
            <TextInput
              placeholder="https://drive.google.com/..."
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
              value={certForm.google_drive_link}
              onChangeText={(t) => setCertForm({ ...certForm, google_drive_link: t })}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowCertModal(false)} style={styles.modalBtn}>
                <Text style={{ color: theme.text }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveCertificate} style={[styles.modalBtn, { backgroundColor: theme.accent }]}>
                <Text style={{ color: '#fff' }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    <ExcelImportModal
        visible={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        theme={theme}
        importHook={excelImportHook}
        onImportComplete={fetchEmployees}
      />

    <Modal visible={showCategoryEmployeesModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 0 }]}>
                {selectedCategoryName} ({categoryFilteredEmployees.length})
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryEmployeesModal(false)}>
                <X size={22} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {paginatedCategoryEmployees.map((emp) => (
                <TouchableOpacity
                  key={emp.id}
                  style={[styles.employeeRow, { borderBottomColor: theme.border }]}
                  onPress={() => { setShowCategoryEmployeesModal(false); openEmployeeDetail(emp); }}
                >
                  {emp.photo_url ? (
                    <Image source={{ uri: emp.photo_url }} style={styles.employeeAvatar} />
                  ) : (
                    <View style={[styles.employeeAvatar, styles.employeeAvatarPlaceholder]}>
                      <User size={20} color="#94a3b8" />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>{emp.nama}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{emp.pangkat}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, gap: 15 }}>
              <TouchableOpacity
                disabled={categoryEmployeesPage === 1}
                onPress={() => setCategoryEmployeesPage((p) => Math.max(1, p - 1))}
                style={{ opacity: categoryEmployeesPage === 1 ? 0.3 : 1, padding: 8 }}
              >
                <Text style={{ color: theme.accent, fontWeight: '700' }}>← Sebelum</Text>
              </TouchableOpacity>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                Muka {categoryEmployeesPage} / {totalCategoryPages}
              </Text>
              <TouchableOpacity
                disabled={categoryEmployeesPage === totalCategoryPages}
                onPress={() => setCategoryEmployeesPage((p) => Math.min(totalCategoryPages, p + 1))}
                style={{ opacity: categoryEmployeesPage === totalCategoryPages ? 0.3 : 1, padding: 8 }}
              >
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Seterusnya →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const StatusBox = ({ label, value, color, theme }) => (
  <View style={[styles.statusBox, { backgroundColor: theme.background }]}>
    <Text style={[styles.statusValue, { color }]}>{value}</Text>
    <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 40, paddingTop: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10, paddingTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: 'bold' },
  contentGrid: { gap: 24 },
  row: { flexDirection: 'row', gap: 24 },
  card: { padding: 28, borderRadius: 24, elevation: 2, position: 'relative' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 20, fontWeight: '800' },
  editBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#22c55e', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 4 }, // Updated to green
  bigNumber: { fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  activeBadge: { backgroundColor: '#22c55e15', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
  barChartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 100, marginTop: 10 },
  bar: { width: 22, borderRadius: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  genderContainer: { flex: 1, justifyContent: 'center', gap: 20 },
  genderRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  genderIconCircle: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center' },
  genderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  genderLabel: { fontSize: 14, fontWeight: '700' },
  genderValue: { fontSize: 14, fontWeight: '800' },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statusGrid: { flexDirection: 'row', gap: 15 },
  statusBox: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center' },
  statusValue: { fontSize: 24, fontWeight: '900' },
  statusLabel: { fontSize: 11, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addInlineBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  addInlineBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 12, width: 220, height: 40 },
  searchInput: { marginLeft: 10, fontSize: 13, fontWeight: '600', flex: 1 },
  table: { borderTopWidth: 1, borderLeftWidth: 1, minWidth: 700 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, alignItems: 'center' },
  tableHeaderCell: { flex: 1, padding: 12, fontSize: 10, fontWeight: '900', borderRightWidth: 1, textAlign: 'center' },
  tableCell: { flex: 1, padding: 12, fontSize: 11, borderRightWidth: 1, textAlign: 'center' },
  communityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  programBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, justifyContent: 'center', alignItems: 'center', width: 70 },
  programBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  pyramidTier: { height: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8, borderRadius: 12 },
  employeeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  employeeAvatar: { width: 44, height: 44, borderRadius: 22 },
  employeeAvatarPlaceholder: { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  employeeStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  profilePhotoLarge: { width: 100, height: 100, borderRadius: 50 },
  lihatSijilBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f0f4ff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 500, padding: 24, borderRadius: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  modalInput: { borderWidth: 1, padding: 12, borderRadius: 10, fontSize: 14, borderColor: '#ccc' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }
});