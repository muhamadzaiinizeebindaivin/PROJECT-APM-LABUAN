// src/screen/sekretariatMapTemplate.js

/**
 * Builds the Leaflet map HTML shown inside the Sekretariat web <iframe>.
 * Mirrors the structure/style of operasiMapTemplate.js exactly:
 *  - Single <script> tag, no duplication.
 *  - maxZoom set directly on the map (required by Leaflet.markercluster).
 *  - Map init deferred until window 'load' to avoid forced-layout warnings.
 *  - Bencana points are clustered (they can pile up over time); agency
 *    member markers are left unclustered since they move via live tracking.
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
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
        <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
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

          .cluster-badge { display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff; font-weight: 800; font-family: sans-serif; box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 2px solid white; }
          .cluster-bencana { background-color: #ea580c; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var canDeleteBencana = ${userRole === 'admin' || userRole === 'sekretariat' ? 'true' : 'false'};

          function initMap() {
          var map = L.map('map', { zoomControl: false, attributionControl: false, maxZoom: 19 }).setView([5.2831, 115.2308], 12);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
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

          // Agences en ligne : non clusterisées (position en direct, comme les véhicules d'Operasi)
          var agencyLayer = L.layerGroup().addTo(map);

          // Bencana : clusterisés (peuvent s'accumuler avec le temps)
          var bencanaCluster = L.markerClusterGroup({
            maxClusterRadius: 60,
            spiderfyOnMaxZoom: true,
            iconCreateFunction: makeClusterIcon('cluster-bencana')
          }).addTo(map);

          var createAgencyIcon = (color) => L.divIcon({
            className: 'custom-pin',
            html: '<svg width="26" height="34" viewBox="0 0 26 34" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">' +
                    '<path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="' + color + '" fill-opacity="0.72" stroke="white" stroke-width="2"/>' +
                    '<circle cx="13" cy="13" r="5" fill="white" fill-opacity="0.9"/>' +
                  '</svg>',
            iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30]
          });

          var createBencanaIcon = () => L.divIcon({
            className: 'bencana-pin',
            html: '<svg width="28" height="36" viewBox="0 0 28 36" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">' +
                    '<path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#ea580c" stroke="white" stroke-width="2"/>' +
                    '<polygon points="14,7 20,18 8,18" fill="white"/>' +
                    '<text x="14" y="17" text-anchor="middle" font-size="9" font-weight="900" fill="#ea580c" font-family="sans-serif">!</text>' +
                  '</svg>',
            iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -34]
          });

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

          window.addEventListener('message', function(event) {
            var data = JSON.parse(event.data);

            if (data.type === 'UPDATE_AGENCIES') {
              var currentIds = data.payload.map(function(a) { return a.id; });
              Object.keys(agencyMarkers).forEach(function(id) {
                if (currentIds.indexOf(id) === -1) {
                  agencyLayer.removeLayer(agencyMarkers[id]);
                  delete agencyMarkers[id];
                }
              });

              data.payload.forEach(function(a) {
                var popupContent = '<div class="custom-popup"><strong>' + a.agency + '</strong><span class="sub">' + a.name + ' — ' + a.updated + '</span></div>';
                if (agencyMarkers[a.id]) {
                  agencyMarkers[a.id].setLatLng([a.lat, a.lng]).setPopupContent(popupContent);
                } else {
                  agencyMarkers[a.id] = L.marker([a.lat, a.lng], { icon: createAgencyIcon(a.color) })
                    .bindPopup(popupContent);
                  agencyLayer.addLayer(agencyMarkers[a.id]);
                }
              });

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