import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TrendingUp, Pencil, Trash2 } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { formatCurrency, parseCurrency } from '../../utils/currency';
import { kewanganStyles as styles } from './kewanganStyles';
import SectionHeader from '../pentadbiran/SectionHeader';
import QuarterlyEditModal from './QuarterlyEditModal';

const EMPTY_DRAFT = { q: '', months: '', spend: '' };

export default function QuarterlySection({ processedData, loading, isEditMode, saveQuarterlyItem, deleteQuarterlyItem }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const openAdd = () => {
    setEditItem(null);
    setDraft(EMPTY_DRAFT);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setDraft({ q: item.q, months: item.months, spend: String(item.spend) });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!draft.q.trim() || !draft.spend) return;
    const ok = await saveQuarterlyItem(draft, editItem);
    if (ok) setModalVisible(false);
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.sectionHeaderRowSpaced}>
          <SectionHeader title="PRESTASI MENGIKUT SUKUAN" Icon={TrendingUp} />
          {isEditMode && (
            <TouchableOpacity style={[styles.addBtn, { marginLeft: 'auto' }]} onPress={openAdd}>
              <Text style={styles.addBtnText}>+ Tambah</Text>
            </TouchableOpacity>
          )}
        </View>
        {loading && <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginVertical: 20 }} />}
      </View>

      {!loading && processedData.map((item, index) => (
        <View key={item.id || index} style={[styles.card, { position: 'relative' }]}>
          {isEditMode && (
            <View style={{ position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 6, zIndex: 5 }}>
              <TouchableOpacity
                style={styles.kpiPencilBtnInline}
                onPress={() => openEdit(item)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Pencil size={13} color={PALETTE.orange} />
                {hoveredIndex === index && (
                  <View style={styles.kpiTooltip}>
                    <Text style={styles.kpiTooltipText}>Ubah</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.kpiDeleteBtnInline} onPress={() => deleteQuarterlyItem(item)}>
                <Trash2 size={13} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.quarterCardHeader}>
            <View>
              <Text style={styles.quarterTitle}>{item.q}</Text>
              <Text style={styles.quarterMonths}>{item.months}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.barColor + '20' }]}>
              <Text style={[styles.statusText, { color: item.barColor }]}>{item.statusText}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statsLabel}>Belanja (Kumulatif)</Text>
              <Text style={styles.statsValue}>RM {formatCurrency(parseCurrency(item.spend))}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statsLabel}>% drp Peruntukan</Text>
              <Text style={[styles.statsValue, { color: item.barColor }]}>{item.percentOfTotal.toFixed(2)}%</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${Math.min((item.percentOfTotal / 25) * 100, 100)}%`, backgroundColor: item.barColor }]} />
            <View style={styles.limitLine} />
          </View>
          <Text style={styles.limitLabel}>Had Sukuan (25%)</Text>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>* Bar kemajuan menunjukkan penggunaan dengan had 25% sukuan.</Text>
      </View>

      <QuarterlyEditModal
        visible={modalVisible}
        isNew={!editItem}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}