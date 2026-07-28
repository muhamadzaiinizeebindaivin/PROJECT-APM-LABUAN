import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Presentation, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { pentadbiranStyles } from '../pentadbiran/pentadbiranStyles';
import PameranEditModal from './PameranEditModal';

const HEADERS = ['AGENSI', 'TAJUK', 'BIL. PENGUNJUNG'];

export default function PameranTable({ pameranList, isEditing, savePameranItem, deletePameranItem, onNotify }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [pameranForm, setPameranForm] = useState({ id: null, agensi: '', tajuk: '', bilangan_pengunjung: '' });
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const displayDeleteItemRef = useRef(null);
  if (confirmDeleteItem !== null) displayDeleteItemRef.current = confirmDeleteItem;
  const [isDeleting, setIsDeleting] = useState(false);

  const openAdd = () => {
    setPameranForm({ id: null, agensi: '', tajuk: '', bilangan_pengunjung: '' });
    setFormError(null);
    setModalVisible(true);
  };
  const openEdit = (item) => {
    setPameranForm({ ...item, bilangan_pengunjung: String(item.bilangan_pengunjung) });
    setFormError(null);
    setModalVisible(true);
  };
  const handleSave = async () => {
    if (!pameranForm.agensi.trim() || !pameranForm.tajuk.trim() || !String(pameranForm.bilangan_pengunjung).trim()) {
      setFormError('Agensi, tajuk dan bilangan pengunjung tidak boleh kosong.');
      return;
    }
    setFormError(null);
    setIsSaving(true);
    const ok = await savePameranItem(pameranForm);
    setIsSaving(false);
    if (ok) {
      setModalVisible(false);
      onNotify?.('success', pameranForm.id ? 'Pameran berjaya dikemaskini.' : 'Pameran berjaya ditambah.');
    } else {
      onNotify?.('error', 'Gagal menyimpan pameran.');
    }
  };
  const confirmDelete = async () => {
    const item = confirmDeleteItem;
    setIsDeleting(true);
    const ok = await deletePameranItem(item.id);
    setIsDeleting(false);
    setConfirmDeleteItem(null);
    onNotify?.(ok === false ? 'error' : 'success', ok === false ? 'Gagal memadam pameran.' : 'Pameran berjaya dipadam.');
  };

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRowSpaced}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBadge}>
            <Presentation size={16} color={PALETTE.orange} />
          </View>
          <Text style={styles.sectionTitle}>PAMERAN</Text>
        </View>
        {isEditing && (
          <TouchableOpacity style={[styles.addBtn, { marginLeft: 'auto' }]} onPress={openAdd}>
            <Plus size={13} color="#fff" />
            <Text style={styles.addBtnText}>Tambah</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          {[...HEADERS, ...(isEditing ? ['TINDAKAN'] : [])].map((h, i) => (
            <Text key={i} style={[styles.tableHeaderCell, i === 0 && { textAlign: 'left' }]}>{h}</Text>
          ))}
        </View>
        {pameranList.length === 0 ? (
          <Text style={{ fontSize: 13, color: PALETTE.textMutedDark, textAlign: 'center', paddingVertical: 20 }}>
            Tiada pameran lagi.
          </Text>
        ) : (
          pameranList.map((item, i) => (
            <View key={item.id} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.tableCellRank]}>{item.agensi}</Text>
              <Text style={styles.tableCell}>{item.tajuk}</Text>
              <Text style={[styles.tableCell, { color: PALETTE.orange, fontWeight: '800' }]}>{item.bilangan_pengunjung}</Text>
              {isEditing && (
                <View style={styles.tableActionCell}>
                  <TouchableOpacity onPress={() => openEdit(item)}>
                    <Pencil size={15} color={PALETTE.orange} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setConfirmDeleteItem(item)}>
                    <Trash2 size={15} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <Modal visible={confirmDeleteItem !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteItem(null)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={pentadbiranStyles.confirmBanner}>
              <View style={pentadbiranStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>Padam Pameran</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                Padam pameran ini{displayDeleteItemRef.current?.tajuk ? ` "${displayDeleteItemRef.current.tajuk}"` : ''}? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>
            <View style={pentadbiranStyles.confirmActions}>
              <TouchableOpacity style={pentadbiranStyles.confirmCancelBtn} onPress={() => setConfirmDeleteItem(null)} disabled={isDeleting}>
                <Text style={pentadbiranStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[pentadbiranStyles.confirmConfirmBtn, isDeleting && { opacity: 0.7 }]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={pentadbiranStyles.confirmConfirmText}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PameranEditModal
        visible={modalVisible}
        isNew={!pameranForm.id}
        pameranForm={pameranForm}
        setPameranForm={setPameranForm}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
        error={formError}
        isSaving={isSaving}
      />
    </View>
  );
}