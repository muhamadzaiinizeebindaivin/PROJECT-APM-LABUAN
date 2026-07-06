// src/components/archive/PentadbiranArchiveView.js
//
// Version "lecture seule" de PentadbiranScreen.js — reprend exactement les mêmes
// styles et la même structure visuelle que l'écran original, mais sans édition
// (pas de modals, pas de CRUD), alimentée par les données d'une sauvegarde archivée.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

export default function PentadbiranArchiveView({ data }) {
  const pageData = data || {};

  const openOrgChart = () => {
    Linking.openURL('https://www.civildefence.gov.my/wilayah-persekutuan-labuan/');
  };

  return (
    <View>
      {/* HEADER & CARTA ORGANISASI LINK */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
          <Text style={styles.headerTitle}>DIKEMASKINI </Text>
          <Text style={styles.headerTitle}>{pageData.dikemaskini}</Text>
        </View>
        <TouchableOpacity style={styles.linkButton} onPress={openOrgChart}>
          <Text style={styles.linkButtonText}>Lihat Carta Organisasi Rasmi</Text>
        </TouchableOpacity>
      </View>

      {/* INSPEKTORAT PEMATUHAN */}
      {pageData.pematuhan?.length ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>INSPEKTORAT PEMATUHAN</Text>
          <View style={styles.complianceRow}>
            {pageData.pematuhan.map((item, index) => (
              <View key={`pematuhan-${index}`} style={styles.complianceBox}>
                <Text style={styles.complianceScore}>{item.score}%</Text>
                <Text style={styles.complianceTitle}>{item.title}</Text>
                <Text style={styles.complianceDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* WARAN PERJAWATAN TABLE */}
      {pageData.waran?.length ? (
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>WARAN PERJAWATAN</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.cellHeader, { width: 100 }]}>GRED</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>KP9</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>KP5</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>KP2</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>N2</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>KP1</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>N1</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>H1</Text>
                <Text style={[styles.tableCell, styles.cellHeader]}>JUMLAH</Text>
              </View>
              {pageData.waran.map((row, index) => (
                <View key={`waran-${index}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.rowLabel, { width: 100, textAlign: 'left' }]}>{row.label}</Text>
                  {['kp9', 'kp5', 'kp2', 'n2', 'kp1', 'n1', 'h1', 'jumlah'].map((key) => (
                    <Text key={key} style={[styles.tableCell, key === 'jumlah' ? styles.boldCell : null]}>{row[key]}</Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {/* PROJEK PDPA */}
      {pageData.pdpa?.length ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PROJEK PDPA WILAYAH PERSEKUTUAN LABUAN</Text>
          {pageData.pdpa.map((item, index) => (
            <View key={`pdpa-${index}`} style={styles.progressItem}>
              <Text style={styles.progressLabel}>{item.label}</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${item.percent}%`, backgroundColor: parseInt(item.percent) > 10 ? '#f39c12' : '#e74c3c' }]} />
              </View>
              <Text style={styles.progressPercent}>{item.percent}%</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* KPI SECTION */}
      {pageData.kpi?.length ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>KEY PERFORMANCE INDICATOR (KPI)</Text>
          <View style={styles.kpiGrid}>
            {pageData.kpi.map((item, index) => (
              <View key={`kpi-${index}`} style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>0{index + 1}</Text>
                <Text style={styles.kpiText}>{item.title}</Text>
                <Text style={styles.kpiScore}>{item.score}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* TANGGUNGJAWAB TABLE */}
      {pageData.tanggungjawab?.length ? (
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>TANGGUNGJAWAB</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.cellHeader, { width: 250 }]}>KAKITANGAN</Text>
                <Text style={[styles.tableCell, styles.cellHeader, { width: 120 }]}>KEHADIRAN KURSUS</Text>
                <Text style={[styles.tableCell, styles.cellHeader, { width: 150 }]}>TAPISAN KESELAMATAN</Text>
              </View>
              {pageData.tanggungjawab.map((staff, index) => (
                <View key={`staff-${index}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: 250, textAlign: 'left', paddingLeft: 10 }]}>{staff.name}</Text>
                  <Text style={[styles.tableCell, { width: 120 }]}>{staff.kursus}</Text>
                  <Text style={[styles.tableCell, { width: 150 }]}>{staff.tapisan}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {/* BAHAGIAN KHIDMAT PENGURUSAN */}
      {(pageData.pecahanUnit?.length || pageData.unitPentadbiran?.length) ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>BAHAGIAN KHIDMAT PENGURUSAN</Text>
          <View style={styles.unitContainer}>
            {pageData.pecahanUnit?.length ? (
              <View style={styles.unitBox}>
                <Text style={styles.boxTitle}>PECAHAN UNIT</Text>
                {pageData.pecahanUnit.map((item, index) => (
                  <Text key={`pecahan-${index}`} style={styles.listItem}>• {item}</Text>
                ))}
              </View>
            ) : null}

            {pageData.unitPentadbiran?.length ? (
              <View style={styles.unitBox}>
                <Text style={styles.boxTitle}>UNIT PENTADBIRAN</Text>
                {pageData.unitPentadbiran.map((item, index) => (
                  <View key={`pentadbiran-${index}`} style={{ marginBottom: 8 }}>
                    <Text style={styles.listItem}>{item.name}</Text>
                    <Text style={styles.subListItem}>{item.role}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 10, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  linkButton: { backgroundColor: '#2980b9', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  linkButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2980b9', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#ecf0f1', paddingBottom: 5 },
  unitContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  unitBox: { flex: 1, backgroundColor: '#f8f9f9', padding: 10, borderRadius: 8, marginHorizontal: 5 },
  boxTitle: { fontWeight: 'bold', marginBottom: 8, color: '#34495e' },
  listItem: { fontSize: 13, color: '#2c3e50', marginBottom: 4 },
  subListItem: { fontSize: 12, color: '#7f8c8d', marginLeft: 15, marginBottom: 6, fontStyle: 'italic' },
  table: { borderWidth: 1, borderColor: '#bdc3c7', borderRadius: 5, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#bdc3c7' },
  tableHeader: { backgroundColor: '#ecf0f1' },
  tableCell: { width: 60, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#bdc3c7', fontSize: 12 },
  cellHeader: { fontWeight: 'bold', color: '#2c3e50' },
  rowLabel: { fontWeight: 'bold', backgroundColor: '#f8f9f9' },
  boldCell: { fontWeight: 'bold' },
  progressItem: { marginBottom: 15 },
  progressLabel: { fontSize: 13, color: '#34495e', marginBottom: 5 },
  progressBarBackground: { height: 10, backgroundColor: '#ecf0f1', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  progressPercent: { fontSize: 12, color: '#7f8c8d', textAlign: 'right', marginTop: 2, fontWeight: 'bold' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  kpiCard: { width: '48%', backgroundColor: '#f8f9f9', padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e5e8e8' },
  kpiNumber: { fontSize: 20, fontWeight: 'bold', color: '#3498db', marginBottom: 5 },
  kpiText: { fontSize: 11, textAlign: 'center', color: '#7f8c8d', marginBottom: 10 },
  kpiScore: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71' },
  complianceRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  complianceBox: { flex: 1, minWidth: '45%', backgroundColor: '#e8f6f3', padding: 15, borderRadius: 8, marginHorizontal: 5, marginBottom: 10, alignItems: 'center' },
  complianceScore: { fontSize: 24, fontWeight: 'bold', color: '#1abc9c', marginBottom: 5 },
  complianceTitle: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', color: '#16a085', marginBottom: 5 },
  complianceDesc: { fontSize: 11, textAlign: 'center', color: '#7f8c8d' },
});
