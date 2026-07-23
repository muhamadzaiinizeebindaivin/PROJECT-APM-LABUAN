// src/components/AdminEditButton.js
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Edit2, X } from 'lucide-react-native';

export default function AdminEditButton({ isEditMode, setIsEditMode, userRole, isSaving = false }) {
  // N'affiche rien si le rôle n'est pas admin (ni indéfini)
  if (userRole && userRole !== 'admin') return null;

  return (
    <TouchableOpacity
      style={[styles.adminBtn, { backgroundColor: isEditMode ? '#ef4444' : '#22c55e', opacity: isSaving ? 0.7 : 1 }]}
      onPress={() => !isSaving && setIsEditMode(!isEditMode)}
      activeOpacity={0.8}
      disabled={isSaving}
    >
      {isSaving ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : isEditMode ? (
        <X size={14} color="#fff" />
      ) : (
        <Edit2 size={14} color="#fff" />
      )}
      <Text style={styles.adminBtnText}>
        {isSaving ? 'Menyimpan...' : isEditMode ? 'Tutup Kemaskini' : 'Kemaskini Maklumat'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  adminBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    marginRight: 15, // Adds padding from the right edge of the screen
    gap: 6, 
    elevation: 2,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 1.41
  },
  adminBtnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 11 
  },
});