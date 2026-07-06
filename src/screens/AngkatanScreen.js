import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { TrendingDown, Users2, ShieldCheck, ListFilter, Search, Edit2, Plus, Trash2, X } from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import * as DATA from '../../data';
import AdminEditButton from '../components/AdminEditButton';

export default function AngkatanScreen({ theme, userRole }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // States for DB Data
  const [summary, setSummary] = useState({
    total_anggota: 0, aktif_anggota: 0, male_count: 0, female_count: 0,
    status_lulus: 0, status_lantikan: 0, status_simpanan: 0, status_aktif: 0
  });
  const [categories, setCategories] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [communityProgs, setCommunityProgs] = useState([]);
  const [pyramidStats, setPyramidStats] = useState([]);

  // Modal States
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showPyramidModal, setShowPyramidModal] = useState(false);

  // Form States
  const [summaryForm, setSummaryForm] = useState({});
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '', count: '', color: '#0ea5e9' });
  const [rankForm, setRankForm] = useState({ id: null, rank: '', lulus: '', kenaikan: '', kbp: '', ptb: '', aktif: '', simpanan: '' });
  const [communityForm, setCommunityForm] = useState({ id: null, category: '', label: '', detail: '', color: '#3b82f6' });
  const [pyramidForm, setPyramidForm] = useState({ id: null, rank: '', total: '', color: '#1e40af', display_order: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, rankRes, commRes, pyrRes] = await Promise.all([
        supabase.from('angkatan_summary').select('*').eq('id', 1).single(),
        supabase.from('angkatan_categories').select('*').order('id'),
        supabase.from('angkatan_ranks').select('*').order('id'),
        supabase.from('angkatan_community').select('*').order('id'),
        supabase.from('angkatan_pyramid').select('*').order('display_order', { ascending: true })
      ]);

      if (sumRes.data) setSummary(sumRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (rankRes.data) setRanks(rankRes.data);
      if (commRes.data) setCommunityProgs(commRes.data);
      if (pyrRes.data) setPyramidStats(pyrRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD Functions: Summary ---
  const handleSaveSummary = async () => {
    try {
      const { error } = await supabase.from('angkatan_summary').update(summaryForm).eq('id', 1);
      if (error) throw error;
      setSummary(summaryForm);
      setShowSummaryModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  // --- CRUD Functions: Categories ---
  const handleSaveCategory = async () => {
    try {
      const payload = { name: categoryForm.name, count: parseInt(categoryForm.count), color: categoryForm.color };
      if (categoryForm.id) {
        await supabase.from('angkatan_categories').update(payload).eq('id', categoryForm.id);
      } else {
        await supabase.from('angkatan_categories').insert([payload]);
      }
      fetchData(); setShowCategoryModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  const handleDeleteCategory = async (id) => {
    try { await supabase.from('angkatan_categories').delete().eq('id', id); fetchData(); }
    catch (error) { Alert.alert('Ralat', error.message); }
  };

  // --- CRUD Functions: Community ---
  const handleSaveCommunity = async () => {
    try {
      const payload = { category: communityForm.category, label: communityForm.label, detail: communityForm.detail, color: communityForm.color };
      if (communityForm.id) {
        await supabase.from('angkatan_community').update(payload).eq('id', communityForm.id);
      } else {
        await supabase.from('angkatan_community').insert([payload]);
      }
      fetchData(); setShowCommunityModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  const handleDeleteCommunity = async (id) => {
    try { await supabase.from('angkatan_community').delete().eq('id', id); fetchData(); }
    catch (error) { Alert.alert('Ralat', error.message); }
  };

  // --- CRUD Functions: Pyramid ---
  const handleSavePyramid = async () => {
    try {
      const payload = { 
        rank: pyramidForm.rank, 
        total: parseInt(pyramidForm.total), 
        color: pyramidForm.color,
        display_order: parseInt(pyramidForm.display_order)
      };
      if (pyramidForm.id) {
        await supabase.from('angkatan_pyramid').update(payload).eq('id', pyramidForm.id);
      } else {
        await supabase.from('angkatan_pyramid').insert([payload]);
      }
      fetchData(); setShowPyramidModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  const handleDeletePyramid = async (id) => {
    try { 
      await supabase.from('angkatan_pyramid').delete().eq('id', id); 
      fetchData(); 
      setShowPyramidModal(false);
    }
    catch (error) { Alert.alert('Ralat', error.message); }
  };

  // --- CRUD Functions: Ranks ---
  const handleSaveRank = async () => {
    try {
      const payload = {
        rank: rankForm.rank, lulus: parseInt(rankForm.lulus), kenaikan: parseInt(rankForm.kenaikan),
        kbp: parseInt(rankForm.kbp), ptb: parseInt(rankForm.ptb), aktif: parseInt(rankForm.aktif), simpanan: parseInt(rankForm.simpanan)
      };
      if (rankForm.id) { await supabase.from('angkatan_ranks').update(payload).eq('id', rankForm.id); }
      else { await supabase.from('angkatan_ranks').insert([payload]); }
      fetchData(); setShowRankModal(false);
    } catch (error) { Alert.alert('Ralat', error.message); }
  };

  const handleDeleteRank = async (id) => {
    try { await supabase.from('angkatan_ranks').delete().eq('id', id); fetchData(); }
    catch (error) { Alert.alert('Ralat', error.message); }
  };

  const filteredRankData = ranks.filter(item => item.rank.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={theme.accent} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* UNIVERSAL ADMIN EDIT BUTTON */}
        <AdminEditButton 
          isEditMode={isEditing} 
          setIsEditMode={setIsEditing} 
          userRole={userRole} 
        />

        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Dashboard Angkatan</Text>
        </View>

        <View style={styles.contentGrid}>
          <View style={styles.row}>
            <View style={[styles.card, { backgroundColor: theme.card, flex: 1 }]}>
              {isEditing ? (
                <TouchableOpacity style={styles.editBadge} onPress={() => { setSummaryForm(summary); setShowSummaryModal(true); }}>
                  <Edit2 size={14} color="#fff" />
                </TouchableOpacity>
              ) : null}
              <Text style={[styles.bigNumber, { color: '#f97316' }]}>{summary.total_anggota}</Text>
              <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Jumlah Anggota</Text>
              <View style={styles.activeBadge}>
                <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>{summary.aktif_anggota} Aktif</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card, flex: 2 }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Trend Aktif (2021-2025)</Text>
              <View style={styles.barChartContainer}>
                {DATA.MEMBERSHIP_TREND.map((item, i) => (
                  <View key={i} style={{ alignItems: 'center' }}>
                    <View style={[styles.bar, { height: item.val * 1.5, backgroundColor: theme.accent }]} />
                    <Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 5 }}>{item.year}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
                <TrendingDown size={14} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontSize: 12, marginLeft: 5 }}>Keanggotaan Tidak Konsisten</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.card, { backgroundColor: theme.card, flex: 1 }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Penjawatan Utama</Text>
                {isEditing ? (
                  <TouchableOpacity onPress={() => { setCategoryForm({ id: null, name: '', count: '', color: '#0ea5e9' }); setShowCategoryModal(true); }}>
                    <Plus size={20} color={theme.accent} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {categories.map((cat) => (
                <View key={cat.id} style={styles.listItem}>
                  <View style={[styles.dot, { backgroundColor: cat.color }]} />
                  <Text style={{ color: theme.textSecondary, flex: 1, marginLeft: 10 }}>{cat.name}</Text>
                  <Text style={{ color: theme.text, fontWeight: '700', marginRight: 10 }}>{cat.count}</Text>
                  {isEditing ? (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity onPress={() => { setCategoryForm({ ...cat, count: String(cat.count) }); setShowCategoryModal(true); }}>
                        <Edit2 size={16} color="#22c55e" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteCategory(cat.id)}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: theme.card, flex: 1 }]}>
              {isEditing ? (
                <TouchableOpacity style={styles.editBadge} onPress={() => { setSummaryForm(summary); setShowSummaryModal(true); }}>
                  <Edit2 size={14} color="#fff" />
                </TouchableOpacity>
              ) : null}
              <Text style={[styles.cardTitle, { color: theme.text }]}>Taburan Jantina</Text>
              <View style={styles.genderContainer}>
                <View style={styles.genderRow}>
                   <View style={styles.genderIconCircle}><Users2 size={24} color={theme.accent} /></View>
                   <View style={{ flex: 1 }}>
                      <View style={styles.genderHeader}>
                        <Text style={[styles.genderLabel, { color: theme.text }]}>Lelaki</Text>
                        <Text style={[styles.genderValue, { color: theme.text }]}>{summary.male_count}</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '66%', backgroundColor: '#3b82f6' }]} />
                      </View>
                   </View>
                </View>

                <View style={styles.genderRow}>
                   <View style={[styles.genderIconCircle, { backgroundColor: '#fdf2f8' }]}>
                     <Users2 size={24} color="#db2777" />
                   </View>
                   <View style={{ flex: 1 }}>
                      <View style={styles.genderHeader}>
                        <Text style={[styles.genderLabel, { color: theme.text }]}>Wanita</Text>
                        <Text style={[styles.genderValue, { color: theme.text }]}>{summary.female_count}</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '33%', backgroundColor: '#db2777' }]} />
                      </View>
                   </View>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
             {isEditing ? (
                <TouchableOpacity style={styles.editBadge} onPress={() => { setSummaryForm(summary); setShowSummaryModal(true); }}>
                  <Edit2 size={14} color="#fff" />
                </TouchableOpacity>
              ) : null}
             <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
               <ShieldCheck size={20} color={theme.accent} />
               <Text style={[styles.cardTitle, { color: theme.text, marginLeft: 10, marginBottom: 0 }]}>Status Anggota</Text>
             </View>
             <View style={styles.statusGrid}>
               <StatusBox label="Lulus Ujian" value={summary.status_lulus} color="#3b82f6" theme={theme} />
               <StatusBox label="Lantikan Baru" value={summary.status_lantikan} color="#f97316" theme={theme} />
               <StatusBox label="Simpanan" value={summary.status_simpanan} color="#6366f1" theme={theme} />
               <StatusBox label="Aktif Penugasan" value={summary.status_aktif} color="#22c55e" theme={theme} />
             </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.tableHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ListFilter size={20} color={theme.accent} />
                <Text style={[styles.cardTitle, { color: theme.text, marginLeft: 10, marginBottom: 0 }]}>Rekod Kenaikan Pangkat</Text>
                {isEditing ? (
                  <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => { setRankForm({ id: null, rank: '', lulus: '', kenaikan: '', kbp: '', ptb: '', aktif: '', simpanan: '' }); setShowRankModal(true); }}>
                    <View style={styles.addInlineBtn}><Plus size={16} color="#fff" /><Text style={styles.addInlineBtnText}>Tambah</Text></View>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
                <Search size={16} color={theme.textSecondary} />
                <TextInput placeholder="Cari Pangkat..." placeholderTextColor={theme.textSecondary} style={[styles.searchInput, { color: theme.text }]} value={searchQuery} onChangeText={setSearchQuery} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={[styles.table, { borderColor: theme.border }]}>
                <View style={[styles.tableRow, { backgroundColor: theme.background }]}>
                  {['PERINGKAT', 'LULUS', 'NAIK', 'KBP', 'PTB', 'AKTIF', 'SIMPANAN', ...(isEditing ? ['TINDAKAN'] : [])].map((h, i) => (
                    <Text key={i} style={[styles.tableHeaderCell, { color: theme.text }]}>{h}</Text>
                  ))}
                </View>
                {filteredRankData.map((item) => (
                  <View key={item.id} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.tableCell, { fontWeight: '700', color: theme.text, textAlign: 'left', width: 140 }]}>{item.rank}</Text>
                    <Text style={[styles.tableCell, { color: theme.textSecondary }]}>{item.lulus}</Text>
                    <Text style={[styles.tableCell, { color: theme.textSecondary }]}>{item.kenaikan}</Text>
                    <Text style={[styles.tableCell, { color: theme.textSecondary }]}>{item.kbp}</Text>
                    <Text style={[styles.tableCell, { color: theme.textSecondary }]}>{item.ptb}</Text>
                    <Text style={[styles.tableCell, { color: '#22c55e', fontWeight: '700' }]}>{item.aktif}</Text>
                    <Text style={[styles.tableCell, { color: theme.accent, fontWeight: '700' }]}>{item.simpanan}</Text>
                    {isEditing ? (
                      <View style={[styles.tableCell, { flexDirection: 'row', justifyContent: 'center', gap: 10 }]}>
                        <TouchableOpacity onPress={() => { setRankForm({ ...item, lulus: String(item.lulus), kenaikan: String(item.kenaikan), kbp: String(item.kbp), ptb: String(item.ptb), aktif: String(item.aktif), simpanan: String(item.simpanan) }); setShowRankModal(true); }}><Edit2 size={16} color="#22c55e" /></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteRank(item.id)}><Trash2 size={16} color="#ef4444" /></TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Program Komuniti (Pasukan APM)</Text>
              {isEditing ? (
                <TouchableOpacity onPress={() => { setCommunityForm({ id: null, category: '', label: '', detail: '', color: '#3b82f6' }); setShowCommunityModal(true); }}>
                  <Plus size={20} color={theme.accent} />
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={{ marginTop: 10 }}>
              {communityProgs.map((prog) => (
                <View key={prog.id} style={[styles.communityItem, { borderBottomColor: theme.border }]}>
                  <View style={[styles.programBadge, { backgroundColor: prog.color }]}><Text style={styles.programBadgeText}>{prog.category}</Text></View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>{prog.label}</Text>
                    <Text style={{ color: theme.textSecondary, marginTop: 4 }}>{prog.detail}</Text>
                  </View>
                  {isEditing ? (
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                      <TouchableOpacity onPress={() => { setCommunityForm(prog); setShowCommunityModal(true); }}><Edit2 size={18} color="#22c55e" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteCommunity(prog.id)}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>Struktur Pangkat & Keahlian</Text>
              {isEditing ? (
                <TouchableOpacity onPress={() => { setPyramidForm({ id: null, rank: '', total: '', color: '#1e40af', display_order: '' }); setShowPyramidModal(true); }}>
                  <Plus size={20} color={theme.accent} />
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              {pyramidStats.map((item, i) => (
                <TouchableOpacity 
                  key={item.id} 
                  disabled={!isEditing}
                  onPress={() => { setPyramidForm({ ...item, total: String(item.total), display_order: String(item.display_order) }); setShowPyramidModal(true); }}
                  style={[styles.pyramidTier, { width: `${35 + (i * 6)}%`, backgroundColor: item.color }]}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{item.rank} ({item.total})</Text>
                  {isEditing ? <Edit2 size={12} color="#fff" /> : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* --- MODALS --- */}
      <Modal visible={showSummaryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Kemaskini Rumusan</Text>
          <ScrollView showsVerticalScrollIndicator={false}>{Object.keys(summaryForm).filter(k => k !== 'id').map((key) => (
            <View key={key} style={styles.inputGroup}>
              <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{key.replace('_', ' ').toUpperCase()}</Text>
              <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={String(summaryForm[key] || '')} onChangeText={(text) => setSummaryForm({ ...summaryForm, [key]: parseInt(text) || 0 })} />
            </View>
          ))}</ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowSummaryModal(false)} style={[styles.modalBtn, { backgroundColor: theme.background }]}><Text style={{ color: theme.text }}>Batal</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSaveSummary} style={[styles.modalBtn, { backgroundColor: theme.accent }]}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Simpan</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={showCategoryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{categoryForm.id ? 'Edit' : 'Tambah'} Penjawatan</Text>
          <TextInput placeholder="Nama" placeholderTextColor={theme.textSecondary} style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 15 }]} value={categoryForm.name} onChangeText={(t) => setCategoryForm({...categoryForm, name: t})} />
          <TextInput placeholder="Jumlah" keyboardType="numeric" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]} value={categoryForm.count} onChangeText={(t) => setCategoryForm({...categoryForm, count: t})} />
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.modalBtn}><Text style={{ color: theme.text }}>Batal</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSaveCategory} style={[styles.modalBtn, { backgroundColor: theme.accent }]}><Text style={{ color: '#fff' }}>Simpan</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={showCommunityModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Kemaskini Program Komuniti</Text>
          <TextInput placeholder="Kategori (Contoh: TUSPA)" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={communityForm.category} onChangeText={(t) => setCommunityForm({...communityForm, category: t})} />
          <TextInput placeholder="Nama Sekolah/Institusi" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={communityForm.label} onChangeText={(t) => setCommunityForm({...communityForm, label: t})} />
          <TextInput placeholder="Detail (Contoh: 30 Orang)" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={communityForm.detail} onChangeText={(t) => setCommunityForm({...communityForm, detail: t})} />
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowCommunityModal(false)} style={styles.modalBtn}><Text style={{ color: theme.text }}>Batal</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSaveCommunity} style={[styles.modalBtn, { backgroundColor: theme.accent }]}><Text style={{ color: '#fff' }}>Simpan</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={showPyramidModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{pyramidForm.id ? 'Kemaskini' : 'Tambah'} Pangkat Piramid</Text>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Nama Pangkat</Text>
          <TextInput placeholder="Cth: SK." style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={pyramidForm.rank} onChangeText={(t) => setPyramidForm({...pyramidForm, rank: t})} />
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Jumlah Anggota</Text>
          <TextInput placeholder="Jumlah" keyboardType="numeric" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={String(pyramidForm.total)} onChangeText={(t) => setPyramidForm({...pyramidForm, total: t})} />
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Urutan (1 = Paling Atas)</Text>
          <TextInput placeholder="Cth: 1" keyboardType="numeric" style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={String(pyramidForm.display_order)} onChangeText={(t) => setPyramidForm({...pyramidForm, display_order: t})} />
          <View style={styles.modalActions}>
            {pyramidForm.id ? (
              <TouchableOpacity onPress={() => handleDeletePyramid(pyramidForm.id)} style={[styles.modalBtn, { backgroundColor: '#ef4444', marginRight: 'auto' }]}><Text style={{ color: '#fff' }}>Padam</Text></TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => setShowPyramidModal(false)} style={styles.modalBtn}><Text style={{ color: theme.text }}>Batal</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSavePyramid} style={[styles.modalBtn, { backgroundColor: theme.accent }]}><Text style={{ color: '#fff' }}>Simpan</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={showRankModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Kemaskini Rekod Pangkat</Text>
          <ScrollView showsVerticalScrollIndicator={false}>{['rank', 'lulus', 'kenaikan', 'kbp', 'ptb', 'aktif', 'simpanan'].map((key) => (
            <TextInput key={key} placeholder={key.toUpperCase()} style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 10 }]} value={rankForm[key]} onChangeText={(text) => setRankForm({ ...rankForm, [key]: text })} />
          ))}</ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowRankModal(false)} style={styles.modalBtn}><Text style={{ color: theme.text }}>Batal</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSaveRank} style={[styles.modalBtn, { backgroundColor: theme.accent }]}><Text style={{ color: '#fff' }}>Simpan</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

    </View>
  );
}

const StatusBox = ({ label, value, color, theme }) => (
  <View style={[styles.statusBox, { backgroundColor: theme.background }]}>
    <Text style={[styles.statusValue, { color }]}>{value}</Text>
    <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 40, paddingTop: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10, paddingTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: 'bold' },
  contentGrid: { gap: 24 },
  row: { flexDirection: 'row', gap: 24 },
  card: { padding: 28, borderRadius: 24, elevation: 2, position: 'relative' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 20, fontWeight: '800' },
  editBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#22c55e', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 4 }, // Updated to green
  bigNumber: { fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  activeBadge: { backgroundColor: '#22c55e15', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
  barChartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 100, marginTop: 10 },
  bar: { width: 22, borderRadius: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  genderContainer: { flex: 1, justifyContent: 'center', gap: 20 },
  genderRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  genderIconCircle: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center' },
  genderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  genderLabel: { fontSize: 14, fontWeight: '700' },
  genderValue: { fontSize: 14, fontWeight: '800' },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statusGrid: { flexDirection: 'row', gap: 15 },
  statusBox: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center' },
  statusValue: { fontSize: 24, fontWeight: '900' },
  statusLabel: { fontSize: 11, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addInlineBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  addInlineBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 12, width: 220, height: 40 },
  searchInput: { marginLeft: 10, fontSize: 13, fontWeight: '600', flex: 1 },
  table: { borderTopWidth: 1, borderLeftWidth: 1, minWidth: 700 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, alignItems: 'center' },
  tableHeaderCell: { flex: 1, padding: 12, fontSize: 10, fontWeight: '900', borderRightWidth: 1, textAlign: 'center' },
  tableCell: { flex: 1, padding: 12, fontSize: 11, borderRightWidth: 1, textAlign: 'center' },
  communityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  programBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, justifyContent: 'center', alignItems: 'center', width: 70 },
  programBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  pyramidTier: { height: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8, borderRadius: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 500, padding: 24, borderRadius: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  modalInput: { borderWidth: 1, padding: 12, borderRadius: 10, fontSize: 14, borderColor: '#ccc' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }
});