import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { User, Search, Plus, Upload, Award, Users } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function EmployeesListCard({
  paginatedEmployees, filteredCount,
  employeeSearch, setEmployeeSearch,
  employeePage, setEmployeePage, totalEmployeePages,
  isEditing, onOpenDetail, onOpenCertificates, onAddNew, onImportExcel,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.employeeListHeader}>
        <View style={styles.employeeListHeaderLeft}>
          <View style={styles.sectionIconBadge}>
            <Users size={16} color={PALETTE.orange} />
          </View>
          <Text style={styles.sectionTitle}>SENARAI ANGGOTA ({filteredCount})</Text>
          {isEditing && (
            <View style={styles.employeeListActions}>
              <TouchableOpacity style={styles.addBtn} onPress={onAddNew}>
                <Plus size={13} color="#fff" />
                <Text style={styles.addBtnText}>Tambah</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: PALETTE.blue }]} onPress={onImportExcel}>
                <Upload size={13} color="#fff" />
                <Text style={styles.addBtnText}>Import Excel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.searchContainer}>
          <Search size={16} color={PALETTE.textMutedDark} />
          <TextInput
            placeholder="Cari nama anggota..."
            placeholderTextColor={PALETTE.textMutedDark}
            style={styles.searchInput}
            value={employeeSearch}
            onChangeText={(t) => { setEmployeeSearch(t); setEmployeePage(1); }}
          />
        </View>
      </View>

      <Text style={styles.employeeHint}>Ketik pada profil untuk lihat lebih maklumat</Text>

      <FlatList
        data={paginatedEmployees}
        keyExtractor={(emp) => String(emp.id)}
        scrollEnabled={false}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item: emp }) => {
          const isActive = String(emp.status_keaktifan).toUpperCase() === 'AKTIF';
          return (
            <TouchableOpacity style={styles.employeeRow} onPress={() => onOpenDetail(emp)}>
              {emp.photo_url ? (
                <Image source={{ uri: emp.photo_url }} style={styles.employeeAvatar} />
              ) : (
                <View style={[styles.employeeAvatar, styles.employeeAvatarPlaceholder]}>
                  <User size={20} color={PALETTE.textMutedDark} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.employeeName}>{emp.nama}</Text>
                  <View style={[styles.employeeStatusBadge, { backgroundColor: isActive ? PALETTE.blueSoft : PALETTE.surface }]}>
                    <Text style={[styles.employeeStatusBadgeText, { color: isActive ? PALETTE.blue : PALETTE.textMutedDark }]}>
                      {emp.status_keaktifan}
                    </Text>
                  </View>
                </View>
                <Text style={styles.employeeRank}>{emp.pangkat}</Text>
              </View>
              <TouchableOpacity
                style={styles.lihatSijilBtn}
                onPress={(e) => { e.stopPropagation?.(); onOpenCertificates(emp); }}
              >
                <Award size={14} color={PALETTE.orange} />
                <Text style={styles.lihatSijilBtnText}>Lihat Sijil</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.paginationRow}>
        <TouchableOpacity
          disabled={employeePage === 1}
          onPress={() => setEmployeePage((p) => Math.max(1, p - 1))}
          style={{ opacity: employeePage === 1 ? 0.3 : 1, padding: 8 }}
        >
          <Text style={styles.paginationBtnText}>← Sebelum</Text>
        </TouchableOpacity>
        <Text style={styles.paginationCount}>
          Muka {employeePage} / {totalEmployeePages} ({filteredCount} rekod)
        </Text>
        <TouchableOpacity
          disabled={employeePage === totalEmployeePages}
          onPress={() => setEmployeePage((p) => Math.min(totalEmployeePages, p + 1))}
          style={{ opacity: employeePage === totalEmployeePages ? 0.3 : 1, padding: 8 }}
        >
          <Text style={styles.paginationBtnText}>Seterusnya →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}