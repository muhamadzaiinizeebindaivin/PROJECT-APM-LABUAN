import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { UserCog, Key, ShieldAlert, Trash2 } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

export default function UserManagementSection({ userAccounts, onEditUser, onDeleteUser }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionIconBadge}>
          <UserCog size={16} color={PALETTE.orange} />
        </View>
        <Text style={styles.sectionTitle}>PENGURUSAN KREDENSIAL PENGGUNA</Text>
      </View>

      <View style={styles.warningBanner}>
        <ShieldAlert size={16} color="#b45309" style={{ marginRight: 8 }} />
        <Text style={styles.warningBannerText}>
          Amaran: Penukaran kata laluan akan log keluar pengguna tersebut dari sistem secara automatik.
        </Text>
      </View>

      {userAccounts.map((user) => (
        <View key={user.id} style={styles.userRow}>
          <View>
            <Text style={styles.userName}>{user.username}</Text>
            <Text style={styles.userRole}>Peranan: {user.role}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.userActionBtn} onPress={() => onEditUser(user)}>
              <Key size={14} color={PALETTE.orange} style={{ marginRight: 4 }} />
              <Text style={styles.userActionBtnText}>Akses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.userDangerBtn} onPress={() => onDeleteUser(user.id, user.username)}>
              <Trash2 size={14} color="#dc2626" style={{ marginRight: 4 }} />
              <Text style={styles.userDangerBtnText}>Padam</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}