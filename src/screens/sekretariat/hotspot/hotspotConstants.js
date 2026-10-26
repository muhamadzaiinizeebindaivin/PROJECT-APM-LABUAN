// src/screens/sekretariat/hotspot/hotspotConstants.js
import {
  Droplets, Waves, Mountain, MapPin,
  Flame, Wind, Tornado, CloudRain, CloudLightning, CloudFog, Zap,
  Sun, Snowflake, Umbrella, TreePine, Trees, Globe, Bug,
  AlertTriangle, Biohazard, Radiation, Siren, ShieldAlert, LifeBuoy,
  Factory, Building2, Home, Tent, Warehouse, Landmark,
  Ship, Anchor, Truck, Car, Plane, Fuel,
} from 'lucide-react-native';
import { PALETTE } from '../../../constants/palette';

// Registre d'icônes sélectionnables (nom stocké en base → composant)
export const ICONS = {
  MapPin, Droplets, Waves, Mountain,
  Flame, Wind, Tornado, CloudRain, CloudLightning, CloudFog, Zap,
  Sun, Snowflake, Umbrella, TreePine, Trees, Globe, Bug,
  AlertTriangle, Biohazard, Radiation, Siren, ShieldAlert, LifeBuoy,
  Factory, Building2, Home, Tent, Warehouse, Landmark,
  Ship, Anchor, Truck, Car, Plane, Fuel,
};
export const resolveIcon = (cat) => ICONS[cat?.icon] || MapPin;

export const COLOR_CHOICES = ['#3B82F6', '#d97706', '#EA580C', '#16A34A', '#9333EA', '#DC2626', '#0891B2'];
export const DEFAULT_PREFIX = 'NO.';

export const EMPTY_CAT_FORM = { label: '', sub: '', color: COLOR_CHOICES[0], prefix: DEFAULT_PREFIX, icon: 'MapPin' };

// Style calqué sur appStyles.input, pour le <input type="date"> HTML natif (web uniquement)
export const webDateInput = {
  width: '100%',
  boxSizing: 'border-box',
  border: `1px solid ${PALETTE.cardLightBorder}`,
  borderRadius: 10,
  padding: 12,
  fontSize: 14,
  color: PALETTE.textDark,
  backgroundColor: '#fafafa',
  outline: 'none',
  fontFamily: 'inherit',
};
