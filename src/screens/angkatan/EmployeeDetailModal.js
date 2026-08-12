import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, useWindowDimensions, Animated, PanResponder, Platform } from 'react-native';
import { X, Trash2, User, AlertTriangle } from 'lucide-react-native';
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
  isEditing, userRole, certOnlyMode,
  certificates, promotionHistoryList,
  onSaveCertificate, onDeleteCertificate, onOpenCertLink,
  onSaveEmployee, onDeleteEmployee,
  onNotify,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const [showFullDetail, setShowFullDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('Identiti');
  const [activeDatePickerField, setActiveDatePickerField] = useState(null);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [certForm, setCertForm] = useState({ id: null, nom_certificat: '', google_drive_link: '', kategori: 'Kursus' });
  const [confirmDeleteCertId, setConfirmDeleteCertId] = useState(null);
  const displayDeleteCertRef = useRef(null);
  if (confirmDeleteCertId !== null) displayDeleteCertRef.current = certificates.find((c) => c.id === confirmDeleteCertId);
  const [isDeletingCert, setIsDeletingCert] = useState(false);
  const [confirmDeleteEmployee, setConfirmDeleteEmployee] = useState(false);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);

  const handleConfirmDeleteEmployee = async () => {
    setIsDeletingEmployee(true);
    await onDeleteEmployee(employeeForm.id);
    setIsDeletingEmployee(false);
    setConfirmDeleteEmployee(false);
  };

  // "Kemaskini" — modification directe depuis le popup, réservée à admin/sekretariat,
  // indépendante du mode édition global de la page (isEditing).
  const canDirectEdit = userRole === 'admin' || userRole === 'sekretariat';
  const [directEditMode, setDirectEditMode] = useState(false);
  const effectiveEditing = isEditing || directEditMode;

  useEffect(() => {
    if (!visible) setDirectEditMode(false);
  }, [visible]);

  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      pan.setValue({ x: 0, y: 0 });
      pan.setOffset({ x: 0, y: 0 });
    }
  }, [visible]);

  // Overlay transparent aux clics/scroll côté web (voir pointerEvents plus bas) —
  // on ré-intercepte manuellement les clics HORS de la boîte du modal (capture phase)
  // pour empêcher de cliquer sur le tableau en arrière-plan, sans bloquer le scroll/wheel.
  const modalBoxRef = useRef(null);
  useEffect(() => {
    // Même raison que l'effet pointer-events plus bas : suspendu tant qu'un
    // modal enfant (édition/suppression de sijil, ou confirmation de
    // suppression d'anggota) est ouvert, sinon ses clics sont traités comme
    // "hors de la boîte" et bloqués.
    if (Platform.OS !== 'web' || !visible || certModalVisible || confirmDeleteCertId !== null || confirmDeleteEmployee) return undefined;
    const handleCapture = (e) => {
      if (modalBoxRef.current && !modalBoxRef.current.contains(e.target)) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    document.addEventListener('click', handleCapture, true);
    document.addEventListener('mousedown', handleCapture, true);
    return () => {
      document.removeEventListener('click', handleCapture, true);
      document.removeEventListener('mousedown', handleCapture, true);
    };
  }, [visible, certModalVisible, confirmDeleteCertId, confirmDeleteEmployee]);

  // react-native-web's <Modal> wraps our content in its own backdrop <div>s
  // (outside our own styles.modalOverlay node), which still swallow scroll/click
  // even though our overlay is set to pointerEvents="none" below. Fix: walk up
  // from our overlay's actual DOM node and force pointer-events: none on every
  // ancestor up to <body> — the popup itself stays clickable since it declares
  // its own pointerEvents="auto" (CSS lets a descendant override an ancestor).
  const overlayRef = useRef(null);
  useEffect(() => {
    // On suspend ce hack dès qu'un modal enfant (édition/suppression de sijil,
    // ou confirmation de suppression d'anggota) est ouvert par-dessus — sinon
    // ses propres noeuds héritent du pointer-events:none qu'on force sur les
    // ancêtres, et se figent aussi.
    if (Platform.OS !== 'web' || !visible || certModalVisible || confirmDeleteCertId !== null || confirmDeleteEmployee) return undefined;
    const touched = [];
    let node = overlayRef.current;
    while (node && node !== document.body) {
      touched.push([node, node.style.pointerEvents]);
      node.style.pointerEvents = 'none';
      node = node.parentElement;
    }
    return () => {
      touched.forEach(([el, prevValue]) => { el.style.pointerEvents = prevValue; });
    };
  }, [visible, certModalVisible, confirmDeleteCertId, confirmDeleteEmployee]);

  const isActive = String(employeeForm.status_keaktifan).toUpperCase() === 'AKTIF';

  const openAddCert = () => {
    setCertForm({ id: null, nom_certificat: '', google_drive_link: '', kategori: 'Kursus' });
    setCertModalVisible(true);
  };
  const openEditCert = (cert) => {
    setCertForm(cert);
    setCertModalVisible(true);
  };
  const handleSaveCert = async () => {
    const isNew = !certForm.id;
    const ok = await onSaveCertificate(certForm);
    setCertModalVisible(false);
    if (ok === false) {
      onNotify?.('error', 'Gagal menyimpan sijil.');
    } else {
      onNotify?.('success', isNew ? 'Sijil berjaya ditambah.' : 'Sijil berjaya dikemaskini.');
    }
  };

  const requestDeleteCert = (id) => setConfirmDeleteCertId(id);
  const confirmDeleteCert = async () => {
    const cert = displayDeleteCertRef.current;
    setIsDeletingCert(true);
    const ok = await onDeleteCertificate(confirmDeleteCertId);
    setConfirmDeleteCertId(null);
    setIsDeletingCert(false);
    if (ok === false) {
      onNotify?.('error', `Gagal memadam sijil "${cert?.nom_certificat}".`);
    } else {
      onNotify?.('success', `Sijil "${cert?.nom_certificat}" berjaya dipadam.`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View ref={overlayRef} style={styles.modalOverlay} pointerEvents={Platform.OS === 'web' ? 'none' : 'auto'}>
        <Animated.View
          ref={modalBoxRef}
          style={[styles.employeeModalContainer, { transform: pan.getTranslateTransform() }]}
          pointerEvents="auto"
        >
          <View style={styles.modalHeader} {...panResponder.panHandlers}>
            <Text style={styles.modalTitle}>
              {certOnlyMode ? 'Sijil' : (employeeForm.id ? 'Butiran Anggota' : 'Tambah Anggota')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {canDirectEdit && !isEditing && !certOnlyMode && employeeForm.id && (
                <TouchableOpacity
                  onPress={() => setDirectEditMode((v) => !v)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                >
                  <Text style={{ color: PALETTE.orange, fontWeight: '700', fontSize: 12 }}>
                    {directEditMode ? 'Selesai' : 'Kemaskini'}
                  </Text>
                </TouchableOpacity>
              )}
              {employeeForm.id && isEditing && !certOnlyMode && (
                <TouchableOpacity onPress={() => setConfirmDeleteEmployee(true)}>
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
                  <View style={[styles.profilePhotoLarge, styles.employeeAvatarPlaceholder]}>
                    <User size={40} color={PALETTE.textMutedDark} />
                  </View>
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
                  onDelete={requestDeleteCert}
                />
              </>
            ) : (
              <>
                {!effectiveEditing && !showFullDetail && (
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

                {(effectiveEditing || showFullDetail) && (
                  <>
                    <ScrollView
                      horizontal={isMobile}
                      showsHorizontalScrollIndicator={false}
                      style={styles.tabBarScroll}
                    >
                      <View style={[styles.tabBar, !isMobile && { flex: 1 }]}>
                        {EMPLOYEE_TABS.map((tab) => (
                          <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[
                              styles.tabBtn,
                              { alignItems: 'center' },
                              isMobile ? styles.tabBtnMobile : { flex: 1 },
                              activeTab === tab && styles.tabBtnActive,
                            ]}
                          >
                            <Text
                              style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}
                              numberOfLines={1}
                            >
                              {tab}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {activeTab === 'Sijil' ? (
                      <CertificatesTab
                        certificates={certificates}
                        isEditing={effectiveEditing}
                        onAdd={openAddCert}
                        onEdit={openEditCert}
                        onOpenLink={onOpenCertLink}
                        onDelete={requestDeleteCert}
                      />
                    ) : (
                      <>
                        {FIELD_GROUPS[activeTab]?.map((f) => (
                          <EmployeeField
                            key={f.key}
                            field={f}
                            form={employeeForm}
                            setForm={setEmployeeForm}
                            isEditing={effectiveEditing}
                            activeDatePickerField={activeDatePickerField}
                            setActiveDatePickerField={setActiveDatePickerField}
                          />
                        ))}
                        {activeTab === 'Pangkat' && (
                          <PromotionHistoryList promotionHistoryList={promotionHistoryList} />
                        )}
                      </>
                    )}

                    {!effectiveEditing && activeTab !== 'Sijil' && (
                      <TouchableOpacity onPress={() => setShowFullDetail(false)} style={{ marginTop: 15 }}>
                        <Text style={{ color: PALETTE.textMutedDark, fontWeight: '600' }}>← Kembali ke ringkasan</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </>
            )}

            {effectiveEditing && !certOnlyMode && (
              <TouchableOpacity style={styles.saveButton} onPress={onSaveEmployee}>
                <Text style={styles.saveButtonText}>Simpan Anggota</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </View>

      <CertEditModal
        visible={certModalVisible}
        isNew={!certForm.id}
        certForm={certForm}
        setCertForm={setCertForm}
        onSave={handleSaveCert}
        onClose={() => setCertModalVisible(false)}
      />

      <Modal visible={confirmDeleteEmployee} transparent animationType="fade" onRequestClose={() => !isDeletingEmployee && setConfirmDeleteEmployee(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmBanner}>
              <View style={styles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={styles.confirmTitle}>Padam Anggota</Text>
              <Text style={styles.confirmSubtitle}>
                Padam anggota "{employeeForm.nama}"? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, isDeletingEmployee && { opacity: 0.5 }]}
                onPress={() => setConfirmDeleteEmployee(false)}
                disabled={isDeletingEmployee}
              >
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmConfirmBtn, isDeletingEmployee && { opacity: 0.7 }]}
                onPress={handleConfirmDeleteEmployee}
                disabled={isDeletingEmployee}
              >
                {isDeletingEmployee ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={styles.confirmConfirmText}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmDeleteCertId !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteCertId(null)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmBanner}>
              <View style={styles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={styles.confirmTitle}>Padam Sijil</Text>
              <Text style={styles.confirmSubtitle}>
                Adakah anda pasti mahu memadam sijil "{displayDeleteCertRef.current?.nom_certificat}"? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, isDeletingCert && { opacity: 0.5 }]}
                onPress={() => setConfirmDeleteCertId(null)}
                disabled={isDeletingCert}
              >
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmConfirmBtn, isDeletingCert && { opacity: 0.7 }]}
                onPress={confirmDeleteCert}
                disabled={isDeletingCert}
              >
                {isDeletingCert ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={styles.confirmConfirmText}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}