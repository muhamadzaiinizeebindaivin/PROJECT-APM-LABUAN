// src/components/AppModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';

export default function AppModal({ 
  visible, 
  onClose, 
  onSave, 
  title, 
  children, 
  theme, 
  isLoading = false, 
  saveText = "Simpan", 
  cancelText = "Batal",
  hideFooter = false,
  position = "bottom", 
  headerIcon = null
}) {
  const isBottom = position === 'bottom';

  return (
    <Modal visible={visible} animationType={isBottom ? "slide" : "fade"} transparent={true} onRequestClose={onClose}>
      <View style={isBottom ? styles.overlayBottom : styles.overlayCenter}>
        <View style={[
          isBottom ? styles.contentBottom : styles.contentCenter, 
          { backgroundColor: theme.background || '#ffffff' }
        ]}>
          
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {headerIcon ? headerIcon : null}
              <Text style={[styles.title, { color: theme.text || '#0f172a' }]}>{title}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={24} color={theme.textSecondary || '#64748b'} />
            </TouchableOpacity>
          </View>

          {children}

          {/* THE FIX: Strict ternary operator instead of && */}
          {!hideFooter ? (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLoading}>
                <Text style={[styles.cancelText, { color: theme.textSecondary || '#64748b' }]}>{cancelText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.accent || '#3b82f6' }]} 
                onPress={onSave} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveText}>{saveText}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  contentBottom: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  
  overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  contentCenter: { borderRadius: 24, padding: 24, maxHeight: '90%', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  closeBtn: { padding: 4, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 12 },
  cancelBtn: { paddingVertical: 14, paddingHorizontal: 16, justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700' },
  saveBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, minWidth: 120, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});