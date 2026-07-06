// src/components/AppTextInput.js
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function AppTextInput({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default', 
  multiline = false, 
  theme, 
  style 
}) {
  return (
    <View style={[styles.container, style]}>
      {/* STRICT TERNARY: No more && */}
      {label ? (
        <Text style={[styles.label, { color: theme?.textSecondary || '#64748b' }]}>
          {label}
        </Text>
      ) : null}
      
      <TextInput
        style={[
          styles.input, 
          { 
            backgroundColor: theme?.background || '#f8fafc', 
            color: theme?.text || '#0f172a', 
            borderColor: theme?.border || '#e2e8f0' 
          },
          /* STRICT TERNARY FOR STYLES */
          multiline ? styles.multilineInput : null
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme?.textSecondary || '#94a3b8'}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  multilineInput: {
    height: 80,
  }
});