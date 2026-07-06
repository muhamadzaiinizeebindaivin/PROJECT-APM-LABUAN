// src/screens/LogistikScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ship, Truck, Activity, ShieldCheck, Hash, Search, X } from 'lucide-react-native';
import { supabase } from '../supabaseClient'; 

// Import Reusable Components
import AppModal from '../components/AppModal';
import AppTextInput from '../components/AppTextInput';
import StatCard from '../components/StatCard';
import AdminEditButton from '../components/AdminEditButton';

export default function LogistikScreen({ theme, userRole }) {
  const [logistikData, setLogistikData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  
  // Modals State
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Active Item States
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const defaultForm = { category: 'Darat', type: 'Lori', model: '', reg: '', qty: '1', status: 'Baik', nota_selenggara: '' };
  const [formData, setFormData] = useState(defaultForm);

  const filterOptions = ['Semua', 'Bot', '4x4', 'Ambulans', 'Lori', 'Motosikal'];
  const statusOptions = ['Baik', 'Selenggara', 'Rosak'];

  useEffect(() => {
    fetchLogistik();
  }, []);

  const fetchLogistik = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('logistik')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLogistikData(data);
    } catch (error) {
      console.error('Error fetching logistik:', error);
      Alert.alert('Ralat', 'Gagal memuat turun data logistik.');
    } finally {
      setLoading(false);
    }
  };

  const seaLogistics = logistikData.filter(item => item.category === 'Laut');
  const landLogistics = logistikData.filter(item => item.category === 'Darat');

  const totalSea = seaLogistics.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
  const totalLand = landLogistics.length;
  const totalAssets = totalSea + totalLand;

  const activeSea = seaLogistics.reduce((sum, item) => item.status === 'Baik' ? sum + (Number(item.qty) || 1) : sum, 0);
  const activeLand = landLogistics.filter(item => item.status === 'Baik').length;
  const totalActive = activeSea + activeLand;

  const readinessPercent = totalAssets > 0 ? Math.round((totalActive / totalAssets) * 100) : 0;

  const filteredSea = seaLogistics.filter(item => {
    const matchesSearch = item.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'Semua' || activeFilter === 'Bot';
    return matchesSearch && matchesFilter;
  });

  const filteredLand = landLogistics.filter(item => {
    const matchesSearch = item.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.reg && item.reg.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = activeFilter === 'Semua' || item.type.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Baik': return { bg: '#f0fdf4', dot: '#22c55e', text: '#16a34a' };
      case 'Selenggara': return { bg: '#fef3c7', dot: '#f59e0b', text: '#d97706' };
      case 'Rosak': return { bg: '#fef2f2', dot: '#ef4444', text: '#dc2626' };
      default: return { bg: '#f1f5f9', dot: '#94a3b8', text: '#64748b' };
    }
  };

  const openViewModal = (asset) => {
    if (isEditMode) return;
    setSelectedAsset(asset);
    setViewModalVisible(true);
  };

  const openAddModal = () => {
    setEditingAsset(null);
    setFormData(defaultForm);
    setFormModalVisible(true);
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setFormData({
      category: asset.category,
      type: asset.type,
      model: asset.model,
      reg: asset.reg || '',
      qty: asset.qty !== null ? asset.qty.toString() : '1',
      status: asset.status,
      nota_selenggara: asset.nota_selenggara || '' 
    });
    setFormModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.model) return Alert.alert('Ralat', 'Sila masukkan model aset.');
    if (formData.status === 'Selenggara' && !formData.nota_selenggara.trim()) {
      return Alert.alert('Ralat', 'Sila masukkan catatan penyelenggaraan.');
    }

    setIsSaving(true);
    try {
      const payload = {
        category: formData.category,
        type: formData.type,
        model: formData.model,
        status: formData.status,
        nota_selenggara: formData.status === 'Selenggara' ? formData.nota_selenggara : null,
      };

      if (formData.category === 'Darat') {
        payload.reg = formData.reg.toUpperCase();
        payload.qty = null;
      } else {
        payload.qty = Number(formData.qty);
        payload.reg = null;
      }

      if (editingAsset) {
        const { error } = await supabase.from('logistik').update(payload).eq('id', editingAsset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('logistik').insert([payload]);
        if (error) throw error;
      }

      setFormModalVisible(false);
      fetchLogistik(); 
    } catch (error) {
      Alert.alert('Ralat', 'Gagal menyimpan rekod.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAsset = (asset) => {
    Alert.alert("Padam Aset", "Adakah anda pasti mahu memadam aset ini?", [
      { text: "Batal", style: "cancel" },
      { 
        text: "Padam", 
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.from('logistik').delete().eq('id', asset.id);
            fetchLogistik(); 
          } catch (error) {
            Alert.alert('Ralat', 'Gagal memadam aset.');
          }
        }
      }
    ]);
  };

  const renderAssetCard = (item, i, isSea) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <TouchableOpacity 
        key={item.id || i} 
        activeOpacity={isEditMode ? 1 : 0.7}
        style={[styles.itemCard, { backgroundColor: theme.card }]}
        onPress={() => openViewModal(item)}
      >
        <View style={styles.cardMainContent}>
          <View style={[styles.avatarBox, { backgroundColor: isSea ? '#e0f2fe' : '#ffedd5' }]}>
            {isSea ? <Ship size={24} color="#0ea5e9" /> : <Truck size={24} color="#f97316" />}
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.modelText, { color: theme.text }]} numberOfLines={1}>{item.model}</Text>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
          <View style={styles.itemAction}>
            <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
            </View>
            <View style={isSea ? styles.qtyContainer : styles.regContainer}>
              {isSea ? <Hash size={12} color="#94a3b8" /> : null}
              <Text style={isSea ? [styles.qtyText, { color: theme.textSecondary }] : [styles.regText, { color: theme.textSecondary }]}>
                {isSea ? `QTY: ${item.qty}` : item.reg}
              </Text>
            </View>
          </View>
        </View>

        {isEditMode ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
              <Text style={styles.editButtonText}>Kemaskini</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteAsset(item)}>
              <Text style={styles.deleteButtonText}>Padam</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background || '#f8fafc' }}>
      
      <ScrollView contentContainerStyle={styles.contentGrid} showsVerticalScrollIndicator={false}>
        
        {/* UNIVERSAL ADMIN EDIT BUTTON */}
        <AdminEditButton 
          isEditMode={isEditMode} 
          setIsEditMode={setIsEditMode} 
          userRole={userRole} 
        />

        {/* REFACTORED: Utilizing StatCard Components */}
        <View style={styles.row}>
          <StatCard 
            theme={theme} 
            icon={Activity} 
            iconColor="#3b82f6" 
            iconBgColor="#eff6ff" 
            value={totalAssets} 
            label="Total Aset" 
          />
          <StatCard 
            theme={theme} 
            icon={ShieldCheck} 
            iconColor={readinessPercent === 100 ? '#22c55e' : '#f59e0b'} 
            iconBgColor={readinessPercent === 100 ? '#f0fdf4' : '#fef3c7'} 
            value={`${readinessPercent}%`} 
            label="Siap Siaga" 
          />
        </View>

        {/* MAKLUMAT UNIT PENTADBIRAN */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitleMain, { color: theme.text, fontSize: 16, marginBottom: 12 }]}>UNIT PENTADBIRAN</Text>
          <View style={styles.unitContainer}>
            <View style={[styles.unitBox, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}>
              <Text style={[styles.boxTitle, { color: theme.text }]}>LOGISTIK</Text>
              <Text style={[styles.listItem, { color: theme.textSecondary || '#475569' }]}>1. Pn. Nora James (Gred H1)</Text>
              <Text style={[styles.listItem, { color: theme.textSecondary || '#475569' }]}>2. En. Mohd Rashid Bin Tahir (Gred H1)</Text>
              <Text style={[styles.listItem, { color: theme.textSecondary || '#475569' }]}>3. En. AG. Jali Bin Ag. Ali (Gred H1) (Pemandu)</Text>
            </View>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitleMain, { color: theme.text }]}>Senarai Logistik</Text>
          <View style={styles.headerActionGroup}>
            {isEditMode ? (
              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Text style={styles.addButtonText}>+ Tambah</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cari model atau no. pendaftaran..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
            {filterOptions.map((filter, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.filterChip, activeFilter === filter ? styles.filterChipActive : { backgroundColor: theme.card }]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterText, activeFilter === filter ? styles.filterTextActive : { color: theme.textSecondary }]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
        ) : (
          <>
            {filteredSea.length > 0 ? (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Logistik Laut</Text>
                  <Text style={[styles.sectionSubtitle, { color: '#0ea5e9' }]}>{totalSea} Aset</Text>
                </View>
                <View style={styles.listContainer}>
                  {filteredSea.map((item, i) => renderAssetCard(item, i, true))}
                </View>
              </View>
            ) : null}
            
            {filteredLand.length > 0 ? (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Logistik Darat</Text>
                  <Text style={[styles.sectionSubtitle, { color: '#f97316' }]}>{filteredLand.length} Kenderaan</Text>
                </View>
                <View style={styles.listContainer}>
                  {filteredLand.map((item, i) => renderAssetCard(item, i, false))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* REFACTORED: View Asset Details Modal */}
      {selectedAsset ? (
        <AppModal
          visible={viewModalVisible}
          onClose={() => setViewModalVisible(false)}
          title={selectedAsset.model}
          theme={theme}
          position="center"
          hideFooter={true}
          headerIcon={
            <View style={[styles.modalAvatar, { backgroundColor: selectedAsset.category === 'Darat' ? '#ffedd5' : '#e0f2fe' }]}>
              {selectedAsset.category === 'Darat' ? <Truck size={24} color="#f97316" /> : <Ship size={24} color="#0ea5e9" />}
            </View>
          }
        >
          <Text style={styles.modalTypeText}>{selectedAsset.type}</Text>

          {selectedAsset.reg ? (
            <View style={styles.modalRegBadge}>
              <Text style={styles.modalRegText}>{selectedAsset.reg}</Text>
            </View>
          ) : null}

          {(selectedAsset.qty !== null && selectedAsset.category === 'Laut') ? (
            <View style={styles.modalRegBadge}>
              <Text style={styles.modalRegText}>QTY: {selectedAsset.qty}</Text>
            </View>
          ) : null}

          <View style={styles.modalDetailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}><Activity size={18} color="#3b82f6" /></View>
              <View>
                <Text style={styles.detailLabel}>Status Semasa</Text>
                <Text style={[styles.detailValue, { color: getStatusStyle(selectedAsset.status).text }]}>
                  {selectedAsset.status}
                </Text>
              </View>
            </View>
            {(selectedAsset.status === 'Selenggara' && selectedAsset.nota_selenggara) ? (
              <View style={styles.detailRow}>
                <View style={[styles.detailIconBox, { backgroundColor: '#fffbeb' }]}><Activity size={18} color="#f59e0b" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Catatan Penyelenggaraan</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedAsset.nota_selenggara}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </AppModal>
      ) : null}

      {/* REFACTORED: Add / Edit Form Modal */}
      <AppModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        onSave={handleSave}
        isLoading={isSaving}
        title={editingAsset ? 'Kemaskini Logistik' : 'Tambah Logistik'}
        saveText="Simpan Rekod"
        theme={theme}
        position="bottom"
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
          <View>
            <Text style={styles.inputLabel}>Kategori</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['Darat', 'Laut'].map(cat => (
                <TouchableOpacity 
                  key={cat} disabled={!!editingAsset}
                  style={[styles.chip, formData.category === cat ? styles.chipActive : styles.chipInactive, !!editingAsset && formData.category !== cat ? { opacity: 0.5 } : null]}
                  onPress={() => setFormData({...formData, category: cat})}
                >
                  <Text style={[styles.chipText, formData.category === cat ? styles.chipTextActive : null]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <AppTextInput 
            label="Jenis (Cth: Lori, Bot, dll)" theme={theme}
            value={formData.type} onChangeText={t => setFormData({...formData, type: t})}
          />
          <AppTextInput 
            label="Model" theme={theme} placeholder="Cth: Toyota Hilux"
            value={formData.model} onChangeText={t => setFormData({...formData, model: t})}
          />

          {formData.category === 'Darat' ? (
            <AppTextInput 
              label="No. Pendaftaran" theme={theme} placeholder="Cth: WAA 1234"
              value={formData.reg} onChangeText={t => setFormData({...formData, reg: t})}
            />
          ) : (
            <AppTextInput 
              label="Kuantiti" theme={theme} keyboardType="numeric"
              value={formData.qty} onChangeText={t => setFormData({...formData, qty: t})}
            />
          )}

          <View>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {statusOptions.map(status => (
                <TouchableOpacity 
                  key={status}
                  style={[styles.chip, formData.status === status ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setFormData({ ...formData, status, nota_selenggara: status !== 'Selenggara' ? '' : formData.nota_selenggara })}
                >
                  <Text style={[styles.chipText, formData.status === status ? styles.chipTextActive : null]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {formData.status === 'Selenggara' ? (
            <AppTextInput 
              label="Catatan Penyelenggaraan" theme={theme} multiline={true} placeholder="Nyatakan kerosakan atau butiran..."
              value={formData.nota_selenggara} onChangeText={t => setFormData({...formData, nota_selenggara: t})}
            />
          ) : null}
        </ScrollView>
      </AppModal>

    </View>
  );
}

const styles = StyleSheet.create({
  contentGrid: { padding: 16, paddingBottom: 40, gap: 24 }, 
  row: { flexDirection: 'row', gap: 16 },
  card: { padding: 16, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  unitContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  unitBox: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  boxTitle: { fontWeight: '800', marginBottom: 8, fontSize: 14 },
  listItem: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitleMain: { fontSize: 18, fontWeight: 'bold' },
  headerActionGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addButton: { backgroundColor: '#1e40af', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 12 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  filterContainer: { gap: 10, paddingVertical: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  filterChipActive: { backgroundColor: '#3b82f6' },
  filterText: { fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: '#ffffff' },
  sectionContainer: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { fontSize: 13, fontWeight: '700' },
  listContainer: { gap: 12 },
  itemCard: { padding: 16, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardMainContent: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  itemInfo: { flex: 1, justifyContent: 'center', paddingRight: 8 },
  modelText: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  typeText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  itemAction: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyText: { fontSize: 12, fontWeight: '700' },
  regContainer: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  regText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  editButton: { backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 8 },
  editButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  deleteButton: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  deleteButtonText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  
  // Custom Modal Styles specific to Logistik
  modalAvatar: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalTypeText: { fontSize: 15, color: '#94a3b8', fontWeight: '600', marginBottom: 16 },
  modalRegBadge: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 24 },
  modalRegText: { fontSize: 14, fontWeight: '800', letterSpacing: 1, color: '#475569' },
  modalDetailsContainer: { gap: 16, backgroundColor: '#f8fafc', padding: 20, borderRadius: 24 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  detailLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipInactive: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  chipTextActive: { color: '#ffffff' },
});