import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { pentadbiranStyles as styles } from './pentadbiranStyles';
import SectionHeader from './SectionHeader';

export default function UnitSection({ pageData, isEditing, updateArrayField, addArrayItem, removeArrayItem }) {
  return (
    <View style={styles.card}>
      <SectionHeader title="BAHAGIAN KHIDMAT PENGURUSAN" />
      <View style={styles.unitContainer}>
        <View style={styles.unitBox}>
          <Text style={styles.boxTitle}>PECAHAN UNIT</Text>
          {pageData.pecahanUnit.map((item, index) => (
            <View key={`pecahan-${index}`} style={styles.editRow}>
              {isEditing ? (
                <>
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 5 }]} value={item} onChangeText={(text) => updateArrayField('pecahanUnit', index, null, text)} />
                  <TouchableOpacity onPress={() => removeArrayItem('pecahanUnit', index)}><Text style={styles.delBtn}>X</Text></TouchableOpacity>
                </>
              ) : (
                <Text style={styles.listItem}>• {item}</Text>
              )}
            </View>
          ))}
          {isEditing && (
            <TouchableOpacity onPress={() => addArrayItem('pecahanUnit', 'Unit Baru')} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Tambah</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.unitBox}>
          <Text style={styles.boxTitle}>UNIT PENTADBIRAN</Text>
          {pageData.unitPentadbiran.map((item, index) => (
            <View key={`pentadbiran-${index}`} style={styles.editRowBlock}>
              {isEditing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput style={styles.input} value={item.name} onChangeText={(text) => updateArrayField('unitPentadbiran', index, 'name', text)} />
                    <TextInput style={[styles.input, { marginTop: 5 }]} value={item.role} onChangeText={(text) => updateArrayField('unitPentadbiran', index, 'role', text)} />
                  </View>
                  <TouchableOpacity onPress={() => removeArrayItem('unitPentadbiran', index)}><Text style={styles.delBtn}>X</Text></TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.listItem}>{item.name}</Text>
                  <Text style={styles.subListItem}>{item.role}</Text>
                </>
              )}
            </View>
          ))}
          {isEditing && (
            <TouchableOpacity onPress={() => addArrayItem('unitPentadbiran', { name: 'Nama', role: '(Peranan)' })} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Tambah</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}