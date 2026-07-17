import React, { createElement } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { MapPin, Phone, Mail } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';

const WIDGETS = [
  {
    key: 'addressPejabatText',
    label: 'ALAMAT PEJABAT APM LABUAN',
    accent: PALETTE.orange,
    accentSoft: 'rgba(249, 115, 22, 0.10)',
    lat: 5.2996567,
    lng: 115.2412092,
  },
  {
    key: 'addressPkodText',
    label: 'ALAMAT PUSAT KAWALAN OPERASI DAERAH (PKOD)',
    accent: PALETTE.blue,
    accentSoft: 'rgba(29, 78, 216, 0.08)',
    lat: 5.3105734,
    lng: 115.2325376,
  },
];

const PHONE_REGEX = /^[\d\s/+()-]{7,}$/;
const EMAIL_REGEX = /\S+@\S+\.\S+/;

function ContactLines({ text, accent }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <View style={styles.contactBlock}>
      {lines.map((line, i) => {
        const isPhone = PHONE_REGEX.test(line);
        const isEmail = EMAIL_REGEX.test(line);
        const isTitle = i === 0;

        if (isPhone || isEmail) {
          const Icon = isPhone ? Phone : Mail;
          return (
            <View key={i} style={styles.contactRow}>
              <View style={[styles.contactIconCircle, { backgroundColor: `${accent}1A` }]}>
                <Icon size={13} color={accent} />
              </View>
              <Text style={styles.contactText}>{line}</Text>
            </View>
          );
        }
        return (
          <Text key={i} style={isTitle ? styles.orgTitle : styles.addressLine}>
            {line}
          </Text>
        );
      })}
    </View>
  );
}

const buildMiniMapHtml = (lat, lng, color) => `
  <!DOCTYPE html>
  <html style="height: 100%; margin: 0;">
    <head>
      <meta charset="utf-8">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
        .apm-pin {
          width: 22px; height: 22px; border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: true, scrollWheelZoom: true, dragging: true, touchZoom: true, doubleClickZoom: true });
        map.setView([${lat}, ${lng}], 15);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '',
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        var icon = L.divIcon({
          className: '',
          html: '<div class="apm-pin" style="background:${color}"></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 22],
        });

        L.marker([${lat}, ${lng}], { icon: icon }).addTo(map);
      </script>
    </body>
  </html>
`;

function MiniMap({ lat, lng, color }) {
  if (Platform.OS !== 'web') {
    return <View style={styles.mapFallback} />;
  }
  const src = `data:text/html;charset=utf-8,${encodeURIComponent(buildMiniMapHtml(lat, lng, color))}`;
  return (
    <View style={styles.mapWrap}>
      {createElement('iframe', {
        src,
        style: { width: '100%', height: '100%', border: 'none', display: 'block' },
        title: 'Peta lokasi',
      })}
    </View>
  );
}

export default function AddressWidgets({ isEditing, pageData, updateField }) {
  return (
    <View style={styles.row}>
      {WIDGETS.map(({ key, label, accent, accentSoft, lat, lng }) => (
        <View key={key} style={styles.widget}>
          <View style={styles.infoColumn}>
            <View style={styles.headerRow}>
              <View style={[styles.iconBadge, { backgroundColor: accentSoft }]}>
                <MapPin size={19} color={accent} />
              </View>
              <Text style={[styles.label, { color: accent }]}>{label}</Text>
            </View>

            <View style={styles.body}>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={pageData[key]}
                  onChangeText={(text) => updateField(key, text)}
                  multiline
                />
              ) : (
                <ContactLines text={pageData[key]} accent={accent} />
              )}
            </View>
          </View>

          <MiniMap lat={lat} lng={lng} color={accent} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, paddingHorizontal: 20 },
  widget: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: PALETTE.cardLight,
    borderWidth: 1,
    borderColor: PALETTE.cardLightBorder,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#c9825a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  infoColumn: { flex: 1.3, padding: 22, paddingLeft: 24 },
  mapWrap: {
    flex: 1,
    minWidth: 140,
    margin: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.cardLightBorder,
  },
  mapFallback: {
    flex: 1,
    minWidth: 140,
    margin: 14,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  iconBadge: {
    width: 36, height: 36, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    flex: 1,
    flexShrink: 1,
    textTransform: 'uppercase',
    lineHeight: 16,
  },

  body: {},
  contactBlock: { gap: 6 },
  orgTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textDark,
    marginBottom: 7,
    lineHeight: 22,
  },
  addressLine: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.textMutedDark,
    lineHeight: 21,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  contactIconCircle: {
    width: 28, height: 28, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textDark,
  },

  input: {
    borderWidth: 1.5,
    borderColor: PALETTE.cardLightBorder,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fafafa',
    color: PALETTE.textDark,
    fontSize: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    flex: 1,
  },
});