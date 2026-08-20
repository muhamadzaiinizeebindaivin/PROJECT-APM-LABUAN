// src/screens/SekretariatScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Users, AlertTriangle, Home, Map, Pencil, Trash2, ChevronUp, ChevronDown, CheckCircle2, XCircle } from 'lucide-react-native';

import AdminEditButton from '../components/AdminEditButton';
import JpbdSection from './sekretariat/JpbdSection';
import HotspotSection from './sekretariat/HotspotSection';
import PpsSection from './sekretariat/PpsSection';
import PetaTab from './sekretariat/PetaTab';
import CatatanSection from './sekretariat/CatatanSection';
import UnitEditModal from './kewangan/UnitEditModal';
import { useUnitStaff } from '../hooks/useUnitStaff';
import { useSekretariatMeta } from '../hooks/useSekretariatMeta';
import { appStyles as shared } from '../styles/appStyles';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';
import { PALETTE } from '../constants/palette';
import { canEditSection } from '../permissions';

const SekretariatScreen = ({ theme, userRole }) => {
  const canEdit = canEditSection(userRole, 'Sekretariat');
  const [activeTab, setActiveTab] = useState('JPBD');
  const [isEditMode, setIsEditMode] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  // ---- Unit Bertanggungjawab ----
  const { staffList: unitList, loading: loadingUnit, saveStaffItem: saveUnitItem, deleteStaffItem: deleteUnitItem, reorderStaff: reorderUnit } = useUnitStaff('sekretariat');
  const { dikemaskiniRaw } = useSekretariatMeta();

  // Convertit un timestamp ISO (colonne updated_at) au format d'affichage DD/M/YYYY HH:MM
  const formatTimestamp = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${date} ${hours}:${minutes}`;
  };
  const dikemaskini = formatTimestamp(dikemaskiniRaw);

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

  const [hoveredUnitIndex, setHoveredUnitIndex] = useState(null);
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [editUnit, setEditUnit] = useState(null);
  const [unitDraft, setUnitDraft] = useState({ name: '', role: '' });

  const openAddUnit = () => { setEditUnit(null); setUnitDraft({ name: '', role: '' }); setUnitModalVisible(true); };
  const openEditUnit = (item) => { setEditUnit(item); setUnitDraft({ name: item.name, role: item.role }); setUnitModalVisible(true); };
  const handleSaveUnit = async () => {
    if (!unitDraft.name.trim()) return;
    const ok = await saveUnitItem(unitDraft, editUnit);
    if (ok) setUnitModalVisible(false);
  };
  const moveUnit = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= unitList.length) return;
    const reordered = [...unitList];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    reorderUnit(reordered);
  };

  return (
    <View style={styles.container}>
      <View style={{ position: 'relative', zIndex: 50 }}>
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
            <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} section="Sekretariat" />
          </View>
        )}

        {notification && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0, right: 0,
              alignItems: 'center', paddingTop: 10, zIndex: 999, elevation: 30,
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
                elevation: 30,
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

      <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tabItem, activeTab === 'JPBD' && styles.tabItemActive]} onPress={() => setActiveTab('JPBD')} activeOpacity={0.8}>
            {!isMobile && <Users size={16} color={activeTab === 'JPBD' ? PALETTE.white : PALETTE.textMutedDark} />}
            <Text style={[styles.tabText, isMobile && styles.tabTextMobile, activeTab === 'JPBD' ? styles.tabTextActive : { color: PALETTE.textMutedDark }]}>Jawatankuasa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabItem, activeTab === 'HOTSPOT' && styles.tabItemActive]} onPress={() => setActiveTab('HOTSPOT')} activeOpacity={0.8}>
            {!isMobile && <AlertTriangle size={16} color={activeTab === 'HOTSPOT' ? PALETTE.white : PALETTE.textMutedDark} />}
            <Text style={[styles.tabText, isMobile && styles.tabTextMobile, activeTab === 'HOTSPOT' ? styles.tabTextActive : { color: PALETTE.textMutedDark }]}>Hotspot</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabItem, activeTab === 'PPS' && styles.tabItemActive]} onPress={() => setActiveTab('PPS')} activeOpacity={0.8}>
            {!isMobile && <Home size={16} color={activeTab === 'PPS' ? PALETTE.white : PALETTE.textMutedDark} />}
            <Text style={[styles.tabText, isMobile && styles.tabTextMobile, activeTab === 'PPS' ? styles.tabTextActive : { color: PALETTE.textMutedDark }]}>Data PPS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabItem, activeTab === 'PETA' && styles.tabItemActive]} onPress={() => setActiveTab('PETA')} activeOpacity={0.8}>
            {!isMobile && <Map size={16} color={activeTab === 'PETA' ? PALETTE.white : PALETTE.textMutedDark} />}
            <Text style={[styles.tabText, isMobile && styles.tabTextMobile, activeTab === 'PETA' ? styles.tabTextActive : { color: PALETTE.textMutedDark }]}>Peta Bencana</Text>
          </TouchableOpacity>
        </View>

      {activeTab === 'PETA' ? (
        <PetaTab theme={theme} userRole={userRole} isEditMode={isEditMode} onNotify={showNotification} />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>

          {activeTab === 'JPBD' && <JpbdSection userRole={userRole} isEditMode={isEditMode} />}
          {activeTab === 'HOTSPOT' && <HotspotSection userRole={userRole} isEditMode={isEditMode} onNotify={showNotification} />}
          {activeTab === 'PPS' && <PpsSection userRole={userRole} isEditMode={isEditMode} onNotify={showNotification} />}

          <View style={styles.sectionDivider} />

          {/* ---- Section Unit Bertanggungjawab (commune à tous les onglets) ---- */}
          <View style={styles.unitSection}>
            <View style={shared.sectionHeaderRow}>
              <View style={shared.sectionHeaderTitleGroup}>
                <View style={shared.sectionIconBadge}>
                  <Users size={16} color={PALETTE.orange} />
                </View>
                <Text style={shared.sectionHeaderTitle}>UNIT SEKRETARIAT</Text>
              </View>
            </View>

            {loadingUnit ? (
              <ActivityIndicator size="small" color={PALETTE.orange} style={{ marginVertical: 8 }} />
            ) : unitList.length === 0 ? (
              <Text style={shared.emptyText}>Tiada maklumat unit.</Text>
            ) : (
              unitList.map((item, index) => (
                <View key={item.id} style={[styles.unitCard, { marginBottom: 8 }]}>
                  {canEdit && isEditMode ? (
                    <View style={styles.reorderGroup}>
                      <TouchableOpacity
                        style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                        onPress={() => moveUnit(index, -1)} disabled={index === 0}
                      >
                        <ChevronUp size={13} color={index === 0 ? PALETTE.textMutedDark : PALETTE.orange} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.reorderBtn, index === unitList.length - 1 && styles.reorderBtnDisabled]}
                        onPress={() => moveUnit(index, 1)} disabled={index === unitList.length - 1}
                      >
                        <ChevronDown size={13} color={index === unitList.length - 1 ? PALETTE.textMutedDark : PALETTE.orange} />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <View style={styles.unitAvatar}>
                    <Text style={styles.unitAvatarText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.unitName}>{item.name}</Text>
                    <Text style={styles.unitRole}>{item.role || '—'}</Text>
                  </View>
                  {canEdit && isEditMode ? (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={styles.unitEditBtn}
                        onPress={() => openEditUnit(item)}
                        onMouseEnter={() => setHoveredUnitIndex(index)}
                        onMouseLeave={() => setHoveredUnitIndex(null)}
                      >
                        <Pencil size={13} color={PALETTE.orange} />
                        {hoveredUnitIndex === index ? (
                          <View style={styles.unitTooltip}>
                            <Text style={styles.unitTooltipText}>Ubah</Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.unitDeleteBtn}
                        onPress={async () => {
                          const ok = await deleteUnitItem(item);
                          showNotification(
                            ok !== false ? 'success' : 'error',
                            ok !== false ? 'Ahli unit berjaya dipadam.' : 'Gagal memadam ahli unit.'
                          );
                        }}
                      >
                        <Trash2 size={13} color={PALETTE.danger} />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ))
            )}

            {canEdit && isEditMode && (
              <TouchableOpacity onPress={openAddUnit} style={styles.addBtnOutline}>
                <Text style={styles.addBtnOutlineText}>+ Tambah</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sectionDivider} />

          {/* ---- Section CATATAN (commune à tous les onglets) ---- */}
          <CatatanSection isEditMode={canEdit && isEditMode} onNotify={showNotification} />
        </ScrollView>
      )}

      <UnitEditModal
        visible={unitModalVisible}
        isNew={!editUnit}
        draft={unitDraft}
        setDraft={setUnitDraft}
        onSave={handleSaveUnit}
        onClose={() => setUnitModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.softOrangeBg, paddingBottom: 16 },
  tabBar: { flexDirection: 'row', margin: 16, padding: 6, borderRadius: 16, backgroundColor: PALETTE.cardLight, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, gap: 8 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: PALETTE.cardLightBorder },
  tabItemActive: { backgroundColor: PALETTE.orange },
  tabText: { fontSize: 13, fontWeight: '700' },
  tabTextMobile: { fontSize: 10 },
  tabTextActive: { color: PALETTE.white },
  listContent: { padding: 15, paddingBottom: 50 },

  // Section unit
  unitSection: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, padding: 16, marginBottom: 0,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  sectionDivider: { height: 16 },
  unitCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: PALETTE.cardLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  unitAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  unitAvatarText: { fontSize: 12, fontWeight: '800', color: PALETTE.orange },
  unitName: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark, marginBottom: 2 },
  unitRole: { fontSize: 12, color: PALETTE.textMutedDark },
  reorderGroup: { gap: 2 },
  reorderBtn: {
    width: 20, height: 16, borderRadius: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  reorderBtnDisabled: { backgroundColor: PALETTE.surface },
  unitEditBtn: {
    width: 26, height: 26, borderRadius: 7, position: 'relative',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  unitDeleteBtn: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: 'rgba(220, 38, 38, 0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  unitTooltip: {
    position: 'absolute', top: -30, right: 0, zIndex: 10,
    backgroundColor: PALETTE.textDark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  unitTooltipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  addBtnOutline: { marginTop: 10, padding: 10, backgroundColor: PALETTE.surface, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: PALETTE.cardLightBorder },
  addBtnOutlineText: { color: PALETTE.orange, fontWeight: '800', fontSize: 12 },
});

export default SekretariatScreen;