// src/screen/operasiMapTemplate.js

/**
 * Builds the Leaflet map HTML shown inside the web <iframe>.
 * Logic and markup are byte-for-byte the same as the previous inline
 * `mapHtml` template literal in OperasiScreen.js — only moved out of the
 * component so the component body isn't dominated by a giant string.
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
        <style>
          body { margin: 0; padding: 0; height: 100%; background-color: ${theme.background}; }
          #map { height: 100%; width: 100%; }
          .leaflet-control-zoom { border: none !important; margin-right: 20px !important; margin-bottom: 30px !important; }
          .leaflet-popup-content-wrapper { border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .custom-popup { text-align: center; font-family: sans-serif; }
          .custom-popup strong { font-size: 14px; color: #1f2937; display: block; margin-bottom: 4px; }
          .custom-popup span { font-size: 12px; font-weight: bold; padding: 2px 8px; border-radius: 12px; }
          .status-patrol { background-color: #dcfce7; color: #166534; }
          .status-idle { background-color: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var canDeleteCalamity = ${userRole === 'admin' ? 'true' : 'false'};
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([5.2831, 115.2308], 13);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          map.on('click', function(e) {
            window.parent.postMessage(JSON.stringify({ type: 'MAP_CLICKED', lat: e.latlng.lat, lng: e.latlng.lng }), '*');
          });

          window.requestDeleteCalamity = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'DELETE_CALAMITY_REQUEST', id: id }), '*');
          };

          var createIcon = (color) => L.divIcon({
            className: 'custom-pin',
            html: '<svg width="26" height="34" viewBox="0 0 26 34" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">' +
                    '<path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="' + color + '" fill-opacity="0.72" stroke="white" stroke-width="2"/>' +
                    '<circle cx="13" cy="13" r="5" fill="white" fill-opacity="0.9"/>' +
                  '</svg>',
            iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30]
          });

          var createCalamityIcon = (color, category) => L.divIcon({
            className: 'calamity-pin',
            html: '<div style="display: flex; align-items: center; gap: 5px; background-color: white; padding: 4px 8px 4px 4px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 1.5px solid ' + color + ';">' +
                    '<svg width="22" height="20" viewBox="0 0 24 22" style="flex-shrink: 0;">' +
                      '<polygon points="12,1 23,20 1,20" fill="' + color + '" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>' +
                      '<text x="12" y="17" text-anchor="middle" font-size="12" font-weight="900" fill="white" font-family="sans-serif">!</text>' +
                    '</svg>' +
                    '<span style="color: #1f2937; font-size: 11px; font-weight: 800; font-family: sans-serif; white-space: nowrap;">' + category + '</span>' +
                  '</div>',
            iconSize: [70, 30], iconAnchor: [15, 28], popupAnchor: [10, -25]
          });

          var createPopupContent = (name, status) => {
            var statusClass = status === 'Patrol' ? 'status-patrol' : 'status-idle';
            return '<div class="custom-popup"><strong>' + name + '</strong><span class="' + statusClass + '">' + status + '</span></div>';
          };

          var markers = {};
          var calamityMarkers = {};

          window.addEventListener('message', function(event) {
            var data = JSON.parse(event.data);
            
            if (data.type === 'INIT_VEHICLES') {
              data.payload.forEach(v => {
                if (v.latitude && v.longitude && v.status === 'Patrol' && !markers[v.id]) {
                  markers[v.id] = L.marker([v.latitude, v.longitude], { icon: createIcon(v.color || '#ef4444') })
                    .bindPopup(createPopupContent(v.name, v.status))
                    .addTo(map);
                }
              });
            } else if (data.type === 'UPDATE_LOCATION') {
              if (data.status === 'Patrol') {
                if (markers[data.id]) {
                  markers[data.id].setLatLng([data.lat, data.lng]).setPopupContent(createPopupContent(data.name, data.status));
                } else if (data.lat && data.lng) {
                  markers[data.id] = L.marker([data.lat, data.lng], { icon: createIcon(data.color) })
                    .bindPopup(createPopupContent(data.name, data.status))
                    .addTo(map);
                }
              } else {
                if (markers[data.id]) {
                  map.removeLayer(markers[data.id]);
                  delete markers[data.id];
                }
              }
            } else if (data.type === 'UPDATE_CALAMITIES') {
              var currentCalamityIds = data.payload.map(function(c) { return c.id; });
              Object.keys(calamityMarkers).forEach(function(id) {
                if (currentCalamityIds.indexOf(id) === -1) {
                  map.removeLayer(calamityMarkers[id]);
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

                  var spanEl = document.createElement('span');
                  spanEl.textContent = c.description || 'Tiada keterangan';
                  popupDiv.appendChild(spanEl);

                  if (canDeleteCalamity) {
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

                  calamityMarkers[c.id] = L.marker([c.lat, c.lng], { icon: createCalamityIcon(c.color, c.category) })
                    .bindPopup(popupDiv)
                    .addTo(map);
                }
              });
            }
          });
        </script>
      </body>
    </html>
  `;
}
