// src/screens/operasi/PertolonganCemasTab.js
import React, { useState, useEffect, useCallback, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Plus, X, Edit2, Trash2, Calendar, MapPin, Users, Truck, FileText, Clock } from 'lucide-react-native';
import { supabaseSandbox } from '../../supabaseSandboxClient';
import { formStyles } from '../../styles/formStyles';
import { reportStyles as styles } from './reportStyles';
import { canEditSection } from '../../permissions';
import { useAvailableVehicles } from '../../hooks/useAvailableVehicles';

const STATUS_OPTIONS = ['aktif', 'selesai', 'dibatal'];
const STATUS_COLORS = {
  aktif: { bg: '#eff6ff', border: '#bfdbfe', text: '#1E3A8A' },
  selesai: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
  dibatal: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
};

const EMPTY_FORM = {
  id: null,
  nama_acara: '',
  lokasi: '',
  tarikh: '',
  tarikh_tamat: '',
  masa_mula: '',
  masa_tamat: '',
  bilangan_pegawai: '',
  bilangan_anggota: '',
  bilangan_kenderaan: '',
  jenis_kenderaan: '',
  bilangan_pesakit: '',
  catatan: '',
  status: 'aktif',
};

// BUCKET retiré — fonctionnalité photo abandonnée

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600', marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

