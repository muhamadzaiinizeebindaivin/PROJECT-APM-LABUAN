import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Image } from 'react-native';
import { X, User } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function FilteredEmployeeListModal({
  visible, title, employees, page, setPage, totalPages, onClose, onSelectEmployee,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title} ({employees.length})</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={styles.modalBody}>
            {employees.map((emp) => (
              <TouchableOpacity
                key={emp.id}
                style={styles.employeeRow}
                onPress={() => onSelectEmployee(emp)}
              >
                {emp.photo_url ? (
                  <Image source={{ uri: emp.photo_url }} style={styles.employeeAvatar} />
                ) : (
                  <View style={[styles.employeeAvatar, styles.employeeAvatarPlaceholder]}>
                    <User size={20} color={PALETTE.textMutedDark} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.employeeName}>{emp.nama}</Text>
                  <Text style={styles.employeeRank}>{emp.pangkat}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {totalPages > 1 && (
            <View style={[styles.paginationRow, { paddingBottom: 16 }]}>
              <TouchableOpacity disabled={page === 1} onPress={() => setPage((p) => Math.max(1, p - 1))} style={{ opacity: page === 1 ? 0.3 : 1, padding: 8 }}>
                <Text style={styles.paginationBtnText}>← Sebelum</Text>
              </TouchableOpacity>
              <Text style={styles.paginationCount}>Muka {page} / {totalPages}</Text>
              <TouchableOpacity disabled={page === totalPages} onPress={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ opacity: page === totalPages ? 0.3 : 1, padding: 8 }}>
                <Text style={styles.paginationBtnText}>Seterusnya →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}