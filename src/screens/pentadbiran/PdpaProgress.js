import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';
import SectionHeader from './SectionHeader';

export default function PdpaProgress({ pageData, isEditing, updateArrayField, addArrayItem, removeArrayItem }) {
  return (
    <View style={styles.card}>
      <SectionHeader title="PROJEK PDPA WILAYAH PERSEKUTUAN LABUAN" />
      {pageData.pdpa.map((item, index) => (
        <View key={`pdpa-${index}`} style={styles.progressItem}>
          {isEditing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <TextInput style={[styles.input, { marginBottom: 5 }]} value={item.label} onChangeText={(text) => updateArrayField('pdpa', index, 'label', text)} multiline />
                <TextInput style={styles.input} value={item.percent} onChangeText={(text) => updateArrayField('pdpa', index, 'percent', text)} keyboardType="numeric" placeholder="Peratusan %" />
              </View>
              <TouchableOpacity onPress={() => removeArrayItem('pdpa', index)}><Text style={styles.delBtn}>X</Text></TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.progressLabel}>{item.label}</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${item.percent}%`, backgroundColor: parseInt(item.percent) > 10 ? PALETTE.orange : '#dc2626' }]} />
              </View>
              <Text style={styles.progressPercent}>{item.percent}%</Text>
            </>
          )}
        </View>
      ))}
      {isEditing && (
        <TouchableOpacity onPress={() => addArrayItem('pdpa', { label: 'Projek Baru', percent: '0' })} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Tambah Projek</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}