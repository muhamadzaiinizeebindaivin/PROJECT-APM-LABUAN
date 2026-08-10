import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { ListFilter, Plus, Pencil, Trash2, HelpCircle, X } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

const HEADERS = ['PERINGKAT', 'LAYAK UBKP', 'KBP', 'KBP WARAN', 'PTB', 'AKTIF', 'SIMPANAN', 'JUMLAH', 'LIHAT SENARAI PENUH'];
const NON_PROMOTABLE_RANKS = ['Prebet'];

export default function RanksTable({ ranks, isEditing, onAdd, onEdit, onDelete, onOpenRank, onOpenPromotion }) {
  const [ubkpHelpVisible, setUbkpHelpVisible] = useState(false);

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
              h === 'LAYAK UBKP' ? (
                <View key={i} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, letterSpacing: 0.3 }} numberOfLines={1}>{h}</Text>
                  <TouchableOpacity onPress={() => setUbkpHelpVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <HelpCircle size={13} color={PALETTE.textMutedDark} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text key={i} style={[styles.tableHeaderCell, i === 0 && { textAlign: 'left' }]}>{h}</Text>
              )
            ))}
          </View>
          {ranks.map((item, i) => (
            <View
              key={item.id}
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
              <TouchableOpacity style={styles.tableCell} onPress={() => onOpenRank(item.rank)}>
                <Text style={{ color: PALETTE.orange, fontWeight: '800', textDecorationLine: 'underline', textAlign: 'center' }}>Lihat</Text>
              </TouchableOpacity>
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
            </View>
          ))}
        </View>
</ScrollView>

      <Modal visible={ubkpHelpVisible} transparent animationType="fade" onRequestClose={() => setUbkpHelpVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 800, maxHeight: '85%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff' }}>
            <View style={{ backgroundColor: '#0c0c0e', padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>Cara Pengiraan LAYAK UBKP</Text>
              <TouchableOpacity onPress={() => setUbkpHelpVisible(false)}>
                <X size={26} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
              <Text style={{ fontSize: 16, color: PALETTE.textMutedDark, lineHeight: 24 }}>
                Bilangan ini menunjukkan bilangan anggota di rang <Text style={{ fontWeight: '800', color: PALETTE.textDark }}>satu peringkat di bawah</Text> pangkat berkenaan yang telah memenuhi syarat untuk dinaikkan pangkat ke peringkat tersebut.
              </Text>

              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: PALETTE.textDark, marginBottom: 6 }}>Prebet</Text>
                <Text style={{ fontSize: 16, color: PALETTE.textMutedDark, lineHeight: 24 }}>
                  Sentiasa dipaparkan sebagai "-" kerana Prebet merupakan pangkat terendah dan tiada pangkat di bawahnya.
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: PALETTE.textDark, marginBottom: 6 }}>Lans Koperal, Koperal, Sarjan</Text>
                <Text style={{ fontSize: 16, color: PALETTE.textMutedDark, lineHeight: 24 }}>
                  Anggota berstatus Aktif di pangkat di bawahnya yang telah memenuhi syarat berikut: berkhidmat sekurang-kurangnya 3 tahun sejak menerima pangkat terkini, mempunyai kelayakan akademik SPM ke bawah, serta telah menghadiri kursus PTB.
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: PALETTE.textDark, marginBottom: 6 }}>Staf Muda</Text>
                <Text style={{ fontSize: 16, color: PALETTE.textMutedDark, lineHeight: 24 }}>
                  Anggota Sarjan berstatus Aktif yang telah memenuhi syarat berikut: berkhidmat sekurang-kurangnya 3 tahun sejak menerima pangkat terkini, mempunyai kelayakan akademik STPM ke atas, serta telah menghadiri kursus KBP.
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: PALETTE.textDark, marginBottom: 6 }}>Staf Kanan, Staf Tinggi</Text>
                <Text style={{ fontSize: 16, color: PALETTE.textMutedDark, lineHeight: 24 }}>
                  Anggota berstatus Aktif di pangkat di bawahnya yang telah memenuhi syarat berikut: berkhidmat sekurang-kurangnya 1 tahun sejak menerima pangkat terkini, mempunyai kelayakan akademik STPM ke atas, serta telah menghadiri kursus KBP.
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: PALETTE.textDark, marginBottom: 6 }}>Leftenan Muda, Leftenan, Kapten, Mejar</Text>
                <Text style={{ fontSize: 16, color: PALETTE.textMutedDark, lineHeight: 24 }}>
                  Anggota berstatus Aktif di pangkat di bawahnya yang telah memenuhi syarat berikut: berkhidmat sekurang-kurangnya 3 tahun sejak menerima pangkat terkini, mempunyai kelayakan akademik STPM ke atas, serta telah menghadiri kursus KBP.
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: PALETTE.textDark, marginBottom: 6 }}>Pegawai Waran II</Text>
                <Text style={{ fontSize: 16, color: PALETTE.textMutedDark, lineHeight: 24 }}>
                  Anggota Sarjan berstatus Aktif yang telah memenuhi syarat berikut: berkhidmat sekurang-kurangnya 3 tahun sejak menerima pangkat terkini, mempunyai kelayakan akademik SPM ke bawah, serta telah menghadiri kursus KBP Waran (bukan kursus KBP biasa). Pegawai Waran II merupakan pangkat plafon; tiada kenaikan pangkat lanjut daripada pangkat ini.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}