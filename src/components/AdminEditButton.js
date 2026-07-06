// src/components/AdminEditButton.js
import React, { useLayoutEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Edit2, X } from 'lucide-react-native';

export default function AdminEditButton({ isEditMode, setIsEditMode, userRole }) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    // Only show the button in the header if the user is an admin
    if (!userRole || userRole === 'admin') {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={[styles.adminBtn, { backgroundColor: isEditMode ? '#ef4444' : '#22c55e' }]}
            onPress={() => setIsEditMode(!isEditMode)}
            activeOpacity={0.8}
          >
            {isEditMode ? <X size={14} color="#fff" /> : <Edit2 size={14} color="#fff" />}
            <Text style={styles.adminBtnText}>
              {isEditMode ? 'Tutup Kemaskini' : 'Kemaskini Maklumat'}
            </Text>
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({ headerRight: () => null });
    }

    // Cleanup: Remove button if component unmounts (e.g., switching tabs)
    return () => navigation.setOptions({ headerRight: () => null });

  }, [navigation, isEditMode, userRole]);

  // Returns null because the button now renders in the top navigation bar!
  return null; 
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