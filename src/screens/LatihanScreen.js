// src/screens/LatihanScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Plus, Edit, Trash2, BarChart3, PieChart, Target, CheckCircle2, XCircle } from 'lucide-react-native';
import { useLatihanBudget } from '../hooks/useLatihanBudget';
import BudgetSection from './kewangan/BudgetSection';
import { useLatihan } from '../hooks/useLatihan';
import AdminEditButton from '../components/AdminEditButton';
import HoverTip from '../components/HoverTip';
import { PALETTE } from '../constants/palette';
import { statusMeta, formatDisplayDate } from './latihan/latihanConstants';
import { appStyles as shared } from '../styles/appStyles';
import { latihanStyles as styles } from './latihan/latihanStyles';
import { AnimatedVerticalBar, AnimatedHorizontalBar, StatusDonut } from './latihan/LatihanCharts';
import LatihanFormModal from './latihan/LatihanFormModal';
// LatihanBreakdownModals retiré — remplacé par des onglets + liste inline
import { useUnitStaff } from '../hooks/useUnitStaff';
import LatihanUnitSection from './latihan/LatihanUnitSection';
import { useKpi } from '../hooks/useKpi';
import KpiSection from './pentadbiran/KpiSection';
import KpiDetailModal from './pentadbiran/KpiDetailModal';
import KpiEditModal from './pentadbiran/KpiEditModal';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';
import { canEditSection } from '../permissions';

