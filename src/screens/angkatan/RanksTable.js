import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ListFilter, Plus, Pencil, Trash2 } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

const HEADERS = ['PERINGKAT', 'LAYAK UBKP', 'KBP', 'KBP WARAN', 'PTB', 'AKTIF', 'SIMPANAN', 'JUMLAH'];
const NON_PROMOTABLE_RANKS = ['Mejar', 'Pegawai Waran II'];

export default function RanksTable({ ranks, isEditing, onAdd, onEdit, onDelete, onOpenRank, onOpenPromotion }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRowSpaced}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBadge}>
            <ListFilter size={16} color={PALETTE.orange} />
          </View>
          <Text style={styles.sectionTitle}>LALUAN KERJAYA</Text>
        </View>
        {isEditing && (
          <TouchableOpacity style={[styles.addBtn, { marginLeft: 'auto' }]} onPress={onAdd}>
            <Plus size={13} color="#fff" />
            <Text style={styles.addBtnText}>Tambah</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
        <Text style={{ fontSize: 12, color: PALETTE.textMutedDark }}>
          <Text style={{ fontWeight: '800', color: PALETTE.textDark }}>UBKP:</Text> Ujian Bertulis Kenaikan Pangkat
        </Text>
        <Text style={{ fontSize: 12, color: PALETTE.textMutedDark }}>
          <Text style={{ fontWeight: '800', color: PALETTE.textDark }}>KBP:</Text> Kursus Bakal Pegawai
        </Text>
        <Text style={{ fontSize: 12, color: PALETTE.textMutedDark }}>
          <Text style={{ fontWeight: '800', color: PALETTE.textDark }}>PTB:</Text> Pegawai Tak Bertauliah
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll} contentContainerStyle={styles.tableScrollContent}>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            {[...HEADERS, ...(isEditing ? ['TINDAKAN'] : [])].map((h, i) => (
              <Text key={i} style={[styles.tableHeaderCell, i === 0 && { textAlign: 'left' }]}>{h}</Text>
            ))}
          </View>
          {ranks.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => onOpenRank(item.rank)}
              style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, styles.tableCellRank]}>{item.rank}</Text>
              {NON_PROMOTABLE_RANKS.includes(item.rank) ? (
                <Text style={styles.tableCell}>-</Text>
              ) : (
                <TouchableOpacity style={styles.tableCell} onPress={() => onOpenPromotion(item.rank)}>
                  <Text style={{ color: PALETTE.orange, fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center' }}>{item.kenaikan}</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.tableCell}>{item.kbp}</Text>
              <Text style={styles.tableCell}>{item.kbp_waran}</Text>
              <Text style={styles.tableCell}>{item.ptb}</Text>
              <Text style={[styles.tableCell, { color: PALETTE.blue, fontWeight: '800' }]}>{item.aktif}</Text>
              <Text style={[styles.tableCell, { color: PALETTE.orange, fontWeight: '800' }]}>{item.simpanan}</Text>
              <Text style={[styles.tableCell, { fontWeight: '800', color: PALETTE.textDark }]}>{item.jumlah}</Text>
              {isEditing && (
                <View style={styles.tableActionCell}>
                  <TouchableOpacity onPress={() => onEdit(item)}>
                    <Pencil size={15} color={PALETTE.orange} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(item.id)}>
                    <Trash2 size={15} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}