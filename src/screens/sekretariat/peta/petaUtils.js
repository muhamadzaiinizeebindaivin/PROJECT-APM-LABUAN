// src/screens/sekretariat/peta/petaUtils.js
import React from 'react';
import { View, Image } from 'react-native';
import { MapPin, Droplets, Waves, Mountain, Flame, Wind, CloudRain, Zap, Siren } from 'lucide-react-native';

export const PAGE_SIZE = 15;

// Icônes proposées pour une catégorie créée depuis le formulaire "Titik Baharu"
export const CATEGORY_ICON_OPTIONS = [
  { key: 'MapPin', Icon: MapPin },
  { key: 'Droplets', Icon: Droplets },
  { key: 'Waves', Icon: Waves },
  { key: 'Mountain', Icon: Mountain },
  { key: 'Flame', Icon: Flame },
  { key: 'Wind', Icon: Wind },
  { key: 'CloudRain', Icon: CloudRain },
  { key: 'Zap', Icon: Zap },
  { key: 'Siren', Icon: Siren },
];

export const CATEGORY_COLORS = ['#1D4E89', '#F4762B', '#7c3aed', '#dc2626', '#16a34a', '#0891b2', '#d97706', '#db2777'];

// Une teinte distincte par agence, répartie sur le cercle chromatique
export const buildAgencyColorMap = (agencyList) => {
  const map = {};
  const total = agencyList.length || 1;
  agencyList.forEach((a, index) => {
    const hue = Math.round((360 / total) * index);
    map[a.agency] = `hsl(${hue}, 70%, 45%)`;
  });
  return map;
};

// Logo de l'agence, ou pastille de couleur en fallback
export const AgencyMark = ({ logo, color, size = 18 }) => {
  if (logo) {
    return <Image source={{ uri: logo }} style={{ width: size, height: size, borderRadius: 4 }} resizeMode="contain" />;
  }
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />;
};

export const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}jam ${m} minit`;
  return `${m} minit`;
};

// Bouton "corbeille" des tableaux (même style partout)
export const deleteBtnStyle = {
  width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(220, 38, 38, 0.10)', alignItems: 'center', justifyContent: 'center',
};
