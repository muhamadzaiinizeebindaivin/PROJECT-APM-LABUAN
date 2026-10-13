// src/components/PilihLokasiModal.js
// "Pilih Lokasi" popup: place search (OpenStreetMap), latitude / longitude
// fields (a pasted "lat, lng" pair is accepted) and a small Leaflet map where
// the point can be clicked or dragged. Same behaviour as the location picker
// of the Bahagian Pengurusan Bencana Operasi dashboard.
import React, { useEffect, useRef, useState, createElement } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { X, Search, MapPin, MousePointerClick } from 'lucide-react-native';
import { PALETTE } from '../constants/palette';

// Labuan by default; searches stay in Malaysia, with Labuan results first
const PUSAT_LABUAN = { lat: 5.3, lng: 115.23 };
const KOTAK_LABUAN = '114.9,5.55,115.45,5.15'; // viewbox: left,top,right,bottom

const dalamMalaysia = (lat, lng) => lat >= 0.5 && lat <= 7.6 && lng >= 99 && lng <= 119.5;

// Small Leaflet map in an iframe (same CDN as the Sekretariat map)
function htmlPeta(awal) {
  const pusat = awal || PUSAT_LABUAN;
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#peta{height:100%;margin:0} .leaflet-container{cursor:crosshair}</style>
</head><body><div id="peta"></div><script>
  var peta = L.map('peta').setView([${pusat.lat}, ${pusat.lng}], ${awal ? 15 : 12});
  // Esri street map: no key, works inside srcDoc iframes
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 20, maxNativeZoom: 19, attribution: 'Tiles &copy; Esri'
  }).addTo(peta);
  var penanda = null;
  function letak(lat, lng) {
    if (penanda) penanda.setLatLng([lat, lng]);
    else {
      penanda = L.marker([lat, lng], { draggable: true }).addTo(peta);
      penanda.on('dragend', function () {
        var p = penanda.getLatLng();
        parent.postMessage(JSON.stringify({ type: 'PILIH_LOKASI', lat: p.lat, lng: p.lng }), '*');
      });
    }
  }
  ${awal ? `letak(${awal.lat}, ${awal.lng});` : ''}
  peta.on('click', function (e) {
    letak(e.latlng.lat, e.latlng.lng);
    parent.postMessage(JSON.stringify({ type: 'PILIH_LOKASI', lat: e.latlng.lat, lng: e.latlng.lng }), '*');
  });
  window.addEventListener('message', function (e) {
    try {
      var d = JSON.parse(e.data);
      if (d.type === 'SET_LOKASI') { letak(d.lat, d.lng); peta.setView([d.lat, d.lng], Math.max(peta.getZoom(), d.zoom || 15)); }
    } catch (err) {}
  });
