// src/screens/angkatan/AngkatanKemaskiniAdminScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { CheckCircle2, XCircle, UserPlus, RefreshCw, ChevronDown, ChevronUp, ClipboardCheck, Inbox } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { useAngkatanKemaskini } from '../../hooks/useAngkatanKemaskini';
import { ALL_FIELDS } from './employeeFieldGroups';

function DiffRow({ label, oldValue, newValue }) {
  const changed = String(oldValue ?? '').trim().toUpperCase() !== String(newValue ?? '').trim().toUpperCase();
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder }}>
      <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: PALETTE.textMutedDark }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 12, color: changed ? '#dc2626' : PALETTE.textDark, textDecorationLine: changed && oldValue ? 'line-through' : 'none' }}>
        {oldValue || '—'}
      </Text>
      <Text style={{ flex: 1, fontSize: 12, fontWeight: changed ? '800' : '400', color: changed ? PALETTE.orange : PALETTE.textDark }}>
        {newValue || '—'}
      </Text>
    </View>
  );
}

// Découpe un champ multi-valeurs en entrées individuelles — gère les deux
// conventions présentes dans les données (numérotation "1) " des anciennes
// données importées, puces "• " des soumissions via le formulaire).
const parseListEntries = (raw) => {
  return String(raw || '')
    .split(/\r?\n|(?=•)|(?<=^|\s)(?=\d{1,2}\)\s)/g)
    .map((line) => line.replace(/^•\s*/, '').replace(/^\d{1,2}\)\s*/, '').trim())
    .filter(Boolean);
};

// Diff ligne par ligne pour les champs listes (Senarai Kursus, etc.) — au lieu
// de comparer tout le bloc de texte d'un coup, ce qui barrait des lignes
// identiques juste parce qu'une autre ligne du même champ avait changé.
function ListDiffRow({ label, oldValue, newValue }) {
  const oldEntries = parseListEntries(oldValue);
  const newEntries = parseListEntries(newValue);
  const normalize = (s) => s.trim().toUpperCase();
  const oldSet = new Set(oldEntries.map(normalize));
  const newSet = new Set(newEntries.map(normalize));

  return (
    <View style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: PALETTE.textMutedDark }}>{label}</Text>
        {(oldEntries.length > 0 || newEntries.length > 0) && (
          <Text style={{ fontSize: 10, fontWeight: '600', color: PALETTE.textMutedDark, marginTop: 2 }}>
            ({oldEntries.length} → {newEntries.length})
          </Text>
        )}
      </View>

      <View style={{ flex: 1, paddingRight: 12 }}>
        {oldEntries.length === 0 ? (
          <Text style={{ fontSize: 12, color: PALETTE.textDark }}>—</Text>
        ) : oldEntries.map((entry, i) => {
          const removed = !newSet.has(normalize(entry));
          return (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ fontSize: 12, width: 16, color: removed ? '#dc2626' : PALETTE.textDark }}>{i + 1}.</Text>
              <Text
                style={{ flex: 1, fontSize: 12, color: removed ? '#dc2626' : PALETTE.textDark, textDecorationLine: removed ? 'line-through' : 'none' }}
              >
                {entry}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {newEntries.length === 0 ? (
          <Text style={{ fontSize: 12, color: PALETTE.textDark }}>—</Text>
        ) : newEntries.map((entry, i) => {
          const added = !oldSet.has(normalize(entry));
          return (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ fontSize: 12, width: 16, fontWeight: added ? '800' : '400', color: added ? PALETTE.orange : PALETTE.textDark }}>{i + 1}.</Text>
              <Text
                style={{ flex: 1, fontSize: 12, fontWeight: added ? '800' : '400', color: added ? PALETTE.orange : PALETTE.textDark }}
              >
                {entry}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PendingCard({ entry, processing, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  return (
    <View style={[
      styles.card,
      {
        padding: 16, marginBottom: 0,
        backgroundColor: PALETTE.cardLight, borderRadius: 16,
        borderWidth: 1, borderColor: PALETTE.cardLightBorder,
        shadowColor: '#c9825a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
      },
    ]}>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} onPress={() => setExpanded((v) => !v)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
            backgroundColor: entry.is_new_entry ? 'rgba(249, 115, 22, 0.12)' : 'rgba(59, 130, 246, 0.12)',
          }}>
            {entry.is_new_entry ? <UserPlus size={19} color={PALETTE.orange} /> : <RefreshCw size={19} color={PALETTE.blue} />}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: PALETTE.textDark }}>{entry.nama || '(Nama kosong)'}</Text>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
                backgroundColor: entry.is_new_entry ? 'rgba(249, 115, 22, 0.12)' : 'rgba(59, 130, 246, 0.12)',
              }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: entry.is_new_entry ? PALETTE.orange : PALETTE.blue }}>
                  {entry.is_new_entry ? 'BAHARU' : 'KEMASKINI'}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: PALETTE.textMutedDark }}>
              {entry.ic_no} · {new Date(entry.submitted_at).toLocaleString('ms-MY')}
            </Text>
          </View>
        </View>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: PALETTE.surface, justifyContent: 'center', alignItems: 'center' }}>
          {expanded ? <ChevronUp size={16} color={PALETTE.textMutedDark} /> : <ChevronDown size={16} color={PALETTE.textMutedDark} />}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder }}>
          <View style={{
            flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, marginBottom: 4,
            backgroundColor: PALETTE.softOrangeBg, borderRadius: 8,
          }}>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', letterSpacing: 0.4, color: PALETTE.textMutedDark }}>MEDAN</Text>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', letterSpacing: 0.4, color: PALETTE.textMutedDark }}>SEDIA ADA</Text>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', letterSpacing: 0.4, color: PALETTE.textMutedDark }}>DIHANTAR</Text>
          </View>
          <View style={{ paddingHorizontal: 10 }}>
            {ALL_FIELDS.filter((f) => f.type !== 'computed_days' && f.type !== 'computed_years').map((f) => {
            if (f.type === 'multiline_list') {
              return (
                <ListDiffRow
                  key={f.key}
                  label={f.label}
                  oldValue={entry._existingSnapshot?.[f.key]}
                  newValue={entry[f.key]}
                />
              );
            }
            const normalize = (v) => (f.type === 'jantina_picker' ? String(v || '').toUpperCase() : v);
            return (
              <DiffRow
                key={f.key}
                label={f.label}
                oldValue={normalize(entry._existingSnapshot?.[f.key])}
                newValue={normalize(entry[f.key])}
              />
            );
            })}
          </View>

          {showRejectBox && (
            <View style={{ marginTop: 14, paddingHorizontal: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, marginBottom: 6 }}>
                Sebab penolakan
              </Text>
              <TextInput
                style={{
                  borderWidth: 1.5, borderColor: '#dc2626', borderRadius: 10,
                  padding: 12, minHeight: 90, textAlignVertical: 'top',
                  fontSize: 14, color: PALETTE.textDark, backgroundColor: '#fef2f2',
                }}
                placeholder="Cth: Nombor telefon tidak lengkap, sila hubungi anggota untuk pengesahan."
                placeholderTextColor="#b91c1c99"
                value={rejectNotes}
                onChangeText={setRejectNotes}
                multiline
                autoFocus
              />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, paddingHorizontal: 10 }}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', backgroundColor: '#16A34A', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6, opacity: processing ? 0.6 : 1 }}
              onPress={() => onApprove(entry)}
              disabled={processing}
            >
              {processing ? <ActivityIndicator size="small" color="#fff" /> : <><CheckCircle2 size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Luluskan</Text></>}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', backgroundColor: '#dc2626', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6, opacity: processing ? 0.6 : 1 }}
              onPress={() => {
                if (!showRejectBox) { setShowRejectBox(true); return; }
                onReject(entry.id, rejectNotes);
              }}
              disabled={processing}
            >
              <XCircle size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{showRejectBox ? 'Sahkan Tolak' : 'Tolak'}</Text>
            </TouchableOpacity>
            {showRejectBox && (
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1.5, borderColor: PALETTE.textMutedDark, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6, opacity: processing ? 0.6 : 1 }}
                onPress={() => { setShowRejectBox(false); setRejectNotes(''); }}
                disabled={processing}
              >
                <Text style={{ color: PALETTE.textMutedDark, fontWeight: '700', fontSize: 13 }}>Batal</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

