// src/screens/LatihanScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Users, Calendar, Plus, Edit, Trash2, TrendingUp, GraduationCap, BarChart3, PieChart, Target } from 'lucide-react-native';
import { useLatihan } from '../hooks/useLatihan';
import AdminEditButton from '../components/AdminEditButton';
import HoverTip from '../components/HoverTip';
import { PALETTE } from '../constants/palette';
import { statusMeta, formatDisplayDate } from './latihan/latihanConstants';
import { appStyles as shared } from '../styles/appStyles';
import { latihanStyles as styles } from './latihan/latihanStyles';
import { AnimatedVerticalBar, AnimatedHorizontalBar, StatusDonut } from './latihan/LatihanCharts';
import LatihanFormModal from './latihan/LatihanFormModal';
import { PesertaModal, PrestasiModal, SenaraiModal } from './latihan/LatihanBreakdownModals';
import { useUnitStaff } from '../hooks/useUnitStaff';
import LatihanUnitSection from './latihan/LatihanUnitSection';
import { useKpi } from '../hooks/useKpi';
import KpiSection from './pentadbiran/KpiSection';
import KpiDetailModal from './pentadbiran/KpiDetailModal';
import KpiEditModal from './pentadbiran/KpiEditModal';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';

export default function LatihanScreen({ theme, userRole }) {
  const { latihanList, isLoading, stats, saveLatihan, deleteLatihan, latihanUpdatedAt } = useLatihan();
  const unit = useUnitStaff('latihan');

  const [senaraiModalVisible, setSenaraiModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(null);

  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi, kpiUpdatedAt } = useKpi('latihan');

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
  const latestRaw = [latihanUpdatedAt, unit.staffUpdatedAt, kpiUpdatedAt].filter(Boolean).sort().slice(-1)[0] || null;
  const dikemaskini = formatTimestamp(latestRaw);

  const [isFormModalVisible, setFormModalVisible] = useState(false);
  const [pesertaModalVisible, setPesertaModalVisible] = useState(false);
  const [prestasiModalVisible, setPrestasiModalVisible] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', start_date: new Date(), end_date: new Date(), pax: '', status: 'Akan Diadakan', sasaran: [],
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ title: '', start_date: new Date(), end_date: new Date(), pax: '', status: 'Akan Diadakan', sasaran: [] });
    setFormModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    const parsedSasaran = item.note ? item.note.split(',').map(s => s.trim()).filter(s => s) : [];
    setFormData({
      title: item.title,
      start_date: item.start_date ? new Date(item.start_date) : new Date(),
      end_date: item.end_date ? new Date(item.end_date) : new Date(),
      pax: item.pax ? item.pax.toString() : '',
      status: item.status || 'Akan Diadakan',
      sasaran: parsedSasaran,
    });
    setFormModalVisible(true);
  };

  const handleSave = async () => {
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
      {userRole === 'admin' && (
        <View style={stickyHeaderStyles.stickyHeader}>
          <View style={stickyHeaderStyles.stickyHeaderCenter} pointerEvents="none">
            {dikemaskini ? (
              <Text style={stickyHeaderStyles.stickyHeaderDikemaskini}>DIKEMASKINI {dikemaskini}</Text>
            ) : null}
          </View>
          <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* ---- Cartes stats ---- */}
        <View style={styles.topRow}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: PALETTE.blue }]} activeOpacity={0.7} onPress={() => setPesertaModalVisible(true)}>
            <View style={styles.statDecorCircle} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabelLight}>Total Peserta</Text>
              <View style={styles.iconBoxLight}><Users size={16} color="#fff" /></View>
            </View>
            <Text style={styles.cardValueLight}>{stats.totalPax}</Text>
            <Text style={[styles.cardSubLight, { textDecorationLine: 'underline' }]}>Lihat Pecahan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { backgroundColor: PALETTE.orange }]} activeOpacity={0.7} onPress={() => setSenaraiModalVisible(true)}>
            <View style={styles.statDecorCircle} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabelLight}>Bil. Latihan</Text>
              <View style={styles.iconBoxLight}><Calendar size={16} color="#fff" /></View>
            </View>
            <Text style={styles.cardValueLight}>{stats.totalEvents}</Text>
            <Text style={[styles.cardSubLight, { textDecorationLine: 'underline' }]}>Lihat Senarai</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCardDark} activeOpacity={0.7} onPress={() => setPrestasiModalVisible(true)}>
            <View style={styles.darkDecorCircle} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabelLight}>Prestasi</Text>
              <View style={styles.iconBoxDark}><TrendingUp size={16} color={PALETTE.orange} /></View>
            </View>
            <Text style={styles.cardValueLight}>{stats.completionRate}%</Text>
            <Text style={[styles.cardSubLight, { textDecorationLine: 'underline' }]}>{stats.completed} Berjaya</Text>
          </TouchableOpacity>
        </View>

        {/* ---- KPI ---- */}
        <View style={{ height: 16 }} />
        <KpiSection
          kpiItems={kpiList}
          isEditing={isEditMode}
          updateKpiItem={(form, item) => saveKpiItem(form, item)}
          addKpiItem={(form) => saveKpiItem(form, null)}
          removeKpiItem={(item) => deleteKpiItem(item)}
          persistKpi={reorderKpi}
          showSubSeksyen={false}
        />

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
      />
      <SenaraiModal
        visible={senaraiModalVisible}
        onClose={() => setSenaraiModalVisible(false)}
        latihanList={latihanList}
        isEditMode={isEditMode}
        onAdd={handleOpenAdd}
        onEdit={handleOpenEdit}
        onDelete={deleteLatihan}
      />
      <PesertaModal visible={pesertaModalVisible} onClose={() => setPesertaModalVisible(false)} latihanList={latihanList} totalPax={stats.totalPax} />
      <PrestasiModal visible={prestasiModalVisible} onClose={() => setPrestasiModalVisible(false)} latihanList={latihanList} completionRate={stats.completionRate} />
    </View>
  );
}