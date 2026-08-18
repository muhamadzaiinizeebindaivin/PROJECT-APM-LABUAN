// src/screen/sekretariatMapTemplate.js

/**
 * Builds the Leaflet map HTML shown inside the Sekretariat web <iframe>.
 * Mirrors the structure/style of operasiMapTemplate.js exactly:
 *  - Single <script> tag, no duplication.
 *  - Map init deferred until window 'load' to avoid forced-layout warnings.
 *  - Neither bencana points nor agency member markers are clustered — each
 *    pin is shown individually and updated in place (setLatLng) as
 *    positions change.
 *  - Bencana markers use the same teardrop/pin shape as Operasi's calamity
 *    markers, but with a fixed color (no fixed category palette — the
 *    category is free text typed by the admin).
 */
export function buildSekretariatMapHtml({ theme, userRole }) {
  return `
    <!DOCTYPE html>
    <html style="height: 100%; margin: 0;">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; height: 100%; background-color: ${theme?.background || '#f8fafc'}; }
          #map { height: 100%; width: 100%; }
          .leaflet-control-zoom { border: none !important; margin-right: 20px !important; margin-bottom: 30px !important; }
          .leaflet-popup-content-wrapper { border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .custom-popup { text-align: center; font-family: sans-serif; min-width: 130px; }
          .custom-popup strong { font-size: 14px; color: #1f2937; display: block; margin-bottom: 2px; }
          .custom-popup .sub { font-size: 11px; color: #6b7280; display: block; margin-bottom: 6px; }
          .custom-popup span.badge { font-size: 12px; font-weight: bold; padding: 2px 8px; border-radius: 12px; display: inline-block; }
          .bencana-time { font-size: 10px; color: #9ca3af; display: block; margin-top: 4px; }

          .agency-name-tooltip { font-family: sans-serif; font-size: 11px; font-weight: 700; color: #1f2937; background: #fff; border: none; border-radius: 6px; padding: 3px 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); }

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
          var canDeleteBencana = ${userRole === 'admin' || userRole === 'sekretariat' ? 'true' : 'false'};
          var canManageAgency = ${userRole === 'admin' || userRole === 'sekretariat' ? 'true' : 'false'};

          function initMap() {
          var map = L.map('map', { zoomControl: false, attributionControl: false, maxZoom: 20 }).setView([5.2831, 115.2308], 12);

          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 20, maxNativeZoom: 19,
            attribution: 'Tiles &copy; Esri'
          }).addTo(map);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
            maxZoom: 20, maxNativeZoom: 19
          }).addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          window.addEventListener('resize', function() {
            map.invalidateSize();
          });

          map.on('click', function(e) {
            window.parent.postMessage(JSON.stringify({ type: 'MAP_CLICKED', lat: e.latlng.lat, lng: e.latlng.lng }), '*');
          });

          window.requestDeleteBencana = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'DELETE_BENCANA_REQUEST', id: id }), '*');
          };

          window.requestResolveBencana = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'RESOLVE_BENCANA_REQUEST', id: id }), '*');
          };

          window.requestDeleteAgencyTracker = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'DELETE_AGENCY_TRACKER_REQUEST', id: id }), '*');
          };

          // Agences en ligne : plus de regroupement — chaque marker est mis à
          // jour sur place (setLatLng) au lieu d'être retiré et recréé.
          var agencyCluster = L.layerGroup().addTo(map);

          // Bencana : plus de regroupement — chaque point s'affiche individuellement
          var bencanaCluster = L.layerGroup().addTo(map);

          var createAgencyIcon = (color, logo) => {
            if (logo) {
              return L.divIcon({
                className: 'custom-pin',
                html: '<div style="opacity:1;width:36px;height:36px;border-radius:8px;background:#fff;border:2px solid ' + color + ';box-shadow:0 2px 5px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;overflow:hidden;">' +
                        '<img src="' + logo + '" style="width:30px;height:30px;object-fit:contain;" />' +
                      '</div>',
                iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20]
              });
            }
            return L.divIcon({
              className: 'custom-pin',
              html: '<svg width="26" height="34" viewBox="0 0 26 34" style="opacity:1;filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">' +
                      '<path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="' + color + '" fill-opacity="0.72" stroke="white" stroke-width="2"/>' +
                      '<circle cx="13" cy="13" r="5" fill="white" fill-opacity="0.9"/>' +
                    '</svg>',
              iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30]
            });
          };

          var createBencanaIcon = function() {
            return L.divIcon({
              className: 'bencana-pin',
              html: '<div class="pulse-wrap" style="width:44px;height:44px;opacity:1;">' +
                      '<div class="pulse-ring" style="background:#ea580c;opacity:0.4;"></div>' +
                      '<svg width="28" height="36" viewBox="0 0 28 36" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35));position:relative;">' +
                        '<path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#ea580c" stroke="white" stroke-width="2"/>' +
                        '<polygon points="14,7 20,18 8,18" fill="white"/>' +
                        '<text x="14" y="17" text-anchor="middle" font-size="9" font-weight="900" fill="#ea580c" font-family="sans-serif">!</text>' +
                      '</svg>' +
                    '</div>',
              iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -44]
            });
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

          var agencyMarkers = {};
          var bencanaMarkers = {};

          window.parent.postMessage(JSON.stringify({ type: 'MAP_READY' }), '*');

          window.addEventListener('message', function(event) {
            var data;
            try { data = JSON.parse(event.data); } catch (e) { return; }
            if (!data || !data.type) return;

            if (data.type === 'UPDATE_AGENCIES') {
              var currentIds = data.payload.map(function(a) { return a.id; });
              Object.keys(agencyMarkers).forEach(function(id) {
                if (currentIds.indexOf(id) === -1) {
                  agencyCluster.removeLayer(agencyMarkers[id]);
                  delete agencyMarkers[id];
                }
              });

              var buildAgencyPopup = function(a) {
                var popupDiv = document.createElement('div');
                popupDiv.className = 'custom-popup';

                var strongEl = document.createElement('strong');
                strongEl.textContent = a.agency;
                popupDiv.appendChild(strongEl);

                var subEl = document.createElement('span');
                subEl.className = 'sub';
                subEl.textContent = a.name + ' — ' + a.updated;
                popupDiv.appendChild(subEl);

                if (canManageAgency) {
                  var btnEl = document.createElement('button');
                  btnEl.textContent = 'Padam';
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
                    window.requestDeleteAgencyTracker(a.id);
                  });
                  popupDiv.appendChild(btnEl);
                }

                return popupDiv;
              };
              data.payload.forEach(function(a) {
                var lat = Number(a.lat), lng = Number(a.lng);
                if (!isFinite(lat) || !isFinite(lng)) return;
                a.lat = lat; a.lng = lng;
                if (agencyMarkers[a.id]) {
                  agencyMarkers[a.id].setLatLng([a.lat, a.lng]);
                  agencyMarkers[a.id].setIcon(createAgencyIcon(a.color, a.logo));
                  agencyMarkers[a.id].setPopupContent(buildAgencyPopup(a));
                  agencyMarkers[a.id].setTooltipContent(a.agency);
                } else {
                  agencyMarkers[a.id] = L.marker([a.lat, a.lng], { icon: createAgencyIcon(a.color, a.logo) })
                    .bindPopup(buildAgencyPopup(a))
                    .bindTooltip(a.agency, { direction: 'top', offset: [0, -20], className: 'agency-name-tooltip' });
                  agencyCluster.addLayer(agencyMarkers[a.id]);
                }
              });

            } else if (data.type === 'FOCUS_AGENCY') {
              var marker = agencyMarkers[data.id];
              if (marker) {
                map.setView(marker.getLatLng(), Math.max(map.getZoom(), 16), { animate: true });
                marker.openPopup();
              } else if (data.lat && data.lng) {
                map.setView([data.lat, data.lng], Math.max(map.getZoom(), 16), { animate: true });
              }
            } else if (data.type === 'UPDATE_BENCANA') {
              var currentBencanaIds = data.payload.map(function(b) { return b.id; });
              Object.keys(bencanaMarkers).forEach(function(id) {
                if (currentBencanaIds.indexOf(id) === -1) {
                  bencanaCluster.removeLayer(bencanaMarkers[id]);
                  delete bencanaMarkers[id];
                }
              });

              data.payload.forEach(function(b) {
                if (!bencanaMarkers[b.id]) {
                  var popupDiv = document.createElement('div');
                  popupDiv.className = 'custom-popup';

                  var strongEl = document.createElement('strong');
                  strongEl.textContent = b.category;
                  popupDiv.appendChild(strongEl);

                  var descEl = document.createElement('span');
                  descEl.className = 'sub';
                  descEl.textContent = b.description || 'Tiada keterangan';
                  popupDiv.appendChild(descEl);

                  if (b.created_at) {
                    var timeEl = document.createElement('span');
                    timeEl.className = 'bencana-time';
                    timeEl.textContent = formatTimeAgo(b.created_at);
                    popupDiv.appendChild(timeEl);
                  }

                  if (canDeleteBencana) {
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
                      window.requestResolveBencana(b.id);
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
                      window.requestDeleteBencana(b.id);
                    });
                    popupDiv.appendChild(btnEl);
                  }

                  bencanaMarkers[b.id] = L.marker([b.lat, b.lng], { icon: createBencanaIcon() })
                    .bindPopup(popupDiv);
                  bencanaCluster.addLayer(bencanaMarkers[b.id]);
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