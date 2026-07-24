import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { FileText } from 'lucide-react-native';
import { pentadbiranStyles as styles } from './pentadbiranStyles';
import SectionHeader from './SectionHeader';
import SectionSaveButton from './SectionSaveButton';

const COLUMNS = ['kp9', 'kp5', 'kp2', 'n2', 'kp1', 'n1', 'h1', 'jumlah'];
const COLUMN_HEADERS = ['KP9', 'KP5', 'KP2', 'N2', 'KP1', 'N1', 'H1', 'JUMLAH'];

export default function WaranTable({ pageData, isEditing, updateArrayField, onSave, onNotify }) {
  const lastSavedRef = useRef(JSON.stringify(pageData.waran));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setIsDirty(JSON.stringify(pageData.waran) !== lastSavedRef.current);
  }, [pageData.waran]);

  const handleSaveWrapped = async () => {
    const ok = await onSave();
    if (ok) {
      lastSavedRef.current = JSON.stringify(pageData.waran);
      setIsDirty(false);
      onNotify?.('success', 'Waran perjawatan berjaya dikemaskini.');
    } else {
      onNotify?.('error', 'Gagal menyimpan waran perjawatan.');
    }
    return ok;
  };

  return (
    <View style={styles.card}>
      <SectionHeader
        title="WARAN PERJAWATAN"
        Icon={FileText}
        rightSlot={
          isEditing && isDirty && (
            <View style={styles.unsavedBadge}>
              <AlertCircle size={12} color="#b45309" />
              <Text style={styles.unsavedBadgeText}>Perubahan belum disimpan</Text>
            </View>
          )
        }
      />

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.cellHeader, styles.cellHeaderGred, { width: 160, textAlign: 'left', paddingLeft: 14 }]}>GRED</Text>
          {COLUMN_HEADERS.map((h) => (
            <Text key={h} style={[styles.tableCell, styles.cellHeader, { flex: 1 }, h === 'JUMLAH' && styles.cellHeaderJumlah]}>{h}</Text>
          ))}
        </View>
        {pageData.waran.map((row, index) => (
          <View key={`waran-${index}`} style={[styles.tableRow, index === pageData.waran.length - 1 && styles.tableRowLast]}>
            {isEditing ? (
              <TextInput
                style={[styles.tableCell, styles.tableInput, styles.rowLabel, { width: 160, textAlign: 'left' }]}
                value={row.label}
                onChangeText={(text) => updateArrayField('waran', index, 'label', text)}
              />
            ) : (
              <Text style={[styles.tableCell, styles.rowLabel, { width: 160, textAlign: 'left', paddingLeft: 14 }]}>{row.label}</Text>
            )}
            {COLUMNS.map((key) => (
              isEditing ? (
                <TextInput
                  key={key}
                  style={[styles.tableCell, styles.tableInput, { flex: 1 }, key === 'jumlah' ? styles.boldCell : null]}
                  value={row[key]}
                  onChangeText={(text) => updateArrayField('waran', index, key, text)}
                  keyboardType="numeric"
                />
              ) : (
                <Text key={key} style={[styles.tableCell, { flex: 1 }, key === 'jumlah' ? styles.boldCell : null]}>{row[key]}</Text>
              )
            ))}
          </View>
        ))}
      </View>

      {isEditing && <SectionSaveButton onSave={handleSaveWrapped} urgent={isDirty} />}
    </View>
  );
}