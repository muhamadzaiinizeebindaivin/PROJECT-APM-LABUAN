import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { pentadbiranStyles as styles } from './pentadbiranStyles';
import SectionHeader from './SectionHeader';

export default function TanggungjawabTable({ pageData, isEditing, updateArrayField, addArrayItem, removeArrayItem }) {
  return (
    <View style={styles.card}>
      <SectionHeader title="TANGGUNGJAWAB" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.cellHeader, { width: 250 }]}>KAKITANGAN</Text>
            <Text style={[styles.tableCell, styles.cellHeader, { width: 120 }]}>KEHADIRAN KURSUS</Text>
            <Text style={[styles.tableCell, styles.cellHeader, { width: 150 }]}>TAPISAN KESELAMATAN</Text>
            {isEditing && <Text style={[styles.tableCell, styles.cellHeader, { width: 50 }]}>T</Text>}
          </View>
          {pageData.tanggungjawab.map((staff, index) => (
            <View key={`staff-${index}`} style={styles.tableRow}>
              {isEditing ? (
                <>
                  <TextInput style={[styles.tableCell, styles.tableInput, { width: 250, textAlign: 'left' }]} value={staff.name} onChangeText={(text) => updateArrayField('tanggungjawab', index, 'name', text)} />
                  <TextInput style={[styles.tableCell, styles.tableInput, { width: 120 }]} value={staff.kursus} onChangeText={(text) => updateArrayField('tanggungjawab', index, 'kursus', text)} keyboardType="numeric" />
                  <TextInput style={[styles.tableCell, styles.tableInput, { width: 150 }]} value={staff.tapisan} onChangeText={(text) => updateArrayField('tanggungjawab', index, 'tapisan', text)} keyboardType="numeric" />
                  <TouchableOpacity style={[styles.tableCell, { width: 50, justifyContent: 'center', alignItems: 'center' }]} onPress={() => removeArrayItem('tanggungjawab', index)}>
                    <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>X</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.tableCell, { width: 250, textAlign: 'left', paddingLeft: 10 }]}>{staff.name}</Text>
                  <Text style={[styles.tableCell, { width: 120 }]}>{staff.kursus}</Text>
                  <Text style={[styles.tableCell, { width: 150 }]}>{staff.tapisan}</Text>
                </>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      {isEditing && (
        <TouchableOpacity onPress={() => addArrayItem('tanggungjawab', { name: '-', kursus: '0', tapisan: '0000' })} style={[styles.addBtn, { marginTop: 10 }]}>
          <Text style={styles.addBtnText}>+ Tambah Kakitangan</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}