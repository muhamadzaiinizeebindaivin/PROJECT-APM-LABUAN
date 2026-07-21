import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { PALETTE } from '../constants/palette';
import AdminEditButton from '../components/AdminEditButton';
import { useExcelImport } from '../hooks/useExcelImport';
import ExcelImportModal from '../components/ExcelImportModal';
import { useAngkatanEmployees, mapMyaspaLabel } from '../hooks/useAngkatanEmployees';
import { useAngkatanCommunity } from '../hooks/useAngkatanCommunity';
import { useEmployeeCertificates } from '../hooks/useEmployeeCertificates';
import { useEmployeePromotionHistory } from '../hooks/useEmployeePromotionHistory';
import { useEmployeePhoto } from '../hooks/useEmployeePhoto';
import { angkatanStyles as styles } from './angkatan/angkatanStyles';
import { emptyEmployeeForm } from './angkatan/employeeFieldGroups';
import { useAngkatanUnit } from '../hooks/useAngkatanUnit';
import AngkatanUnitSection from './angkatan/AngkatanUnitSection';
import { useKpi } from '../hooks/useKpi';
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

  const {
    loading, employees, summary, categories, pyramidStats, ranks,
    fetchEmployees, saveEmployee, deleteEmployee,
    saveCategory, deleteCategoryItem, savePyramidItem, deletePyramidItem, saveRankItem, deleteRankItem,
    saveSummaryExtra,
  } = useAngkatanEmployees();
  const { communityProgs, saveCommunityItem, deleteCommunityItem } = useAngkatanCommunity();
  const { certificates, fetchCertificates, saveCertificate, deleteCertificate, openCertificateLink } = useEmployeeCertificates();
  const { promotionHistoryList, fetchPromotionHistory } = useEmployeePromotionHistory();
  const { uploadingPhoto, pickAndUploadPhoto } = useEmployeePhoto();
  const excelImportHook = useExcelImport();
  const { unitList, loadingUnit, saveUnitItem, deleteUnitItem, reorderUnit } = useAngkatanUnit();
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi } = useKpi('angkatan');

  // ── Recherche / pagination liste principale ──
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const filteredEmployees = employees.filter((emp) => emp.nama.toLowerCase().includes(employeeSearch.toLowerCase()));
  const totalEmployeePages = Math.max(1, Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE));
  const paginatedEmployees = filteredEmployees.slice((employeePage - 1) * EMPLOYEES_PER_PAGE, employeePage * EMPLOYEES_PER_PAGE);

  // ── Modal détail employé ──
  const [showEmployeeDetailModal, setShowEmployeeDetailModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm());
  const [certOnlyMode, setCertOnlyMode] = useState(false);

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
    if (ok) setShowEmployeeDetailModal(false);
  };
  const handleDeleteEmployee = async (id) => {
    const ok = await deleteEmployee(id);
    if (ok) setShowEmployeeDetailModal(false);
  };
  const handleSaveCertificate = async (certForm) => {
    await saveCertificate(employeeForm.id, certForm);
  };
  const handleDeleteCertificate = async (id, employeeId) => {
    await deleteCertificate(id, employeeId);
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
  const [communityForm, setCommunityForm] = useState({ id: null, category: '', label: '', detail: '', color: '#1D4E89' });
  const openAddCommunity = () => { setCommunityForm({ id: null, category: '', label: '', detail: '', color: '#1D4E89' }); setShowCommunityModal(true); };
  const openEditCommunity = (prog) => { setCommunityForm(prog); setShowCommunityModal(true); };
  const handleSaveCommunity = async () => { await saveCommunityItem(communityForm); setShowCommunityModal(false); };
  const handleDeleteCommunity = async (id) => { await deleteCommunityItem(id); };

  // ── Modal Pyramide ──
  const [showPyramidModal, setShowPyramidModal] = useState(false);
  const [pyramidForm, setPyramidForm] = useState({ id: null, rank: '', total: '', color: '#123456', display_order: '' });
  const openAddPyramid = () => { setPyramidForm({ id: null, rank: '', total: '', color: '#123456', display_order: '' }); setShowPyramidModal(true); };
  const openEditPyramid = (item) => { setPyramidForm({ ...item, total: String(item.total), display_order: String(item.display_order) }); setShowPyramidModal(true); };
  const handleSavePyramid = async () => { await savePyramidItem(pyramidForm); setShowPyramidModal(false); };

  // ── Import Excel ──
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);

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
      <ScrollView contentContainerStyle={styles.contentGrid} showsVerticalScrollIndicator={false}>
        <AdminEditButton isEditMode={isEditing} setIsEditMode={setIsEditing} userRole={userRole} />

        <View style={styles.row}>
          <SummaryHeroCard total={summary.total_anggota} isEditing={isEditing} onEdit={openSummaryModal} />
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

        <RanksTable ranks={ranks} isEditing={isEditing} onAdd={openAddRank} onEdit={openEditRank} onDelete={handleDeleteRank} />

        <CommunityList
          communityProgs={communityProgs}
          isEditing={isEditing}
          onAdd={openAddCommunity}
          onEdit={openEditCommunity}
          onDelete={handleDeleteCommunity}
        />

        <PyramidChart pyramidStats={pyramidStats} isEditing={isEditing} onAdd={openAddPyramid} onEdit={openEditPyramid} />

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
        />
        <View style={{ height: 16 }} />
        <AngkatanUnitSection
          unitList={unitList}
          loadingUnit={loadingUnit}
          isEditMode={isEditing}
          saveUnitItem={saveUnitItem}
          deleteUnitItem={deleteUnitItem}
          reorderUnit={reorderUnit}
        />
      </ScrollView>

      <EmployeeDetailModal
        visible={showEmployeeDetailModal}
        onClose={() => setShowEmployeeDetailModal(false)}
        employeeForm={employeeForm}
        setEmployeeForm={setEmployeeForm}
        isEditing={isEditing}
        certOnlyMode={certOnlyMode}
        certificates={certificates}
        promotionHistoryList={promotionHistoryList}
        onSaveCertificate={handleSaveCertificate}
        onDeleteCertificate={handleDeleteCertificate}
        onOpenCertLink={openCertificateLink}
        uploadingPhoto={uploadingPhoto}
        onPickPhoto={pickAndUploadPhoto}
        onSaveEmployee={handleSaveEmployee}
        onDeleteEmployee={handleDeleteEmployee}
      />

      <FilteredEmployeeListModal
        visible={filterModal.visible}
        title={filterModal.title}
        employees={filterPageItems}
        page={filterModal.page}
        setPage={(updater) => setFilterModal((prev) => ({ ...prev, page: typeof updater === 'function' ? updater(prev.page) : updater }))}
        totalPages={filterTotalPages}
        onClose={() => setFilterModal({ visible: false, title: '', list: [], page: 1 })}
        onSelectEmployee={(emp) => {
          setFilterModal({ visible: false, title: '', list: [], page: 1 });
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
      />
      <PyramidEditModal
        visible={showPyramidModal}
        isNew={!pyramidForm.id}
        pyramidForm={pyramidForm}
        setPyramidForm={setPyramidForm}
        onSave={handleSavePyramid}
        onClose={() => setShowPyramidModal(false)}
      />

      <ExcelImportModal
        visible={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        importHook={excelImportHook}
        onImportComplete={fetchEmployees}
      />
    </View>
  );
}