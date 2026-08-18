// src/screens/angkatan/KemaskiniDataPage.js
//
// Version plein-écran (page à part, pas une Modal) du formulaire Kemaskini
// Data Anggota. Ouverte dans un nouvel onglet du navigateur (voir App.js,
// route ?kemaskini=data) depuis AngkatanScreen.js, pour que le formulaire —
// qui peut afficher des données d'employé non publiques — ne s'affiche
// jamais par-dessus la liste des employés dans l'onglet principal.
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';
import { AlertCircle, CheckCircle2, UserPlus, RefreshCw, Plus, Trash2, X, ClipboardEdit } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { useSemakData } from '../../hooks/useSemakData';
import { FIELD_SECTIONS } from './employeeFieldGroups';
import EmployeeField from './EmployeeField';
import { angkatanStyles } from './angkatanStyles';

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

export default function KemaskiniDataPage({ userRole }) {
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

  useEffect(() => {
    const t = setTimeout(() => icBoxRefs.current[0]?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

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

  const handleBackToSearch = () => {
    resetIcInput();
    resetSearch();
    setActiveSection(FIELD_SECTIONS[0]?.title);
  };

  const handleCloseTab = () => {
    if (typeof window !== 'undefined') window.close();
  };

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.softOrangeBg || '#fff7ed' }}>
      <View
        style={{
          backgroundColor: '#0c0c0e', paddingHorizontal: 24, paddingVertical: 18,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: PALETTE.orange, alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardEdit size={18} color="#fff" />
          </View>
          <View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff' }}>Kemaskini Data Anggota</Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: 1 }}>APM W.P Labuan</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {searched && !submitted && form && (userRole === 'admin' || userRole === 'angkatan') && (
            <TouchableOpacity
              onPress={submitKemaskini}
              disabled={submitting}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PALETTE.orange,
                borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, opacity: submitting ? 0.7 : 1,
                shadowColor: PALETTE.orange, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 3,
              }}
            >
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Hantar</Text>}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={searched && !submitted ? handleBackToSearch : handleCloseTab}
            style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32, maxWidth: 900, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            backgroundColor: PALETTE.cardLight || '#fff', borderRadius: 20, borderWidth: 1,
            borderColor: PALETTE.cardLightBorder || '#f1f5f9', padding: 28,
            shadowColor: '#c9825a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3,
            gap: 12,
          }}
        >
        {!searched && !submitted && (
          <>
            <Text style={{ fontSize: 18, fontWeight: '900', color: PALETTE.textDark || '#0f172a', textAlign: 'center', marginBottom: 6 }}>
              Semak &amp; Kemaskini Data Anda
            </Text>
            <Text style={{ fontSize: 13, color: PALETTE.textMutedDark || '#64748b', fontWeight: '600', marginBottom: 20, textAlign: 'center' }}>
              Masukkan nombor kad pengenalan (IC) anda untuk mula.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 3 : 6, marginBottom: 16 }}>
              {icDigits.map((digit, index) => (
                <React.Fragment key={index}>
                  <TextInput
                    ref={(el) => { icBoxRefs.current[index] = el; }}
                    style={{
                      width: isMobile ? 22 : 30, height: isMobile ? 38 : 46, borderWidth: 2,
                      borderColor: digit ? PALETTE.orange : (PALETTE.cardLightBorder || '#e2e8f0'),
                      borderRadius: isMobile ? 8 : 10, backgroundColor: PALETTE.surface || '#f8fafc',
                      textAlign: 'center', fontSize: isMobile ? 14 : 18, fontWeight: '800', color: PALETTE.textDark || '#0f172a',
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
                    <Text style={{ fontSize: isMobile ? 14 : 18, fontWeight: '800', color: '#cbd5e1', marginHorizontal: isMobile ? 1 : 2 }}>-</Text>
                  )}
                </React.Fragment>
              ))}
            </View>

            {searchError ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', marginBottom: 16 }}>
                <AlertCircle size={14} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700', flex: 1 }}>{searchError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSearch}
              disabled={searching}
              style={{
                backgroundColor: PALETTE.orange, borderRadius: 12, height: 52, flexDirection: 'row',
                alignItems: 'center', justifyContent: 'center', gap: 8, opacity: searching ? 0.7 : 1,
                shadowColor: PALETTE.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 3,
              }}
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

            <View style={{
              flexDirection: 'row', width: '100%', marginBottom: 8,
              backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 14, padding: 5, gap: 5,
            }}>
              {FIELD_SECTIONS.map((section) => (
                <TouchableOpacity
                  key={section.title}
                  onPress={() => setActiveSection(section.title)}
                  style={[angkatanStyles.tabBtn, { flex: 1, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10 }, activeSection === section.title && angkatanStyles.tabBtnActive]}
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
        </View>
      </ScrollView>
    </View>
  );
}
