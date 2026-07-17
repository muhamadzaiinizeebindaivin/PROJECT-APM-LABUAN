import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { pentadbiranStyles as styles } from './pentadbiranStyles';
import SectionHeader from './SectionHeader';

export default function ComplianceSection({ pageData, isEditing, updateArrayField, addArrayItem, removeArrayItem }) {
  return (
    <View style={styles.card}>
      <SectionHeader title="INSPEKTORAT PEMATUHAN" />
      <View style={styles.complianceRow}>
        {pageData.pematuhan.map((item, index) => (
          <View key={`pematuhan-${index}`} style={styles.complianceBox}>
            {isEditing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                <View style={{ flex: 1 }}>
                  <TextInput style={[styles.input, { marginBottom: 5, textAlign: 'center', fontWeight: 'bold' }]} value={item.score} onChangeText={(text) => updateArrayField('pematuhan', index, 'score', text)} keyboardType="numeric" placeholder="Skor %" />
                  <TextInput style={[styles.input, { marginBottom: 5, textAlign: 'center' }]} value={item.title} onChangeText={(text) => updateArrayField('pematuhan', index, 'title', text)} multiline />
                  <TextInput style={[styles.input, { textAlign: 'center' }]} value={item.desc} onChangeText={(text) => updateArrayField('pematuhan', index, 'desc', text)} multiline />
                </View>
                <TouchableOpacity onPress={() => removeArrayItem('pematuhan', index)}><Text style={styles.delBtn}>X</Text></TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.complianceScore}>{item.score}%</Text>
                <Text style={styles.complianceTitle}>{item.title}</Text>
                <Text style={styles.complianceDesc}>{item.desc}</Text>
              </>
            )}
          </View>
        ))}
      </View>
      {isEditing && (
        <TouchableOpacity onPress={() => addArrayItem('pematuhan', { score: '0', title: 'Tajuk Baru', desc: 'Penerangan Baru' })} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Tambah Pematuhan</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}