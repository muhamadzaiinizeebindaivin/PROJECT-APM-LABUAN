import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { kewanganStyles as styles } from './kewanganStyles';
import { BULAN_MS } from '../../constants/bulan';

export default function MonthDropdown({ value, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.monthDropdownTrigger} onPress={() => setOpen(true)}>
        <Text style={[styles.monthDropdownText, !value && styles.monthDropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color={PALETTE.textMutedDark} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.monthDropdownOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.monthDropdownPanel}>
            <FlatList
              data={BULAN_MS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = value === item;
                return (
                  <TouchableOpacity
                    style={[styles.monthDropdownOption, selected && styles.monthDropdownOptionSelected]}
                    onPress={() => { onSelect(item); setOpen(false); }}
                  >
                    <Text style={[styles.monthDropdownOptionText, selected && styles.monthDropdownOptionTextSelected]}>{item}</Text>
                    {selected && <Check size={15} color={PALETTE.orange} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}