import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, Text, useWindowDimensions, Alert, Platform, Linking, TouchableOpacity } from 'react-native';
import { CheckCircle2, XCircle, Users } from 'lucide-react-native';
import { PALETTE } from '../constants/palette';
import { supabaseSandbox } from '../supabaseSandboxClient';
import AdminEditButton from '../components/AdminEditButton';
import { useExcelImport } from '../hooks/useExcelImport';
import ExcelImportModal from '../components/ExcelImportModal';
import { useAngkatanEmployees, mapMyaspaLabel, normalizePangkat, isEligibleForPromotion, isEligibleForPegawaiWaranII, PANGKAT_HIERARCHY } from '../hooks/useAngkatanEmployees';
import { useAngkatanCommunity, SCHOOL_CATEGORIES, CDA_CATEGORIES } from '../hooks/useAngkatanCommunity';
import { useEmployeeCertificates } from '../hooks/useEmployeeCertificates';
import { useEmployeePromotionHistory } from '../hooks/useEmployeePromotionHistory';
// useEmployeePhoto retiré — fonctionnalité photo employé abandonnée
import { angkatanStyles as styles } from './angkatan/angkatanStyles';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';
import { emptyEmployeeForm } from './angkatan/employeeFieldGroups';
import { useUnitStaff } from '../hooks/useUnitStaff';
import AngkatanUnitSection from './angkatan/AngkatanUnitSection';
import { useAngkatanBudget } from '../hooks/useAngkatanBudget';
import BudgetSection from './kewangan/BudgetSection';
import { useAngkatanPameran } from '../hooks/useAngkatanPameran';
import PameranTable from './angkatan/PameranTable';
import { useKpi } from '../hooks/useKpi';
import { canEditSection } from '../permissions';
import KpiSection from './pentadbiran/KpiSection';

import SummaryHeroCard from './angkatan/SummaryHeroCard';
import StatusCard from './angkatan/StatusCard';
import CategoriesCard from './angkatan/CategoriesCard';
import GenderCard from './angkatan/GenderCard';
import RanksTable from './angkatan/RanksTable';
import CommunityList from './angkatan/CommunityList';
import PyramidChart from './angkatan/PyramidChart';
import EmployeesListCard from './angkatan/EmployeesListCard';
import EmployeeDetailModal from './angkatan/EmployeeDetailModal';
import FilteredEmployeeListModal from './angkatan/FilteredEmployeeListModal';
import SummaryEditModal from './angkatan/SummaryEditModal';
import CategoryEditModal from './angkatan/CategoryEditModal';
import RankEditModal from './angkatan/RankEditModal';
import CommunityEditModal from './angkatan/CommunityEditModal';
import PyramidEditModal from './angkatan/PyramidEditModal';

const EMPLOYEES_PER_PAGE = 10;