</script></body></html>`;
}

export default function PilihLokasiModal({ visible, tajuk = 'Pilih Lokasi', awal = null, onClose, onSimpan, onKlikPetaUtama }) {
  const iframeRef = useRef(null);
  const [carian, setCarian] = useState('');
  const [hasil, setHasil] = useState([]);
  const [mencari, setMencari] = useState(false);
  const [ralatCarian, setRalatCarian] = useState('');
  const [latTeks, setLatTeks] = useState('');
  const [lngTeks, setLngTeks] = useState('');
  const [ralat, setRalat] = useState('');
  const [html, setHtml] = useState('');

  // Fresh state each time the popup opens
  useEffect(() => {
    if (!visible) return;
    setCarian('');
    setHasil([]);
    setRalatCarian('');
    setRalat('');
    setLatTeks(awal ? String(awal.lat) : '');
    setLngTeks(awal ? String(awal.lng) : '');
    setHtml(htmlPeta(awal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Clicks / drags on the small map fill the fields
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return undefined;
    const dengar = (e) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'PILIH_LOKASI') {
          setLatTeks(d.lat.toFixed(6));
          setLngTeks(d.lng.toFixed(6));
          setRalat('');
        }
      } catch (err) {}
    };
    window.addEventListener('message', dengar);
    return () => window.removeEventListener('message', dengar);
  }, [visible]);

  const hantarKePeta = (lat, lng) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: 'SET_LOKASI', lat, lng, zoom: 16 }), '*');
  };

  const lat = parseFloat(latTeks);
  const lng = parseFloat(lngTeks);
  const sah = Number.isFinite(lat) && Number.isFinite(lng) && dalamMalaysia(lat, lng);

  // Typed or pasted coordinates move the marker ("5.2831, 115.2308" in one field is split)
  const ubahLat = (teks) => {
    const pasangan = teks.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (pasangan) {
      setLatTeks(pasangan[1]);
      setLngTeks(pasangan[2]);
      const a = parseFloat(pasangan[1]);
      const b = parseFloat(pasangan[2]);
      if (dalamMalaysia(a, b)) hantarKePeta(a, b);
      return;
    }
    setLatTeks(teks);
  };
  const kemaskiniPetaDariMedan = () => {
    if (sah) hantarKePeta(lat, lng);
  };

  const cari = async () => {
    const q = carian.trim();
    if (!q) return;
    setMencari(true);
    setRalatCarian('');
    setHasil([]);
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=my' +
        `&viewbox=${KOTAK_LABUAN}&accept-language=ms&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) setRalatCarian('Tiada hasil. Cuba nama tempat lain atau masukkan koordinat.');
      setHasil(Array.isArray(data) ? data : []);
    } catch (err) {
      setRalatCarian('Carian gagal. Semak sambungan internet.');
    } finally {
      setMencari(false);
    }
  };

  const pilihHasil = (h) => {
    const a = parseFloat(h.lat);
    const b = parseFloat(h.lon);
    setLatTeks(a.toFixed(6));
    setLngTeks(b.toFixed(6));
    setHasil([]);
    setRalat('');
    hantarKePeta(a, b);
  };

  const simpan = () => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setRalat('Sila pilih lokasi pada peta, cari tempat, atau masukkan latitud dan longitud.');
      return;
    }
    if (!dalamMalaysia(lat, lng)) {
      setRalat('Koordinat di luar kawasan Malaysia. Sila semak semula.');
      return;
    }
    onSimpan(lat, lng);
  };

  const input = {
    borderWidth: 1, borderColor: PALETTE.border, borderRadius: 10, backgroundColor: PALETTE.white,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: PALETTE.textDark,
  };
  const label = { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, marginBottom: 4 };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ backgroundColor: PALETTE.white, borderRadius: 18, width: '100%', maxWidth: 720, maxHeight: '94%', overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: PALETTE.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color={PALETTE.orange} />
              <Text style={{ fontSize: 17, fontWeight: '800', color: PALETTE.textDark }}>{tajuk}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={PALETTE.textMutedDark} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {/* Search */}
            <View>
              <Text style={label}>Cari tempat</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[input, { flex: 1, outlineStyle: 'none' }]}
                  placeholder="Cth: Kg Rancha-Rancha, Labuan"
                  placeholderTextColor={PALETTE.textMutedDark}
                  value={carian}
                  onChangeText={setCarian}
                  onSubmitEditing={cari}
                  returnKeyType="search"
                />
                <TouchableOpacity
                  onPress={cari}
                  disabled={mencari || !carian.trim()}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PALETTE.orange, borderRadius: 10, paddingHorizontal: 14, opacity: mencari || !carian.trim() ? 0.6 : 1 }}
                >
                  {mencari ? <ActivityIndicator size="small" color="#fff" /> : <Search size={16} color="#fff" />}
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Cari</Text>
                </TouchableOpacity>
              </View>
              {ralatCarian ? <Text style={{ fontSize: 12, color: PALETTE.danger, marginTop: 6 }}>{ralatCarian}</Text> : null}
              {hasil.length > 0 && (
                <View style={{ marginTop: 8, borderWidth: 1, borderColor: PALETTE.border, borderRadius: 10, overflow: 'hidden' }}>
                  {hasil.map((h) => (
                    <TouchableOpacity
                      key={h.place_id}
                      onPress={() => pilihHasil(h)}
                      style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: PALETTE.surface }}
                    >
                      <MapPin size={14} color={PALETTE.orange} style={{ marginTop: 2 }} />
                      <Text style={{ flex: 1, fontSize: 13, color: PALETTE.textDark }} numberOfLines={2}>{h.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Coordinates */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={label}>Latitud</Text>
                <TextInput
                  style={[input, { outlineStyle: 'none' }]}
                  placeholder="5.2831"
                  placeholderTextColor={PALETTE.textMutedDark}
                  value={latTeks}
                  onChangeText={ubahLat}
                  onBlur={kemaskiniPetaDariMedan}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={label}>Longitud</Text>
                <TextInput
                  style={[input, { outlineStyle: 'none' }]}
                  placeholder="115.2308"
                  placeholderTextColor={PALETTE.textMutedDark}
                  value={lngTeks}
                  onChangeText={setLngTeks}
                  onBlur={kemaskiniPetaDariMedan}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <Text style={{ fontSize: 11, color: PALETTE.textMutedDark, marginTop: -8 }}>
              Boleh tampal koordinat dari Google Maps (cth: 5.2831, 115.2308) dalam medan Latitud.
            </Text>

            {/* Small map */}
            {Platform.OS === 'web' && html ? (
              <View style={{ height: 320, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.border }}>
                {createElement('iframe', {
                  ref: iframeRef,
                  srcDoc: html,
                  title: 'Peta pilih lokasi',
                  style: { width: '100%', height: '100%', border: 'none' },
                })}
              </View>
            ) : null}
            <Text style={{ fontSize: 11, color: PALETTE.textMutedDark, marginTop: -8 }}>
              Klik pada peta untuk letak titik. Penanda boleh diseret untuk ubah kedudukan.
            </Text>

            {ralat ? <Text style={{ fontSize: 13, color: PALETTE.danger }}>{ralat}</Text> : null}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              {onKlikPetaUtama ? (
                <TouchableOpacity onPress={onKlikPetaUtama} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MousePointerClick size={14} color={PALETTE.textMutedDark} />
                  <Text style={{ fontSize: 12, color: PALETTE.textMutedDark, textDecorationLine: 'underline' }}>
                    Atau klik terus pada peta utama
                  </Text>
                </TouchableOpacity>
              ) : <View />}
              <TouchableOpacity
                onPress={simpan}
                style={{ backgroundColor: sah ? PALETTE.orange : '#fdba74', borderRadius: 10, paddingHorizontal: 22, paddingVertical: 12 }}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Simpan Lokasi</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}