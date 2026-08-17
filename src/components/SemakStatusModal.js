import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator, Linking, useWindowDimensions } from 'react-native';
import { ShieldCheck, X, AlertCircle, CreditCard, Award, FileText, ExternalLink, GraduationCap } from 'lucide-react-native';
import { PALETTE } from '../constants/palette';
import { supabaseSandbox } from '../supabaseSandboxClient';

// Convertit une date ISO (YYYY-MM-DD) en format standard Malaysia (DD/MM/YYYY).
// Renvoie la valeur telle quelle si elle n'a pas ce format (ex: '-', null, texte libre).
const formatDateMY = (isoDate) => {
  if (!isoDate || typeof isoDate !== 'string') return isoDate;
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

export default function SemakStatusModal({ visible, onClose }) {
  const { width: appWidth } = useWindowDimensions();
  const isMobile = appWidth < 768;

  const [statusIcInput, setStatusIcInput] = useState('');
  const [icDigits, setIcDigits] = useState(Array(12).fill(''));
  const icBoxRefs = useRef([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [statusCooldown, setStatusCooldown] = useState(false);

  const handleIcDigitChange = (index, text) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    setIcDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      setStatusIcInput(next.join(''));
      return next;
    });
    if (digit && index < 11) {
      icBoxRefs.current[index + 1]?.focus();
    }
  };

  const handleIcKeyPress = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !icDigits[index] && index > 0) {
      icBoxRefs.current[index - 1]?.focus();
    }
  };

  const resetIcInput = () => {
    setIcDigits(Array(12).fill(''));
    setStatusIcInput('');
  };

  const handleCheckStatus = async () => {
    if (!statusIcInput.trim()) {
      setStatusError('Sila masukkan nombor kad pengenalan.');
      return;
    }
    setStatusLoading(true);
    setStatusError('');
    setStatusResult(null);
    const formattedIc = statusIcInput.trim().length === 12
      ? `${statusIcInput.slice(0, 6)}-${statusIcInput.slice(6, 8)}-${statusIcInput.slice(8, 12)}`
      : statusIcInput.trim();
    const { data, error } = await supabaseSandbox.rpc('check_status', { p_ic_no: formattedIc });
    setStatusLoading(false);
    if (error) {
      setStatusError('Ralat semasa semakan. Sila cuba lagi.');
      return;
    }
    if (!data) {
      setStatusError('Tiada rekod dijumpai untuk nombor kad pengenalan ini.');
      return;
    }
    setStatusResult(data);
    setStatusCooldown(true);
    setTimeout(() => setStatusCooldown(false), 5000);
  };

  const closeStatusModal = () => {
    onClose();
    resetIcInput();
    setStatusError('');
    setStatusResult(null);
  };

  const handleCloseResult = () => {
    setStatusError('');
    setStatusResult(null);
  };

  const getStatusBadgeStyle = (value) => {
    if (!value) return { bg: '#f1f5f9', color: '#64748b' };
    const v = value.toLowerCase();
    if (v.includes('tidak')) return { bg: '#fef2f2', color: '#dc2626' };
    if (v.includes('aktif')) return { bg: '#f0fdf4', color: '#16a34a' };
    return { bg: '#f1f5f9', color: '#64748b' };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={statusResult ? handleCloseResult : closeStatusModal}
      onShow={() => setTimeout(() => icBoxRefs.current[0]?.focus(), 50)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 900, maxHeight: '92%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff' }}>
          <View style={{ backgroundColor: '#0c0c0e', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff' }}>Semak Status</Text>
            <TouchableOpacity onPress={statusResult ? handleCloseResult : closeStatusModal}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            {!statusResult && (
              <>
                <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 4 }}>
                  Masukkan nombor kad pengenalan (IC) untuk menyemak status.
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
                        editable={!statusLoading}
                        onSubmitEditing={index === 11 ? handleCheckStatus : undefined}
                      />
                      {(index === 5 || index === 7) && (
                        <Text style={{ fontSize: isMobile ? 13 : 16, fontWeight: '800', color: '#94a3b8', marginHorizontal: isMobile ? 1 : 2 }}>-</Text>
                      )}
                    </React.Fragment>
                  ))}
                </View>

                {statusError ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca', marginBottom: 12 }}>
                    <AlertCircle size={14} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700', flex: 1 }}>{statusError}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={handleCheckStatus}
                  disabled={statusLoading || statusCooldown}
                  style={{ backgroundColor: PALETTE.orange, borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (statusLoading || statusCooldown) ? 0.7 : 1 }}
                >
                  {statusLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Semak</Text>}
                </TouchableOpacity>
              </>
            )}

            {statusResult && (
              <View style={{ gap: 16 }}>
                <View style={{ backgroundColor: '#fff7ed', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fed7aa' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.orange, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nama</Text>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', marginTop: 2 }}>{statusResult.nama || '-'}</Text>
                  <View style={{ height: 1, backgroundColor: '#fed7aa', marginVertical: 10 }} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.orange, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nombor Badan</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginTop: 2 }}>{statusResult.no_anggota || '-'}</Text>
                </View>

                <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <ShieldCheck size={14} color="#64748b" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Insurans</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Kelompok/Individu</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.insurans?.insuran_kelompok_individu || '-'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Status Aktif</Text>
                    <View style={{ backgroundColor: getStatusBadgeStyle(statusResult.insurans?.insuran_aktif_tidak).bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: getStatusBadgeStyle(statusResult.insurans?.insuran_aktif_tidak).color }}>{statusResult.insurans?.insuran_aktif_tidak || '-'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Tamat</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{formatDateMY(statusResult.insurans?.tarikh_tamat_insuran) || '-'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Baki Hari Aktif</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.insurans?.tempoh_baki_aktif_insuran_hari ?? '-'}</Text>
                  </View>
                </View>

                <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <CreditCard size={14} color="#64748b" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Kad Pelantikan</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Aktif</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{formatDateMY(statusResult.kad?.tarikh_aktif_kad) || '-'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Tamat</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{formatDateMY(statusResult.kad?.tarikh_tamat_kad) || '-'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Baki Hari Aktif</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.kad?.tempoh_baki_aktif_kad_hari ?? '-'}</Text>
                  </View>
                </View>

                <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <ShieldCheck size={14} color="#64748b" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Perkeso</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Jabatan/Individu</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.perkeso?.perkeso_jabatan_individu || '-'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Status Aktif</Text>
                    <View style={{ backgroundColor: getStatusBadgeStyle(statusResult.perkeso?.perkeso_aktif_tidak).bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: getStatusBadgeStyle(statusResult.perkeso?.perkeso_aktif_tidak).color }}>{statusResult.perkeso?.perkeso_aktif_tidak || '-'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Tamat</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{formatDateMY(statusResult.perkeso?.tarikh_tamat_perkeso) || '-'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Baki Hari Caruman</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{statusResult.perkeso?.tempoh_baki_caruman_perkeso_hari ?? '-'}</Text>
                  </View>
                </View>

                <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Award size={14} color="#64748b" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pelantikan</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Menyertai APM</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{formatDateMY(statusResult.pelantikan?.tarikh_menyertai_apm) || '-'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Tarikh Terima Pangkat Terkini</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700' }}>{formatDateMY(statusResult.pelantikan?.tarikh_terima_pangkat_terkini) || '-'}</Text>
                  </View>
                </View>

                <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <FileText size={14} color="#64748b" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sijil</Text>
                  </View>
                  {(statusResult.sijil || []).length === 0 ? (
                    <Text style={{ fontSize: 13, color: '#94a3b8' }}>Tiada sijil direkodkan.</Text>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {statusResult.sijil.map((s, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => s.google_drive_link && Linking.openURL(s.google_drive_link)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.orange }}>{s.nom_certificat || 'Sijil'}</Text>
                          {s.google_drive_link ? <ExternalLink size={12} color={PALETTE.orange} /> : null}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <GraduationCap size={14} color="#64748b" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Kursus</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#0f172a', lineHeight: 19 }}>{statusResult.kursus || '-'}</Text>
                </View>

              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}