export default function AngkatanKemaskiniAdminScreen() {
  const { pendingList, loadingKemaskini, processingId, approveEntry, rejectEntry } = useAngkatanKemaskini();

  return (
    <View style={styles.card}>
      <View style={styles.employeeListHeader}>
        <View style={styles.employeeListHeaderLeft}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <View style={styles.sectionIconBadge}>
              <ClipboardCheck size={16} color={PALETTE.orange} />
            </View>
            <Text style={styles.sectionTitle}>SEMAKAN DATA ANGGOTA ({pendingList.length})</Text>
          </View>
        </View>
      </View>

      <Text style={styles.employeeHint}>Ketik pada rekod untuk lihat butiran perubahan</Text>

      <View style={{ marginTop: 14 }}>
        {loadingKemaskini ? (
          <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginVertical: 40 }} />
        ) : pendingList.length === 0 ? (
          <View style={{
            alignItems: 'center', justifyContent: 'center', paddingVertical: 48,
            backgroundColor: PALETTE.softOrangeBg, borderRadius: 16,
          }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(249, 115, 22, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
              <Inbox size={26} color={PALETTE.orange} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textDark, marginBottom: 4 }}>
              Semua rekod sudah disemak
            </Text>
            <Text style={{ fontSize: 12, color: PALETTE.textMutedDark }}>
              Tiada rekod menunggu semakan buat masa ini.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {pendingList.map((entry) => (
              <PendingCard
                key={entry.id}
                entry={entry}
                processing={processingId === entry.id}
                onApprove={approveEntry}
                onReject={rejectEntry}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}