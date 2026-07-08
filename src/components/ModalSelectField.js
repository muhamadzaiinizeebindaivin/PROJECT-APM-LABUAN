// src/components/ModalSelectField.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { formStyles as styles } from '../styles/formStyles';

/**
 * Generic "select from a list" field used inside the NG999 CRUD modal.
 * Replaces the two previously duplicated category/month dropdown blocks.
 *
 * `stackIndex` mirrors the original fixed zIndex/elevation values
 * (2000 for the category field, 1000 for the month field) so stacking
 * order between the two open dropdowns stays exactly as before.
 */
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
    <View style={[styles.inputGroup, { zIndex: stackIndex, elevation: stackIndex }]}>
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
        <View style={[styles.modalDropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.modalDropdownItem, { borderBottomColor: theme.border }]}
                onPress={() => onSelect(opt)}
              >
                <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>{opt}</Text>
                {value === opt && <Check size={14} color="#3b82f6" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
