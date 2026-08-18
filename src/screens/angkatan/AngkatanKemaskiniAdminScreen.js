// src/screens/angkatan/AngkatanKemaskiniAdminScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
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

function PendingCard({ entry, processing, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  return (
    <View style={[
      styles.card,
      {
        padding: 16, marginBottom: 14,
        backgroundColor: PALETTE.cardLight, borderRadius: 18,
        borderWidth: 1, borderColor: PALETTE.cardLightBorder,
        shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
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
        <View style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: PALETTE.textMutedDark }}>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', color: PALETTE.textMutedDark }}>MEDAN</Text>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', color: PALETTE.textMutedDark }}>SEDIA ADA</Text>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', color: PALETTE.textMutedDark }}>DIHANTAR</Text>
          </View>
          {ALL_FIELDS.filter((f) => f.type !== 'computed_days' && f.type !== 'computed_years').map((f) => {
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

          {showRejectBox && (
            <View style={{ marginTop: 12 }}>
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

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', backgroundColor: '#16A34A', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6, opacity: processing ? 0.6 : 1 }}
              onPress={() => onApprove(entry)}
              disabled={processing}
            >
              {processing ? <ActivityIndicator size="small" color="#fff" /> : <><CheckCircle2 size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Luluskan</Text></>}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', backgroundColor: '#dc2626', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6, opacity: processing ? 0.6 : 1 }}
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
                style={{ flex: 1, flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1.5, borderColor: PALETTE.textMutedDark, padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6, opacity: processing ? 0.6 : 1 }}
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

  if (loadingKemaskini) {
    return (
      <View style={{ flex: 1, backgroundColor: PALETTE.softOrangeBg }}>
        <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PALETTE.softOrangeBg }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(249, 115, 22, 0.12)', justifyContent: 'center', alignItems: 'center' }}>
          <ClipboardCheck size={16} color={PALETTE.orange} />
        </View>
        <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: PALETTE.orange, textTransform: 'uppercase' }}>
          Semakan Data Anggota
        </Text>
        {pendingList.length > 0 ? (
          <View style={{ backgroundColor: PALETTE.orange, borderRadius: 999, minWidth: 22, height: 22, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{pendingList.length}</Text>
          </View>
        ) : null}
      </View>
      

      {pendingList.length === 0 ? (
        <View style={{
          alignItems: 'center', justifyContent: 'center', paddingVertical: 60,
          backgroundColor: PALETTE.cardLight, borderRadius: 16, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
        }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(249, 115, 22, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
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
        pendingList.map((entry) => (
          <PendingCard
            key={entry.id}
            entry={entry}
            processing={processingId === entry.id}
            onApprove={approveEntry}
            onReject={rejectEntry}
          />
        ))
      )}
    </ScrollView>
  );
}