import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { kewanganStyles as styles } from './kewanganStyles';
import SummaryEditModal from './SummaryEditModal';

export default function SummaryCard({ orgName, title, totalAllocation, loading, isEditMode, saveSummary, saving, onNotify }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState({ title, total: String(totalAllocation) });
  const [formError, setFormError] = useState(null);

  const openModal = () => {
    setDraft({ title, total: String(totalAllocation) });
    setFormError(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!draft.title.trim() || !draft.total.trim()) {
      setFormError('Tajuk dan peruntukan tidak boleh kosong.');
      return;
    }
    setFormError(null);
    const ok = await saveSummary(draft);
    if (ok) {
      setModalVisible(false);
      onNotify?.('success', 'Peruntukan tahunan berjaya dikemaskini.');
    } else {
      onNotify?.('error', 'Gagal menyimpan peruntukan.');
    }
  };

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroGlow} />
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text style={styles.heroKicker}>{orgName}</Text>
          <Text style={styles.heroYear}>{title}</Text>
          <View style={styles.heroTotalBox}>
            <Text style={styles.heroTotalLabel}>Jumlah Peruntukan</Text>
            <Text style={styles.heroTotalAmount}>RM {formatCurrency(totalAllocation)}</Text>
          </View>
          {isEditMode && (
            <TouchableOpacity style={styles.heroEditBtn} onPress={openModal}>
              <Pencil size={14} color="#fff" />
              <Text style={styles.heroEditBtnText}>Kemaskini Peruntukan</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <SummaryEditModal
        visible={modalVisible}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
        saving={saving}
        error={formError}
      />
    </View>
  );
}