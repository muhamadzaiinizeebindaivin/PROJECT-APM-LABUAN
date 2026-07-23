import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal } from 'react-native';
import {
  UserPlus, CheckCircle, AlertCircle, User, Mail, ShieldCheck, Briefcase,
  Trash2, Users, Search, ChevronLeft, ChevronRight, ArrowUpDown,
  LayoutDashboard, CreditCard, Truck, GraduationCap, ShieldAlert, RefreshCw
} from 'lucide-react-native';
import { supabaseSandbox as supabase } from '../supabaseSandboxClient';
import { PALETTE } from '../constants/palette';

const ROLES = [
  { key: 'admin', label: 'Admin', icon: ShieldCheck, color: '#1E3A8A' },
  { key: 'pentadbiran', label: 'Pentadbiran', icon: LayoutDashboard, color: '#7c3aed' },
  { key: 'kewangan', label: 'Kewangan', icon: CreditCard, color: '#16a34a' },
  { key: 'logistik', label: 'Logistik', icon: Truck, color: '#0891b2' },
  { key: 'angkatan', label: 'Angkatan', icon: Users, color: '#ea580c' },
  { key: 'sekretariat', label: 'Sekretariat', icon: Briefcase, color: '#f97316' },
  { key: 'latihan', label: 'Latihan', icon: GraduationCap, color: '#db2777' },
  { key: 'operasi', label: 'Operasi', icon: ShieldAlert, color: '#dc2626' },
];

const PAGE_SIZE = 20;

