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
  const { loading, pageData, updatedAt, saveData, updateField, updateArrayField, addArrayItem, removeArrayItem } = usePentadbiranData();
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi, kpiUpdatedAt } = useKpi(KPI_SECTION);
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
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Ralat', 'Gagal menyimpan data. Pastikan anda log masuk sebagai Admin.');
      return false;
    }
  };

  // "Tutup Kemaskini" sauvegarde automatiquement tout ce qui a pu être modifié avant de fermer le mode édition
  const handleCloseEditing = () => {
    setIsEditing(false);
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
            setIsEditMode={setIsEditing}
            userRole={userRole}
            section="Pentadbiran"
          />
        </View>
      )}

      {notification && (
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: notification.type === 'success' ? '#16a34a' : '#dc2626',
              paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, maxWidth: '90%',
              shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
            }}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={16} color="#fff" />
            ) : (
              <XCircle size={16} color="#fff" />
            )}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, flexShrink: 1 }}>{notification.message}</Text>
          </View>
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
        <ComplianceSection pageData={pageData} isEditing={isEditing} updateField={updateField} onSave={persistPageData} />
        <WaranTable pageData={pageData} isEditing={isEditing} updateArrayField={updateArrayField} onSave={persistPageData} />
        <UnitSection
          pageData={pageData}
          isEditing={isEditing}
          updateField={updateField}
          onSave={persistPageData}
          unitStaffList={unitStaffList}
          saveStaffItem={saveStaffItem}
          deleteStaffItem={deleteStaffItem}
          reorderStaff={reorderStaff}
        />
      </ScrollView>
    </View>
  );
}