export default function PertolonganCemasTab({ theme, userRole, isEditMode }) {
  const canManage = isEditMode && canEditSection(userRole, 'Operasi');
  const { vehicles } = useAvailableVehicles();
  const vehicleOptions = vehicles.map(v => `${v.model}${v.reg ? ` (${v.reg})` : ''}`);
  const [jenisKenderaanOpen, setJenisKenderaanOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const selectedVehicles = form.jenis_kenderaan ? form.jenis_kenderaan.split(', ').filter(Boolean) : [];
  const toggleVehicle = (opt) => {
    setForm(f => {
      const current = f.jenis_kenderaan ? f.jenis_kenderaan.split(', ').filter(Boolean) : [];
      const next = current.includes(opt) ? current.filter(v => v !== opt) : [...current, opt];
      return { ...f, jenis_kenderaan: next.join(', ') };
    });
  };
  const lainLainValue = selectedVehicles.filter(v => !vehicleOptions.includes(v)).join(', ');
  const [showLainLain, setShowLainLain] = useState(false);
  const toggleLainLain = () => {
    if (showLainLain) {
      // Décoché : retire toute valeur personnalisée déjà saisie, rien n'est enregistré
      setForm(f => {
        const current = f.jenis_kenderaan ? f.jenis_kenderaan.split(', ').filter(Boolean) : [];
        const next = current.filter(v => vehicleOptions.includes(v));
        return { ...f, jenis_kenderaan: next.join(', ') };
      });
    }
    setShowLainLain(!showLainLain);
  };

  useEffect(() => {
    if (modalVisible) setShowLainLain(!!lainLainValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalVisible]);

  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [statusModalId, setStatusModalId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const EVENTS_PER_PAGE = 5;
  

  // photos retirées

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseSandbox
      .from('pertolongan_cemas')
      .select('*')
      .order('tarikh', { ascending: false });
    if (data) setEvents(data);
    if (error) console.error(error);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
    const sub1 = supabaseSandbox
      .channel('pertolongan_cemas_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'pertolongan_cemas' }, fetchEvents)
      .subscribe();
    return () => { supabaseSandbox.removeChannel(sub1); };
  }, [fetchEvents]);

  const handleSave = async () => {
    if (!form.nama_acara || !form.lokasi || !form.tarikh || !form.tarikh_tamat || !form.masa_mula || !form.masa_tamat) {
      Alert.alert('Ralat', 'Sila isi semua maklumat wajib.');
      return;
    }
    setSaving(true);
    const payload = {
      nama_acara: form.nama_acara.trim(),
      lokasi: form.lokasi.trim(),
      tarikh: form.tarikh,
      tarikh_tamat: form.tarikh_tamat,
      masa_mula: form.masa_mula,
      masa_tamat: form.masa_tamat,
      bilangan_pegawai: parseInt(form.bilangan_pegawai) || 0,
      bilangan_anggota: parseInt(form.bilangan_anggota) || 0,
      bilangan_kenderaan: parseInt(form.bilangan_kenderaan) || 0,
      jenis_kenderaan: form.jenis_kenderaan.trim() || null,
      bilangan_pesakit: parseInt(form.bilangan_pesakit) || 0,
      catatan: form.catatan.trim() || null,
      status: form.status,
    };
    let error, recordId = form.id;
    if (form.id) {
      ({ error } = await supabaseSandbox.from('pertolongan_cemas').update(payload).eq('id', form.id));
    } else {
      const { data, error: insertError } = await supabaseSandbox.from('pertolongan_cemas').insert([payload]).select('id').single();
      error = insertError;
      if (data) recordId = data.id;
    }
    if (!error) {
      await fetchEvents();
      closeModal();
    } else Alert.alert('Ralat', 'Gagal menyimpan. Sila cuba lagi.');
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const confirmed = Platform.OS === 'web' ? window.confirm('Padam acara ini?') : true;
    if (!confirmed) return;
    await supabaseSandbox.from('pertolongan_cemas').delete().eq('id', id);
    fetchEvents();
  };

  const openEdit = (event) => {
    setForm({
      id: event.id,
      nama_acara: event.nama_acara || '',
      lokasi: event.lokasi || '',
      tarikh: event.tarikh || '',
      tarikh_tamat: event.tarikh_tamat || '',
      masa_mula: event.masa_mula || '',
      masa_tamat: event.masa_tamat || '',
      bilangan_pegawai: String(event.bilangan_pegawai || ''),
      bilangan_anggota: String(event.bilangan_anggota || ''),
      bilangan_kenderaan: String(event.bilangan_kenderaan || ''),
      jenis_kenderaan: event.jenis_kenderaan || '',
      bilangan_pesakit: String(event.bilangan_pesakit || ''),
      catatan: event.catatan || '',
      status: event.status || 'aktif',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setForm(EMPTY_FORM);
  };

  const availableYears = [...new Set(events.map(e => new Date(e.tarikh).getFullYear()))].sort((a, b) => b - a);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterYear, searchQuery]);

  const filteredEvents = events.filter(e => {
    if (new Date(e.tarikh).getFullYear() !== filterYear) return false;
    if (filterStatus !== 'semua' && e.status !== filterStatus) return false;
    if (searchQuery.trim() && !(e.nama_acara + e.lokasi).toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * EVENTS_PER_PAGE, currentPage * EVENTS_PER_PAGE);

  const inputStyle = [formStyles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginBottom: 0 }];
  const labelStyle = { fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 4, marginTop: 12 };

  return (
    <>
      <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>

        <View style={styles.reportHeader}>
          <Text style={[styles.reportTitle, { color: theme.text }]}>Pertolongan Cemas</Text>
          <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Pengurusan Acara & Penyebaran</Text>
        </View>

        {/* Stat cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Jumlah Acara', value: events.length, color: '#1E3A8A', bg: '#eff6ff' },
            { label: 'Aktif', value: events.filter(e => e.status === 'aktif').length, color: '#3b82f6', bg: '#dbeafe' },
            { label: 'Selesai', value: events.filter(e => e.status === 'selesai').length, color: '#16a34a', bg: '#dcfce7' },
            { label: 'Dibatal', value: events.filter(e => e.status === 'dibatal').length, color: '#dc2626', bg: '#fee2e2' },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 12, padding: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b' }}>{s.label}</Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: s.color }}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Toolbar */}
        <View style={{ marginBottom: 12, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TextInput
              style={[formStyles.inputField, { flex: 1, backgroundColor: theme.background, color: theme.text, borderColor: '#94a3b8', borderWidth: 2, outlineStyle: 'none', marginBottom: 0 }]}
              placeholder="Cari nama acara atau lokasi..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery} onChangeText={setSearchQuery}
            />
            {canManage && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Plus size={16} color="#fff" />
                <Text style={styles.addBtnText}>Tambah Acara</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['semua', ...STATUS_OPTIONS].map(s => (
                <TouchableOpacity key={s} onPress={() => setFilterStatus(s)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: filterStatus === s ? '#1E3A8A' : '#f1f5f9' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: filterStatus === s ? '#fff' : '#64748b', textTransform: 'capitalize' }}>
                    {s === 'semua' ? 'Semua' : s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(availableYears.length > 0 ? availableYears : [new Date().getFullYear()]).map(y => (
                <TouchableOpacity key={y} onPress={() => setFilterYear(y)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: filterYear === y ? '#1E3A8A' : '#f1f5f9' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: filterYear === y ? '#fff' : '#64748b' }}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Liste */}
        {loading ? (
          <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 20 }} />
        ) : filteredEvents.length === 0 ? (
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginVertical: 20 }}>Tiada acara ditemui.</Text>
        ) : (
          paginatedEvents.map(event => {
            const sc = STATUS_COLORS[event.status] || STATUS_COLORS.aktif;
            return (
              <View key={event.id} style={{
                backgroundColor: theme.card, borderRadius: 16, padding: 18, marginBottom: 12,
                borderWidth: 1, borderColor: theme.border,
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text }}>{event.nama_acara}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <MapPin size={12} color="#94a3b8" />
                      <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>{event.lokasi}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ backgroundColor: sc.bg, borderWidth: 1, borderColor: sc.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: sc.text, textTransform: 'capitalize' }}>{event.status}</Text>
                    </View>
                    {canManage && (
                      <>
                        <TouchableOpacity onPress={() => setStatusModalId(event.id)}
                          style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Status</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openEdit(event)} style={styles.iconBtn}>
                          <Edit2 size={15} color="#22c55e" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(event.id)} style={styles.iconBtn}>
                          <Trash2 size={15} color="#ef4444" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                  <View style={{ flex: 1, minWidth: 200 }}>
                    <InfoRow icon={<Calendar size={14} color="#94a3b8" />} label="Mula" value={event.tarikh ? `${event.tarikh} ${event.masa_mula || ''}`.trim() : null} />
                    <InfoRow icon={<Clock size={14} color="#94a3b8" />} label="Tamat" value={event.tarikh_tamat ? `${event.tarikh_tamat} ${event.masa_tamat || ''}`.trim() : null} />
                    <InfoRow icon={<Users size={14} color="#94a3b8" />} label="Bilangan Pegawai" value={event.bilangan_pegawai ? `${event.bilangan_pegawai} orang` : null} />
                    <InfoRow icon={<Users size={14} color="#94a3b8" />} label="Bilangan Anggota" value={`${event.bilangan_anggota} orang`} />
                    <InfoRow icon={<Truck size={14} color="#94a3b8" />} label="Kenderaan" value={event.bilangan_kenderaan ? `${event.bilangan_kenderaan} unit${event.jenis_kenderaan ? ` (${event.jenis_kenderaan})` : ''}` : null} />
                  </View>
                  <View style={{ flex: 1, minWidth: 200 }}>
                    <InfoRow icon={<Users size={14} color="#94a3b8" />} label="Bilangan Pesakit" value={event.bilangan_pesakit ? `${event.bilangan_pesakit} orang` : null} />
                    <InfoRow icon={<FileText size={14} color="#94a3b8" />} label="Catatan" value={event.catatan} />
                  </View>
                </View>

                </View>
            );
          })
        )}

        {filteredEvents.length > 0 && totalPages > 1 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: currentPage === 1 ? '#f1f5f9' : '#1E3A8A' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: currentPage === 1 ? '#94a3b8' : '#fff' }}>Sebelum</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>
              Muka {currentPage} daripada {totalPages}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#1E3A8A' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: currentPage === totalPages ? '#94a3b8' : '#fff' }}>Seterus</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Modal statut */}
      <Modal visible={!!statusModalId} transparent animationType="fade">
        <View style={formStyles.modalOverlay}>
          <View style={[formStyles.modalContent, { backgroundColor: theme.background }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>Kemaskini Status</Text>
              <TouchableOpacity onPress={() => setStatusModalId(null)}>
                <X size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>Pilih status baharu untuk acara ini:</Text>
            {STATUS_OPTIONS.map(s => {
              const sc = STATUS_COLORS[s];
              return (
                <TouchableOpacity key={s}
                  onPress={async () => {
                    await supabaseSandbox.from('pertolongan_cemas').update({ status: s }).eq('id', statusModalId);
                    fetchEvents(); setStatusModalId(null);
                  }}
                  style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: sc.bg, borderWidth: 1.5, borderColor: sc.border }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: sc.text, textTransform: 'capitalize' }}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Modal ajout/modification */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={formStyles.modalOverlay}>
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingVertical: 40 }}>
            <View style={[formStyles.modalContent, { backgroundColor: theme.background, width: '90%', maxWidth: 600 }]}>
              <View style={formStyles.modalHeader}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>
                  {form.id ? 'Kemaskini Acara' : 'Tambah Acara Baru'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <X size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={labelStyle}>Nama Acara *</Text>
              <TextInput style={inputStyle} placeholder="Cth: Kejohanan Sukan Daerah" placeholderTextColor={theme.textSecondary}
                value={form.nama_acara} onChangeText={v => setForm(f => ({ ...f, nama_acara: v }))} />

              <Text style={labelStyle}>Lokasi *</Text>
              <TextInput style={inputStyle} placeholder="Cth: Stadium Labuan" placeholderTextColor={theme.textSecondary}
                value={form.lokasi} onChangeText={v => setForm(f => ({ ...f, lokasi: v }))} />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Tarikh Mula *</Text>
                  {Platform.OS === 'web' ? (
                    createElement('input', {
                      type: 'date', value: form.tarikh || '',
                      onChange: e => setForm(f => ({ ...f, tarikh: e.target.value })),
                      style: { width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, fontSize: 14, boxSizing: 'border-box' },
                    })
                  ) : (
                    <TextInput style={inputStyle} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary}
                      value={form.tarikh} onChangeText={v => setForm(f => ({ ...f, tarikh: v }))} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Masa Mula *</Text>
                  {Platform.OS === 'web' ? (
                    createElement('input', {
                      type: 'time', value: form.masa_mula || '',
                      onChange: e => setForm(f => ({ ...f, masa_mula: e.target.value })),
                      style: { width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, fontSize: 14, boxSizing: 'border-box' },
                    })
                  ) : (
                    <TextInput style={inputStyle} placeholder="HH:MM" placeholderTextColor={theme.textSecondary}
                      value={form.masa_mula} onChangeText={v => setForm(f => ({ ...f, masa_mula: v }))} />
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Tarikh Tamat *</Text>
                  {Platform.OS === 'web' ? (
                    createElement('input', {
                      type: 'date', value: form.tarikh_tamat || '',
                      onChange: e => setForm(f => ({ ...f, tarikh_tamat: e.target.value })),
                      style: { width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, fontSize: 14, boxSizing: 'border-box' },
                    })
                  ) : (
                    <TextInput style={inputStyle} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary}
                      value={form.tarikh_tamat} onChangeText={v => setForm(f => ({ ...f, tarikh_tamat: v }))} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Masa Tamat *</Text>
                  {Platform.OS === 'web' ? (
                    createElement('input', {
                      type: 'time', value: form.masa_tamat || '',
                      onChange: e => setForm(f => ({ ...f, masa_tamat: e.target.value })),
                      style: { width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, fontSize: 14, boxSizing: 'border-box' },
                    })
                  ) : (
                    <TextInput style={inputStyle} placeholder="HH:MM" placeholderTextColor={theme.textSecondary}
                      value={form.masa_tamat} onChangeText={v => setForm(f => ({ ...f, masa_tamat: v }))} />
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Bilangan Pegawai</Text>
                  <TextInput style={inputStyle} placeholder="0" placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric" value={form.bilangan_pegawai}
                    onChangeText={v => setForm(f => ({ ...f, bilangan_pegawai: v.replace(/[^0-9]/g, '') }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Bilangan Anggota</Text>
                  <TextInput style={inputStyle} placeholder="0" placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric" value={form.bilangan_anggota}
                    onChangeText={v => setForm(f => ({ ...f, bilangan_anggota: v.replace(/[^0-9]/g, '') }))} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Bilangan Kenderaan</Text>
                  <TextInput style={inputStyle} placeholder="0" placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric" value={form.bilangan_kenderaan}
                    onChangeText={v => setForm(f => ({ ...f, bilangan_kenderaan: v.replace(/[^0-9]/g, '') }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Bilangan Pesakit</Text>
                  <TextInput style={inputStyle} placeholder="0" placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric" value={form.bilangan_pesakit}
                    onChangeText={v => setForm(f => ({ ...f, bilangan_pesakit: v.replace(/[^0-9]/g, '') }))} />
                </View>
              </View>

              <Text style={labelStyle}>Jenis Kenderaan <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(pilihan)</Text></Text>
              <TouchableOpacity
                style={[inputStyle, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                onPress={() => setJenisKenderaanOpen(true)}
              >
                <Text style={{ color: selectedVehicles.length ? theme.text : theme.textSecondary, fontSize: 14, flex: 1 }} numberOfLines={1}>
                  {selectedVehicles.length ? form.jenis_kenderaan : 'Pilih kenderaan...'}
                </Text>
              </TouchableOpacity>

              <Modal visible={jenisKenderaanOpen} transparent animationType="fade" onRequestClose={() => setJenisKenderaanOpen(false)}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }} activeOpacity={1} onPress={() => setJenisKenderaanOpen(false)}>
                  <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                    <View style={{
                      backgroundColor: theme.card, borderRadius: 16, maxHeight: 460, width: '100%', maxWidth: 420,
                      alignSelf: 'center', overflow: 'hidden',
                      shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10,
                    }}>
                      <View style={{
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                        paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border,
                      }}>
                        <View>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>Pilih Kenderaan</Text>
                          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2, fontWeight: '600' }}>
                            {selectedVehicles.length > 0 ? `${selectedVehicles.length} dipilih` : 'Tiada kenderaan dipilih'}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => setJenisKenderaanOpen(false)} style={{ padding: 4 }}>
                          <X size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>

                      <ScrollView style={{ maxHeight: 320 }}>
                        {vehicleOptions.map((opt, i) => {
                          const selected = selectedVehicles.includes(opt);
                          return (
                            <TouchableOpacity
                              key={opt}
                              onPress={() => toggleVehicle(opt)}
                              style={{
                                flexDirection: 'row', alignItems: 'center', gap: 12,
                                paddingVertical: 13, paddingHorizontal: 18,
                                backgroundColor: selected ? '#eff6ff' : 'transparent',
                                borderBottomWidth: 1,
                                borderBottomColor: '#f1f5f9',
                              }}
                            >
                              <View style={{
                                width: 20, height: 20, borderRadius: 5, borderWidth: 2,
                                borderColor: selected ? '#1E3A8A' : '#cbd5e1',
                                backgroundColor: selected ? '#1E3A8A' : 'transparent',
                                justifyContent: 'center', alignItems: 'center',
                              }}>
                                {selected && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                              </View>
                              <Truck size={15} color={selected ? '#1E3A8A' : '#94a3b8'} />
                              <Text style={{ fontSize: 14, color: theme.text, fontWeight: selected ? '700' : '500', flex: 1 }} numberOfLines={1}>{opt}</Text>
                            </TouchableOpacity>
                          );
                        })}

                        <View
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 12,
                            paddingVertical: 13, paddingHorizontal: 18,
                            backgroundColor: showLainLain ? '#eff6ff' : 'transparent',
                          }}
                        >
                          <TouchableOpacity onPress={toggleLainLain} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{
                              width: 20, height: 20, borderRadius: 5, borderWidth: 2,
                              borderColor: showLainLain ? '#1E3A8A' : '#cbd5e1',
                              backgroundColor: showLainLain ? '#1E3A8A' : 'transparent',
                              justifyContent: 'center', alignItems: 'center',
                            }}>
                              {showLainLain && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                            </View>
                            <Truck size={15} color={showLainLain ? '#1E3A8A' : '#94a3b8'} />
                          </TouchableOpacity>
                          {showLainLain ? (
                            <TextInput
                              style={{ fontSize: 14, color: theme.text, fontWeight: '700', flex: 1, padding: 0, outlineStyle: 'none' }}
                              placeholder="Lain-lain..."
                              placeholderTextColor={theme.textSecondary}
                              value={lainLainValue}
                              onChangeText={(text) => {
                                setForm(f => {
                                  const current = f.jenis_kenderaan ? f.jenis_kenderaan.split(', ').filter(Boolean) : [];
                                  const known = current.filter(v => vehicleOptions.includes(v));
                                  const next = text.trim() ? [...known, text.trim()] : known;
                                  return { ...f, jenis_kenderaan: next.join(', ') };
                                });
                              }}
                            />
                          ) : (
                            <TouchableOpacity onPress={toggleLainLain} style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, color: theme.text, fontWeight: '500' }}>Lain-lain</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </ScrollView>

                      <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: theme.border }}>
                        <TouchableOpacity
                          onPress={() => setJenisKenderaanOpen(false)}
                          style={{ backgroundColor: '#1E3A8A', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Selesai</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>

              <Text style={labelStyle}>Catatan Tambahan <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(pilihan)</Text></Text>
              <TextInput style={[inputStyle, { height: 80, textAlignVertical: 'top' }]} placeholder="Maklumat tambahan..." placeholderTextColor={theme.textSecondary}
                multiline value={form.catatan} onChangeText={v => setForm(f => ({ ...f, catatan: v }))} />

              {/* Status */}
              <Text style={labelStyle}>Status</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {STATUS_OPTIONS.map(s => (
                  <TouchableOpacity key={s} onPress={() => setForm(f => ({ ...f, status: s }))}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: form.status === s ? '#1E3A8A' : '#f1f5f9' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: form.status === s ? '#fff' : '#64748b', textTransform: 'capitalize' }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[formStyles.saveBtn, saving && { opacity: 0.7 }, { marginTop: 20 }]}
                onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.saveBtnText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      </>
  );
}
