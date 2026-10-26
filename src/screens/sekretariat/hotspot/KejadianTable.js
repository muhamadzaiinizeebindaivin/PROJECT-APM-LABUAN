// src/screens/sekretariat/hotspot/KejadianTable.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Edit, Trash2 } from 'lucide-react-native';
import HoverTip from '../../../components/HoverTip';
import { PALETTE } from '../../../constants/palette';

const COLS = [
  { key: 'tarikh', label: 'Tarikh' },
  { key: 'lokasi', label: 'Kawasan Terjejas' },
  { key: 'jumlah_kir', label: 'Jumlah KIR' },
  { key: 'jumlah_mangsa', label: 'Jumlah Mangsa' },
  { key: 'jumlah_rumah_terjejas', label: 'Rumah Terjejas' },
  { key: 'pps', label: 'PPS' },
];

const cellText = { fontSize: 13, color: PALETTE.textDark, textAlign: 'center' };
const cellBox = { flex: 1, paddingVertical: 14, paddingHorizontal: 10 };

// Tableau "Rekod" (historique d'incidents) d'une catégorie
export default function KejadianTable({ rows, isMobile, canEdit, onOpen, onDelete }) {
  return (
    <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={isMobile}>
      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', overflow: 'hidden', minWidth: isMobile ? 600 : '100%' }}>
        <View style={{ flexDirection: 'row', backgroundColor: '#1e3a8a' }}>
          {COLS.map((col) => (
            <View key={col.key} style={cellBox}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{col.label}</Text>
            </View>
          ))}
          {canEdit && (
            <View style={{ width: 90, paddingVertical: 14, paddingHorizontal: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff', textAlign: 'center' }}>Aksi</Text>
            </View>
          )}
        </View>

        {rows.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => onOpen(item)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: index % 2 === 1 ? (PALETTE.surface || '#f8fafc') : '#fff',
              borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder || '#e2e8f0',
            }}
          >
            <View style={cellBox}><Text style={cellText}>{item.tarikh || '-'}</Text></View>
            <View style={cellBox}><Text style={cellText}>{item.lokasi || '-'}</Text></View>
            <View style={cellBox}><Text style={cellText}>{item.jumlah_kir ?? '-'}</Text></View>
            <View style={cellBox}><Text style={cellText}>{item.jumlah_mangsa ?? '-'}</Text></View>
            <View style={cellBox}><Text style={cellText}>{item.jumlah_rumah_terjejas ?? '-'}</Text></View>
            <View style={cellBox}><Text style={cellText}>{item.pps || '-'}</Text></View>
            {canEdit && (
              <View style={{ width: 90, flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 14 }}>
                <HoverTip label="Kemaskini rekod ini">
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); onOpen(item); }}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: PALETTE.orange + '18', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Edit size={13} color={PALETTE.orange} />
                  </TouchableOpacity>
                </HoverTip>
                <HoverTip label="Padam rekod ini">
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); onDelete(item.id); }}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: PALETTE.danger + '18', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={13} color={PALETTE.danger} />
                  </TouchableOpacity>
                </HoverTip>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
