// src/utils/vehicleIcons.js
import React from 'react';
import { Truck, Ambulance, Bike, Car, PlusSquare } from 'lucide-react-native';

// Matching rules + default colors preserved exactly as they were
// individually defined in OperasiScreen.js and DriverScreen.js.
const ICON_PRESETS = {
  // Was: OperasiScreen's getVehicleIcon(type, color)
  operasi: {
    rules: [
      { test: (t) => t.includes('lori'), Icon: Truck, defaultColor: '#f97316' },
      { test: (t) => t.includes('ambulans'), Icon: Ambulance, defaultColor: '#ef4444' },
      { test: (t) => t.includes('motor') || t.includes('kriss'), Icon: Bike, defaultColor: '#3b82f6' },
    ],
    fallback: { Icon: Car, defaultColor: '#10b981' },
  },
  // Was: DriverScreen's getVehicleIcon(type, color)
  driver: {
    rules: [
      { test: (t) => t.includes('lori'), Icon: Truck },
      { test: (t) => t.includes('ambulans'), Icon: PlusSquare },
      { test: (t) => t.includes('motosikal'), Icon: Bike },
    ],
    fallback: { Icon: Car },
  },
};

/**
 * Resolves the vehicle icon element for a given screen "preset".
 * preset: 'operasi' | 'driver'
 */
export function getVehicleIcon(preset, type, color, size) {
  const config = ICON_PRESETS[preset];
  const lowerType = (type || '').toLowerCase();
  const match = config.rules.find((r) => r.test(lowerType)) || config.fallback;
  const resolvedColor = color || match.defaultColor;
  const Icon = match.Icon;
  return <Icon size={size} color={resolvedColor} />;
}
