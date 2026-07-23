// src/screens/operasi/PertolonganCemasTab.js
import React, { useState, useEffect, useCallback, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { Plus, X, Edit2, Trash2, Calendar, MapPin, Users, Truck, Package, Pill, FileText, Clock, Camera, Image as ImageIcon } from 'lucide-react-native';
import { supabaseSandbox } from '../../supabaseSandboxClient';
import { formStyles } from '../../styles/formStyles';
import { reportStyles as styles } from './reportStyles';
import { canEditSection } from '../../permissions';

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
  masa_mula: '',
  masa_tamat: '',
  bilangan_anggota: '',
  bilangan_kenderaan: '',
  jenis_kenderaan: '',
  peralatan: '',
  ubatan: '',
  catatan: '',
  status: 'aktif',
};

const BUCKET = 'pertolongan-cemas-photos';

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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [statusModalId, setStatusModalId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Photos
  const [pendingFiles, setPendingFiles] = useState([]);
  const [photoViewer, setPhotoViewer] = useState(null); // { photos, index }

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseSandbox
      .from('pertolongan_cemas')
      .select('*, pertolongan_cemas_photos(id, photo_url)')
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
    const sub2 = supabaseSandbox
      .channel('pertolongan_cemas_photos_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'pertolongan_cemas_photos' }, fetchEvents)
      .subscribe();
    return () => { supabaseSandbox.removeChannel(sub1); supabaseSandbox.removeChannel(sub2); };
  }, [fetchEvents]);

  const uploadPhoto = async (file) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabaseSandbox.storage.from(BUCKET).upload(fileName, file, { contentType: file.type });
    if (error) return { url: null, error };
    const { data } = supabaseSandbox.storage.from(BUCKET).getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
  };

  const deletePhoto = async (photoId, photoUrl) => {
    if (photoUrl) {
      const fileName = photoUrl.split('/').pop();
      await supabaseSandbox.storage.from(BUCKET).remove([fileName]);
    }
    await supabaseSandbox.from('pertolongan_cemas_photos').delete().eq('id', photoId);
    fetchEvents();
  };

  const addPhotosToEvent = async (acara_id, files) => {
    const urls = [];
    for (const file of files) {
      const { url, error } = await uploadPhoto(file);
      if (!error && url) urls.push(url);
    }
    if (urls.length > 0) {
      await supabaseSandbox.from('pertolongan_cemas_photos').insert(
        urls.map(photo_url => ({ acara_id, photo_url }))
      );
    }
    await fetchEvents();
  };

  const handlePickPhotos = () => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jpg,.jpeg,.png,.gif,.webp,.heic';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      setPendingFiles(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
    };
    input.click();
  };

  const handleSave = async () => {
    if (!form.nama_acara || !form.lokasi || !form.tarikh || !form.masa_mula || !form.masa_tamat) {
      Alert.alert('Ralat', 'Sila isi semua maklumat wajib.');
      return;
    }
    setSaving(true);
    const payload = {
      nama_acara: form.nama_acara.trim(),
      lokasi: form.lokasi.trim(),
      tarikh: form.tarikh,
      masa_mula: form.masa_mula,
      masa_tamat: form.masa_tamat,
      bilangan_anggota: parseInt(form.bilangan_anggota) || 0,
      bilangan_kenderaan: parseInt(form.bilangan_kenderaan) || 0,
      jenis_kenderaan: form.jenis_kenderaan.trim() || null,
      peralatan: form.peralatan.trim() || null,
      ubatan: form.ubatan.trim() || null,
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
      if (pendingFiles.length > 0) await addPhotosToEvent(recordId, pendingFiles.map(p => p.file));
      else await fetchEvents();
      closeModal();
    } else Alert.alert('Ralat', 'Gagal menyimpan. Sila cuba lagi.');
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const confirmed = Platform.OS === 'web' ? window.confirm('Padam acara ini?') : true;
    if (!confirmed) return;
    // Supprimer les photos du bucket
    const event = events.find(e => e.id === id);
    if (event?.pertolongan_cemas_photos?.length > 0) {
      const fileNames = event.pertolongan_cemas_photos.map(p => p.photo_url.split('/').pop());
      await supabaseSandbox.storage.from(BUCKET).remove(fileNames);
    }
    await supabaseSandbox.from('pertolongan_cemas').delete().eq('id', id);
    fetchEvents();
  };

  const openEdit = (event) => {
    setForm({
      id: event.id,
      nama_acara: event.nama_acara || '',
      lokasi: event.lokasi || '',
      tarikh: event.tarikh || '',
      masa_mula: event.masa_mula || '',
      masa_tamat: event.masa_tamat || '',
      bilangan_anggota: String(event.bilangan_anggota || ''),
      bilangan_kenderaan: String(event.bilangan_kenderaan || ''),
      jenis_kenderaan: event.jenis_kenderaan || '',
      peralatan: event.peralatan || '',
      ubatan: event.ubatan || '',
      catatan: event.catatan || '',
      status: event.status || 'aktif',
    });
    setPendingFiles([]);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setForm(EMPTY_FORM);
    setPendingFiles([]);
  };

  const availableYears = [...new Set(events.map(e => new Date(e.tarikh).getFullYear()))].sort((a, b) => b - a);

  const filteredEvents = events.filter(e => {
    if (new Date(e.tarikh).getFullYear() !== filterYear) return false;
    if (filterStatus !== 'semua' && e.status !== filterStatus) return false;
    if (searchQuery.trim() && !(e.nama_acara + e.lokasi).toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  });

  const inputStyle = [formStyles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginBottom: 0 }];
  const labelStyle = { fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 4, marginTop: 12 };

  const existingPhotos = form.id ? (events.find(e => e.id === form.id)?.pertolongan_cemas_photos || []) : [];

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
          filteredEvents.map(event => {
            const sc = STATUS_COLORS[event.status] || STATUS_COLORS.aktif;
            const photos = event.pertolongan_cemas_photos || [];
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
                    <InfoRow icon={<Calendar size={14} color="#94a3b8" />} label="Tarikh" value={event.tarikh} />
                    <InfoRow icon={<Clock size={14} color="#94a3b8" />} label="Masa" value={`${event.masa_mula} – ${event.masa_tamat}`} />
                    <InfoRow icon={<Users size={14} color="#94a3b8" />} label="Bilangan Anggota" value={`${event.bilangan_anggota} orang`} />
                    <InfoRow icon={<Truck size={14} color="#94a3b8" />} label="Kenderaan" value={event.bilangan_kenderaan ? `${event.bilangan_kenderaan} unit${event.jenis_kenderaan ? ` (${event.jenis_kenderaan})` : ''}` : null} />
                  </View>
                  <View style={{ flex: 1, minWidth: 200 }}>
                    <InfoRow icon={<Package size={14} color="#94a3b8" />} label="Peralatan" value={event.peralatan} />
                    <InfoRow icon={<Pill size={14} color="#94a3b8" />} label="Ubatan" value={event.ubatan} />
                    <InfoRow icon={<FileText size={14} color="#94a3b8" />} label="Catatan" value={event.catatan} />
                  </View>
                </View>

                {/* Photos */}
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 8 }}>
                    FOTO {photos.length > 0 ? `(${photos.length})` : ''}
                  </Text>
                  {photos.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {photos.map((photo, i) => (
                          <TouchableOpacity key={photo.id} onPress={() => setPhotoViewer({ photos, index: i })}>
                            <Image source={{ uri: photo.photo_url }} style={{ width: 72, height: 72, borderRadius: 10 }} resizeMode="cover" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  ) : (
                    <Text style={{ fontSize: 12, color: '#cbd5e1', fontStyle: 'italic' }}>Tiada gambar</Text>
                  )}
                </View>
              </View>
            );
          })
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

              <Text style={labelStyle}>Tarikh *</Text>
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

              <View style={{ flexDirection: 'row', gap: 12 }}>
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
                  <Text style={labelStyle}>Bilangan Anggota</Text>
                  <TextInput style={inputStyle} placeholder="0" placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric" value={form.bilangan_anggota}
                    onChangeText={v => setForm(f => ({ ...f, bilangan_anggota: v.replace(/[^0-9]/g, '') }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Bilangan Kenderaan</Text>
                  <TextInput style={inputStyle} placeholder="0" placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric" value={form.bilangan_kenderaan}
                    onChangeText={v => setForm(f => ({ ...f, bilangan_kenderaan: v.replace(/[^0-9]/g, '') }))} />
                </View>
              </View>

              <Text style={labelStyle}>Jenis Kenderaan <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(pilihan)</Text></Text>
              <TextInput style={inputStyle} placeholder="Cth: Ambulans, MPV" placeholderTextColor={theme.textSecondary}
                value={form.jenis_kenderaan} onChangeText={v => setForm(f => ({ ...f, jenis_kenderaan: v }))} />

              <Text style={labelStyle}>Peralatan <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(pilihan)</Text></Text>
              <TextInput style={[inputStyle, { height: 70, textAlignVertical: 'top' }]} placeholder="Senarai peralatan..." placeholderTextColor={theme.textSecondary}
                multiline value={form.peralatan} onChangeText={v => setForm(f => ({ ...f, peralatan: v }))} />

              <Text style={labelStyle}>Ubatan <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(pilihan)</Text></Text>
              <TextInput style={[inputStyle, { height: 70, textAlignVertical: 'top' }]} placeholder="Senarai ubatan..." placeholderTextColor={theme.textSecondary}
                multiline value={form.ubatan} onChangeText={v => setForm(f => ({ ...f, ubatan: v }))} />

              <Text style={labelStyle}>Catatan Tambahan <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(pilihan)</Text></Text>
              <TextInput style={[inputStyle, { height: 80, textAlignVertical: 'top' }]} placeholder="Maklumat tambahan..." placeholderTextColor={theme.textSecondary}
                multiline value={form.catatan} onChangeText={v => setForm(f => ({ ...f, catatan: v }))} />

              {/* Section Photos */}
              <Text style={labelStyle}>Foto <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(pilihan)</Text></Text>

              {/* Photos existantes */}
              {existingPhotos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {existingPhotos.map((photo) => (
                      <View key={photo.id} style={{ position: 'relative' }}>
                        <TouchableOpacity onPress={() => setPhotoViewer({ photos: existingPhotos, index: existingPhotos.indexOf(photo) })}>
                          <Image source={{ uri: photo.photo_url }} style={{ width: 80, height: 80, borderRadius: 8 }} resizeMode="cover" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => { if (window.confirm('Padam foto ini?')) deletePhoto(photo.id, photo.photo_url); }}
                          style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                          <X size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              {/* Photos en attente */}
              {pendingFiles.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {pendingFiles.map((p, index) => (
                      <View key={index} style={{ position: 'relative' }}>
                        <Image source={{ uri: p.preview }} style={{ width: 80, height: 80, borderRadius: 8, opacity: 0.8 }} resizeMode="cover" />
                        <TouchableOpacity
                          onPress={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))}
                          style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#64748b', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                          <X size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              <TouchableOpacity onPress={handlePickPhotos}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 }}>
                <Camera size={18} color="#64748b" />
                <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13 }}>
                  {existingPhotos.length + pendingFiles.length > 0 ? 'Tambah Foto Lagi' : 'Pilih Foto'}
                </Text>
              </TouchableOpacity>

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

      {/* Visionneuse photos */}
      {photoViewer && (
        <Modal visible={true} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setPhotoViewer(null)}
              style={{ position: 'absolute', top: 40, right: 24, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginBottom: 12, opacity: 0.8 }}>
              {photoViewer.index + 1} / {photoViewer.photos.length}
            </Text>
            <Image source={{ uri: photoViewer.photos[photoViewer.index].photo_url }}
              style={{ width: '90%', height: '70%', borderRadius: 12 }} resizeMode="contain" />
            {photoViewer.photos.length > 1 && (
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 20 }}>
                <TouchableOpacity
                  onPress={() => setPhotoViewer(prev => ({ ...prev, index: prev.index - 1 }))}
                  disabled={photoViewer.index === 0}
                  style={{ backgroundColor: photoViewer.index === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 }}>
                  <Text style={{ color: photoViewer.index === 0 ? 'rgba(255,255,255,0.3)' : '#fff', fontWeight: '700' }}>← Sebelum</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPhotoViewer(prev => ({ ...prev, index: prev.index + 1 }))}
                  disabled={photoViewer.index === photoViewer.photos.length - 1}
                  style={{ backgroundColor: photoViewer.index === photoViewer.photos.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 }}>
                  <Text style={{ color: photoViewer.index === photoViewer.photos.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff', fontWeight: '700' }}>Selepas →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>
      )}
    </>
  );
}
