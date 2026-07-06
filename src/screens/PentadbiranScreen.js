// src/screen/PentadbiranScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, TextInput, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { UserCog, Key, Edit, X, ShieldAlert, Trash2 } from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import AdminEditButton from '../components/AdminEditButton';

const PentadbiranScreen = ({ theme, userRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  const [deleteModalConfig, setDeleteModalConfig] = useState({ visible: false, userId: null, username: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [userAccounts, setUserAccounts] = useState([]);

  const defaultData = {
    dikemaskini: '23/2/2026',
    pecahanUnit: ['Unit Pentadbiran', 'Unit Kewangan', 'Unit Aset, Stok dan Logistik'],
    unitPentadbiran: [
      { name: '1. Norhana binti Sabudin (Gred N2)', role: '(Pembantu Tadbir Perkeranian/Operasi)' },
      { name: '2. Fatin Othman (Gred N1)', role: '(Sumber Manusia)' },
      { name: '3. Mohd Rizuan Bin Abdullah (Gred H1)', role: '(Rekod dan ICT)' }
    ],
    waran: [
      { label: 'PERJAWATAN', kp9: '1', kp5: '1', kp2: '1', n2: '1', kp1: '4', n1: '1', h1: '1', jumlah: '14' },
      { label: 'PENGISIAN', kp9: '1', kp5: '0', kp2: '1', n2: '1', kp1: '2', n1: '1', h1: '1', jumlah: '11' },
      { label: 'KOSONG', kp9: '0', kp5: '1', kp2: '0', n2: '0', kp1: '2', n1: '0', h1: '0', jumlah: '3' }
    ],
    pdpa: [
      { label: 'Projek pembinaan Pejabat Awam Wilayah Persekutuan Labuan di bawah RP1 RMLK 13', percent: '11' },
      { label: 'Cadangan projek pembinaan satu (1) unit Multi Purpose Trailer (MPT-X1)', percent: '5' }
    ],
    kpi: [
      { title: 'Permohonan pelanjutan penyewaan ruang pejabat di premis bukan milik APM', score: '--' },
      { title: 'Pendaftaran Aset Alih Kerajaan', score: '--' },
      { title: 'Penggunaan Sistem MRO', score: '100%' },
      { title: 'Pengurusan internet pejabat', score: '100%' }
    ],
    tanggungjawab: [
      { name: 'Mej. (PA) Wan Jabir Bin Wan Mohd Badrudin', kursus: '3', tapisan: '0000' },
      { name: '-', kursus: '0', tapisan: '0000' }
    ],
    pematuhan: [
      { score: '87', title: 'Keselamatan Perlindungan', desc: 'Pejabat Ketua Pegawai Keselamatan Kerajaan Malaysia (CGSO)' },
      { score: '90', title: 'Keselamatan Dan Kesihatan Pekerjaan', desc: 'Jabatan Keselamatan Dan Kesihatan Pekerjaan (DOSH)' }
    ]
  };

  useEffect(() => {
    fetchData();
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true }); 

      if (error) throw error;
      setUserAccounts(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (Platform.OS === 'web') window.alert('Ralat menarik data pengguna dari database.');
      else Alert.alert('Ralat', 'Gagal memuat turun senarai pengguna.');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pentadbiran_data')
        .select('data_json')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPageData(data?.data_json || defaultData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPageData(defaultData);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('pentadbiran_data')
        .upsert({ id: 1, data_json: pageData });

      if (error) throw error;
      
      Alert.alert('Berjaya', 'Maklumat telah dikemaskini.');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Ralat', 'Gagal menyimpan data. Pastikan anda log masuk sebagai Admin.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setPageData(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (section, index, field, value) => {
    setPageData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)); 
      if (field === null) {
        newData[section][index] = value; 
      } else {
        newData[section][index][field] = value; 
      }
      return newData;
    });
  };

  const addArrayItem = (section, emptyItem) => {
    const newData = { ...pageData };
    newData[section].push(emptyItem);
    setPageData(newData);
  };

  const removeArrayItem = (section, index) => {
    const newData = { ...pageData };
    newData[section].splice(index, 1);
    setPageData(newData);
  };

  const openOrgChart = () => {
    Linking.openURL('https://www.civildefence.gov.my/wilayah-persekutuan-labuan/');
  };

  const handleUpdateCredentials = async () => {
    if (!newUsername) {
      if (Platform.OS === 'web') window.alert('Sila masukkan nama pengguna baru.');
      else Alert.alert('Ralat', 'Sila masukkan nama pengguna baru.');
      return;
    }
    setIsUpdatingUser(true);
    try {
      const { error } = await supabase.rpc('update_user_credentials', {
        target_user_id: editingUser.id,
        new_username: newUsername,
        new_password: newPassword || null
      });
      if (error) throw error;
      setUserAccounts(prev => prev.map(user => user.id === editingUser.id ? { ...user, username: newUsername } : user));
      setUserModalVisible(false);
      Alert.alert('Berjaya', `Kredensial untuk ${newUsername} telah dikemaskini.`);
    } catch (error) {
      console.error("Error updating user:", error);
      Alert.alert('Ralat', 'Gagal mengemaskini pengguna.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const openUserEditModal = (user) => {
    setEditingUser(user);
    setNewUsername(user.username);
    setNewPassword(''); 
    setUserModalVisible(true);
  };

  const triggerDeleteModal = (userId, username) => {
    setDeleteModalConfig({ visible: true, userId, username });
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    const { userId, username } = deleteModalConfig;
    try {
      const { error } = await supabase.rpc('delete_user_account', { target_user_id: userId });
      if (error) throw error;
      setUserAccounts(prev => prev.filter(user => user.id !== userId));
      setDeleteModalConfig({ visible: false, userId: null, username: '' });
      Alert.alert('Berjaya', `Pengguna ${username} telah dipadam.`);
    } catch (error) {
      console.error("Error deleting user:", error);
      Alert.alert('Ralat', 'Gagal memadam pengguna.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && !pageData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2980b9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* STICKY HEADER - ADMIN CONTROLS */}
      {userRole === 'admin' && (
        <View style={styles.stickyHeader}>
          {isEditing && (
            <TouchableOpacity 
              style={styles.stickySaveBtn}
              onPress={handleSave}
            >
              <Text style={styles.stickySaveBtnText}>💾 Simpan Perubahan</Text>
            </TouchableOpacity>
          )}
          <AdminEditButton 
            isEditMode={isEditing} 
            setIsEditMode={setIsEditing} 
            userRole={userRole} 
          />
        </View>
      )}

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.contentContainer}>
        
        {/* HEADER & CARTA ORGANISASI LINK */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
            <Text style={styles.headerTitle}>DIKEMASKINI </Text>
            {isEditing ? (
              <TextInput style={[styles.input, { width: 100 }]} value={pageData.dikemaskini} onChangeText={(text) => updateField('dikemaskini', text)} />
            ) : (
              <Text style={styles.headerTitle}>{pageData.dikemaskini}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.linkButton} onPress={openOrgChart}>
            <Text style={styles.linkButtonText}>Lihat Carta Organisasi Rasmi</Text>
          </TouchableOpacity>
        </View>

        {/* INSPEKTORAT PEMATUHAN */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>INSPEKTORAT PEMATUHAN</Text>
          <View style={styles.complianceRow}>
            {pageData.pematuhan.map((item, index) => (
              <View key={`pematuhan-${index}`} style={styles.complianceBox}>
                {isEditing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <View style={{ flex: 1 }}>
                      <TextInput style={[styles.input, { marginBottom: 5, textAlign: 'center', fontWeight: 'bold' }]} value={item.score} onChangeText={(text) => updateArrayField('pematuhan', index, 'score', text)} keyboardType="numeric" placeholder="Skor %" />
                      <TextInput style={[styles.input, { marginBottom: 5, textAlign: 'center' }]} value={item.title} onChangeText={(text) => updateArrayField('pematuhan', index, 'title', text)} multiline />
                      <TextInput style={[styles.input, { textAlign: 'center' }]} value={item.desc} onChangeText={(text) => updateArrayField('pematuhan', index, 'desc', text)} multiline />
                    </View>
                    <TouchableOpacity onPress={() => removeArrayItem('pematuhan', index)}><Text style={styles.delBtn}>X</Text></TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.complianceScore}>{item.score}%</Text>
                    <Text style={styles.complianceTitle}>{item.title}</Text>
                    <Text style={styles.complianceDesc}>{item.desc}</Text>
                  </>
                )}
              </View>
            ))}
          </View>
          {isEditing && (
             <TouchableOpacity onPress={() => addArrayItem('pematuhan', { score: '0', title: 'Tajuk Baru', desc: 'Penerangan Baru' })} style={styles.addBtn}>
               <Text style={styles.addBtnText}>+ Tambah Pematuhan</Text>
             </TouchableOpacity>
          )}
        </View>

        {/* WARAN PERJAWATAN TABLE */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>WARAN PERJAWATAN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.cellHeader, {width: 100}]}>GRED</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>KP9</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>KP5</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>KP2</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>N2</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>KP1</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>N1</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>H1</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>JUMLAH</Text>
              </View>
              {pageData.waran.map((row, index) => (
                <View key={`waran-${index}`} style={styles.tableRow}>
                  {isEditing ? (
                    <TextInput style={[styles.tableCell, styles.tableInput, styles.rowLabel, {width: 100, textAlign: 'left'}]} value={row.label} onChangeText={(text) => updateArrayField('waran', index, 'label', text)} />
                  ) : (
                    <Text style={[styles.tableCell, styles.rowLabel, {width: 100, textAlign: 'left'}]}>{row.label}</Text>
                  )}
                  {['kp9', 'kp5', 'kp2', 'n2', 'kp1', 'n1', 'h1', 'jumlah'].map(key => (
                    isEditing ? (
                      <TextInput key={key} style={[styles.tableCell, styles.tableInput, key === 'jumlah' ? styles.boldCell : null]} value={row[key]} onChangeText={(text) => updateArrayField('waran', index, key, text)} keyboardType="numeric" />
                    ) : (
                      <Text key={key} style={[styles.tableCell, key === 'jumlah' ? styles.boldCell : null]}>{row[key]}</Text>
                    )
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* PROJEK PDPA */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PROJEK PDPA WILAYAH PERSEKUTUAN LABUAN</Text>
          {pageData.pdpa.map((item, index) => (
            <View key={`pdpa-${index}`} style={styles.progressItem}>
              {isEditing ? (
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <View style={{ flex: 1 }}>
                     <TextInput style={[styles.input, { marginBottom: 5 }]} value={item.label} onChangeText={(text) => updateArrayField('pdpa', index, 'label', text)} multiline />
                     <TextInput style={styles.input} value={item.percent} onChangeText={(text) => updateArrayField('pdpa', index, 'percent', text)} keyboardType="numeric" placeholder="Peratusan %" />
                   </View>
                   <TouchableOpacity onPress={() => removeArrayItem('pdpa', index)}><Text style={styles.delBtn}>X</Text></TouchableOpacity>
                 </View>
              ) : (
                <>
                  <Text style={styles.progressLabel}>{item.label}</Text>
                  <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${item.percent}%`, backgroundColor: parseInt(item.percent) > 10 ? '#f39c12' : '#e74c3c' }]} />
                  </View>
                  <Text style={styles.progressPercent}>{item.percent}%</Text>
                </>
              )}
            </View>
          ))}
          {isEditing && (
             <TouchableOpacity onPress={() => addArrayItem('pdpa', { label: 'Projek Baru', percent: '0' })} style={styles.addBtn}>
               <Text style={styles.addBtnText}>+ Tambah Projek</Text>
             </TouchableOpacity>
          )}
        </View>

        {/* KPI SECTION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>KEY PERFORMANCE INDICATOR (KPI)</Text>
          <View style={styles.kpiGrid}>
            {pageData.kpi.map((item, index) => (
              <View key={`kpi-${index}`} style={[styles.kpiCard, isEditing ? { width: '100%' } : null]}>
                {isEditing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <View style={{ flex: 1 }}>
                      <TextInput style={[styles.input, { marginBottom: 5 }]} value={item.title} onChangeText={(text) => updateArrayField('kpi', index, 'title', text)} multiline />
                      <TextInput style={styles.input} value={item.score} onChangeText={(text) => updateArrayField('kpi', index, 'score', text)} placeholder="Skor" />
                    </View>
                    <TouchableOpacity onPress={() => removeArrayItem('kpi', index)}><Text style={styles.delBtn}>X</Text></TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.kpiNumber}>0{index + 1}</Text>
                    <Text style={styles.kpiText}>{item.title}</Text>
                    <Text style={styles.kpiScore}>{item.score}</Text>
                  </>
                )}
              </View>
            ))}
          </View>
          {isEditing && (
             <TouchableOpacity onPress={() => addArrayItem('kpi', { title: 'KPI Baru', score: '--' })} style={styles.addBtn}>
               <Text style={styles.addBtnText}>+ Tambah KPI</Text>
             </TouchableOpacity>
          )}
        </View>

        {/* TANGGUNGJAWAB TABLE */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>TANGGUNGJAWAB</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.cellHeader, {width: 250}]}>KAKITANGAN</Text>
                <Text style={[styles.tableCell, styles.cellHeader, {width: 120}]}>KEHADIRAN KURSUS</Text>
                <Text style={[styles.tableCell, styles.cellHeader, {width: 150}]}>TAPISAN KESELAMATAN</Text>
                {isEditing && <Text style={[styles.tableCell, styles.cellHeader, {width: 50}]}>T</Text>}
              </View>
              
              {pageData.tanggungjawab.map((staff, index) => (
                <View key={`staff-${index}`} style={styles.tableRow}>
                  {isEditing ? (
                    <>
                      <TextInput style={[styles.tableCell, styles.tableInput, {width: 250, textAlign: 'left'}]} value={staff.name} onChangeText={(text) => updateArrayField('tanggungjawab', index, 'name', text)} />
                      <TextInput style={[styles.tableCell, styles.tableInput, {width: 120}]} value={staff.kursus} onChangeText={(text) => updateArrayField('tanggungjawab', index, 'kursus', text)} keyboardType="numeric" />
                      <TextInput style={[styles.tableCell, styles.tableInput, {width: 150}]} value={staff.tapisan} onChangeText={(text) => updateArrayField('tanggungjawab', index, 'tapisan', text)} keyboardType="numeric" />
                      <TouchableOpacity style={[styles.tableCell, {width: 50, justifyContent: 'center', alignItems: 'center'}]} onPress={() => removeArrayItem('tanggungjawab', index)}>
                        <Text style={{color: 'red', fontWeight: 'bold'}}>X</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.tableCell, {width: 250, textAlign: 'left', paddingLeft: 10}]}>{staff.name}</Text>
                      <Text style={[styles.tableCell, {width: 120}]}>{staff.kursus}</Text>
                      <Text style={[styles.tableCell, {width: 150}]}>{staff.tapisan}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
          {isEditing && (
             <TouchableOpacity onPress={() => addArrayItem('tanggungjawab', { name: '-', kursus: '0', tapisan: '0000' })} style={[styles.addBtn, { marginTop: 10 }]}>
               <Text style={styles.addBtnText}>+ Tambah Kakitangan</Text>
             </TouchableOpacity>
          )}
        </View>

        {/* BAHAGIAN KHIDMAT PENGURUSAN */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>BAHAGIAN KHIDMAT PENGURUSAN</Text>
          
          <View style={styles.unitContainer}>
            <View style={styles.unitBox}>
              <Text style={styles.boxTitle}>PECAHAN UNIT</Text>
              {pageData.pecahanUnit.map((item, index) => (
                <View key={`pecahan-${index}`} style={styles.editRow}>
                  {isEditing ? (
                    <>
                      <TextInput style={[styles.input, { flex: 1, marginBottom: 5 }]} value={item} onChangeText={(text) => updateArrayField('pecahanUnit', index, null, text)} />
                      <TouchableOpacity onPress={() => removeArrayItem('pecahanUnit', index)}><Text style={styles.delBtn}>X</Text></TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.listItem}>• {item}</Text>
                  )}
                </View>
              ))}
              {isEditing && (
                <TouchableOpacity onPress={() => addArrayItem('pecahanUnit', 'Unit Baru')} style={styles.addBtn}>
                  <Text style={styles.addBtnText}>+ Tambah</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.unitBox}>
              <Text style={styles.boxTitle}>UNIT PENTADBIRAN</Text>
              {pageData.unitPentadbiran.map((item, index) => (
                <View key={`pentadbiran-${index}`} style={styles.editRowBlock}>
                  {isEditing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                      <View style={{ flex: 1 }}>
                        <TextInput style={styles.input} value={item.name} onChangeText={(text) => updateArrayField('unitPentadbiran', index, 'name', text)} />
                        <TextInput style={[styles.input, { marginTop: 5 }]} value={item.role} onChangeText={(text) => updateArrayField('unitPentadbiran', index, 'role', text)} />
                      </View>
                      <TouchableOpacity onPress={() => removeArrayItem('unitPentadbiran', index)}><Text style={styles.delBtn}>X</Text></TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.listItem}>{item.name}</Text>
                      <Text style={styles.subListItem}>{item.role}</Text>
                    </>
                  )}
                </View>
              ))}
              {isEditing && (
                <TouchableOpacity onPress={() => addArrayItem('unitPentadbiran', { name: 'Nama', role: '(Peranan)' })} style={styles.addBtn}>
                  <Text style={styles.addBtnText}>+ Tambah</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* PENGURUSAN PENGGUNA SISTEM (ADMIN ONLY) */}
        {userRole === 'admin' && isEditing && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#ecf0f1', paddingBottom: 10 }}>
              <UserCog size={20} color="#2980b9" style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { marginBottom: 0, borderBottomWidth: 0 }]}>PENGURUSAN KREDENSIAL PENGGUNA</Text>
            </View>

            <View style={{ backgroundColor: '#fff3cd', padding: 10, borderRadius: 8, marginBottom: 15, flexDirection: 'row', alignItems: 'center' }}>
              <ShieldAlert size={16} color="#856404" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 11, color: '#856404', flex: 1 }}>
                Amaran: Penukaran kata laluan akan log keluar pengguna tersebut dari sistem secara automatik.
              </Text>
            </View>

            {userAccounts.map((user) => (
              <View key={user.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ecf0f1' }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e50' }}>{user.username}</Text>
                  <Text style={{ fontSize: 11, color: '#7f8c8d', textTransform: 'uppercase' }}>Peranan: {user.role}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, alignItems: 'center' }} onPress={() => openUserEditModal(user)}>
                    <Key size={14} color="#2980b9" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#2980b9' }}>Akses</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={{ flexDirection: 'row', backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, alignItems: 'center' }} onPress={() => triggerDeleteModal(user.id, user.username)}>
                    <Trash2 size={14} color="#ef4444" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#ef4444' }}>Padam</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* MODALS */}
      <Modal visible={isUserModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kemaskini Akses Pengguna</Text>
              <TouchableOpacity onPress={() => setUserModalVisible(false)}><X size={24} color="#7f8c8d" /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nama Pengguna / Username</Text>
              <TextInput style={styles.modalInput} value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" />
              <Text style={styles.inputLabel}>Kata Laluan Baru (Biarkan kosong jika tidak mahu tukar)</Text>
              <TextInput style={styles.modalInput} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Masukkan kata laluan baru..." />
              <TouchableOpacity style={[styles.saveButton, isUpdatingUser && { opacity: 0.7 }]} onPress={handleUpdateCredentials} disabled={isUpdatingUser}>
                {isUpdatingUser ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Simpan Kredensial</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteModalConfig.visible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 400 }]}>
            <View style={[styles.modalHeader, { borderBottomWidth: 0, paddingBottom: 10, paddingTop: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#fee2e2', padding: 8, borderRadius: 20, marginRight: 12 }}><ShieldAlert size={24} color="#ef4444" /></View>
                <Text style={[styles.modalTitle, { color: '#b91c1c', fontSize: 18 }]}>Pengesahan Padam</Text>
              </View>
            </View>
            <View style={[styles.modalBody, { paddingTop: 10 }]}>
              <Text style={{ fontSize: 14, color: '#475569', marginBottom: 25, lineHeight: 22 }}>
                Adakah anda pasti mahu memadam akses untuk pengguna <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>'{deleteModalConfig.username}'</Text>? Tindakan ini kekal dan tidak boleh dipulihkan.
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                <TouchableOpacity style={{ paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#f1f5f9' }} onPress={() => setDeleteModalConfig({ visible: false, userId: null, username: '' })} disabled={isDeleting}>
                  <Text style={{ color: '#475569', fontWeight: 'bold' }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center' }} onPress={executeDelete} disabled={isDeleting}>
                  {isDeleting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ya, Padam</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  
  // New Sticky Header Styles
  stickyHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    zIndex: 10,
    elevation: 4, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    gap: 10
  },
  stickySaveBtn: {
    backgroundColor: '#27ae60', 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 8
  },
  stickySaveBtnText: {
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14
  },

  scrollArea: { flex: 1 },
  contentContainer: { padding: 15 },
  card: { backgroundColor: '#ffffff', borderRadius: 10, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  linkButton: { backgroundColor: '#2980b9', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  linkButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2980b9', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#ecf0f1', paddingBottom: 5 },
  unitContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  unitBox: { flex: 1, backgroundColor: '#f8f9f9', padding: 10, borderRadius: 8, marginHorizontal: 5 },
  boxTitle: { fontWeight: 'bold', marginBottom: 8, color: '#34495e' },
  listItem: { fontSize: 13, color: '#2c3e50', marginBottom: 4 },
  subListItem: { fontSize: 12, color: '#7f8c8d', marginLeft: 15, marginBottom: 6, fontStyle: 'italic' },
  table: { borderWidth: 1, borderColor: '#bdc3c7', borderRadius: 5, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#bdc3c7' },
  tableHeader: { backgroundColor: '#ecf0f1' },
  tableCell: { width: 60, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#bdc3c7', fontSize: 12 },
  tableInput: { padding: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0' },
  cellHeader: { fontWeight: 'bold', color: '#2c3e50' },
  rowLabel: { fontWeight: 'bold', backgroundColor: '#f8f9f9' },
  boldCell: { fontWeight: 'bold' },
  progressItem: { marginBottom: 15 },
  progressLabel: { fontSize: 13, color: '#34495e', marginBottom: 5 },
  progressBarBackground: { height: 10, backgroundColor: '#ecf0f1', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  progressPercent: { fontSize: 12, color: '#7f8c8d', textAlign: 'right', marginTop: 2, fontWeight: 'bold' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  kpiCard: { width: '48%', backgroundColor: '#f8f9f9', padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e5e8e8' },
  kpiNumber: { fontSize: 20, fontWeight: 'bold', color: '#3498db', marginBottom: 5 },
  kpiText: { fontSize: 11, textAlign: 'center', color: '#7f8c8d', marginBottom: 10 },
  kpiScore: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71' },
  complianceRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  complianceBox: { flex: 1, minWidth: '45%', backgroundColor: '#e8f6f3', padding: 15, borderRadius: 8, marginHorizontal: 5, marginBottom: 10, alignItems: 'center' },
  complianceScore: { fontSize: 24, fontWeight: 'bold', color: '#1abc9c', marginBottom: 5 },
  complianceTitle: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', color: '#16a085', marginBottom: 5 },
  complianceDesc: { fontSize: 11, textAlign: 'center', color: '#7f8c8d' },
  input: { borderWidth: 1, borderColor: '#bdc3c7', borderRadius: 5, padding: 6, fontSize: 12, backgroundColor: '#fff' },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editRowBlock: { marginBottom: 10 },
  delBtn: { color: 'red', fontWeight: 'bold', marginLeft: 10, padding: 5 },
  addBtn: { marginTop: 10, padding: 8, backgroundColor: '#ecf0f1', borderRadius: 5, alignItems: 'center' },
  addBtnText: { color: '#2980b9', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 5, width: '100%', maxWidth: 500 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ecf0f1' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 8, marginTop: 10 },
  modalInput: { borderWidth: 1, borderColor: '#bdc3c7', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#f8f9f9', marginBottom: 10 },
  saveButton: { backgroundColor: '#2980b9', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});

export default PentadbiranScreen;