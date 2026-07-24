// src/components/HoverTip.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Tooltip immédiat au survol (web uniquement)
export default function HoverTip({ label, children }) {
  const [hovered, setHovered] = useState(false);
  if (Platform.OS !== 'web') return children;
  return (
    <View
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered ? (
        <View style={[tipStyles.bubble, { pointerEvents: 'none' }]}>
          <Text style={tipStyles.text}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const tipStyles = StyleSheet.create({
  bubble: {
    position: 'absolute', bottom: '110%', right: 0,
    backgroundColor: '#1F2937', borderRadius: 6,
    paddingVertical: 4, paddingHorizontal: 8,
    zIndex: 100,
  },
  text: { color: '#fff', fontSize: 11, fontWeight: '600', whiteSpace: 'nowrap' },
});