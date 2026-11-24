// src/screens/jawatankuasa/PemantauanBanner.js
//
// Bannière "Pemantauan Aktif" : affichée uniquement s'il existe au moins un
// rapport de pemantauan non clôturé (sekretariat_pemantauan_points).
//   - PemantauanSideLeft  : colonne gauche (grand écran) — alerte + rapport le plus récent
//   - PemantauanSideRight : colonne droite (grand écran) — autres rapports actifs
//   - PemantauanTopBanner : petit écran / mobile — bandeau pleine largeur, dépliable
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform, ScrollView, StyleSheet } from 'react-native';
import { Radio, MapPin, Home, Droplets, Building2, Users, ChevronDown, ChevronUp } from 'lucide-react-native';
import { CMD, masaLalu } from './commandPalette';

// Point rouge clignotant (indicateur "en cours")
function PulseDot({ size = 10 }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.25, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: CMD.red, opacity }} />;
}

function InfoLine({ Icon, label, value }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.infoLine}>
      <Icon size={13} color={CMD.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// Carte d'un rapport de pemantauan
function ReportCard({ report, highlight }) {
  return (
    <View style={[styles.reportCard, highlight && styles.reportCardHighlight]}>
      <View style={styles.reportHeader}>
        <MapPin size={14} color={CMD.orange} />
        <Text style={styles.reportTitle} numberOfLines={2}>{report.lokasi || 'Lokasi tidak dinyatakan'}</Text>
      </View>
      <InfoLine Icon={Home} label="Rumah terjejas" value={report.jumlah_rumah_terjejas != null ? String(report.jumlah_rumah_terjejas) : null} />
      <InfoLine Icon={Droplets} label="Bacaan air" value={report.bacaan_air} />
      <InfoLine Icon={Building2} label="PPS" value={report.pps} />
      <InfoLine Icon={Users} label="Agensi" value={report.agensi_di_lapangan} />
      <Text style={styles.reportTime}>Dilaporkan {masaLalu(report.created_at)}</Text>
    </View>
  );
}

// Position collante sur le web : la colonne reste visible pendant le défilement
const stickyStyle = Platform.OS === 'web' ? { position: 'sticky', top: 16 } : null;

export function PemantauanSideLeft({ reports }) {
  const [latest] = reports;
  return (
    <View style={[styles.rail, stickyStyle]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertTitleRow}>
          <PulseDot />
          <Text style={styles.alertTitle}>PEMANTAUAN AKTIF</Text>
        </View>
        <View style={styles.countBadge}><Text style={styles.countText}>{reports.length}</Text></View>
      </View>
      <Text style={styles.alertSub}>Laporan pemantauan sedang dijalankan. Paparan untuk makluman agensi.</Text>
      <Text style={styles.sectionLabel}>LAPORAN TERKINI</Text>
      <ReportCard report={latest} highlight />
    </View>
  );
}

export function PemantauanSideRight({ reports }) {
  const others = reports.slice(1);
  const totalRumah = reports.reduce((s, r) => s + (Number(r.jumlah_rumah_terjejas) || 0), 0);
  return (
    <View style={[styles.rail, stickyStyle]}>
      <View style={styles.alertTitleRow}>
        <Radio size={14} color={CMD.orange} />
        <Text style={styles.alertTitle}>LAPORAN PEMANTAUAN</Text>
      </View>
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{reports.length}</Text>
          <Text style={styles.summaryLabel}>Laporan aktif</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{totalRumah}</Text>
          <Text style={styles.summaryLabel}>Rumah terjejas</Text>
        </View>
      </View>
      {others.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>LAPORAN LAIN ({others.length})</Text>
          <ScrollView style={styles.railList} contentContainerStyle={{ gap: 10 }}>
            {others.map((r) => <ReportCard key={r.id} report={r} />)}
          </ScrollView>
        </>
      ) : (
        <Text style={styles.emptyText}>Tiada laporan lain buat masa ini.</Text>
      )}
    </View>
  );
}

export function PemantauanTopBanner({ reports }) {
  const [expanded, setExpanded] = useState(false);
  const [latest] = reports;
  return (
    <View style={styles.topBanner}>
      <TouchableOpacity style={styles.topBannerHead} onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
        <PulseDot />
        <View style={{ flex: 1 }}>
          <Text style={styles.alertTitle}>PEMANTAUAN AKTIF ({reports.length})</Text>
          <Text style={styles.topBannerSub} numberOfLines={1}>
            Terkini: {latest.lokasi || 'Lokasi tidak dinyatakan'} · {masaLalu(latest.created_at)}
          </Text>
        </View>
        <Text style={styles.toggleText}>{expanded ? 'Tutup' : 'Lihat'}</Text>
        {expanded ? <ChevronUp size={18} color={CMD.orange} /> : <ChevronDown size={18} color={CMD.orange} />}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.topBannerList}>
          {reports.map((r, i) => <ReportCard key={r.id} report={r} highlight={i === 0} />)}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 260, alignSelf: 'flex-start', backgroundColor: CMD.card, borderRadius: 18,
    borderWidth: 1, borderColor: CMD.orange + '55', padding: 16, gap: 10,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertTitle: { color: CMD.text, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  alertSub: { color: CMD.textMuted, fontSize: 11, lineHeight: 16 },
  countBadge: { minWidth: 26, height: 26, borderRadius: 13, backgroundColor: CMD.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  sectionLabel: { color: CMD.textFaint, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  reportCard: { backgroundColor: CMD.cardSoft, borderRadius: 12, padding: 12, gap: 6 },
  reportCardHighlight: { borderWidth: 1, borderColor: CMD.orange },
  reportHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 2 },
  reportTitle: { flex: 1, color: CMD.text, fontSize: 13, fontWeight: '800' },
  infoLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  infoLabel: { color: CMD.textMuted, fontSize: 11, width: 92 },
  infoValue: { flex: 1, color: CMD.text, fontSize: 11, fontWeight: '700' },
  reportTime: { color: CMD.textFaint, fontSize: 10, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryBox: { flex: 1, backgroundColor: CMD.cardSoft, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  summaryValue: { color: CMD.orange, fontSize: 20, fontWeight: '900' },
  summaryLabel: { color: CMD.textMuted, fontSize: 10, fontWeight: '700' },
  railList: { maxHeight: 520 },
  emptyText: { color: CMD.textMuted, fontSize: 11, fontStyle: 'italic' },
  topBanner: { backgroundColor: CMD.card, borderRadius: 16, borderWidth: 1, borderColor: CMD.orange, overflow: 'hidden' },
  topBannerHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: CMD.cardSoft },
  topBannerSub: { color: CMD.textMuted, fontSize: 11, marginTop: 2 },
  toggleText: { color: CMD.orange, fontSize: 11, fontWeight: '800' },
  topBannerList: { padding: 12, gap: 10 },
});
