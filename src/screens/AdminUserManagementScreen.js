import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import {
  UserPlus, CheckCircle, AlertCircle, User, Mail, Lock, ShieldCheck, Briefcase,
  Trash2, Users, Search, ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react-native';
import { supabaseSandbox as supabase } from '../supabaseSandboxClient';

const ROLES = [
  { key: 'admin', label: 'Admin', icon: ShieldCheck, color: '#1E3A8A' },
  { key: 'sekretariat', label: 'Sekretariat', icon: Briefcase, color: '#f97316' },
];

const PAGE_SIZE = 20;

export default function AdminUserManagementScreen({ theme }) {
  // --- Formulaire de création ---
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleChangeRole = async (targetId, newRole, username) => {
    const confirmed = window.confirm(`Tukar peranan "${username}" kepada "${newRole}"?`);
    if (!confirmed) return;
  
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'updateRole', targetId, newRole },
    });
    if (!error && !data?.error) fetchUserList();
  };

  const handleDeleteUser = async (targetId, username) => {
    const confirmed = window.confirm(`Padam akaun "${username}"? Tindakan ini tidak boleh dibatalkan.`);
    if (!confirmed) return;

    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'delete', targetId },
    });
    if (!error && !data?.error) fetchUserList();
  };

  const handleCreateUser = async () => {
    setFeedback(null);

    if (!displayName || !email || !password) {
      setFeedback({ type: 'error', message: 'Sila isi semua ruangan.' });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { displayName, email, password, role },
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

    setFeedback({ type: 'success', message: `Akaun "${data.displayName}" (${data.role}) telah berjaya dicipta.` });
    setDisplayName('');
    setEmail('');
    setPassword('');
    fetchUserList();
  };

  const SORT_COLUMNS = [
    { key: 'username', label: 'Nama' },
    { key: 'role', label: 'Peranan' },
    { key: 'email', label: 'E-mel' },
  ];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme?.background || '#f1f5f9' }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBlock}>
        <View style={styles.headerIconCircle}>
          <UserPlus size={26} color="#fff" />
        </View>
        <Text style={[styles.title, { color: theme?.text || '#0f172a' }]}>Pengurusan Akaun</Text>
        <Text style={[styles.subtitle, { color: theme?.textSecondary || '#64748b' }]}>
          Cipta akaun baharu untuk Admin atau Sekretariat
        </Text>
      </View>

      {/* ============ CARTE 1 : CRÉATION DE COMPTE ============ */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>MAKLUMAT AKAUN</Text>

        {feedback && (
          <View style={[
            styles.feedbackBox,
            feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
          ]}>
            {feedback.type === 'success' ? (
              <CheckCircle size={20} color="#16a34a" />
            ) : (
              <AlertCircle size={20} color="#dc2626" />
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
            <User size={18} color={focusedField === 'name' ? '#1E3A8A' : '#94a3b8'} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Nama Penuh (Cth: Ahmad bin Ismail)"
            placeholderTextColor="#94a3b8"
            value={displayName}
            onChangeText={setDisplayName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <View style={[styles.inputGroup, focusedField === 'email' && styles.inputGroupFocused]}>
          <View style={styles.inputIconWrap}>
            <Mail size={18} color={focusedField === 'email' ? '#1E3A8A' : '#94a3b8'} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="E-mel (Cth: ahmad@gmail.com)"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <View style={[styles.inputGroup, focusedField === 'password' && styles.inputGroupFocused]}>
          <View style={styles.inputIconWrap}>
            <Lock size={18} color={focusedField === 'password' ? '#1E3A8A' : '#94a3b8'} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Kata Laluan"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setFocusedField('password')}
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
                  { borderColor: isActive ? r.color : '#e2e8f0' },
                  isActive && { backgroundColor: r.color + '0D' }
                ]}
                onPress={() => setRole(r.key)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.roleIconCircle,
                  { backgroundColor: isActive ? r.color : '#f1f5f9' }
                ]}>
                  <RoleIcon size={20} color={isActive ? '#fff' : '#94a3b8'} />
                </View>
                <Text style={[
                  styles.roleCardText,
                  { color: isActive ? r.color : '#64748b', fontWeight: isActive ? '800' : '600' }
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
              <Text style={styles.saveButtonText}>Cipta Akaun</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ============ CARTE 2 : LISTE DES COMPTES ============ */}
      <View ref={listCardRef} style={[styles.card, { marginTop: 20 }]}>
        <View style={styles.listHeaderRow}>
          <Users size={18} color="#1E3A8A" />
          <Text style={styles.sectionLabel}>SENARAI AKAUN ({totalUsers})</Text>
        </View>

        <View style={styles.searchBar}>
          <View style={styles.inputIconWrap}>
            <Search size={18} color="#94a3b8" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama atau e-mel..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>

        <View style={styles.sortRow}>
          {SORT_COLUMNS.map(col => (
            <TouchableOpacity key={col.key} style={styles.sortBtn} onPress={() => handleSort(col.key)}>
              <Text style={[styles.sortBtnText, sortBy === col.key && { color: '#1E3A8A' }]}>
                {col.label}
              </Text>
              <ArrowUpDown size={12} color={sortBy === col.key ? '#1E3A8A' : '#cbd5e1'} />
            </TouchableOpacity>
          ))}
        </View>

        {loadingList ? (
          <ActivityIndicator size="small" color="#1E3A8A" style={{ marginVertical: 20 }} />
        ) : userList.length === 0 ? (
          <Text style={styles.emptyListText}>Tiada akaun dijumpai.</Text>
        ) : (
          userList.map((u) => (
            <View
              key={u.id}
              style={[styles.userRow, u.id === currentUserId && styles.userRowSelf]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.userName}>{u.username}</Text>
                  {u.id === currentUserId && (
                    <View style={styles.selfBadge}>
                      <Text style={styles.selfBadgeText}>ANDA</Text>
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
                      { color: u.role === r.key ? '#fff' : '#94a3b8' }
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
                <Trash2 size={16} color={u.id === currentUserId ? '#cbd5e1' : '#ef4444'} />
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
              <ChevronLeft size={16} color={page === 1 ? '#cbd5e1' : '#1E3A8A'} />
            </TouchableOpacity>

            <Text style={styles.pageIndicator}>
              Muka {page} / {totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
              onPress={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight size={16} color={page >= totalPages ? '#cbd5e1' : '#1E3A8A'} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 60 },

  headerBlock: { marginBottom: 28, width: '100%' },
  headerIconCircle: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: '#1E3A8A',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    shadowColor: '#1E3A8A', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6
  },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 6, letterSpacing: 0.2, lineHeight: 22, textAlign: 'center' },

  card: {
    width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 4,
    borderWidth: 1, borderColor: '#f1f5f9'
  },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 12 },

  inputGroup: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, marginBottom: 12, backgroundColor: '#f8fafc', overflow: 'hidden'
  },
  inputGroupFocused: {
    borderColor: '#1E3A8A',
    backgroundColor: '#eff6ff',
  },
  inputIconWrap: { paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  input: {
    flex: 1, paddingVertical: 14, paddingRight: 14, fontSize: 14, fontWeight: '600',
    color: '#0f172a', caretColor: '#1E3A8A', outlineStyle: 'none'
  },

  roleGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleCard: {
    flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 16, alignItems: 'center', gap: 8
  },
  roleIconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  roleCardText: { fontSize: 13 },

  feedbackBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 16
  },
  feedbackSuccess: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  feedbackError: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  feedbackText: { fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },

  saveButton: {
    flexDirection: 'row', backgroundColor: '#1E3A8A', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#1E3A8A', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  listHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  emptyListText: { color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 10
  },
  userName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  userEmail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  userRoleSwitch: { flexDirection: 'row', gap: 4, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 3 },
  userRoleBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  userRoleBtnText: { fontSize: 11, fontWeight: '700' },
  deleteIconBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, marginBottom: 12, backgroundColor: '#f8fafc', overflow: 'hidden'
  },
  searchInput: {
    flex: 1, paddingVertical: 14, paddingRight: 14, fontSize: 14, fontWeight: '600',
    color: '#0f172a', caretColor: '#1E3A8A', outlineStyle: 'none'
  },
  sortRow: { flexDirection: 'row', gap: 16, marginBottom: 12, paddingHorizontal: 4 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortBtnText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 },
  pageBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 },
  pageBtnDisabled: { opacity: 0.5 },
  pageIndicator: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  userRowSelf: { backgroundColor: '#eff6ff', borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -10 },
  selfBadge: { backgroundColor: '#1E3A8A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  selfBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  userRoleBtnDisabled: { opacity: 0.4 },
  deleteIconBtnDisabled: { opacity: 0.4 },
});