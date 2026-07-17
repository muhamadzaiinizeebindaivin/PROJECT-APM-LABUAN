import React from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { pentadbiranStyles as styles } from './pentadbiranStyles';
import SectionHeader from './SectionHeader';

const COLUMNS = ['kp9', 'kp5', 'kp2', 'n2', 'kp1', 'n1', 'h1', 'jumlah'];
const COLUMN_HEADERS = ['KP9', 'KP5', 'KP2', 'N2', 'KP1', 'N1', 'H1', 'JUMLAH'];

export default function WaranTable({ pageData, isEditing, updateArrayField }) {
  return (
    <View style={styles.card}>
      <SectionHeader title="WARAN PERJAWATAN" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.cellHeader, styles.tableCellLabel]}>GRED</Text>
            {COLUMN_HEADERS.map((h) => (
              <Text key={h} style={[styles.tableCell, styles.cellHeader, h === 'JUMLAH' && styles.cellHeaderAccent]}>{h}</Text>
            ))}
          </View>
          {pageData.waran.map((row, index) => (
            <View key={`waran-${index}`} style={[styles.tableRow, index === pageData.waran.length - 1 && styles.tableRowLast]}>
              {isEditing ? (
                <TextInput style={[styles.tableCell, styles.tableInput, styles.rowLabel, styles.tableCellLabel, { textAlign: 'left' }]} value={row.label} onChangeText={(text) => updateArrayField('waran', index, 'label', text)} />
              ) : (
                <Text style={[styles.tableCell, styles.rowLabel, styles.tableCellLabel, { textAlign: 'left' }]}>{row.label}</Text>
              )}
              {COLUMNS.map((key) => (
                isEditing ? (
                  <TextInput key={key} style={[styles.tableCell, styles.tableInput, key === 'jumlah' ? styles.boldCell : null]} value={row[key]} onChangeText={(text) => updateArrayField('waran', index, key, text)} keyboardType="numeric" />
                ) : (
                  <Text key={key} style={[styles.tableCell, key === 'jumlah' ? styles.boldCell : null]}>{row[key]}</Text>
                )
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}