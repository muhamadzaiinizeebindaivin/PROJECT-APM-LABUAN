import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import AdminEditButton from '../components/AdminEditButton';
import { PALETTE } from '../constants/palette';
import { usePentadbiranData } from '../hooks/usePentadbiranData';
import { useKpi } from '../hooks/useKpi';
import { useUnitStaff } from '../hooks/useUnitStaff';
import { canEditSection } from '../permissions';
import { pentadbiranStyles as styles } from './pentadbiran/pentadbiranStyles';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';
import { Network } from 'lucide-react-native';
import SectionHeader from './pentadbiran/SectionHeader';
import ComplianceSection from './pentadbiran/ComplianceSection';
import WaranTable from './pentadbiran/WaranTable';
import KpiSection from './pentadbiran/KpiSection';
import UnitSection from './pentadbiran/UnitSection';
import OrgChartPhoto from './pentadbiran/OrgChartPhoto';

const KPI_SECTION = 'pentadbiran';

export default function PentadbiranScreen({ userRole }) {
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = canEditSection(userRole, 'Pentadbiran');
  const { loading, pageData, updatedAt, saveData, updateField, updateArrayField, addArrayItem, removeArrayItem, restorePageData } = usePentadbiranData();
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi, kpiUpdatedAt } = useKpi(KPI_SECTION);
  const editSnapshotRef = useRef(null);
  const { staffList: unitStaffList, saveStaffItem, deleteStaffItem, reorderStaff, staffUpdatedAt } = useUnitStaff('pentadbiran');

  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message }
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

  // DIKEMASKINI = le plus récent entre les données de la page et les KPI (deux tables distinctes)
  const latestRaw = [updatedAt, kpiUpdatedAt, staffUpdatedAt].filter(Boolean).sort().slice(-1)[0] || null;
  const dikemaskini = formatTimestamp(latestRaw);

  // Sauvegarde partagée par toutes les sections basées sur pageData (Penilaian, Waran, Unit, Carta Organisasi)
  const persistPageData = async (overrides = {}) => {
    try {
      await saveData(overrides);
      editSnapshotRef.current = null; // sauvegardé : plus rien à restaurer si on ferme ensuite
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Ralat', 'Gagal menyimpan data. Pastikan anda log masuk sebagai Admin.');
      return false;
    }
  };

  // Prend un instantané de pageData à l'entrée en édition ; le restaure à la sortie si rien n'a été sauvegardé
  const handleEditModeChange = (next) => {
    if (next) {
      editSnapshotRef.current = pageData;
    } else if (editSnapshotRef.current) {
      restorePageData(editSnapshotRef.current);
      editSnapshotRef.current = null;
    }
    setIsEditing(next);
  };

  if (loading && !pageData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PALETTE.orange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {canEdit && (
        <View style={{ position: 'relative', zIndex: 20 }}>
          <View style={stickyHeaderStyles.stickyHeader}>
            <View style={[stickyHeaderStyles.stickyHeaderCenter, { pointerEvents: 'none' }]}>
              {dikemaskini ? (
                <View style={stickyHeaderStyles.stickyHeaderDikemaskiniBadge}>
                  <View style={stickyHeaderStyles.stickyHeaderDikemaskiniDot} />
                  <Text style={stickyHeaderStyles.stickyHeaderDikemaskini}>DIKEMASKINI {dikemaskini}</Text>
                </View>
              ) : null}
            </View>
            <AdminEditButton
              isEditMode={isEditing}
              setIsEditMode={handleEditModeChange}
              userRole={userRole}
              section="Pentadbiran"
            />
          </View>

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

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <SectionHeader title="CARTA ORGANISASI APM LABUAN" Icon={Network} />

          <OrgChartPhoto
            isEditing={isEditing}
            canEdit={canEdit}
            url={pageData.cartaOrganisasiUrl}
            onChangeUrl={(url) => updateField('cartaOrganisasiUrl', url)}
            onSaveUrl={async (url) => {
              try {
                await saveData({ cartaOrganisasiUrl: url });
                return true;
              } catch (error) {
                console.error('Error saving org chart:', error);
                Alert.alert('Ralat', 'Gagal menyimpan gambar.');
                return false;
              }
            }}
          />
        </View>

        <KpiSection
          kpiItems={kpiList}
          isEditing={isEditing}
          updateKpiItem={(form, item) => saveKpiItem(form, item)}
          addKpiItem={(form) => saveKpiItem(form, null)}
          removeKpiItem={(item) => deleteKpiItem(item)}
          persistKpi={reorderKpi}
          onNotify={showNotification}
        />
        <ComplianceSection pageData={pageData} isEditing={isEditing} updateField={updateField} onSave={persistPageData} onNotify={showNotification} />
        <WaranTable pageData={pageData} isEditing={isEditing} updateArrayField={updateArrayField} onSave={persistPageData} onNotify={showNotification} />
        <UnitSection
          pageData={pageData}
          isEditing={isEditing}
          updateField={updateField}
          onSave={persistPageData}
          unitStaffList={unitStaffList}
          saveStaffItem={saveStaffItem}
          deleteStaffItem={deleteStaffItem}
          reorderStaff={reorderStaff}
          onNotify={showNotification}
        />
      </ScrollView>
    </View>
  );
}