import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../supabaseClient';

export function useUserAccounts(enabled) {
  const [userAccounts, setUserAccounts] = useState([]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('role', { ascending: true });
      if (error) throw error;
      setUserAccounts(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (Platform.OS === 'web') window.alert('Ralat menarik data pengguna dari database.');
      else Alert.alert('Ralat', 'Gagal memuat turun senarai pengguna.');
    }
  }, []);

  useEffect(() => { if (enabled) fetchUsers(); }, [enabled, fetchUsers]);

  const updateCredentials = async (userId, newUsername, newPassword) => {
    const { error } = await supabase.rpc('update_user_credentials', {
      target_user_id: userId,
      new_username: newUsername,
      new_password: newPassword || null,
    });
    if (error) throw error;
    setUserAccounts((prev) => prev.map((u) => (u.id === userId ? { ...u, username: newUsername } : u)));
  };

  const deleteUser = async (userId) => {
    const { error } = await supabase.rpc('delete_user_account', { target_user_id: userId });
    if (error) throw error;
    setUserAccounts((prev) => prev.filter((u) => u.id !== userId));
  };

  return { userAccounts, updateCredentials, deleteUser };
}