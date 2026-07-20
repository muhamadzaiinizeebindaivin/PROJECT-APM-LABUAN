import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Image } from 'react-native';
import { X, Trash2, User } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { EMPLOYEE_TABS, FIELD_GROUPS } from './employeeFieldGroups';
import EmployeeField from './EmployeeField';
import CertificatesTab from './CertificatesTab';
import CertEditModal from './CertEditModal';
import PromotionHistoryList from './PromotionHistoryList';

export default function EmployeeDetailModal({
  visible, onClose,
  employeeForm, setEmployeeForm,
  isEditing, certOnlyMode,
  certificates, promotionHistoryList,
  onSaveCertificate, onDeleteCertificate, onOpenCertLink,
  uploadingPhoto, onPickPhoto,
  onSaveEmployee, onDeleteEmployee,
}) {
  const [showFullDetail, setShowFullDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('Identiti');
  const [activeDatePickerField, setActiveDatePickerField] = useState(null);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [certForm, setCertForm] = useState({ id: null, nom_certificat: '', google_drive_link: '' });

  const isActive = String(employeeForm.status_keaktifan).toUpperCase() === 'AKTIF';

  const openAddCert = () => {
    setCertForm({ id: null, nom_certificat: '', google_drive_link: '' });
    setCertModalVisible(true);
  };
  const openEditCert = (cert) => {
    setCertForm(cert);
    setCertModalVisible(true);
  };
  const handleSaveCert = async () => {
    await onSaveCertificate(certForm);
    setCertModalVisible(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.employeeModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {certOnlyMode ? 'Sijil / Sertifikat' : (employeeForm.id ? 'Butiran Anggota' : 'Tambah Anggota')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {employeeForm.id && isEditing && !certOnlyMode && (
                <TouchableOpacity onPress={() => onDeleteEmployee(employeeForm.id)}>
                  <Trash2 size={20} color="#dc2626" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            {!certOnlyMode && (
              <View style={styles.profileHeader}>
                <View style={styles.profilePhotoWrap}>
                  {employeeForm.photo_url ? (
                    <Image source={{ uri: employeeForm.photo_url }} style={styles.profilePhotoLarge} />
                  ) : (
                    <View style={[styles.profilePhotoLarge, styles.employeeAvatarPlaceholder]}>
                      <User size={40} color={PALETTE.textMutedDark} />
                    </View>
                  )}
                </View>
                <Text style={styles.profileName}>{employeeForm.nama || 'Nama Baru'}</Text>
                <Text style={styles.profileRank}>{employeeForm.pangkat || '-'}</Text>
                {!!employeeForm.status_keaktifan && (
                  <View style={[styles.profileStatusBadge, { backgroundColor: isActive ? PALETTE.blueSoft : PALETTE.surface }]}>
                    <Text style={[styles.profileStatusText, { color: isActive ? PALETTE.blue : PALETTE.textMutedDark }]}>
                      {employeeForm.status_keaktifan}
                    </Text>
                  </View>
                )}
                {isEditing && (
                  <TouchableOpacity
                    style={styles.changePhotoBtn}
                    disabled={uploadingPhoto}
                    onPress={async () => {
                      const url = await onPickPhoto(employeeForm.id);
                      if (url) setEmployeeForm({ ...employeeForm, photo_url: url });
                    }}
                  >
                    <Text style={styles.changePhotoText}>{uploadingPhoto ? 'Memuat naik...' : 'Tukar Foto'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {certOnlyMode ? (
              <>
                <Text style={{ color: PALETTE.textDark, fontWeight: '700', fontSize: 16, textAlign: 'center', marginBottom: 15 }}>
                  {employeeForm.nama}
                </Text>
                <CertificatesTab
                  certificates={certificates}
                  isEditing={isEditing}
                  onAdd={openAddCert}
                  onEdit={openEditCert}
                  onOpenLink={onOpenCertLink}
                  onDelete={(id) => onDeleteCertificate(id, employeeForm.id)}
                />
              </>
            ) : (
              <>
                {!isEditing && !showFullDetail && (
                  <>
                    <View style={styles.quickInfoGrid}>
                      {[
                        { label: 'No. IC', value: employeeForm.ic_no },
                        { label: 'No. Anggota', value: employeeForm.no_anggota },
                        { label: 'No. Telefon', value: employeeForm.contact },
                        { label: 'Jantina', value: employeeForm.jantina },
                      ].map((item) => (
                        <View key={item.label} style={styles.quickInfoBox}>
                          <Text style={styles.quickInfoLabel}>{item.label}</Text>
                          <Text style={styles.quickInfoValue}>{item.value || '-'}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setShowFullDetail(true)}>
                      <Text style={styles.seeMoreBtnText}>Lihat Semua Maklumat →</Text>
                    </TouchableOpacity>
                  </>
                )}

                {(isEditing || showFullDetail) && (
                  <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll}>
                      <View style={styles.tabBar}>
                        {EMPLOYEE_TABS.map((tab) => (
                          <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                          >
                            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {activeTab === 'Sijil' ? (
                      <CertificatesTab
                        certificates={certificates}
                        isEditing={isEditing}
                        onAdd={openAddCert}
                        onEdit={openEditCert}
                        onOpenLink={onOpenCertLink}
                        onDelete={(id) => onDeleteCertificate(id, employeeForm.id)}
                      />
                    ) : (
                      <>
                        {FIELD_GROUPS[activeTab]?.map((f) => (
                          <EmployeeField
                            key={f.key}
                            field={f}
                            form={employeeForm}
                            setForm={setEmployeeForm}
                            isEditing={isEditing}
                            activeDatePickerField={activeDatePickerField}
                            setActiveDatePickerField={setActiveDatePickerField}
                          />
                        ))}
                        {activeTab === 'Pangkat' && (
                          <PromotionHistoryList promotionHistoryList={promotionHistoryList} />
                        )}
                      </>
                    )}

                    {!isEditing && activeTab !== 'Sijil' && (
                      <TouchableOpacity onPress={() => setShowFullDetail(false)} style={{ marginTop: 15 }}>
                        <Text style={{ color: PALETTE.textMutedDark, fontWeight: '600' }}>← Kembali ke ringkasan</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </>
            )}

            {isEditing && !certOnlyMode && (
              <TouchableOpacity style={styles.saveButton} onPress={onSaveEmployee}>
                <Text style={styles.saveButtonText}>Simpan Anggota</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>

      <CertEditModal
        visible={certModalVisible}
        isNew={!certForm.id}
        certForm={certForm}
        setCertForm={setCertForm}
        onSave={handleSaveCert}
        onClose={() => setCertModalVisible(false)}
      />
    </Modal>
  );
}