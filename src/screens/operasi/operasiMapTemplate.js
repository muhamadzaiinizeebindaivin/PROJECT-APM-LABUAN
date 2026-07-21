// src/screen/operasiMapTemplate.js
import { VEHICLE_GLYPHS } from '../../constants/vehicleGlyphs';

/**
 * Builds the Leaflet map HTML shown inside the web <iframe>.
 *
 * Changes vs previous version:
 *  - Calamity points are now clustered (Leaflet.markercluster) with a
 *    colored count badge, since they can pile up over time and overlap.
 *    Vehicles are intentionally left unclustered: they move continuously
 *    via live GPS, and markercluster doesn't reindex a marker's spatial
 *    position on setLatLng, so clustering them would make moving vehicles
 *    appear stuck inside stale clusters.
 *  - Vehicle pins now show a shape specific to the vehicle type (lori,
 *    ambulans, motor, or default car), mirroring the rules in
 *    src/utils/vehicleIcons.js so the map matches the vehicle list.
 *  - Popups are richer: vehicle popups show plate/reg + type + status;
 *    calamity popups show category, description and time reported.
 */

export function buildOperasiMapHtml({ theme, userRole }) {
  return `
    <!DOCTYPE html>
    <html style="height: 100%; margin: 0;">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
        <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
        <style>
          body { margin: 0; padding: 0; height: 100%; background-color: ${theme.background}; }
          #map { height: 100%; width: 100%; }
          .leaflet-control-zoom { border: none !important; margin-right: 20px !important; margin-bottom: 30px !important; }
          .leaflet-popup-content-wrapper { border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .custom-popup { text-align: center; font-family: sans-serif; min-width: 130px; }
          .custom-popup strong { font-size: 14px; color: #1f2937; display: block; margin-bottom: 2px; }
          .custom-popup .sub { font-size: 11px; color: #6b7280; display: block; margin-bottom: 6px; }
          .custom-popup span.badge { font-size: 12px; font-weight: bold; padding: 2px 8px; border-radius: 12px; display: inline-block; }
          .status-patrol { background-color: #dcfce7; color: #166534; }
          .status-idle { background-color: #fee2e2; color: #991b1b; }
          .calamity-time { font-size: 10px; color: #9ca3af; display: block; margin-top: 4px; }

          /* Custom cluster badges */
          .cluster-badge { display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff; font-weight: 800; font-family: sans-serif; box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 2px solid white; }
          .cluster-vehicle { background-color: #2563eb; }
          .cluster-calamity { background-color: #ea580c; }

          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          .pulse-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
          .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; animation: pulse-ring 1.4s ease-out infinite; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var canDeleteCalamity = ${userRole === 'admin' ? 'true' : 'false'};
          function initMap() {
          var map = L.map('map', { zoomControl: false, attributionControl: false, maxZoom: 19 }).setView([5.2831, 115.2308], 13);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          map.on('click', function(e) {
            window.parent.postMessage(JSON.stringify({ type: 'MAP_CLICKED', lat: e.latlng.lat, lng: e.latlng.lng }), '*');
          });

          window.requestDeleteCalamity = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'DELETE_CALAMITY_REQUEST', id: id }), '*');
          };

          window.requestResolveCalamity = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'RESOLVE_CALAMITY_REQUEST', id: id }), '*');
          };

          // ---- Cluster groups (one for vehicles, one for calamity points) ----
          function makeClusterIcon(className) {
            return function(cluster) {
              var count = cluster.getChildCount();
              var size = count < 10 ? 34 : count < 50 ? 40 : 48;
              return L.divIcon({
                html: '<div class="cluster-badge ' + className + '" style="width:' + size + 'px;height:' + size + 'px;font-size:' + (size < 40 ? 12 : 14) + 'px;">' + count + '</div>',
                className: '',
                iconSize: [size, size]
              });
            };
          }

          // Vehicles move continuously (live GPS): NOT clustered, since
          // Leaflet.markercluster doesn't reindex a marker's position in its
          // spatial tree on setLatLng, which would make moving vehicles look
          // stuck inside stale clusters. They're added straight to the map.
          var vehicleLayer = L.layerGroup().addTo(map);

          var calamityCluster = L.markerClusterGroup({
            maxClusterRadius: 30,
            spiderfyOnMaxZoom: true,
            disableClusteringAtZoom: 16,
            iconCreateFunction: makeClusterIcon('cluster-calamity')
          }).addTo(map);

          // ---- Vehicle type -> inner glyph, mirrors utils/vehicleIcons.js "operasi" preset ----
          var VEHICLE_GLYPHS = { car: '', lori: '', motor: '', bot: '' };

          function vehicleGlyph(iconKey, color) {
            if (iconKey === 'ambulans') {
              return '<rect x="2" y="4" width="12" height="10" rx="1.5" fill="white" stroke="none"/>' +
                    '<rect x="6.8" y="6" width="2.4" height="6" fill="' + color + '"/>' +
                    '<rect x="4.8" y="8" width="6.4" height="2.4" fill="' + color + '"/>';
            }
            return VEHICLE_GLYPHS[iconKey] || VEHICLE_GLYPHS.car;
          }

          var createIcon = (color, type) => L.divIcon({
            className: 'custom-pin',
            html: '<svg width="26" height="34" viewBox="0 0 26 34" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">' +
                    '<path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="' + color + '" fill-opacity="0.85" stroke="white" stroke-width="2"/>' +
                    '<g transform="translate(5,4)" fill="white" stroke="white" stroke-width="0.6">' + vehicleGlyph(type, color) + '</g>' +
                  '</svg>',
            iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30]
          });

          var createCalamityIcon = function(color, category, logo) {
            if (logo) {
              return L.divIcon({
                className: 'calamity-pin',
                html: '<div class="pulse-wrap" style="width:48px;height:48px;">' +
                        '<div class="pulse-ring" style="background:' + color + ';opacity:0.4;"></div>' +
                        '<div style="width:40px;height:40px;border-radius:8px;background:#fff;border:2px solid ' + color + ';box-shadow:0 2px 5px rgba(0,0,0,0.35);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;gap:1px;position:relative;">' +
                          '<img src="' + logo + '" style="width:26px;height:26px;object-fit:contain;"/>' +
                          '<span style="font-size:7px;font-weight:900;color:' + color + ';font-family:sans-serif;line-height:1;">' + category + '</span>' +
                        '</div>' +
                      '</div>',
                iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -48]
              });
            }
            return L.divIcon({
              className: 'calamity-pin',
              html: '<div class="pulse-wrap" style="width:44px;height:44px;">' +
                      '<div class="pulse-ring" style="background:' + color + ';opacity:0.4;border-radius:50%;"></div>' +
                      '<svg width="28" height="36" viewBox="0 0 28 36" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35));position:relative;">' +
                        '<path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="' + color + '" stroke="white" stroke-width="2"/>' +
                        '<text x="14" y="17" text-anchor="middle" font-size="7" font-weight="900" fill="white" font-family="sans-serif">' + category + '</text>' +
                      '</svg>' +
                    '</div>',
              iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -44]
            });
          };

          var createPopupContent = (name, reg, type, status) => {
            var statusClass = status === 'Patrol' ? 'status-patrol' : 'status-idle';
            var subLine = (reg ? reg : '') + (reg && type ? ' &middot; ' : '') + (type ? type : '');
            return '<div class="custom-popup"><strong>' + name + '</strong>' +
                   (subLine ? '<span class="sub">' + subLine + '</span>' : '') +
                   '<span class="badge ' + statusClass + '">' + status + '</span></div>';
          };

          var formatTimeAgo = (iso) => {
            if (!iso) return '';
            var diffMs = Date.now() - new Date(iso).getTime();
            var mins = Math.floor(diffMs / 60000);
            if (mins < 1) return 'Baru sahaja';
            if (mins < 60) return mins + ' minit lalu';
            var hrs = Math.floor(mins / 60);
            if (hrs < 24) return hrs + ' jam lalu';
            return Math.floor(hrs / 24) + ' hari lalu';
          };

          var markers = {};
          var vehicleMeta = {}; // remembers icon_key/type/reg per vehicle id across partial realtime updates
          var calamityMarkers = {};

          window.addEventListener('message', function(event) {
            var data = JSON.parse(event.data);

            if (data.type === 'INIT_VEHICLES') {
              data.payload.forEach(v => {
                if (v.latitude && v.longitude && v.status === 'Patrol' && !markers[v.id]) {
                  vehicleMeta[v.id] = { iconKey: v.icon_key, type: v.type, reg: v.reg };
                  markers[v.id] = L.marker([v.latitude, v.longitude], { icon: createIcon(v.color || '#ef4444', v.icon_key) })
                    .bindPopup(createPopupContent(v.name, v.reg, v.type, v.status));
                  vehicleLayer.addLayer(markers[v.id]);
                }
              });
            } else if (data.type === 'UPDATE_LOCATION') {
              var prev = vehicleMeta[data.id];
              var meta = vehicleMeta[data.id] = {
                iconKey: data.iconKey || (prev && prev.iconKey),
                type: data.vehicleType || (prev && prev.type),
                reg: data.reg || (prev && prev.reg)
              };
              if (data.status === 'Patrol') {
                if (markers[data.id]) {
                  markers[data.id].setLatLng([data.lat, data.lng]);
                  markers[data.id].setIcon(createIcon(data.color, meta.iconKey));
                  markers[data.id].setPopupContent(createPopupContent(data.name, meta.reg, meta.type, data.status));
                } else if (data.lat && data.lng) {
                  markers[data.id] = L.marker([data.lat, data.lng], { icon: createIcon(data.color, meta.iconKey) })
                    .bindPopup(createPopupContent(data.name, meta.reg, meta.type, data.status));
                  vehicleLayer.addLayer(markers[data.id]);
                }
              } else {
                if (markers[data.id]) {
                  vehicleLayer.removeLayer(markers[data.id]);
                  delete markers[data.id];
                }
              }
            } else if (data.type === 'UPDATE_CALAMITIES') {
              var currentCalamityIds = data.payload.map(function(c) { return c.id; });
              Object.keys(calamityMarkers).forEach(function(id) {
                if (currentCalamityIds.indexOf(id) === -1) {
                  calamityCluster.removeLayer(calamityMarkers[id]);
                  delete calamityMarkers[id];
                }
              });

              data.payload.forEach(function(c) {
                if (!calamityMarkers[c.id]) {
                  var popupDiv = document.createElement('div');
                  popupDiv.className = 'custom-popup';

                  var strongEl = document.createElement('strong');
                  strongEl.textContent = c.label;
                  popupDiv.appendChild(strongEl);

                  var descEl = document.createElement('span');
                  descEl.className = 'sub';
                  descEl.textContent = c.description || 'Tiada keterangan';
                  popupDiv.appendChild(descEl);

                  if (c.created_at) {
                    var timeEl = document.createElement('span');
                    timeEl.className = 'calamity-time';
                    timeEl.textContent = formatTimeAgo(c.created_at);
                    popupDiv.appendChild(timeEl);
                  }

                  if (canDeleteCalamity) {
                    var resolveBtnEl = document.createElement('button');
                    resolveBtnEl.textContent = 'Selesai';
                    resolveBtnEl.style.marginTop = '6px';
                    resolveBtnEl.style.backgroundColor = '#22c55e';
                    resolveBtnEl.style.color = 'white';
                    resolveBtnEl.style.border = 'none';
                    resolveBtnEl.style.padding = '4px 10px';
                    resolveBtnEl.style.borderRadius = '6px';
                    resolveBtnEl.style.fontSize = '11px';
                    resolveBtnEl.style.fontWeight = '700';
                    resolveBtnEl.style.cursor = 'pointer';
                    resolveBtnEl.style.width = '100%';
                    resolveBtnEl.addEventListener('click', function() {
                      window.requestResolveCalamity(c.id);
                    });
                    popupDiv.appendChild(resolveBtnEl);

                    var btnEl = document.createElement('button');
                    btnEl.textContent = 'Padam Titik';
                    btnEl.style.marginTop = '6px';
                    btnEl.style.backgroundColor = '#ef4444';
                    btnEl.style.color = 'white';
                    btnEl.style.border = 'none';
                    btnEl.style.padding = '4px 10px';
                    btnEl.style.borderRadius = '6px';
                    btnEl.style.fontSize = '11px';
                    btnEl.style.fontWeight = '700';
                    btnEl.style.cursor = 'pointer';
                    btnEl.style.width = '100%';
                    btnEl.addEventListener('click', function() {
                      window.requestDeleteCalamity(c.id);
                    });
                    popupDiv.appendChild(btnEl);
                  }

                  calamityMarkers[c.id] = L.marker([c.lat, c.lng], { icon: createCalamityIcon(c.color, c.category, c.logo) })
                    .bindPopup(popupDiv);
                  calamityCluster.addLayer(calamityMarkers[c.id]);
                }
              });
            }
          });
          }

          if (document.readyState === 'complete') {
            initMap();
          } else {
            window.addEventListener('load', initMap);
          }
        </script>
      </body>
    </html>
  `;
}
