// src/screens/sekretariat/JpbdSection.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { Briefcase, Plus, Edit, Trash2, X } from 'lucide-react-native';
import { useJpbdDirectory } from '../../hooks/useJpbdDirectory';
import { sharedStyles as styles } from './sharedStyles';

export default function JpbdSection({ userRole, isEditMode }) {
  const [expandedId, setExpandedId] = useState(null);
  const {
    jpbdList, loadingJPBD,
    modalJpbdVisible, setModalJpbdVisible,
    formModeJpbd, formJpbd, setFormJpbd,
    openAddModal, openEditModal,
    handleSaveJPBD, confirmDeleteJPBD,
  } = useJpbdDirectory();

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <View>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Direktori Agensi (JPBD)</Text>
        {userRole === 'admin' && isEditMode ? (
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Plus size={16} color="#fff" />
            <Text style={styles.addButtonText}>Tambah</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loadingJPBD && jpbdList.length === 0 ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 20 }} />
      ) : jpbdList.length === 0 ? (
        <Text style={styles.emptyText}>Tiada rekod dijumpai. Sila tambah agensi.</Text>
      ) : (
        jpbdList.map((item, index) => {
          const isExpanded = expandedId === item.id;
          return (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity style={styles.header} onPress={() => toggleExpand(item.id)} activeOpacity={0.7}>
                <View style={styles.headerContent}>
                  <Text style={jpbdStyles.agencyName}>{index + 1}. {item.agency}</Text>
                  {item.officer ? <Text style={jpbdStyles.officerName}>{item.officer}</Text> : null}
                </View>
                <Briefcase size={20} color="#1E3A8A" />
              </TouchableOpacity>

              {isExpanded ? (
                <View style={styles.body}>
                  {userRole === 'admin' && isEditMode ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                        <Edit size={14} color="#fff" />
                        <Text style={styles.actionText}>Kemaskini</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDeleteJPBD(item.id)}>
                        <Trash2 size={14} color="#fff" />
                        <Text style={styles.actionText}>Padam</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View style={styles.section}>
                    <Text style={styles.label}>Jawatan: <Text style={styles.value}>{item.position || '-'}</Text></Text>
                    <Text style={styles.label}>Email: <Text style={styles.value}>{item.email || '-'}</Text></Text>
                    <Text style={styles.label}>Gred: <Text style={styles.value}>{item.grade || '-'}</Text></Text>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Hubungan & Logistik</Text>
                  <Text style={styles.label}>Alamat: <Text style={styles.value}>{item.address || '-'}</Text></Text>

                  <View style={styles.row}>
                    <View style={styles.halfCol}><Text style={styles.label}>Tel (Pejabat):</Text><Text style={styles.value}>{item.office_phone || '-'}</Text></View>
                    <View style={styles.halfCol}><Text style={styles.label}>Tel (Bimbit):</Text><Text style={styles.value}>{item.mobile_phone || '-'}</Text></View>
                  </View>
                  <Text style={[styles.label, { marginTop: 4 }]}>Fax: <Text style={styles.value}>{item.fax || '-'}</Text></Text>

                  {(item.officers_count || item.members_count) ? (
                    <>
                      <View style={[styles.divider, { marginVertical: 8 }]} />
                      <Text style={styles.subTitle}>Kekuatan Anggota</Text>
                      <View style={styles.row}>
                        <View style={styles.halfCol}><Text style={styles.statLabel}>Pegawai</Text><Text style={styles.statValue2}>{item.officers_count || '0'}</Text></View>
                        <View style={styles.halfCol}><Text style={styles.statLabel}>Anggota</Text><Text style={styles.statValue2}>{item.members_count || '0'}</Text></View>
                      </View>
                    </>
                  ) : null}

                  {item.logistics_assets ? (
                    <View style={styles.logisticsBox}>
                      <Text style={styles.subTitle}>Logistik & Aset:</Text>
                      <Text style={styles.logItem}>{item.logistics_assets}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })
      )}

      <Modal visible={modalJpbdVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModeJpbd === 'add' ? 'Tambah Agensi' : 'Kemaskini Agensi'}</Text>
              <TouchableOpacity onPress={() => setModalJpbdVisible(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Agensi *</Text>
              <TextInput style={styles.input} placeholder="Contoh: PDRM" value={formJpbd.agency} onChangeText={(t) => setFormJpbd({ ...formJpbd, agency: t })} />
              <Text style={styles.inputLabel}>Nama Pegawai</Text>
              <TextInput style={styles.input} placeholder="Nama penuh pegawai" value={formJpbd.officer} onChangeText={(t) => setFormJpbd({ ...formJpbd, officer: t })} />
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Jawatan</Text>
                  <TextInput style={styles.input} placeholder="Cth: Pengarah" value={formJpbd.position} onChangeText={(t) => setFormJpbd({ ...formJpbd, position: t })} />
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Gred</Text>
                  <TextInput style={styles.input} placeholder="Cth: KB 9" value={formJpbd.grade} onChangeText={(t) => setFormJpbd({ ...formJpbd, grade: t })} />
                </View>
              </View>
              <Text style={styles.inputLabel}>E-mel</Text>
              <TextInput style={styles.input} placeholder="emel@domain.com" keyboardType="email-address" value={formJpbd.email} onChangeText={(t) => setFormJpbd({ ...formJpbd, email: t })} />
              <Text style={styles.inputLabel}>Alamat</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Alamat penuh" multiline value={formJpbd.address} onChangeText={(t) => setFormJpbd({ ...formJpbd, address: t })} />
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Tel Pejabat</Text>
                  <TextInput style={styles.input} placeholder="087-XXXXXX" keyboardType="phone-pad" value={formJpbd.office_phone} onChangeText={(t) => setFormJpbd({ ...formJpbd, office_phone: t })} />
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Tel Bimbit</Text>
                  <TextInput style={styles.input} placeholder="01X-XXXXXXX" keyboardType="phone-pad" value={formJpbd.mobile_phone} onChangeText={(t) => setFormJpbd({ ...formJpbd, mobile_phone: t })} />
                </View>
              </View>
              <Text style={styles.inputLabel}>No. Fax</Text>
              <TextInput style={styles.input} placeholder="087-XXXXXX" keyboardType="phone-pad" value={formJpbd.fax} onChangeText={(t) => setFormJpbd({ ...formJpbd, fax: t })} />
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Bil. Pegawai</Text>
                  <TextInput style={styles.input} placeholder="Cth: 5" keyboardType="number-pad" value={formJpbd.officers_count} onChangeText={(t) => setFormJpbd({ ...formJpbd, officers_count: t })} />
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Bil. Anggota</Text>
                  <TextInput style={styles.input} placeholder="Cth: 30" keyboardType="number-pad" value={formJpbd.members_count} onChangeText={(t) => setFormJpbd({ ...formJpbd, members_count: t })} />
                </View>
              </View>
              <Text style={styles.inputLabel}>Logistik & Aset (Senaraikan)</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Cth: 3 Buah Hilux, 2 Bot Aluminium..." multiline value={formJpbd.logistics_assets} onChangeText={(t) => setFormJpbd({ ...formJpbd, logistics_assets: t })} />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveJPBD}>
                {loadingJPBD ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Simpan Rekod</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const jpbdStyles = StyleSheet.create({
  agencyName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  officerName: { fontSize: 13, color: '#64748b', marginTop: 4 },
});