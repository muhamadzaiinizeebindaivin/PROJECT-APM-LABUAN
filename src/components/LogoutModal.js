import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { LogOut } from 'lucide-react-native';

export default function LogoutModal({ visible, onCancel, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 }}>

          {/* Bandeau header sombre, même esprit que la modale de login */}
          <View style={{ backgroundColor: '#0c0c0e', padding: 24, alignItems: 'center' }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <LogOut size={26} color="#ef4444" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>Log Keluar</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
              Adakah anda pasti mahu log keluar daripada portal SediaOps?
            </Text>
          </View>

          {/* Boutons */}
          <View style={{ flexDirection: 'row', gap: 10, padding: 20, backgroundColor: '#fff' }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#64748b', fontWeight: '800', fontSize: 14 }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <LogOut size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Log Keluar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}