export default function AdminUserManagementScreen() {
  // --- Formulaire de création ---
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('sekretariat');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  // --- Liste des comptes (recherche / tri / pagination) ---
  const [userList, setUserList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('username');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'role'|'delete', targetId, username, newRole? }

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

  const listCardRef = useRef(null);
  useEffect(() => {
    if (listCardRef.current) {
      listCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchCurrentUser();
  }, []);

  // Recharge la liste dès que page / recherche / tri changent (avec un léger debounce)
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUserList();
    }, 300);
    return () => clearTimeout(debounce);
  }, [page, searchQuery, sortBy, sortDir]);

  // Fait disparaître le message de feedback après 5 secondes
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const fetchUserList = async () => {
    setLoadingList(true);
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'list', page, pageSize: PAGE_SIZE, search: searchQuery, sortBy, sortDir },
    });
    setLoadingList(false);
    if (!error && data?.users) {
      setUserList(data.users);
      setTotalUsers(data.total || 0);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleChangeRole = (targetId, newRole, username) => {
    setConfirmModal({ type: 'role', targetId, username, newRole });
  };

  const handleDeleteUser = (targetId, username) => {
    setConfirmModal({ type: 'delete', targetId, username });
  };

  const executeConfirm = async () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'role') {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'updateRole', targetId: confirmModal.targetId, newRole: confirmModal.newRole },
      });
      if (!error && !data?.error) fetchUserList();
    } else {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'delete', targetId: confirmModal.targetId },
      });
      if (!error && !data?.error) fetchUserList();
    }
    setConfirmModal(null);
  };

  const handleCreateUser = async () => {
    setFeedback(null);

    if (!displayName || !email) {
      setFeedback({ type: 'error', message: 'Sila isi semua ruangan.' });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { displayName, email, role },
    });

    setLoading(false);

    if (error) {
      let detailedMessage = error.message || 'Ralat rangkaian.';
      try {
        if (error.context) {
          const errorBody = await error.context.json();
          if (errorBody?.error) detailedMessage = errorBody.error;
        }
      } catch (e) {}
      setFeedback({ type: 'error', message: detailedMessage });
      return;
    }

    if (data?.error) {
      setFeedback({ type: 'error', message: data.error });
      return;
    }

    setFeedback({ type: 'success', message: `Jemputan telah dihantar ke "${email}". Pengguna perlu semak e-mel untuk tetapkan kata laluan.` });
    setDisplayName('');
    setEmail('');
    fetchUserList();
  };

  const SORT_COLUMNS = [
    { key: 'username', label: 'Nama' },
    { key: 'role', label: 'Peranan' },
    { key: 'email', label: 'E-mel' },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ============ CARTE 1 : CRÉATION DE COMPTE ============ */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>MAKLUMAT AKAUN</Text>

        {feedback && (
          <View style={[
            styles.feedbackBox,
            feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
          ]}>
            {feedback.type === 'success' ? (
              <CheckCircle size={20} color={PALETTE.success} />
            ) : (
              <AlertCircle size={20} color={PALETTE.danger} />
            )}
            <Text style={[
              styles.feedbackText,
              { color: feedback.type === 'success' ? '#166534' : '#991b1b' }
            ]}>
              {feedback.message}
            </Text>
          </View>
        )}

        <View style={[styles.inputGroup, focusedField === 'name' && styles.inputGroupFocused]}>
          <View style={styles.inputIconWrap}>
            <User size={18} color={focusedField === 'name' ? PALETTE.orange : PALETTE.textMutedDark} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Nama Penuh (Cth: Ahmad bin Ismail)"
            placeholderTextColor={PALETTE.textMutedDark}
            value={displayName}
            onChangeText={setDisplayName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <View style={[styles.inputGroup, focusedField === 'email' && styles.inputGroupFocused]}>
          <View style={styles.inputIconWrap}>
            <Mail size={18} color={focusedField === 'email' ? PALETTE.orange : PALETTE.textMutedDark} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="E-mel (Cth: ahmad@gmail.com)"
            placeholderTextColor={PALETTE.textMutedDark}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PERANAN</Text>

        <View style={styles.roleGrid}>
          {ROLES.map(r => {
            const RoleIcon = r.icon;
            const isActive = role === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.roleCard,
                  { borderColor: isActive ? r.color : PALETTE.cardLightBorder },
                  isActive && { backgroundColor: r.color + '0D' }
                ]}
                onPress={() => setRole(r.key)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.roleIconCircle,
                  { backgroundColor: isActive ? r.color : PALETTE.surface }
                ]}>
                  <RoleIcon size={20} color={isActive ? '#fff' : PALETTE.textMutedDark} />
                </View>
                <Text style={[
                  styles.roleCardText,
                  { color: isActive ? r.color : PALETTE.textMutedDark, fontWeight: isActive ? '800' : '600' }
                ]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleCreateUser}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <UserPlus size={19} color="#fff" />
              <Text style={styles.saveButtonText}>Hantar Jemputan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ============ CARTE 2 : LISTE DES COMPTES ============ */}
      <View ref={listCardRef} style={[styles.card, { marginTop: 20 }]}>
        <View style={styles.listHeaderRow}>
          <Users size={18} color={PALETTE.orange} />
          <Text style={styles.sectionLabel}>SENARAI AKAUN ({totalUsers})</Text>
        </View>

        <View style={styles.searchBar}>
          <View style={styles.inputIconWrap}>
            <Search size={18} color={PALETTE.textMutedDark} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama atau e-mel..."
            placeholderTextColor={PALETTE.textMutedDark}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>

        <View style={styles.sortRow}>
          {SORT_COLUMNS.map(col => (
            <TouchableOpacity key={col.key} style={styles.sortBtn} onPress={() => handleSort(col.key)}>
              <Text style={[styles.sortBtnText, sortBy === col.key && { color: PALETTE.orange }]}>
                {col.label}
              </Text>
              <ArrowUpDown size={12} color={sortBy === col.key ? PALETTE.orange : PALETTE.cardLightBorder} />
            </TouchableOpacity>
          ))}
        </View>

        {loadingList ? (
          <ActivityIndicator size="small" color={PALETTE.orange} style={{ marginVertical: 20 }} />
        ) : userList.length === 0 ? (
          <Text style={styles.emptyListText}>Tiada akaun dijumpai.</Text>
        ) : (
          userList.map((u) => (
            <View
              key={u.id}
              style={[styles.userRow, u.id === currentUserId && styles.userRowSelf]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.userName}>{u.username}</Text>
                  {u.id === currentUserId && (
                      <View style={styles.selfBadge}>
                      <Text style={styles.selfBadgeText}>ANDA</Text>
                      </View>
                  )}
                  {u.pending && (
                      <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>MENUNGGU AKTIVASI</Text>
                      </View>
                  )}
                </View>
                <Text style={styles.userEmail}>{u.email}</Text>
              </View>
            
              <View style={styles.userRoleSwitch}>
                {ROLES.map(r => (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.userRoleBtn,
                      u.role === r.key && { backgroundColor: r.color },
                      u.id === currentUserId && styles.userRoleBtnDisabled
                    ]}
                    onPress={() => handleChangeRole(u.id, r.key, u.username)}
                    disabled={u.id === currentUserId}
                  >
                    <Text style={[
                      styles.userRoleBtnText,
                      { color: u.role === r.key ? '#fff' : PALETTE.textMutedDark }
                    ]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            
              <TouchableOpacity
                style={[styles.deleteIconBtn, u.id === currentUserId && styles.deleteIconBtnDisabled]}
                onPress={() => handleDeleteUser(u.id, u.username)}
                disabled={u.id === currentUserId}
              >
                <Trash2 size={16} color={u.id === currentUserId ? PALETTE.cardLightBorder : PALETTE.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {totalUsers > PAGE_SIZE && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
              onPress={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} color={page === 1 ? PALETTE.cardLightBorder : PALETTE.orange} />
            </TouchableOpacity>

            <Text style={styles.pageIndicator}>
              Muka {page} / {totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
              onPress={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight size={16} color={page >= totalPages ? PALETTE.cardLightBorder : PALETTE.orange} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={!!confirmModal} transparent animationType="fade" onRequestClose={() => setConfirmModal(null)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>

            <View style={[
              styles.confirmBanner,
              { backgroundColor: confirmModal?.type === 'delete' ? '#2a0f0f' : '#0c0c0e' },
            ]}>
              <View style={[
                styles.confirmIconCircle,
                { backgroundColor: confirmModal?.type === 'delete' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)' },
              ]}>
                {confirmModal?.type === 'delete' ? (
                  <Trash2 size={26} color={PALETTE.danger} />
                ) : (
                  <RefreshCw size={26} color={PALETTE.orange} />
                )}
              </View>
              <Text style={styles.confirmTitle}>
                {confirmModal?.type === 'delete' ? 'Padam Akaun' : 'Tukar Peranan'}
              </Text>
              <Text style={styles.confirmSubtitle}>
                {confirmModal?.type === 'delete'
                  ? `Padam akaun "${confirmModal?.username}"? Tindakan ini tidak boleh dibatalkan.`
                  : `Tukar peranan "${confirmModal?.username}" kepada "${confirmModal?.newRole}"?`}
              </Text>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmModal(null)}>
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmConfirmBtn,
                  { backgroundColor: confirmModal?.type === 'delete' ? PALETTE.danger : PALETTE.orange },
                ]}
                onPress={executeConfirm}
              >
                {confirmModal?.type === 'delete' ? (
                  <Trash2 size={16} color="#fff" />
                ) : (
                  <RefreshCw size={16} color="#fff" />
                )}
                <Text style={styles.confirmConfirmText}>
                  {confirmModal?.type === 'delete' ? 'Padam' : 'Tukar'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PALETTE.softOrangeBg },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 60 },

  headerBlock: { marginBottom: 28, width: '100%' },
  headerIconCircle: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: PALETTE.orange,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    shadowColor: PALETTE.orange, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6
  },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3, color: PALETTE.textDark },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 6, letterSpacing: 0.2, lineHeight: 22, textAlign: 'center', color: PALETTE.textMutedDark },

  card: {
    width: '100%', backgroundColor: PALETTE.cardLight, borderRadius: 20, padding: 24,
    shadowColor: '#c9825a', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder
  },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, letterSpacing: 1, marginBottom: 12 },

  inputGroup: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: PALETTE.cardLightBorder,
    borderRadius: 12, marginBottom: 12, backgroundColor: PALETTE.surface, overflow: 'hidden'
  },
  inputGroupFocused: {
    borderColor: PALETTE.orange,
    backgroundColor: 'rgba(249, 115, 22, 0.06)',
  },
  inputIconWrap: { paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  input: {
    flex: 1, paddingVertical: 14, paddingRight: 14, fontSize: 14, fontWeight: '600',
    color: PALETTE.textDark, outlineStyle: 'none'
  },

  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  roleCard: {
    width: '31%', borderWidth: 1.5, borderRadius: 14, paddingVertical: 16, alignItems: 'center', gap: 8
  },
  
  roleIconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  roleCardText: { fontSize: 13 },

  feedbackBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 16
  },
  feedbackSuccess: { backgroundColor: PALETTE.successSoft, borderWidth: 1, borderColor: '#bbf7d0' },
  feedbackError: { backgroundColor: PALETTE.dangerSoft, borderWidth: 1, borderColor: '#fecaca' },
  feedbackText: { fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },

  saveButton: {
    flexDirection: 'row', backgroundColor: PALETTE.orange, paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: PALETTE.orange, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  listHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  emptyListText: { color: PALETTE.textMutedDark, fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder, gap: 10
  },
  userName: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark },
  userEmail: { fontSize: 12, color: PALETTE.textMutedDark, marginTop: 2 },
  userRoleSwitch: { flexDirection: 'row', gap: 4, backgroundColor: PALETTE.surface, borderRadius: 8, padding: 3 },
  userRoleBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  userRoleBtnText: { fontSize: 11, fontWeight: '700' },
  deleteIconBtn: { padding: 8, backgroundColor: PALETTE.dangerSoft, borderRadius: 8 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: PALETTE.cardLightBorder,
    borderRadius: 12, marginBottom: 12, backgroundColor: PALETTE.surface, overflow: 'hidden'
  },
  searchInput: {
    flex: 1, paddingVertical: 14, paddingRight: 14, fontSize: 14, fontWeight: '600',
    color: PALETTE.textDark, outlineStyle: 'none'
  },
  sortRow: { flexDirection: 'row', gap: 16, marginBottom: 12, paddingHorizontal: 4 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortBtnText: { fontSize: 11, fontWeight: '700', color: PALETTE.textMutedDark },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 },
  pageBtn: { padding: 8, backgroundColor: PALETTE.surface, borderRadius: 8 },
  pageBtnDisabled: { opacity: 0.5 },
  pageIndicator: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },

  userRowSelf: { backgroundColor: 'rgba(249, 115, 22, 0.06)', borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -10 },
  selfBadge: { backgroundColor: PALETTE.orange, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  selfBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  userRoleBtnDisabled: { opacity: 0.4 },
  deleteIconBtnDisabled: { opacity: 0.4 },
  pendingBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#fbbf24' },
  pendingBadgeText: { fontSize: 9, fontWeight: '800', color: '#92400e', letterSpacing: 0.3 },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: {
    width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
  },
  confirmBanner: { padding: 24, alignItems: 'center' },
  confirmIconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  confirmTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  confirmSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: 10, padding: 20, backgroundColor: '#fff' },
  confirmCancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: PALETTE.cardLightBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmCancelText: { color: PALETTE.textMutedDark, fontWeight: '800', fontSize: 14 },
  confirmConfirmBtn: {
    flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});