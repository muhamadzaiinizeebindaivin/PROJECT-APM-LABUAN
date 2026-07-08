// src/utils/vehicleIcons.js
import React from 'react';
import { Truck, Ambulance, Bike, Car, Ship } from 'lucide-react-native';

// Data-driven: the vehicle's own icon_key column decides the icon,
// no more guessing from free-text "type".
const ICON_KEY_ASSETS = {
  car: { Icon: Car, defaultColor: '#10b981' },
  lori: { Icon: Truck, defaultColor: '#f97316' },
  motor: { Icon: Bike, defaultColor: '#3b82f6' },
  ambulans: { Icon: Ambulance, defaultColor: '#ef4444' },
  boat: { Icon: Ship, defaultColor: '#0ea5e9' },
};

/**
 * Resolves the vehicle icon element from its icon_key column.
 */
export function getVehicleIcon(iconKey, color, size) {
  const asset = ICON_KEY_ASSETS[iconKey] || ICON_KEY_ASSETS.car;
  const Icon = asset.Icon;
  return <Icon size={size} color={color || asset.defaultColor} />;
}