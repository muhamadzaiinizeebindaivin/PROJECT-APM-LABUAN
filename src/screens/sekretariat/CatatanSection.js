// src/screens/sekretariat/CatatanSection.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { StickyNote, Save } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { appStyles as shared } from '../../styles/appStyles';
import { useCatatanSekretariat } from '../../hooks/useCatatanSekretariat';

export default function CatatanSection({ isEditMode, onNotify }) {
  const { catatan, loading, saving, saveCatatan } = useCatatanSekretariat();
  const [draft, setDraft] = useState('');
  const [dirty, setDirty] = useState(false);
  const [focused, setFocused] = useState(false);

  // Segerakkan draf dengan data dari Supabase selagi pengguna belum menaip
  useEffect(() => {
    if (!dirty) setDraft(catatan);
  }, [catatan]);

  // Reset status "dirty" bila keluar dari mod edit tanpa simpan
  useEffect(() => {
    if (!isEditMode) { setDirty(false); setDraft(catatan); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  const handleSave = async () => {
    const ok = await saveCatatan(draft);
    setDirty(false);
    onNotify?.(ok ? 'success' : 'error', ok ? 'Catatan berjaya disimpan.' : 'Gagal menyimpan catatan.');
  };

  return (
    <View style={styles.card}>
      <View style={shared.sectionHeaderRow}>
        <View style={shared.sectionHeaderTitleGroup}>
          <View style={shared.sectionIconBadge}>
            <StickyNote size={16} color={PALETTE.orange} />
          </View>
          <Text style={shared.sectionHeaderTitle}>CATATAN</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={PALETTE.orange} style={{ marginVertical: 10 }} />
      ) : isEditMode ? (
        <>
          <TextInput
            style={[styles.textArea, focused && styles.textAreaFocused]}
            multiline
            numberOfLines={6}
            value={draft}
            onChangeText={(t) => { setDraft(t); setDirty(true); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Tulis catatan di sini..."
            placeholderTextColor={PALETTE.textMutedDark}
            textAlignVertical="top"
          />
          <TouchableOpacity
            onPress={handleSave}
            disabled={!dirty || saving}
            activeOpacity={0.7}
            style={[styles.addBtnOutline, dirty && !saving && styles.addBtnOutlineActive, (!dirty || saving) && { opacity: 0.5 }]}
          >
            <Save size={14} color={PALETTE.orange} style={{ marginRight: 6 }} />
            <Text style={styles.addBtnOutlineText}>{saving ? 'Menyimpan...' : 'Simpan Catatan'}</Text>
          </TouchableOpacity>
        </>
      ) : catatan ? (
        <View style={styles.catatanBox}>
          <Text style={styles.catatanText}>{catatan}</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <StickyNote size={22} color={PALETTE.cardLightBorder} />
          <Text style={[shared.emptyText, { marginTop: 6 }]}>Tiada catatan.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.cardLight, borderRadius: 18, padding: 16, marginBottom: 0,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  catatanBox: {
    backgroundColor: PALETTE.surface, borderRadius: 12, padding: 12, marginTop: 4,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  catatanText: { fontSize: 13, color: PALETTE.textDark, lineHeight: 21 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  textArea: {
    minHeight: 120, borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 12,
    backgroundColor: PALETTE.surface, padding: 12, fontSize: 13, color: PALETTE.textDark, lineHeight: 20,
    outlineStyle: 'none',
  },
  textAreaFocused: { borderColor: PALETTE.orange, borderWidth: 1.5, outlineStyle: 'none' },
  addBtnOutline: {
    marginTop: 10, padding: 10, backgroundColor: PALETTE.surface, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  addBtnOutlineActive: { borderColor: PALETTE.orange, backgroundColor: '#fdf1e7' },
  addBtnOutlineText: { color: PALETTE.orange, fontWeight: '800', fontSize: 12 },
});

