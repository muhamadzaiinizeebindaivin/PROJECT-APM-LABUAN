import React, { createElement } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { PALETTE } from '../../constants/palette';

const LOCATIONS = [
  {
    lat: 5.2996567,
    lng: 115.2412092,
    name: 'Pejabat Daerah Pertahanan Awam Labuan (PDPA APM)',
    detail: 'Tingkat 2, Lot 4A2, Wisma Wong Wo Lo',
    color: '#f97316',
  },
  {
    lat: 5.3105734,
    lng: 115.2325376,
    name: 'Pusat Kawalan Operasi Daerah (PKOD)',
    detail: 'Kg. Pantai, Jln Pohon Batu — Operasi 24/7',
    color: '#1d4ed8',
  },
];

const buildMapHtml = () => `
  <!DOCTYPE html>
  <html style="height: 100%; margin: 0;">
    <head>
      <meta charset="utf-8">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
        .apm-pin {
          width: 26px; height: 26px; border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        }
        .apm-popup { font-family: -apple-system, sans-serif; font-size: 12px; line-height: 1.4; }
        .apm-popup strong { display: block; margin-bottom: 2px; font-size: 12.5px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var locations = ${JSON.stringify(LOCATIONS)};

        var map = L.map('map', { zoomControl: true, scrollWheelZoom: false });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors, &copy; CARTO',
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        var markers = [];
        locations.forEach(function(loc) {
          var icon = L.divIcon({
            className: '',
            html: '<div class="apm-pin" style="background:' + loc.color + '"></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 26],
          });

          var marker = L.marker([loc.lat, loc.lng], { icon: icon }).addTo(map);
          marker.bindPopup(
            '<div class="apm-popup"><strong>' + loc.name + '</strong>' + loc.detail + '</div>'
          );
          markers.push(marker);
        });

        var group = L.featureGroup(markers);
        map.fitBounds(group.getBounds(), { padding: [40, 40] });
      </script>
    </body>
  </html>
`;

const MAP_SRC = `data:text/html;charset=utf-8,${encodeURIComponent(buildMapHtml())}`;

export default function AddressMap() {
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.card, styles.fallback]}>
        <Text style={styles.fallbackText}>Peta tidak disokong pada peranti ini.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {createElement('iframe', {
        src: MAP_SRC,
        style: { width: '100%', height: '100%', border: 'none', display: 'block' },
        title: 'Lokasi Pejabat APM',
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: PALETTE.cardLight,
    borderWidth: 1,
    borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  fallback: { justifyContent: 'center', alignItems: 'center' },
  fallbackText: { color: PALETTE.textMutedDark, fontSize: 13, fontWeight: '500' },
});