// src/components/SemakDataModal.js
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';
import { X, AlertCircle, CheckCircle2, UserPlus, RefreshCw, Plus, Trash2 } from 'lucide-react-native';
import { PALETTE } from '../constants/palette';
import { useSemakData } from '../hooks/useSemakData';
import { FIELD_SECTIONS } from '../screens/angkatan/employeeFieldGroups';
import EmployeeField from '../screens/angkatan/EmployeeField';
import { angkatanStyles } from '../screens/angkatan/angkatanStyles';

// Même convention que splitCourseEntries (useAngkatanEmployees.js) : une entrée
// par ligne, préfixée par "• " — on parse/sérialise dans ce format.
const parseBulletList = (raw) => {
  const entries = String(raw || '')
    .split(/\r?\n|(?=•)/g)
    .map((s) => s.replace(/^•\s*/, '').trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : [''];
};
const serializeBulletList = (entries) => entries.map((e) => `• ${e}`).join('\n');

function BulletListField({ label, value, onChange }) {
  // État local, initialisé UNE FOIS depuis value — évite que le champ se
  // re-synchronise (et efface une ligne vide fraîchement ajoutée via
  // "Tambah") à chaque frappe.
  const [entries, setEntries] = useState(() => parseBulletList(value));

  const updateEntry = (idx, text) => {
    const next = [...entries];
    next[idx] = text;
    setEntries(next);
    onChange(serializeBulletList(next));
  };
  const addEntry = () => {
    const next = [...entries, ''];
    setEntries(next);
    onChange(serializeBulletList(next));
  };
  const removeEntry = (idx) => {
    const next = entries.filter((_, i) => i !== idx);
    const finalEntries = next.length > 0 ? next : [''];
    setEntries(finalEntries);
    onChange(serializeBulletList(finalEntries));
  };

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={angkatanStyles.fieldLabel}>{label}</Text>
      <View style={{ gap: 6, marginTop: 6 }}>
        {entries.map((entry, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '800' }}>•</Text>
            <TextInput
              style={{
                flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 10,
                fontSize: 13, fontWeight: '700', color: '#0f172a', backgroundColor: '#fff',
                outlineStyle: 'none',
              }}
              value={entry}
              onChangeText={(t) => updateEntry(idx, t)}
            />
            {entries.length > 1 && (
              <TouchableOpacity onPress={() => removeEntry(idx)} style={{ padding: 6 }}>
                <Trash2 size={14} color="#dc2626" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity onPress={addEntry} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 2 }}>
          <Plus size={13} color={PALETTE.orange} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.orange }}>Tambah</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SemakDataModal({ visible, onClose }) {
  const { width: appWidth } = useWindowDimensions();
  const isMobile = appWidth < 768;

  const [icDigits, setIcDigits] = useState(Array(12).fill(''));
  const icBoxRefs = useRef([]);
  const [activeSection, setActiveSection] = useState(FIELD_SECTIONS[0]?.title);
  const [activeDatePickerField, setActiveDatePickerField] = useState(null);
  

  const {
    setIcInput, searching, searched, matchedEmployee, form, setForm,
    searchByIc, resetSearch, submitting, submitted, submitKemaskini,
    pendingId, rejectionNote, lastApprovedAt, icNotFound,
  } = useSemakData();

  const [searchError, setSearchError] = useState('');

  const handleIcDigitChange = (index, text) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    setIcDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      setIcInput(next.join(''));
      return next;
    });
    if (digit && index < 11) icBoxRefs.current[index + 1]?.focus();
  };

  const handleIcKeyPress = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !icDigits[index] && index > 0) {
      icBoxRefs.current[index - 1]?.focus();
    }
  };

  const resetIcInput = () => {
    setIcDigits(Array(12).fill(''));
    setIcInput('');
    setSearchError('');
  };

  const handleSearch = async () => {
    if (icDigits.some((d) => !d)) {
      setSearchError('Sila lengkapkan 12 digit nombor kad pengenalan.');
      return;
    }
    setSearchError('');
    await searchByIc();
  };

  const closeModal = () => {
    onClose();
    resetIcInput();
    resetSearch();
  };

  const handleBackToSearch = () => {
    resetIcInput();
    resetSearch();
    setActiveSection(FIELD_SECTIONS[0]?.title);
    
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
      onShow={() => setTimeout(() => icBoxRefs.current[0]?.focus(), 50)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 900, maxHeight: '92%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff' }}>
          <View style={{ backgroundColor: '#0c0c0e', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff' }}>Kemaskini Data Anggota</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {searched && !submitted && form && (
                <TouchableOpacity
                  onPress={submitKemaskini}
                  disabled={submitting}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PALETTE.orange, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Hantar</Text>}
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={searched && !submitted ? handleBackToSearch : closeModal}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            {!searched && !submitted && (
              <>
                <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '600', marginBottom: 4 }}>
                  Masukkan nombor kad pengenalan (IC) anda untuk mula.
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 2 : 4, marginBottom: 12 }}>
                  {icDigits.map((digit, index) => (
                    <React.Fragment key={index}>
                      <TextInput
                        ref={(el) => { icBoxRefs.current[index] = el; }}
                        style={{
                          width: isMobile ? 19 : 26, height: isMobile ? 32 : 40, borderWidth: 1.5,
                          borderColor: digit ? PALETTE.orange : '#e2e8f0',
                          borderRadius: isMobile ? 6 : 8, backgroundColor: '#f8fafc',
                          textAlign: 'center', fontSize: isMobile ? 13 : 16, fontWeight: '800', color: '#0f172a',
                          outlineStyle: 'none', padding: 0,
                        }}
                        value={digit}
                        onChangeText={(t) => handleIcDigitChange(index, t)}
                        onKeyPress={(e) => handleIcKeyPress(index, e)}
                        keyboardType="number-pad"
                        maxLength={1}
                        editable={!searching}
                        onSubmitEditing={index === 11 ? handleSearch : undefined}
                      />
                      {(index === 5 || index === 7) && (
                        <Text style={{ fontSize: isMobile ? 13 : 16, fontWeight: '800', color: '#94a3b8', marginHorizontal: isMobile ? 1 : 2 }}>-</Text>
                      )}
                    </React.Fragment>
                  ))}
                </View>

                {searchError ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca', marginBottom: 12 }}>
                    <AlertCircle size={14} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700', flex: 1 }}>{searchError}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={handleSearch}
                  disabled={searching}
                  style={{ backgroundColor: PALETTE.orange, borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: searching ? 0.7 : 1 }}
                >
                  {searching ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Cari</Text>}
                </TouchableOpacity>
              </>
            )}

            {submitted && (
              <View style={{ alignItems: 'center', paddingVertical: 30, gap: 14 }}>
                <CheckCircle2 size={44} color={PALETTE.orange} />
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
                  Terima kasih! Data anda telah dihantar untuk semakan admin.
                </Text>
                <TouchableOpacity
                  onPress={handleBackToSearch}
                  style={{ backgroundColor: PALETTE.orange, borderRadius: 12, height: 48, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Semak Data Lain</Text>
                </TouchableOpacity>
              </View>
            )}

            {searched && !submitted && icNotFound && (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: 14 }}>
                <AlertCircle size={44} color="#dc2626" />
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
                  Nombor kad pengenalan tidak dijumpai
                </Text>
                <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', paddingHorizontal: 20 }}>
                  Sistem ini hanya untuk anggota berdaftar. Sila hubungi admin jika anda anggota tetapi rekod anda tidak dijumpai.
                </Text>
                <TouchableOpacity
                  onPress={handleBackToSearch}
                  style={{ backgroundColor: PALETTE.orange, borderRadius: 12, height: 48, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Cuba IC Lain</Text>
                </TouchableOpacity>
              </View>
            )}

            {searched && !submitted && form && (
              <View style={{ gap: 16 }}>
                {rejectionNote ? (
                  <View style={{ backgroundColor: '#fef2f2', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fecaca' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#dc2626', marginBottom: 4 }}>
                      Rekod ini telah ditolak oleh admin
                    </Text>
                    <Text style={{ fontSize: 13, color: '#7f1d1d' }}>{rejectionNote}</Text>
                    <Text style={{ fontSize: 12, color: '#991b1b', marginTop: 6, fontStyle: 'italic' }}>
                      Sila betulkan data di bawah dan hantar semula.
                    </Text>
                  </View>
                ) : lastApprovedAt ? (
                  <View style={{ backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#bbf7d0' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#16a34a', marginBottom: 4 }}>
                      Kemaskini terdahulu telah diluluskan
                    </Text>
                    <Text style={{ fontSize: 12, color: '#166534' }}>
                      Diluluskan pada {lastApprovedAt.toLocaleString('ms-MY')}. Data di bawah adalah rekod terkini anda — boleh dikemaskini semula jika perlu.
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#fff7ed', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fed7aa', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {matchedEmployee ? <RefreshCw size={18} color={PALETTE.orange} /> : <UserPlus size={18} color={PALETTE.orange} />}
                    <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.orange, flex: 1 }}>
                      {pendingId
                        ? 'Data sudah dihantar — boleh dikemaskini sebelum disemak admin'
                        : matchedEmployee
                          ? 'Data ditemui — sila semak & kemaskini'
                          : 'Data belum wujud — sila lengkapkan data baru'}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', width: '100%', marginBottom: 4 }}>
                  {FIELD_SECTIONS.map((section) => (
                    <TouchableOpacity
                      key={section.title}
                      onPress={() => setActiveSection(section.title)}
                      style={[angkatanStyles.tabBtn, { flex: 1, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 }, activeSection === section.title && angkatanStyles.tabBtnActive]}
                    >
                        <Text style={[angkatanStyles.tabBtnText, activeSection === section.title && angkatanStyles.tabBtnTextActive]}>
                        {section.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {FIELD_SECTIONS.find((s) => s.title === activeSection)?.fields
                  .filter((f) => f.type !== 'computed_days' && f.key !== 'ic_no')
                  .map((f) =>
                    f.type === 'multiline_list' ? (
                      <BulletListField
                        key={`${f.key}-${form.ic_no || 'new'}`}
                        label={f.label}
                        value={form[f.key]}
                        onChange={(t) => setForm({ ...form, [f.key]: t })}
                      />
                    ) : (
                      <EmployeeField
                        key={f.key}
                        field={f}
                        form={form}
                        setForm={setForm}
                        isEditing={true}
                        activeDatePickerField={activeDatePickerField}
                        setActiveDatePickerField={setActiveDatePickerField}
                      />
                    )
                  )}
                
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}