export default function LatihanScreen({ theme, userRole }) {
  const canEdit = canEditSection(userRole, 'Latihan');
  const { latihanList, isLoading, stats, saveLatihan, deleteLatihan, latihanUpdatedAt } = useLatihan();
  const unit = useUnitStaff('latihan');

  const [isEditMode, setIsEditMode] = useState(false);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(null);
  const [activeStatTab, setActiveStatTab] = useState('senarai'); // 'senarai' | 'peserta' | 'prestasi'
  const [statPage, setStatPage] = useState(1);
  const STAT_PAGE_SIZE = 10;
  const paginatedLatihanList = latihanList.slice((statPage - 1) * STAT_PAGE_SIZE, statPage * STAT_PAGE_SIZE);
  const totalStatPages = Math.max(1, Math.ceil(latihanList.length / STAT_PAGE_SIZE));

  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi, kpiUpdatedAt } = useKpi('latihan');
  const latihanBudget = useLatihanBudget();

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
  const latestRaw = [latihanUpdatedAt, unit.staffUpdatedAt, kpiUpdatedAt, latihanBudget.budgetUpdatedAt].filter(Boolean).sort().slice(-1)[0] || null;
  const dikemaskini = formatTimestamp(latestRaw);

  const [isFormModalVisible, setFormModalVisible] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', start_date: null, end_date: null, pax: '', status: 'Akan Diadakan', sasaran: [],
  });
  const [formError, setFormError] = useState(null);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ title: '', start_date: null, end_date: null, pax: '', status: 'Akan Diadakan', sasaran: [] });
    setFormError(null);
    setFormModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    const parsedSasaran = item.note ? item.note.split(',').map(s => s.trim()).filter(s => s) : [];
    setFormData({
      title: item.title,
      start_date: item.start_date ? new Date(item.start_date) : null,
      end_date: item.end_date ? new Date(item.end_date) : null,
      pax: item.pax ? item.pax.toString() : '',
      status: item.status || 'Akan Diadakan',
      sasaran: parsedSasaran,
    });
    setFormError(null);
    setFormModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.start_date || !formData.end_date) {
      setFormError('Tajuk, tarikh mula dan tarikh tamat mesti diisi.');
      return;
    }
    setFormError(null);
    const ok = await saveLatihan(formData, editingId);
    if (ok) setFormModalVisible(false);
  };

  if (isLoading) {
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
          <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} section="Latihan" />

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

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* ---- KPI ---- */}
        <KpiSection
          kpiItems={kpiList}
          isEditing={isEditMode}
          updateKpiItem={(form, item) => saveKpiItem(form, item)}
          addKpiItem={(form) => saveKpiItem(form, null)}
          removeKpiItem={(item) => deleteKpiItem(item)}
          persistKpi={reorderKpi}
          showSubSeksyen={false}
        />
        <View style={{ height: 16 }} />

        {/* ---- Carte statistique statique : Total Peserta (plus un onglet, plus cliquable) ---- */}
        <View style={{
          backgroundColor: PALETTE.ink, borderRadius: 20, padding: 24, marginBottom: 16,
          position: 'relative', overflow: 'hidden',
        }}>
          <View style={{
            position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60,
            backgroundColor: PALETTE.orange, opacity: 0.25,
          }} />
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#fff' }}>{stats.totalPax}</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Jumlah Peserta</Text>
        </View>

        {/* ---- Statistik Bulanan ---- */}
        <View style={styles.sectionCard}>
          <View style={shared.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionIconBadge}><BarChart3 size={16} color={PALETTE.orange} /></View>
              <View>
                <Text style={shared.sectionHeaderTitle}>Statistik Bulanan</Text>
                <Text style={styles.sectionSub}>Tekan bar untuk lihat peratusan</Text>
              </View>
            </View>
            <View style={styles.badgeBtn}>
              <Text style={styles.badgeText}>Tahunan</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {stats.monthsLabel.map((m, i) => (
              <AnimatedVerticalBar
                key={i} label={m}
                height={(stats.monthlyCounts[i] / stats.maxMonthVal) * 112}
                value={stats.monthlyCounts[i]} total={stats.totalRecordedEvents}
                delay={i * 60}
                isSelected={hoveredMonthIndex === i}
                isCurrentMonth={new Date().getMonth() === i}
                onPress={() => setHoveredMonthIndex(hoveredMonthIndex === i ? null : i)}
              />
            ))}
          </View>
        </View>

        {/* ---- Status Program + Kumpulan Sasaran ---- */}
        <View style={styles.splitRow}>
          <View style={[styles.sectionCard, { flex: 0.45, marginBottom: 0 }]}>
            <View style={shared.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View style={styles.sectionIconBadge}><PieChart size={16} color={PALETTE.orange} /></View>
                <Text style={shared.sectionHeaderTitle}>Status Program</Text>
              </View>
            </View>
            <StatusDonut completionRate={stats.completionRate} completed={stats.completed} upcoming={stats.upcoming} failed={stats.failed} />
          </View>

          <View style={[styles.sectionCard, { flex: 1, marginBottom: 0 }]}>
            <View style={shared.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View style={styles.sectionIconBadge}><Target size={16} color={PALETTE.orange} /></View>
                <Text style={shared.sectionHeaderTitle}>Kumpulan Sasaran</Text>
              </View>
            </View>
            {stats.audienceList.map((item, index) => (
              <View key={index} style={styles.progressRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={styles.audienceRank}><Text style={styles.audienceRankText}>{index + 1}</Text></View>
                  <Text style={styles.progressLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.progressCount}>{item.count} latihan</Text>
                  <Text style={styles.progressPercent}>{item.percent}%</Text>
                </View>
                <AnimatedHorizontalBar widthPercent={item.percent} color={PALETTE.orange} delay={400 + (index * 120)} />
              </View>
            ))}
          </View>
        </View>

        {/* ---- Onglets stats + liste ---- */}
        <View style={[styles.sectionCard, { marginTop: 16 }]}>

          {activeStatTab === 'senarai' && (
            <>
              {isEditMode && (
                <TouchableOpacity style={[shared.addButton, { alignSelf: 'flex-end', marginBottom: 10 }]} onPress={handleOpenAdd}>
                  <Plus size={16} color="#fff" />
                  <Text style={shared.addButtonText}>Tambah</Text>
                </TouchableOpacity>
              )}
              {latihanList.length === 0 ? (
                <Text style={shared.emptyText}>Tiada data latihan.</Text>
              ) : (
                paginatedLatihanList.map((item) => {
                  const meta = statusMeta(item.status);
                  return (
                    <View key={item.id} style={styles.listItem}>
                      <View style={styles.dateChip}>
                        <Text style={styles.dateText}>{formatDisplayDate(item.start_date, item.end_date)}</Text>
                      </View>
                      <View style={{ flex: 1, paddingLeft: 8 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemSub}>{item.note || 'Tiada Kumpulan'} • {item.pax} Pax</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.statusBadge, { backgroundColor: meta.soft }]}>
                          <meta.Icon size={12} color={meta.color} />
                          <Text style={[styles.statusBadgeText, { color: meta.color }]}>{item.status}</Text>
                        </View>
                        {isEditMode && (
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <HoverTip label="Kemaskini latihan ini">
                              <TouchableOpacity onPress={() => handleOpenEdit(item)} style={[styles.itemActionBtn, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
                                <Edit size={14} color={PALETTE.orange} />
                              </TouchableOpacity>
                            </HoverTip>
                            <HoverTip label="Padam latihan ini">
                              <TouchableOpacity onPress={() => deleteLatihan(item.id)} style={[styles.itemActionBtn, { backgroundColor: 'rgba(220, 38, 38, 0.10)' }]}>
                                <Trash2 size={14} color={PALETTE.danger} />
                              </TouchableOpacity>
                            </HoverTip>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {latihanList.length > STAT_PAGE_SIZE && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 14 }}>
              <TouchableOpacity
                disabled={statPage === 1}
                onPress={() => setStatPage((p) => Math.max(1, p - 1))}
                style={{ opacity: statPage === 1 ? 0.3 : 1, padding: 8 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.orange }}>← Sebelum</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.textDark }}>
                Muka {statPage} / {totalStatPages}
              </Text>
              <TouchableOpacity
                disabled={statPage === totalStatPages}
                onPress={() => setStatPage((p) => Math.min(totalStatPages, p + 1))}
                style={{ opacity: statPage === totalStatPages ? 0.3 : 1, padding: 8 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.orange }}>Seterusnya →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <BudgetSection
          budgetData={latihanBudget.budgetData}
          loading={latihanBudget.loading}
          isEditMode={isEditMode}
          saveBudgetItem={latihanBudget.saveBudgetItem}
          deleteBudgetItem={latihanBudget.deleteBudgetItem}
          deleteCategory={latihanBudget.deleteCategory}
          renameCategory={latihanBudget.renameCategory}
          onNotify={showNotification}
        />

        {/* ---- Unit Bertanggungjawab ---- */}
        <View style={{ height: 16 }} />
        <LatihanUnitSection
          unitList={unit.staffList}
          loadingUnit={unit.loading}
          isEditMode={isEditMode}
          saveUnitItem={unit.saveStaffItem}
          deleteUnitItem={unit.deleteStaffItem}
          reorderUnit={unit.reorderStaff}
        />
      </ScrollView>

      <LatihanFormModal
        visible={isFormModalVisible}
        onClose={() => setFormModalVisible(false)}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        error={formError}
      />
      </View>
  );
}