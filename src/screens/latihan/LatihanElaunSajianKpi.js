import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Wallet, TrendingUp, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { formatCurrency } from '../../utils/currency';
import { kewanganStyles as styles } from '../kewangan/kewanganStyles';

function KpiRow({ label, agihan, belanja, baki, isMobile, isEditMode, onEditAgihan }) {
  const [draft, setDraft] = useState(String(agihan));
  const inputRef = useRef(null);

  // Le brouillon suit la valeur réelle tant qu'on n'est pas en train de la
  // modifier soi-même — évite d'écraser une saisie en cours si agihan change
  // ailleurs, tout en restant à jour quand isEditMode s'active.
  useEffect(() => {
    setDraft(String(agihan));
  }, [agihan]);

  const [isSaving, setIsSaving] = useState(false);

  const confirmEdit = async () => {
    const num = parseFloat(draft);
    const clamped = Number.isFinite(num) ? Math.max(0, num) : 0;
    setIsSaving(true);
    await onEditAgihan(clamped);
    setIsSaving(false);
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={[styles.kpiRow, isMobile && { flexDirection: 'column' }]}>
        <View style={[
          styles.kpiCard,
          { backgroundColor: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)' },
          isEditMode && { borderColor: PALETTE.blue, borderWidth: 2, backgroundColor: 'rgba(59, 130, 246, 0.14)' },
        ]}>
          <Text style={[styles.kpiTitle, { color: PALETTE.blue }]}>Jumlah Agihan</Text>
          {isEditMode ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: PALETTE.blue, borderRadius: 8, backgroundColor: '#fff', paddingHorizontal: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: PALETTE.blue, marginRight: 4, lineHeight: 22 }}>RM</Text>
                <TextInput
                  ref={inputRef}
                  value={draft}
                  onChangeText={(t) => setDraft(t.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  onSubmitEditing={confirmEdit}
                  returnKeyType="done"
                  style={{ paddingVertical: 8, fontSize: 16, lineHeight: 22, fontWeight: '700', color: PALETTE.textDark, width: 90, outlineStyle: 'none' }}
                />
              </View>
              <TouchableOpacity
                onPress={confirmEdit}
                disabled={isSaving}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#16a34a', opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Check size={14} color="#fff" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Simpan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.kpiValue, { color: PALETTE.blue }, isMobile && { fontSize: 15 }]}>RM {formatCurrency(agihan)}</Text>
          )}
          <Wallet size={26} color={PALETTE.blue} style={{ position: 'absolute', top: 10, right: 10, opacity: 0.35 }} />
        </View>
        <View style={[styles.kpiCard, { backgroundColor: PALETTE.softOrangeBg, borderColor: 'rgba(249, 115, 22, 0.25)' }]}>
          <Text style={[styles.kpiTitle, { color: PALETTE.orange }]}>Jumlah Belanja</Text>
          <Text style={[styles.kpiValue, { color: PALETTE.orange }, isMobile && { fontSize: 15 }]}>RM {formatCurrency(belanja)}</Text>
          <TrendingUp size={26} color={PALETTE.orange} style={{ position: 'absolute', top: 10, right: 10, opacity: 0.35 }} />
        </View>
        <View style={[styles.kpiCard, { backgroundColor: 'rgba(22, 163, 74, 0.08)', borderColor: 'rgba(22, 163, 74, 0.25)' }]}>
          <Text style={[styles.kpiTitle, { color: '#16a34a' }]}>Baki Semasa</Text>
          <Text style={[styles.kpiValue, { color: '#16a34a' }, isMobile && { fontSize: 15 }]}>RM {formatCurrency(baki)}</Text>
          <Check size={26} color="#16a34a" style={{ position: 'absolute', top: 10, right: 10, opacity: 0.35 }} />
        </View>
      </View>
    </View>
  );
}

export default function LatihanElaunSajianKpi({ latihanList, settings, isEditMode, onSaveSettings, onNotify }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  const totalElaun = latihanList.reduce((sum, item) => sum + (parseFloat(item.elaun_latihan) || 0), 0);
  const totalSajian = latihanList.reduce((sum, item) => sum + (parseFloat(item.kos_sajian) || 0), 0);

  const handleSave = async (updates) => {
    const ok = await onSaveSettings(updates);
    onNotify?.(ok ? 'success' : 'error', ok ? 'Jumlah agihan berjaya dikemaskini.' : 'Gagal mengemaskini jumlah agihan.');
    return ok;
  };

  return (
    <View>
      <KpiRow
        label="Elaun Latihan"
        agihan={settings.agihan_elaun}
        belanja={totalElaun}
        baki={settings.agihan_elaun - totalElaun}
        isMobile={isMobile}
        isEditMode={isEditMode}
        onEditAgihan={(val) => handleSave({ agihan_elaun: val })}
      />
      <KpiRow
        label="Sajian"
        agihan={settings.agihan_sajian}
        belanja={totalSajian}
        baki={settings.agihan_sajian - totalSajian}
        isMobile={isMobile}
        isEditMode={isEditMode}
        onEditAgihan={(val) => handleSave({ agihan_sajian: val })}
      />
    </View>
  );
}