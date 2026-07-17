import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Linking } from 'react-native';
import AdminEditButton from '../components/AdminEditButton';
import { PALETTE } from '../constants/palette';
import { usePentadbiranData } from '../hooks/usePentadbiranData';
import { useKpiItems } from '../hooks/useKpiItems';
import { useUserAccounts } from '../hooks/useUserAccounts';
import { pentadbiranStyles as styles } from './pentadbiran/pentadbiranStyles';
import ComplianceSection from './pentadbiran/ComplianceSection';
import WaranTable from './pentadbiran/WaranTable';
import PdpaProgress from './pentadbiran/PdpaProgress';
import KpiSection from './pentadbiran/KpiSection';
import TanggungjawabTable from './pentadbiran/TanggungjawabTable';
import UnitSection from './pentadbiran/UnitSection';
import UserManagementSection from './pentadbiran/UserManagementSection';
import UserEditModal from './pentadbiran/UserEditModal';
import DeleteConfirmModal from './pentadbiran/DeleteConfirmModal';

const KPI_SECTION = 'pentadbiran';

export default function PentadbiranScreen({ userRole }) {
  const [isEditing, setIsEditing] = useState(false);
  const { loading, pageData, saveData, updateField, updateArrayField, addArrayItem, removeArrayItem } = usePentadbiranData();
  const { kpiItems, addKpiItem, removeKpiItem, updateKpiItem, saveKpiItems } = useKpiItems(KPI_SECTION);
  const { userAccounts, updateCredentials, deleteUser } = useUserAccounts(userRole === 'admin');

  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  const [deleteConfig, setDeleteConfig] = useState({ visible: false, userId: null, username: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDikemaskini = () => {
    const now = new Date();
    const date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${date} ${hours}:${minutes}`;
  };

  const handleSave = async () => {
    try {
      await saveData({ dikemaskini: formatDikemaskini() });
      await saveKpiItems();
      Alert.alert('Berjaya', 'Maklumat telah dikemaskini.');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Ralat', 'Gagal menyimpan data. Pastikan anda log masuk sebagai Admin.');
    }
  };

  const openOrgChart = () => Linking.openURL('https://www.civildefence.gov.my/wilayah-persekutuan-labuan/');

  const openUserEditModal = (user) => {
    setEditingUser(user);
    setNewUsername(user.username);
    setNewPassword('');
    setUserModalVisible(true);
  };

  const handleUpdateCredentials = async () => {
    if (!newUsername) {
      Alert.alert('Ralat', 'Sila masukkan nama pengguna baru.');
      return;
    }
    setIsUpdatingUser(true);
    try {
      await updateCredentials(editingUser.id, newUsername, newPassword);
      setUserModalVisible(false);
      Alert.alert('Berjaya', `Kredensial untuk ${newUsername} telah dikemaskini.`);
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Ralat', 'Gagal mengemaskini pengguna.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteUser(deleteConfig.userId);
      Alert.alert('Berjaya', `Pengguna ${deleteConfig.username} telah dipadam.`);
      setDeleteConfig({ visible: false, userId: null, username: '' });
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Ralat', 'Gagal memadam pengguna.');
    } finally {
      setIsDeleting(false);
    }
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
      {userRole === 'admin' && (
        <View style={styles.stickyHeader}>
          {isEditing && (
            <TouchableOpacity style={styles.stickySaveBtn} onPress={handleSave}>
              <Text style={styles.stickySaveBtnText}>💾 Simpan Perubahan</Text>
            </TouchableOpacity>
          )}
          <AdminEditButton isEditMode={isEditing} setIsEditMode={setIsEditing} userRole={userRole} />
        </View>
      )}

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
            <Text style={styles.headerTitle}>DIKEMASKINI {pageData.dikemaskini}</Text>
          </View>
          <TouchableOpacity style={styles.linkButton} onPress={openOrgChart}>
            <Text style={styles.linkButtonText}>Lihat Carta Organisasi Rasmi</Text>
          </TouchableOpacity>
        </View>

        <KpiSection kpiItems={kpiItems} isEditing={isEditing} updateKpiItem={updateKpiItem} addKpiItem={addKpiItem} removeKpiItem={removeKpiItem} />
        <ComplianceSection pageData={pageData} isEditing={isEditing} updateArrayField={updateArrayField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />
        <WaranTable pageData={pageData} isEditing={isEditing} updateArrayField={updateArrayField} />
        <PdpaProgress pageData={pageData} isEditing={isEditing} updateArrayField={updateArrayField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />
        <TanggungjawabTable pageData={pageData} isEditing={isEditing} updateArrayField={updateArrayField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />
        <UnitSection pageData={pageData} isEditing={isEditing} updateArrayField={updateArrayField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />

        {userRole === 'admin' && isEditing && (
          <UserManagementSection
            userAccounts={userAccounts}
            onEditUser={openUserEditModal}
            onDeleteUser={(userId, username) => setDeleteConfig({ visible: true, userId, username })}
          />
        )}
      </ScrollView>

      <UserEditModal
        visible={userModalVisible}
        onClose={() => setUserModalVisible(false)}
        username={newUsername}
        setUsername={setNewUsername}
        password={newPassword}
        setPassword={setNewPassword}
        onSave={handleUpdateCredentials}
        saving={isUpdatingUser}
      />

      <DeleteConfirmModal
        visible={deleteConfig.visible}
        username={deleteConfig.username}
        onCancel={() => setDeleteConfig({ visible: false, userId: null, username: '' })}
        onConfirm={executeDelete}
        deleting={isDeleting}
      />
    </View>
  );
}