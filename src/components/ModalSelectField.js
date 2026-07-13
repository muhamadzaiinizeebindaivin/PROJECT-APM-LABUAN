// src/components/ModalSelectField.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { formStyles as styles } from '../styles/formStyles';

export default function ModalSelectField({
  theme,
  label,
  value,
  options,
  placeholder,
  isOpen,
  onToggle,
  onSelect,
  stackIndex,
}) {
  return (
    <View style={[styles.inputGroup, { position: 'relative', zIndex: isOpen ? 9999 : stackIndex, elevation: isOpen ? 9999 : stackIndex }]}>
      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.modalDropdownBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={onToggle}
      >
        <Text style={{ color: value ? theme.text : theme.textSecondary, fontSize: 14 }}>
          {value || placeholder}
        </Text>
        {isOpen ? <ChevronUp size={18} color={theme.textSecondary} /> : <ChevronDown size={18} color={theme.textSecondary} />}
      </TouchableOpacity>

      {isOpen && (
        <>
          {/* Overlay transparent pour fermer au clic extérieur */}
          <TouchableOpacity
            onPress={onToggle}
            activeOpacity={1}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 9998,
            }}
          />
          <View style={[
            styles.modalDropdownList,
            {
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: theme.card,
              borderColor: theme.border,
              zIndex: 9999,
              elevation: 9999,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 8,
            }
          ]}>
            <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
              {options.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.modalDropdownItem, { borderBottomColor: theme.border, backgroundColor: value === opt ? '#eff6ff' : 'transparent' }]}
                  onPress={() => onSelect(opt)}
                >
                  <Text style={{ color: value === opt ? '#1E3A8A' : theme.text, fontSize: 13, flex: 1, fontWeight: value === opt ? '700' : '400' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}
