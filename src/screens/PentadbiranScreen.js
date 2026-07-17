// src/screen/PentadbiranScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, TextInput, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { UserCog, Key, X, ShieldAlert, Trash2 } from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import { supabaseSandbox } from '../supabaseSandboxClient';
import AdminEditButton from '../components/AdminEditButton';
import { TACTICAL_THEME as T, SPACING, RADIUS } from '../styles/tacticalTheme';
import { SectionHeader } from '../styles/tacticalComponents';

const KPI_SECTION = 'pentadbiran'; // change per screen: 'kewangan', 'logistik', ...

const PentadbiranScreen = ({ theme: _theme, userRole }) => {
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

  const [kpiItems, setKpiItems] = useState([]);
  const [kpiToDelete, setKpiToDelete] = useState([]);

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
    fetchKpi();
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  const fetchKpi = async () => {
    try {
      const { data, error } = await supabaseSandbox
        .from('kpi')
        .select('*')
        .eq('section', KPI_SECTION)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setKpiItems(data || []);
    } catch (error) {
      console.error('Error fetching kpi:', error);
    }
  };

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
      const { data, error } = await supabaseSandbox
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
      const { error } = await supabaseSandbox
        .from('pentadbiran_data')
        .upsert({ id: 1, data_json: pageData });

      if (error) throw error;

      await saveKpiItems();

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

  // --- KPI (table sandbox.kpi, filtrée par section) ---
  const updateKpiField = (index, field, value) => {
    setKpiItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addKpiItem = () => {
    setKpiItems(prev => [
      ...prev,
      { id: null, section: KPI_SECTION, nama: 'KPI Baru', tafsiran: '', sasaran: '--', display_order: prev.length }
    ]);
  };

  const removeKpiItem = (index) => {
    const item = kpiItems[index];
    if (item.id) setKpiToDelete(prev => [...prev, item.id]);
    setKpiItems(prev => prev.filter((_, i) => i !== index));
  };

  const saveKpiItems = async () => {
    if (kpiToDelete.length > 0) {
      await supabaseSandbox.from('kpi').delete().in('id', kpiToDelete);
    }
    for (let i = 0; i < kpiItems.length; i++) {
      const item = kpiItems[i];
      const payload = {
        section: KPI_SECTION,
        nama: item.nama,
        tafsiran: item.tafsiran,
        sasaran: item.sasaran,
        display_order: i,
      };
      if (item.id) {
        await supabaseSandbox.from('kpi').update(payload).eq('id', item.id);
      } else {
        await supabaseSandbox.from('kpi').insert([payload]);
      }
    }
    setKpiToDelete([]);
    fetchKpi();
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
        <ActivityIndicator size="large" color={T.accent} />
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
          <SectionHeader title="INSPEKTORAT PEMATUHAN" />
          <View style={styles.complianceRow}>
            {pageData.pematuhan.map((item, index) => (
              <View key={`pematuhan-${index}`} style={styles.complianceBox}>
                {isEditing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <View style={{ flex: 1 }}>
                      <TextInput style={[styles.input, { marginBottom: 5, textAlign: 'center', fontWeight: 'bold' }]} value={item.score} onChangeText={(text) => updateArrayField('pematuhan', index, 'score', text)} keyboardType="numeric" placeholder="Skor %" placeholderTextColor={T.textMuted} />
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
          <SectionHeader title="WARAN PERJAWATAN" />
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
          <SectionHeader title="PROJEK PDPA WILAYAH PERSEKUTUAN LABUAN" />
          {pageData.pdpa.map((item, index) => (
            <View key={`pdpa-${index}`} style={styles.progressItem}>
              {isEditing ? (
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <View style={{ flex: 1 }}>
                     <TextInput style={[styles.input, { marginBottom: 5 }]} value={item.label} onChangeText={(text) => updateArrayField('pdpa', index, 'label', text)} multiline />
                     <TextInput style={styles.input} value={item.percent} onChangeText={(text) => updateArrayField('pdpa', index, 'percent', text)} keyboardType="numeric" placeholder="Peratusan %" placeholderTextColor={T.textMuted} />
                   </View>
                   <TouchableOpacity onPress={() => removeArrayItem('pdpa', index)}><Text style={styles.delBtn}>X</Text></TouchableOpacity>
                 </View>
              ) : (
                <>
                  <Text style={styles.progressLabel}>{item.label}</Text>
                  <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${item.percent}%`, backgroundColor: parseInt(item.percent) > 10 ? T.accent : T.danger }]} />
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
          <SectionHeader title="KEY PERFORMANCE INDICATOR (KPI)" />
          <View style={styles.kpiGrid}>
            {kpiItems.map((item, index) => (
              <View key={`kpi-${item.id ?? 'new'}-${index}`} style={[styles.kpiCard, isEditing && { width: '100%' }]}>
                <View style={styles.kpiCardAccent} />
                {isEditing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                    <View style={{ flex: 1 }}>
                      <TextInput style={[styles.input, { marginBottom: 6, fontWeight: 'bold' }]} value={item.nama} onChangeText={(text) => updateKpiField(index, 'nama', text)} multiline placeholder="Nama KPI" placeholderTextColor={T.textMuted} />
                      <TextInput style={[styles.input, { marginBottom: 6 }]} value={item.tafsiran} onChangeText={(text) => updateKpiField(index, 'tafsiran', text)} multiline placeholder="Tafsiran" placeholderTextColor={T.textMuted} />
                      <TextInput style={[styles.input, { width: 100 }]} value={item.sasaran} onChangeText={(text) => updateKpiField(index, 'sasaran', text)} placeholder="Sasaran" placeholderTextColor={T.textMuted} />
                    </View>
                    <TouchableOpacity onPress={() => removeKpiItem(index)}><Text style={styles.delBtn}>X</Text></TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.kpiCardNama}>{item.nama}</Text>
                    <Text style={styles.kpiCardTafsiran}>{item.tafsiran}</Text>
                    <View style={styles.kpiSasaranBadge}>
                      <Text style={styles.kpiSasaranText}>{item.sasaran}</Text>
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
          {isEditing && (
             <TouchableOpacity onPress={addKpiItem} style={[styles.addBtn, { marginTop: 10 }]}>
               <Text style={styles.addBtnText}>+ Tambah KPI</Text>
             </TouchableOpacity>
          )}
        </View>

        {/* TANGGUNGJAWAB TABLE */}
        <View style={styles.card}>
          <SectionHeader title="TANGGUNGJAWAB" />
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
                        <Text style={{color: T.danger, fontWeight: 'bold'}}>X</Text>
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
          <SectionHeader title="BAHAGIAN KHIDMAT PENGURUSAN" />

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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: T.border, paddingBottom: 10 }}>
              <UserCog size={20} color={T.accent} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>PENGURUSAN KREDENSIAL PENGGUNA</Text>
            </View>

            <View style={styles.warningBanner}>
              <ShieldAlert size={16} color={T.warning} style={{ marginRight: 8 }} />
              <Text style={styles.warningBannerText}>
                Amaran: Penukaran kata laluan akan log keluar pengguna tersebut dari sistem secara automatik.
              </Text>
            </View>

            {userAccounts.map((user) => (
              <View key={user.id} style={styles.userRow}>
                <View>
                  <Text style={styles.userName}>{user.username}</Text>
                  <Text style={styles.userRole}>Peranan: {user.role}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.userActionBtn} onPress={() => openUserEditModal(user)}>
                    <Key size={14} color={T.accent} style={{ marginRight: 4 }} />
                    <Text style={styles.userActionBtnText}>Akses</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.userDangerBtn} onPress={() => triggerDeleteModal(user.id, user.username)}>
                    <Trash2 size={14} color={T.danger} style={{ marginRight: 4 }} />
                    <Text style={styles.userDangerBtnText}>Padam</Text>
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
              <TouchableOpacity onPress={() => setUserModalVisible(false)}><X size={24} color={T.textSecondary} /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nama Pengguna / Username</Text>
              <TextInput style={styles.modalInput} value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" placeholderTextColor={T.textMuted} />
              <Text style={styles.inputLabel}>Kata Laluan Baru (Biarkan kosong jika tidak mahu tukar)</Text>
              <TextInput style={styles.modalInput} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Masukkan kata laluan baru..." placeholderTextColor={T.textMuted} />
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
                <View style={styles.dangerIconCircle}><ShieldAlert size={24} color={T.danger} /></View>
                <Text style={[styles.modalTitle, { color: T.danger, fontSize: 18 }]}>Pengesahan Padam</Text>
              </View>
            </View>
            <View style={[styles.modalBody, { paddingTop: 10 }]}>
              <Text style={styles.confirmText}>
                Adakah anda pasti mahu memadam akses untuk pengguna <Text style={{ fontWeight: 'bold', color: T.text }}>'{deleteModalConfig.username}'</Text>? Tindakan ini kekal dan tidak boleh dipulihkan.
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteModalConfig({ visible: false, userId: null, username: '' })} disabled={isDeleting}>
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmDeleteBtn} onPress={executeDelete} disabled={isDeleting}>
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
  container: { flex: 1, backgroundColor: T.background },

  stickyHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: T.card,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    gap: 10
  },
  stickySaveBtn: {
    backgroundColor: T.accent,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: RADIUS.sm
  },
  stickySaveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },

  scrollArea: { flex: 1 },
  contentContainer: { padding: 15 },
  card: {
    backgroundColor: T.card, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: T.border,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: T.text },
  linkButton: { backgroundColor: T.accent, padding: 12, borderRadius: RADIUS.sm, alignItems: 'center', marginTop: 10 },
  linkButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: {
    fontSize: 14, fontWeight: '800', color: T.text,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  unitContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  unitBox: { flex: 1, backgroundColor: T.cardAlt, padding: 10, borderRadius: RADIUS.sm, marginHorizontal: 5 },
  boxTitle: { fontWeight: 'bold', marginBottom: 8, color: T.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  listItem: { fontSize: 13, color: T.text, marginBottom: 4 },
  subListItem: { fontSize: 12, color: T.textSecondary, marginLeft: 15, marginBottom: 6, fontStyle: 'italic' },
  table: { borderWidth: 1, borderColor: T.border, borderRadius: RADIUS.sm, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.border },
  tableHeader: { backgroundColor: T.cardAlt },
  tableCell: { width: 60, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: T.border, fontSize: 12, color: T.textSecondary },
  tableInput: { padding: 4, backgroundColor: T.background, borderWidth: 1, borderColor: T.border, color: T.text },
  cellHeader: { fontWeight: 'bold', color: T.text },
  rowLabel: { fontWeight: 'bold', backgroundColor: T.cardAlt, color: T.text },
  boldCell: { fontWeight: 'bold', color: T.text },
  progressItem: { marginBottom: 15 },
  progressLabel: { fontSize: 13, color: T.textSecondary, marginBottom: 5 },
  progressBarBackground: { height: 10, backgroundColor: T.cardAlt, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  progressPercent: { fontSize: 12, color: T.textSecondary, textAlign: 'right', marginTop: 2, fontWeight: 'bold' },
  complianceRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  complianceBox: {
    flex: 1, minWidth: '45%', backgroundColor: T.cardAlt, padding: 15, borderRadius: RADIUS.sm,
    marginHorizontal: 5, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: T.border,
  },
  complianceScore: { fontSize: 24, fontWeight: 'bold', color: T.accent, marginBottom: 5 },
  complianceTitle: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', color: T.text, marginBottom: 5 },
  complianceDesc: { fontSize: 11, textAlign: 'center', color: T.textSecondary },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  kpiCard: {
    width: '48%', backgroundColor: T.cardAlt, borderRadius: RADIUS.sm, padding: 16, marginBottom: 4,
    borderWidth: 1, borderColor: T.border, overflow: 'hidden', position: 'relative',
  },
  kpiCardAccent: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: T.accent },
  kpiCardNama: { fontSize: 14, fontWeight: 'bold', color: T.text, marginBottom: 6, marginLeft: 6 },
  kpiCardTafsiran: { fontSize: 12, color: T.textSecondary, lineHeight: 17, marginBottom: 12, marginLeft: 6 },
  kpiSasaranBadge: {
    alignSelf: 'flex-start', backgroundColor: T.accent + '18', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.pill, marginLeft: 6, borderWidth: 1, borderColor: T.accent + '55',
  },
  kpiSasaranText: { fontSize: 13, fontWeight: 'bold', color: T.accent },
  input: { borderWidth: 1, borderColor: T.border, borderRadius: RADIUS.sm, padding: 6, fontSize: 12, backgroundColor: T.background, color: T.text },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editRowBlock: { marginBottom: 10 },
  delBtn: { color: T.danger, fontWeight: 'bold', marginLeft: 10, padding: 5 },
  addBtn: { marginTop: 10, padding: 8, backgroundColor: T.cardAlt, borderRadius: RADIUS.sm, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  addBtnText: { color: T.accent, fontWeight: 'bold', fontSize: 12 },

  warningBanner: {
    backgroundColor: T.warning + '18', padding: 10, borderRadius: RADIUS.sm, marginBottom: 15,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: T.warning + '55',
  },
  warningBannerText: { fontSize: 11, color: T.warning, flex: 1 },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  userName: { fontSize: 14, fontWeight: 'bold', color: T.text },
  userRole: { fontSize: 11, color: T.textSecondary, textTransform: 'uppercase' },
  userActionBtn: { flexDirection: 'row', backgroundColor: T.accent + '18', paddingHorizontal: 10, paddingVertical: 8, borderRadius: RADIUS.sm, alignItems: 'center' },
  userActionBtnText: { fontSize: 11, fontWeight: 'bold', color: T.accent },
  userDangerBtn: { flexDirection: 'row', backgroundColor: T.danger + '18', paddingHorizontal: 10, paddingVertical: 8, borderRadius: RADIUS.sm, alignItems: 'center' },
  userDangerBtnText: { fontSize: 11, fontWeight: 'bold', color: T.danger },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: {
    backgroundColor: T.card, borderRadius: RADIUS.lg, overflow: 'hidden', elevation: 5,
    width: '100%', maxWidth: 500, borderWidth: 1, borderColor: T.border,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: T.text },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: T.textSecondary, marginBottom: 8, marginTop: 10 },
  modalInput: { borderWidth: 1, borderColor: T.border, borderRadius: RADIUS.sm, padding: 12, fontSize: 14, backgroundColor: T.background, color: T.text, marginBottom: 10 },
  saveButton: { backgroundColor: T.accent, padding: 14, borderRadius: RADIUS.sm, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  dangerIconCircle: { backgroundColor: T.danger + '18', padding: 8, borderRadius: 20, marginRight: 12 },
  confirmText: { fontSize: 14, color: T.textSecondary, marginBottom: 25, lineHeight: 22 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: RADIUS.sm, backgroundColor: T.cardAlt },
  cancelBtnText: { color: T.textSecondary, fontWeight: 'bold' },
  confirmDeleteBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: RADIUS.sm, backgroundColor: T.danger, flexDirection: 'row', alignItems: 'center' },
});

export default PentadbiranScreen;