export default function AngkatanScreen({ userRole }) {
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = canEditSection(userRole, 'Angkatan');
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  const {
    loading, employees, summary, categories, pyramidStats, ranks, dataUpdatedAt,
    fetchEmployees, saveEmployee, deleteEmployee,
    saveCategory, deleteCategoryItem, savePyramidItem, deletePyramidItem, saveRankItem, deleteRankItem,
    saveSummaryExtra,
  } = useAngkatanEmployees();
  const { communityProgs, saveCommunityItem, deleteCommunityItem, communityUpdatedAt } = useAngkatanCommunity();
  const { certificates, fetchCertificates, saveCertificate, deleteCertificate, openCertificateLink } = useEmployeeCertificates();
  const { promotionHistoryList, fetchPromotionHistory } = useEmployeePromotionHistory();
  // photo employé retirée
  const excelImportHook = useExcelImport();
  const unit = useUnitStaff('angkatan');
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi, kpiUpdatedAt } = useKpi('angkatan');
  const angkatanBudget = useAngkatanBudget();
  const angkatanPameran = useAngkatanPameran();

  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);
  const showNotification = (type, message) => {
    setNotification({ type, message });
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 3000);
  };
  useEffect(() => () => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
  }, []);

  const [pyramidFormError, setPyramidFormError] = useState(null);
  const [isSavingPyramid, setIsSavingPyramid] = useState(false);

  // Convertit un timestamp ISO (colonne updated_at) au format d'affichage DD/M/YYYY HH:MM
  const formatTimestamp = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${date} ${hours}:${minutes}`;
  };

  // DIKEMASKINI = le plus récent updated_at parmi toutes les tables qui composent la page
  const latestRaw = [dataUpdatedAt, communityUpdatedAt, unit.staffUpdatedAt, kpiUpdatedAt, angkatanBudget.budgetUpdatedAt, angkatanPameran.pameranUpdatedAt].filter(Boolean).sort().slice(-1)[0] || null;
  const dikemaskini = formatTimestamp(latestRaw);

  // ── Recherche / pagination liste principale ──
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const filteredEmployees = employees
    .filter((emp) => emp.nama.toLowerCase().includes(employeeSearch.toLowerCase()))
    .slice()
    .sort((a, b) => {
      const idxA = PANGKAT_HIERARCHY.findIndex((p) => normalizePangkat(p) === normalizePangkat(a.pangkat));
      const idxB = PANGKAT_HIERARCHY.findIndex((p) => normalizePangkat(p) === normalizePangkat(b.pangkat));
      const rankA = idxA === -1 ? PANGKAT_HIERARCHY.length : idxA;
      const rankB = idxB === -1 ? PANGKAT_HIERARCHY.length : idxB;
      return rankA - rankB;
    });
  const totalEmployeePages = Math.max(1, Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE));
  const paginatedEmployees = filteredEmployees.slice((employeePage - 1) * EMPLOYEES_PER_PAGE, employeePage * EMPLOYEES_PER_PAGE);

  // ── Modal détail employé ──
  const [showEmployeeDetailModal, setShowEmployeeDetailModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm());
  const [certOnlyMode, setCertOnlyMode] = useState(false);

  // Le ScrollView principal (table/cards en arrière-plan) revient en haut tout
  // seul quand le Modal se ferme (comportement du <Modal> de react-native-web,
  // pas le nôtre) — on retient la position de scroll et on la réapplique juste
  // après la fermeture plutôt que d'essayer d'empêcher le saut lui-même.
  const mainScrollRef = useRef(null);
  const scrollYRef = useRef(0);
  const closeEmployeeDetailModal = () => {
    setShowEmployeeDetailModal(false);
    // Le <Modal> de react-native-web remet le scroll en haut de façon asynchrone
    // (timing pas garanti par rapport à notre propre callback) — on réapplique
    // la position sur plusieurs frames pendant ~300ms pour gagner la course,
    // peu importe l'ordre dans lequel les deux resets se déclenchent.
    const targetY = scrollYRef.current;
    const deadline = Date.now() + 300;
    const reassert = () => {
      mainScrollRef.current?.scrollTo({ y: targetY, animated: false });
      if (Date.now() < deadline) requestAnimationFrame(reassert);
    };
    requestAnimationFrame(reassert);
  };

  const openEmployeeDetail = (emp) => {
    setEmployeeForm({ ...emptyEmployeeForm(), ...emp });
    setCertOnlyMode(false);
    fetchCertificates(emp.id);
    fetchPromotionHistory(emp.id);
    setShowEmployeeDetailModal(true);
  };
  const openCertificatesOnly = (emp) => {
    setEmployeeForm({ ...emp });
    setCertOnlyMode(true);
    fetchCertificates(emp.id);
    setShowEmployeeDetailModal(true);
  };
  const openAddEmployee = () => {
    setEmployeeForm(emptyEmployeeForm());
    setCertOnlyMode(false);
    setShowEmployeeDetailModal(true);
  };
  const handleSaveEmployee = async () => {
    const ok = await saveEmployee(employeeForm);
    if (ok) closeEmployeeDetailModal();
  };
  const handleDeleteEmployee = async (id) => {
    const ok = await deleteEmployee(id);
    if (ok) closeEmployeeDetailModal();
  };

  const handleDownloadLatestImport = async () => {
    const { data, error } = await supabaseSandbox.storage
      .from('angkatan-imports')
      .createSignedUrl('data_keseluruhan_anggota_daerah.xlsx', 60);
    if (error || !data?.signedUrl) {
      Alert.alert('Ralat', 'Gagal menjana pautan muat turun.');
      return;
    }
    if (Platform.OS === 'web') window.open(data.signedUrl, '_blank');
    else Linking.openURL(data.signedUrl);
  };
  const handleSaveCertificate = async (certForm) => {
    return await saveCertificate(employeeForm.id, certForm);
  };
  const handleDeleteCertificate = async (id) => {
    return await deleteCertificate(id, employeeForm.id);
  };

  // ── Modal "Résumé" ──
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryForm, setSummaryForm] = useState({});
  const openSummaryModal = () => { setSummaryForm(summary); setShowSummaryModal(true); };
  const handleSaveSummary = async () => {
    const ok = await saveSummaryExtra(summaryForm);
    if (ok) setShowSummaryModal(false);
  };

  // ── Modal Catégorie ──
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '', count: '', color: '#1D4E89' });
  const openAddCategory = () => { setCategoryForm({ id: null, name: '', count: '', color: '#1D4E89' }); setShowCategoryModal(true); };
  const openEditCategory = (cat) => { setCategoryForm({ ...cat, count: String(cat.count) }); setShowCategoryModal(true); };
  const handleSaveCategory = async () => { await saveCategory(categoryForm); setShowCategoryModal(false); };
  const handleDeleteCategory = async (id) => { await deleteCategoryItem(id); };

  // ── Modal Rang ──
  const [showRankModal, setShowRankModal] = useState(false);
  const [rankForm, setRankForm] = useState({ id: null, rank: '', lulus: '', kenaikan: '', kbp: '', ptb: '', aktif: '', simpanan: '' });
  const openAddRank = () => { setRankForm({ id: null, rank: '', lulus: '', kenaikan: '', kbp: '', ptb: '', aktif: '', simpanan: '' }); setShowRankModal(true); };
  const openEditRank = (item) => {
    setRankForm({ ...item, lulus: String(item.lulus), kenaikan: String(item.kenaikan), kbp: String(item.kbp), ptb: String(item.ptb), aktif: String(item.aktif), simpanan: String(item.simpanan) });
    setShowRankModal(true);
  };
  const handleSaveRank = async () => { await saveRankItem(rankForm); setShowRankModal(false); };
  const handleDeleteRank = async (id) => { await deleteRankItem(id); };

  // ── Modal Communauté ──
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [communityForm, setCommunityForm] = useState({ id: null, category: '', tempat: '', detail: '' });
  const [communityFormError, setCommunityFormError] = useState(null);
  const [isSavingCommunity, setIsSavingCommunity] = useState(false);
  const openAddCommunity = (defaultCategory = '') => { setCommunityForm({ id: null, category: defaultCategory, tempat: '', detail: '' }); setCommunityFormError(null); setShowCommunityModal(true); };
  const openEditCommunity = (prog) => { setCommunityForm(prog); setCommunityFormError(null); setShowCommunityModal(true); };
  const handleSaveCommunity = async () => {
    const isSchool = SCHOOL_CATEGORIES.includes(communityForm.category);
    const isCda = CDA_CATEGORIES.includes(communityForm.category);
    if (!communityForm.category.trim()) {
      setCommunityFormError('Kategori tidak boleh kosong.');
      return;
    }
    if (isSchool) {
      if (!communityForm.nama_sekolah?.trim() || !communityForm.no_pendaftaran?.trim() || !communityForm.tarikh_penubuhan?.trim()) {
        setCommunityFormError('Nama sekolah, nombor pendaftaran dan tarikh penubuhan tidak boleh kosong.');
        return;
      }
    } else if (isCda) {
      if (!communityForm.kod_cda?.trim() || !communityForm.no_pendaftaran?.trim() || !communityForm.nama_pasukan?.trim()
        || !communityForm.tempoh_sah_penubuhan?.trim() || !communityForm.tarikh_berdaftar?.trim()) {
        setCommunityFormError('Kod CDA, nombor pendaftaran, nama pasukan, tempoh sah penubuhan dan tarikh berdaftar tidak boleh kosong.');
        return;
      }
    } else if (!communityForm.tempat.trim() || !communityForm.detail.trim()) {
      setCommunityFormError('Tempat dan keterangan tidak boleh kosong.');
      return;
    }
    setCommunityFormError(null);
    setIsSavingCommunity(true);
    const ok = await saveCommunityItem(communityForm);
    setIsSavingCommunity(false);
    if (ok) {
      setShowCommunityModal(false);
      showNotification('success', communityForm.id ? 'Program berjaya dikemaskini.' : 'Program berjaya ditambah.');
    } else {
      showNotification('error', 'Gagal menyimpan program.');
    }
  };
  const handleDeleteCommunity = async (id) => {
    const ok = await deleteCommunityItem(id);
    showNotification(ok ? 'success' : 'error', ok ? 'Program berjaya dipadam.' : 'Gagal memadam program.');
  };

  // ── Modal Pyramide ──
  const [showPyramidModal, setShowPyramidModal] = useState(false);
  const [pyramidForm, setPyramidForm] = useState({ id: null, rank: '', total: '', color: '#123456', display_order: '' });
  const openAddPyramid = () => { setPyramidForm({ id: null, rank: '', total: '', color: '#123456', display_order: '' }); setPyramidFormError(null); setShowPyramidModal(true); };
  const openEditPyramid = (item) => { setPyramidForm({ ...item, total: String(item.total), display_order: String(item.display_order) }); setPyramidFormError(null); setShowPyramidModal(true); };
  const handleSavePyramid = async () => {
    if (!pyramidForm.rank.trim() || !String(pyramidForm.total).trim()) {
      setPyramidFormError('Pangkat dan jumlah tidak boleh kosong.');
      return;
    }
    setPyramidFormError(null);
    setIsSavingPyramid(true);
    const ok = await savePyramidItem(pyramidForm);
    setIsSavingPyramid(false);
    if (ok) {
      setShowPyramidModal(false);
      showNotification('success', pyramidForm.id ? 'Struktur pangkat berjaya dikemaskini.' : 'Struktur pangkat berjaya ditambah.');
    } else {
      showNotification('error', 'Gagal menyimpan struktur pangkat.');
    }
  };

  // ── Import Excel ──
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [communitySubTab, setCommunitySubTab] = useState('pasukan');

  // ── Modal liste filtrée (catégorie ou statut) ──
  const [filterModal, setFilterModal] = useState({ visible: false, title: '', list: [], page: 1 });
  const openCategoryEmployees = (categoryName) => {
    const list = employees.filter((e) => mapMyaspaLabel(e.status_myaspa)?.toUpperCase() === categoryName.toUpperCase());
    setFilterModal({ visible: true, title: categoryName, list, page: 1 });
  };
  const openStatusEmployees = (statusValue, label) => {
    const list = employees.filter((e) => String(e.status_keaktifan || '').trim().toUpperCase() === statusValue);
    setFilterModal({ visible: true, title: label, list, page: 1 });
  };
  const openRankEmployees = (rankLabel) => {
    const list = employees.filter((e) => {
      if (normalizePangkat(e.pangkat) !== normalizePangkat(rankLabel)) return false;
      const st = String(e.status_keaktifan || '').trim().toUpperCase();
      return st === 'AKTIF' || st === 'SIMPANAN';
    });
    setFilterModal({ visible: true, title: rankLabel, list, page: 1 });
  };
  const openPromotionEligibleEmployees = (rankLabel) => {
    // Même règle que la colonne LAYAK UBKP : ce sont les employés du rang
    // JUSTE EN DESSOUS de rankLabel qui sont éligibles à monter DANS rankLabel.
    // Pegawai Waran II a sa propre règle dédiée (basée sur les Sarjan).
    let list;
    if (normalizePangkat(rankLabel) === normalizePangkat('Pegawai Waran II')) {
      list = employees.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat('Sarjan') && isEligibleForPegawaiWaranII(e));
    } else {
      const rankIdx = PANGKAT_HIERARCHY.findIndex((p) => normalizePangkat(p) === normalizePangkat(rankLabel));
      const lowerRank = rankIdx > -1 && rankIdx + 1 < PANGKAT_HIERARCHY.length ? PANGKAT_HIERARCHY[rankIdx + 1] : undefined;
      list = lowerRank
        ? employees.filter((e) => normalizePangkat(e.pangkat) === normalizePangkat(lowerRank) && isEligibleForPromotion(e, lowerRank))
        : [];
    }
    setFilterModal({ visible: true, title: `Layak Kenaikan Pangkat — ${rankLabel}`, list, page: 1 });
  };
  const FILTER_PER_PAGE = 10;
  const filterTotalPages = Math.max(1, Math.ceil(filterModal.list.length / FILTER_PER_PAGE));
  const filterPageItems = filterModal.list.slice((filterModal.page - 1) * FILTER_PER_PAGE, filterModal.page * FILTER_PER_PAGE);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PALETTE.orange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {canEdit && (
        <View style={stickyHeaderStyles.stickyHeader}>
          <View style={[stickyHeaderStyles.stickyHeaderCenter, { pointerEvents: 'none' }]}>
            {dikemaskini ? (
              <View style={stickyHeaderStyles.stickyHeaderDikemaskiniBadge}>
                <View style={stickyHeaderStyles.stickyHeaderDikemaskiniDot} />
                <Text style={stickyHeaderStyles.stickyHeaderDikemaskini}>DIKEMASKINI {dikemaskini}</Text>
              </View>
            ) : null}
          </View>
          <AdminEditButton isEditMode={isEditing} setIsEditMode={setIsEditing} userRole={userRole} section="Angkatan" />

          {notification && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                alignItems: 'center', paddingTop: 10, zIndex: 30,
              }}
            >
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '92%',
                  backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  borderWidth: 1,
                  borderColor: notification.type === 'success' ? '#bbf7d0' : '#fecaca',
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                {notification.type === 'success' ? (
                  <CheckCircle2 size={17} color="#16a34a" />
                ) : (
                  <XCircle size={17} color="#dc2626" />
                )}
                <Text
                  style={{
                    color: notification.type === 'success' ? '#166534' : '#991b1b',
                    fontWeight: '700', fontSize: 13, flexShrink: 1,
                  }}
                >
                  {notification.message}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <ScrollView
        ref={mainScrollRef}
        contentContainerStyle={styles.contentGrid}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        {isMobile ? (
          <View style={{ gap: 16 }}>
            <SummaryHeroCard total={summary.total_anggota} />
            <StatusCard summary={summary} onOpenStatus={openStatusEmployees} fill={false} />
            <CategoriesCard
              categories={categories}
              isEditing={isEditing}
              onEdit={openEditCategory}
              onDelete={handleDeleteCategory}
              onOpenCategory={openCategoryEmployees}
              fill={false}
            />
            <GenderCard summary={summary} fill={false} />
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <SummaryHeroCard total={summary.total_anggota} />
              <StatusCard summary={summary} isEditing={isEditing} onEdit={openSummaryModal} onOpenStatus={openStatusEmployees} />
            </View>
            <View style={styles.row}>
              <CategoriesCard
                categories={categories}
                isEditing={isEditing}
                onAdd={openAddCategory}
                onEdit={openEditCategory}
                onDelete={handleDeleteCategory}
                onOpenCategory={openCategoryEmployees}
              />
              <GenderCard summary={summary} isEditing={isEditing} onEdit={openSummaryModal} />
            </View>
          </>
        )}

        {/* ---- KPI ---- */}
        <View style={{ marginBottom: -16 }}>
          <KpiSection
            kpiItems={kpiList}
            isEditing={isEditing}
            updateKpiItem={(form, item) => saveKpiItem(form, item)}
            addKpiItem={(form) => saveKpiItem(form, null)}
            removeKpiItem={(item) => deleteKpiItem(item)}
            persistKpi={reorderKpi}
            showSubSeksyen={false}
          />
        </View>

        <View style={{ marginBottom: -16 }}>
          <BudgetSection
            budgetData={angkatanBudget.budgetData}
            loading={angkatanBudget.loading}
            isEditMode={isEditing}
            saveBudgetItem={angkatanBudget.saveBudgetItem}
            deleteBudgetItem={angkatanBudget.deleteBudgetItem}
            deleteCategory={angkatanBudget.deleteCategory}
            renameCategory={angkatanBudget.renameCategory}
            onNotify={showNotification}
          />
        </View>

        <RanksTable ranks={ranks} isEditing={isEditing} onAdd={openAddRank} onEdit={openEditRank} onDelete={handleDeleteRank} onOpenRank={openRankEmployees} onOpenPromotion={openPromotionEligibleEmployees} />

        <PameranTable
          pameranList={angkatanPameran.pameranList}
          isEditing={isEditing}
          savePameranItem={angkatanPameran.savePameranItem}
          deletePameranItem={angkatanPameran.deletePameranItem}
          onNotify={showNotification}
        />

        <CommunityList
          communityProgs={communityProgs}
          isEditing={isEditing}
          onAdd={openAddCommunity}
          onEdit={openEditCommunity}
          onDelete={handleDeleteCommunity}
        />

        <View style={{ flexDirection: 'row', margin: 0, padding: 6, borderRadius: 16, backgroundColor: PALETTE.cardLight, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, gap: 8 }}>
          {[
            { key: 'pasukan', label: 'Pasukan', Icon: Users },
            { key: 'pkpb', label: 'PKPB', Icon: Users },
          ].map(({ key, label, Icon }) => {
            const isActive = communitySubTab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setCommunitySubTab(key)}
                activeOpacity={0.8}
                style={[
                  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: PALETTE.cardLightBorder },
                  isActive && { backgroundColor: PALETTE.orange, borderColor: PALETTE.orange },
                ]}
              >
                <Icon size={16} color={isActive ? '#fff' : PALETTE.textMutedDark} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: isActive ? '#fff' : PALETTE.textMutedDark }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {communitySubTab === 'pasukan' ? (
          <>
            <PyramidChart pyramidStats={pyramidStats} isEditing={isEditing} onAdd={openAddPyramid} onEdit={openEditPyramid} onDelete={deletePyramidItem} onNotify={showNotification} />

            <EmployeesListCard
              paginatedEmployees={paginatedEmployees}
              filteredCount={filteredEmployees.length}
              employeeSearch={employeeSearch}
              setEmployeeSearch={setEmployeeSearch}
              employeePage={employeePage}
              setEmployeePage={setEmployeePage}
              totalEmployeePages={totalEmployeePages}
              isEditing={isEditing}
              onOpenDetail={openEmployeeDetail}
              onOpenCertificates={openCertificatesOnly}
              onAddNew={openAddEmployee}
              onImportExcel={() => setShowExcelImportModal(true)}
              onDeleteEmployee={handleDeleteEmployee}
              canViewLatestImport={canEdit}
              latestImportFilename={summary.latest_import_filename}
              latestImportAt={summary.latest_import_at}
              onDownloadLatestImport={handleDownloadLatestImport}
            />
          </>
        ) : (
          <View style={styles.card}>
            <Text style={{ color: PALETTE.textMutedDark, fontSize: 13, fontWeight: '600', textAlign: 'center', paddingVertical: 30 }}>
              Belum tersedia
            </Text>
          </View>
        )}
        <AngkatanUnitSection
          unitList={unit.staffList}
          loadingUnit={unit.loading}
          isEditMode={isEditing}
          saveUnitItem={unit.saveStaffItem}
          deleteUnitItem={unit.deleteStaffItem}
          reorderUnit={unit.reorderStaff}
        />
      </ScrollView>

      <EmployeeDetailModal
        visible={showEmployeeDetailModal}
        onClose={closeEmployeeDetailModal}
        employeeForm={employeeForm}
        setEmployeeForm={setEmployeeForm}
        isEditing={isEditing}
        userRole={userRole}
        certOnlyMode={certOnlyMode}
        certificates={certificates}
        promotionHistoryList={promotionHistoryList}
        onSaveCertificate={handleSaveCertificate}
        onDeleteCertificate={handleDeleteCertificate}
        onOpenCertLink={openCertificateLink}
        onSaveEmployee={handleSaveEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onNotify={showNotification}
      />

      <FilteredEmployeeListModal
        visible={filterModal.visible}
        title={filterModal.title}
        totalCount={filterModal.list.length}
        employees={filterPageItems}
        page={filterModal.page}
        setPage={(updater) => setFilterModal((prev) => ({ ...prev, page: typeof updater === 'function' ? updater(prev.page) : updater }))}
        totalPages={filterTotalPages}
        onClose={() => setFilterModal((prev) => ({ ...prev, visible: false }))}
        onSelectEmployee={(emp) => {
          setFilterModal((prev) => ({ ...prev, visible: false }));
          openEmployeeDetail(emp);
        }}
      />

      <SummaryEditModal
        visible={showSummaryModal}
        summaryForm={summaryForm}
        setSummaryForm={setSummaryForm}
        onSave={handleSaveSummary}
        onClose={() => setShowSummaryModal(false)}
      />
      <CategoryEditModal
        visible={showCategoryModal}
        isNew={!categoryForm.id}
        categoryForm={categoryForm}
        setCategoryForm={setCategoryForm}
        onSave={handleSaveCategory}
        onClose={() => setShowCategoryModal(false)}
      />
      <RankEditModal
        visible={showRankModal}
        rankForm={rankForm}
        setRankForm={setRankForm}
        onSave={handleSaveRank}
        onClose={() => setShowRankModal(false)}
      />
      <CommunityEditModal
        visible={showCommunityModal}
        isNew={!communityForm.id}
        communityForm={communityForm}
        setCommunityForm={setCommunityForm}
        onSave={handleSaveCommunity}
        onClose={() => setShowCommunityModal(false)}
        error={communityFormError}
        isSaving={isSavingCommunity}
      />
      <PyramidEditModal
        visible={showPyramidModal}
        isNew={!pyramidForm.id}
        pyramidForm={pyramidForm}
        setPyramidForm={setPyramidForm}
        onSave={handleSavePyramid}
        onClose={() => setShowPyramidModal(false)}
        error={pyramidFormError}
        isSaving={isSavingPyramid}
      />

      <ExcelImportModal
        visible={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        importHook={excelImportHook}
        onImportComplete={fetchEmployees}
        onSaveImportMeta={saveSummaryExtra}
      />
    </View>
  );
}