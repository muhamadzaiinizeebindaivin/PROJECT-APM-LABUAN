// src/screens/sekretariat/hotspot/KejadianAnalytics.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { MapPin, Users, ShieldAlert, ClipboardList, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { appStyles as styles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';
import { BULAN_MS } from '../../../constants/bulan';

// Onglet "Analisis & Statistik" : Ringkasan, Trend Bulanan, Kawasan Terjejas Paling Kerap
export default function KejadianAnalytics({ data, currentColor, lokasiPage, setLokasiPage }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  const totalKejadian = data.length;
  const totalMangsa = data.reduce((sum, k) => sum + (k.jumlah_mangsa || 0), 0);
  const totalKir = data.reduce((sum, k) => sum + (k.jumlah_kir || 0), 0);
  const purataMangsa = totalKejadian > 0 ? (totalMangsa / totalKejadian).toFixed(1) : '0';

  // Trend bulanan — année la plus récente présente dans les données, sinon année courante
  const years = data.filter((k) => k.tarikh).map((k) => new Date(k.tarikh).getFullYear());
  const trendYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
  const monthlyCounts = Array(12).fill(0);
  const monthlyMangsa = Array(12).fill(0);
  const monthlyKir = Array(12).fill(0);
  data.forEach((k) => {
    if (!k.tarikh) return;
    const d = new Date(k.tarikh);
    if (d.getFullYear() === trendYear) {
      monthlyCounts[d.getMonth()] += 1;
      monthlyMangsa[d.getMonth()] += k.jumlah_mangsa || 0;
      monthlyKir[d.getMonth()] += k.jumlah_kir || 0;
    }
  });
  const maxMonthly = Math.max(1, ...monthlyCounts);
  const peakMonthIdx = monthlyCounts.indexOf(Math.max(...monthlyCounts));

  // Kawasan Terjejas paling kerap
  const lokasiCounts = {};
  data.forEach((k) => {
    if (!k.lokasi?.trim()) return;
    lokasiCounts[k.lokasi.trim()] = (lokasiCounts[k.lokasi.trim()] || 0) + 1;
  });
  const sortedLokasi = Object.entries(lokasiCounts).sort((a, b) => b[1] - a[1]);
  const LOKASI_PAGE_SIZE = 5;
  const totalLokasiPages = Math.ceil(sortedLokasi.length / LOKASI_PAGE_SIZE);
  const safeLokasiPage = Math.min(lokasiPage, Math.max(0, totalLokasiPages - 1));
  const pagedLokasi = sortedLokasi.slice(safeLokasiPage * LOKASI_PAGE_SIZE, safeLokasiPage * LOKASI_PAGE_SIZE + LOKASI_PAGE_SIZE);

  const statCards = [
    { label: 'Jumlah Kejadian', value: totalKejadian, Icon: ClipboardList, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Jumlah Mangsa', value: totalMangsa, Icon: Users, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Jumlah KIR', value: totalKir, Icon: ShieldAlert, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Purata Mangsa/Kejadian', value: purataMangsa, Icon: BarChart2, color: '#7c3aed', bg: '#f5f3ff' },
  ];

  if (totalKejadian === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${currentColor}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <BarChart2 size={24} color={currentColor} />
        </View>
        <Text style={styles.emptyText}>Tiada data untuk dianalisis bagi kategori ini.</Text>
      </View>
    );
  }

  const sectionCardStyle = {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0',
    padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  };

  return (
    <View>
      {/* ---- Ringkasan ---- */}
      <View style={sectionCardStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${currentColor}14`, alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={14} color={currentColor} />
          </View>
          <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.textDark, textTransform: 'uppercase', letterSpacing: 0.3 }}>Ringkasan</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {statCards.map((card) => (
            <View
              key={card.label}
              style={{
                flexBasis: '48%', flexGrow: 1, backgroundColor: card.bg, borderRadius: 12, padding: 14,
                borderWidth: 1, borderColor: `${card.color}30`,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>{card.label}</Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: card.color }}>{card.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ---- Trend Bulanan ---- */}
      <View style={[sectionCardStyle, { padding: 0 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 14 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={14} color="#2563eb" />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.textDark, textTransform: 'uppercase', letterSpacing: 0.3 }}>Trend Bulanan · {trendYear}</Text>
          </View>

          <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={isMobile} style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', minWidth: isMobile ? 440 : '100%' }}>
              <View style={{ flexDirection: 'row', backgroundColor: '#1e3a8a' }}>
                <View style={{ width: 140, paddingVertical: 14, paddingHorizontal: 14 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Bulan</Text>
                </View>
                <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' }}>Kejadian</Text>
                </View>
                <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' }}>Mangsa</Text>
                </View>
                <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' }}>KIR</Text>
                </View>
              </View>
              {BULAN_MS.map((label, idx) => {
                const isPeak = monthlyCounts[idx] === maxMonthly && maxMonthly > 0 && idx === peakMonthIdx;
                return (
                  <View
                    key={label}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: isPeak ? '#eff6ff' : (idx % 2 === 1 ? (PALETTE.surface || '#f8fafc') : '#fff'),
                      borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder || '#e2e8f0',
                    }}
                  >
                    <View style={{ width: 140, paddingVertical: 14, paddingHorizontal: 14 }}>
                      <Text style={{ fontSize: 15, fontWeight: isPeak ? '800' : '600', color: PALETTE.textDark }}>{label}</Text>
                    </View>
                    <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: isPeak ? '#2563eb' : PALETTE.textDark, textAlign: 'center' }}>{monthlyCounts[idx]}</Text>
                    </View>
                    <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: PALETTE.textDark, textAlign: 'center' }}>{monthlyMangsa[idx]}</Text>
                    </View>
                    <View style={{ width: isMobile ? 100 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: PALETTE.textDark, textAlign: 'center' }}>{monthlyKir[idx]}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

      {/* ---- Kawasan Terjejas Paling Kerap ---- */}
      <View style={[sectionCardStyle, { padding: 0, marginBottom: 0 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 14 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={14} color="#2563eb" />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.textDark, textTransform: 'uppercase', letterSpacing: 0.3 }}>Kawasan Terjejas Paling Kerap</Text>
          </View>

          {pagedLokasi.length === 0 ? (
            <Text style={{ paddingHorizontal: 16, paddingBottom: 16, fontSize: 13, color: PALETTE.textMutedDark, fontStyle: 'italic' }}>Tiada kawasan direkodkan.</Text>
          ) : (
            <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={isMobile} style={{ marginHorizontal: 16, marginBottom: 16 }}>
              <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', minWidth: isMobile ? 500 : '100%' }}>
                <View style={{ flexDirection: 'row', backgroundColor: '#1e3a8a' }}>
                  <View style={{ width: 60, paddingVertical: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' }}>#</Text>
                  </View>
                  <View style={{ width: isMobile ? 300 : undefined, flex: isMobile ? undefined : 2, paddingVertical: 14, paddingHorizontal: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Kawasan</Text>
                  </View>
                  <View style={{ width: isMobile ? 140 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' }}>Kejadian</Text>
                  </View>
                </View>
                {pagedLokasi.map(([lokasi, count], i) => {
                  const globalIdx = safeLokasiPage * LOKASI_PAGE_SIZE + i;
                  return (
                    <View
                      key={lokasi}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: i % 2 === 1 ? (PALETTE.surface || '#f8fafc') : '#fff',
                        borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder || '#e2e8f0',
                      }}
                    >
                      <View style={{ width: 60, paddingVertical: 14 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: PALETTE.textMutedDark, textAlign: 'center' }}>{globalIdx + 1}</Text>
                      </View>
                      <View style={{ width: isMobile ? 300 : undefined, flex: isMobile ? undefined : 2, paddingVertical: 14, paddingHorizontal: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: PALETTE.textDark }} numberOfLines={1}>{lokasi}</Text>
                      </View>
                      <View style={{ width: isMobile ? 140 : undefined, flex: isMobile ? undefined : 1, paddingVertical: 14, paddingHorizontal: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: PALETTE.textDark, textAlign: 'center' }}>{count}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {totalLokasiPages > 1 && (
            <View style={{ alignItems: 'center', paddingVertical: 16, paddingTop: 4, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <TouchableOpacity
                  disabled={safeLokasiPage === 0}
                  onPress={() => setLokasiPage((p) => Math.max(0, p - 1))}
                  style={{
                    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: safeLokasiPage === 0 ? (PALETTE.surface || '#f1f5f9') : 'rgba(249, 115, 22, 0.10)',
                  }}
                >
                  <ChevronLeft size={17} color={safeLokasiPage === 0 ? PALETTE.textMutedDark : PALETTE.orange} />
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={safeLokasiPage >= totalLokasiPages - 1}
                  onPress={() => setLokasiPage((p) => Math.min(totalLokasiPages - 1, p + 1))}
                  style={{
                    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: safeLokasiPage >= totalLokasiPages - 1 ? (PALETTE.surface || '#f1f5f9') : 'rgba(249, 115, 22, 0.10)',
                  }}
                >
                  <ChevronRight size={17} color={safeLokasiPage >= totalLokasiPages - 1 ? PALETTE.textMutedDark : PALETTE.orange} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: PALETTE.textMutedDark }}>{safeLokasiPage + 1} / {totalLokasiPages}</Text>
            </View>
          )}
      </View>
    </View>
  );
}
