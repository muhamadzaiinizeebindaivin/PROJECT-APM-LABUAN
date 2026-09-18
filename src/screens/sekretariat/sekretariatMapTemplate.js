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
export function buildSekretariatMapHtml({ theme, userRole, pemantauanIconUrl }) {
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
          var canManagePemantauanPoint = ${userRole === 'admin' || userRole === 'sekretariat' || userRole === 'pemantauan' ? 'true' : 'false'};

          function initMap() {
          var map = L.map('map', { zoomControl: false, attributionControl: false, maxZoom: 20 }).setView([5.2831, 115.2308], 12);

          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 20, maxNativeZoom: 19,
            attribution: 'Tiles &copy; Esri'
          }).addTo(map);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
            maxZoom: 20, maxNativeZoom: 19
          }).addTo(map);


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

          window.requestEditBencana = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'EDIT_BENCANA_REQUEST', id: id }), '*');
          };

          window.requestDeleteAgencyTracker = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'DELETE_AGENCY_TRACKER_REQUEST', id: id }), '*');
          };

          window.requestDeletePemantauanPoint = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'DELETE_PEMANTAUAN_POINT_REQUEST', id: id }), '*');
          };

          window.requestEditPemantauanPoint = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'EDIT_PEMANTAUAN_POINT_REQUEST', id: id }), '*');
          };

          window.requestResolvePemantauanPoint = function(id) {
            window.parent.postMessage(JSON.stringify({ type: 'RESOLVE_PEMANTAUAN_POINT_REQUEST', id: id }), '*');
          };

          // Agences en ligne : plus de regroupement — chaque marker est mis à
          // jour sur place (setLatLng) au lieu d'être retiré et recréé.
          var agencyCluster = L.layerGroup().addTo(map);

          // Bencana : plus de regroupement — chaque point s'affiche individuellement
          var bencanaCluster = L.layerGroup().addTo(map);
          var pemantauanCluster = L.layerGroup().addTo(map);
          var PEMANTAUAN_ICON = ${JSON.stringify(pemantauanIconUrl || '')};

          // Chemins SVG (style Lucide) pour une petite icône optionnelle au
          // centre d'un pin d'agence/Pemantauan sans logo.
          var AGENCY_ICON_PATHS = {
            Eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>'
          };

          var createAgencyIcon = (color, logo, noOutline, iconKey) => {
            if (logo) {
              return L.divIcon({
                className: 'custom-pin',
                html: '<div style="opacity:1;width:36px;height:36px;border-radius:8px;background:#fff;border:2px solid ' + color + ';box-shadow:0 2px 5px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;overflow:hidden;">' +
                        '<img src="' + logo + '" style="width:30px;height:30px;object-fit:contain;" />' +
                      '</div>',
                iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20]
              });
            }
            var strokeAttr = noOutline ? '' : 'stroke="white" stroke-width="2"';
            var innerMark = (iconKey && AGENCY_ICON_PATHS[iconKey])
              ? '<g transform="translate(7.5,7.5) scale(0.46)" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + AGENCY_ICON_PATHS[iconKey] + '</g>'
              : '<circle cx="13" cy="13" r="5" fill="white" fill-opacity="0.9"/>';
            return L.divIcon({
              className: 'custom-pin',
              html: '<svg width="26" height="34" viewBox="0 0 26 34" style="opacity:1;filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">' +
                      '<path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="' + color + '" fill-opacity="0.72" ' + strokeAttr + '/>' +
                      innerMark +
                    '</svg>',
              iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30]
            });
          };

          // Chemins SVG (style Lucide, viewBox 24x24, stroke uniquement) pour les
          // icônes de catégorie utilisées sur les points bencana.
          var BENCANA_ICON_PATHS = {
            MapPin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
            Droplets: '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
            Waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
            Mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
            Flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
            Wind: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
            CloudRain: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>',
            Zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
            Siren: '<path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1z"/>'
          };

          var createBencanaIcon = function(iconKey, color) {
            var pinColor = color || '#ea580c';
            var iconInner = BENCANA_ICON_PATHS[iconKey] || BENCANA_ICON_PATHS.MapPin;
            return L.divIcon({
              className: 'bencana-pin',
              html: '<div class="pulse-wrap" style="width:44px;height:44px;opacity:1;">' +
                      '<div class="pulse-ring" style="background:' + pinColor + ';opacity:0.4;"></div>' +
                      '<svg width="28" height="36" viewBox="0 0 28 36" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35));position:relative;">' +
                        '<path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="' + pinColor + '"/>' +
                        '<g transform="translate(7,4) scale(0.58)" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                          iconInner +
                        '</g>' +
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
          var pemantauanPointMarkers = {};
          var markerAnimations = {}; // requestAnimationFrame id per agency, so a new GPS ping can smoothly redirect an in-progress glide

          function animateMarkerTo(id, marker, targetLat, targetLng, duration) {
            if (markerAnimations[id]) cancelAnimationFrame(markerAnimations[id]);
            var start = marker.getLatLng();
            var startTime = performance.now();
            function step(now) {
              var t = Math.min((now - startTime) / duration, 1);
              var eased = 1 - Math.pow(1 - t, 3); // ease-out: fast start, smooth settle
              marker.setLatLng([
                start.lat + (targetLat - start.lat) * eased,
                start.lng + (targetLng - start.lng) * eased
              ]);
              if (t < 1) {
                markerAnimations[id] = requestAnimationFrame(step);
              } else {
                delete markerAnimations[id];
              }
            }
            markerAnimations[id] = requestAnimationFrame(step);
          }

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
                  animateMarkerTo(a.id, agencyMarkers[a.id], a.lat, a.lng, 5000);
                  agencyMarkers[a.id].setIcon(createAgencyIcon(a.color, a.logo, a.noOutline, a.icon));
                  agencyMarkers[a.id].setPopupContent(buildAgencyPopup(a));
                  agencyMarkers[a.id].setTooltipContent(a.agency);
                } else {
                  agencyMarkers[a.id] = L.marker([a.lat, a.lng], { icon: createAgencyIcon(a.color, a.logo, a.noOutline, a.icon) })
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

              var buildBencanaPopup = function(b) {
                var popupDiv = document.createElement('div');
                popupDiv.className = 'custom-popup';

                var strongEl = document.createElement('strong');
                strongEl.textContent = b.categoryLabel || b.category;
                popupDiv.appendChild(strongEl);

                if (b.lokasi) {
                  var lokasiEl = document.createElement('span');
                  lokasiEl.className = 'sub';
                  lokasiEl.textContent = 'Kawasan Terjejas: ' + b.lokasi;
                  popupDiv.appendChild(lokasiEl);
                }

                if (b.pps) {
                  var ppsEl = document.createElement('span');
                  ppsEl.className = 'sub';
                  ppsEl.textContent = 'PPS: ' + b.pps;
                  popupDiv.appendChild(ppsEl);
                }

                var descEl = document.createElement('span');
                descEl.className = 'sub';
                descEl.textContent = b.description ? ('Keterangan: ' + b.description) : 'Tiada keterangan';
                popupDiv.appendChild(descEl);

                if (b.created_at) {
                  var timeEl = document.createElement('span');
                  timeEl.className = 'bencana-time';
                  timeEl.textContent = formatTimeAgo(b.created_at);
                  popupDiv.appendChild(timeEl);
                }

                if (canManagePemantauanPoint) {
                  var editBtnEl = document.createElement('button');
                  editBtnEl.textContent = 'Kemaskini';
                  editBtnEl.style.marginTop = '6px';
                  editBtnEl.style.backgroundColor = '#f97316';
                  editBtnEl.style.color = 'white';
                  editBtnEl.style.border = 'none';
                  editBtnEl.style.padding = '4px 10px';
                  editBtnEl.style.borderRadius = '6px';
                  editBtnEl.style.fontSize = '11px';
                  editBtnEl.style.fontWeight = '700';
                  editBtnEl.style.cursor = 'pointer';
                  editBtnEl.style.width = '100%';
                  editBtnEl.addEventListener('click', function() {
                    window.requestEditBencana(b.id);
                  });
                  popupDiv.appendChild(editBtnEl);

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

                return popupDiv;
              };

              data.payload.forEach(function(b) {
                var popupDiv = buildBencanaPopup(b);
                if (!bencanaMarkers[b.id]) {
                  bencanaMarkers[b.id] = L.marker([b.lat, b.lng], { icon: createBencanaIcon(b.icon, b.color) })
                    .bindPopup(popupDiv);
                  bencanaCluster.addLayer(bencanaMarkers[b.id]);
                } else {
                  bencanaMarkers[b.id].setPopupContent(popupDiv);
                  bencanaMarkers[b.id].setIcon(createBencanaIcon(b.icon, b.color));
                  bencanaMarkers[b.id].setLatLng([b.lat, b.lng]);
                }
              });
            } else if (data.type === 'UPDATE_PEMANTAUAN_POINTS') {
              var currentPemantauanIds = data.payload.map(function(p) { return p.id; });
              Object.keys(pemantauanPointMarkers).forEach(function(id) {
                if (currentPemantauanIds.indexOf(id) === -1) {
                  pemantauanCluster.removeLayer(pemantauanPointMarkers[id]);
                  delete pemantauanPointMarkers[id];
                }
              });

              var buildPemantauanPopup = function(p) {
                var popupDiv = document.createElement('div');
                popupDiv.className = 'custom-popup';

                var strongEl = document.createElement('strong');
                strongEl.textContent = 'Titik Pemantauan';
                popupDiv.appendChild(strongEl);

                var lokasiEl = document.createElement('span');
                lokasiEl.className = 'sub';
                lokasiEl.textContent = 'Lokasi: ' + (p.lokasi || '-');
                popupDiv.appendChild(lokasiEl);

                var rumahEl = document.createElement('span');
                rumahEl.className = 'sub';
                rumahEl.textContent = 'Jumlah Rumah Terjejas: ' + (p.jumlah_rumah_terjejas != null ? p.jumlah_rumah_terjejas : 0);
                popupDiv.appendChild(rumahEl);

                var ppsEl = document.createElement('span');
                ppsEl.className = 'sub';
                ppsEl.textContent = 'PPS: ' + (p.pps || 'TIADA');
                popupDiv.appendChild(ppsEl);

                var agensiEl = document.createElement('span');
                agensiEl.className = 'sub';
                agensiEl.textContent = 'Agensi di Lapangan: ' + (p.agensi_di_lapangan || '-');
                popupDiv.appendChild(agensiEl);

                var airEl = document.createElement('span');
                airEl.className = 'sub';
                airEl.textContent = 'Bacaan Air: ' + (p.bacaan_air || '-');
                popupDiv.appendChild(airEl);

                if (p.created_at) {
                  var timeEl = document.createElement('span');
                  timeEl.className = 'bencana-time';
                  timeEl.textContent = formatTimeAgo(p.created_at);
                  popupDiv.appendChild(timeEl);
                }

                if (canManagePemantauanPoint) {
                  var editBtnEl = document.createElement('button');
                  editBtnEl.textContent = 'Kemaskini';
                  editBtnEl.style.marginTop = '6px';
                  editBtnEl.style.backgroundColor = '#f97316';
                  editBtnEl.style.color = 'white';
                  editBtnEl.style.border = 'none';
                  editBtnEl.style.padding = '4px 10px';
                  editBtnEl.style.borderRadius = '6px';
                  editBtnEl.style.fontSize = '11px';
                  editBtnEl.style.fontWeight = '700';
                  editBtnEl.style.cursor = 'pointer';
                  editBtnEl.style.width = '100%';
                  editBtnEl.addEventListener('click', function() {
                    window.requestEditPemantauanPoint(p.id);
                  });
                  popupDiv.appendChild(editBtnEl);

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
                    window.requestResolvePemantauanPoint(p.id);
                  });
                  popupDiv.appendChild(resolveBtnEl);

                  var delBtnEl = document.createElement('button');
                  delBtnEl.textContent = 'Padam Titik';
                  delBtnEl.style.marginTop = '6px';
                  delBtnEl.style.backgroundColor = '#ef4444';
                  delBtnEl.style.color = 'white';
                  delBtnEl.style.border = 'none';
                  delBtnEl.style.padding = '4px 10px';
                  delBtnEl.style.borderRadius = '6px';
                  delBtnEl.style.fontSize = '11px';
                  delBtnEl.style.fontWeight = '700';
                  delBtnEl.style.cursor = 'pointer';
                  delBtnEl.style.width = '100%';
                  delBtnEl.addEventListener('click', function() {
                    window.requestDeletePemantauanPoint(p.id);
                  });
                  popupDiv.appendChild(delBtnEl);
                }

                return popupDiv;
              };

              data.payload.forEach(function(p) {
                var popupDiv = buildPemantauanPopup(p);
                if (!pemantauanPointMarkers[p.id]) {
                  pemantauanPointMarkers[p.id] = L.marker([p.lat, p.lng], { icon: createAgencyIcon('#eab308', PEMANTAUAN_ICON) })
                    .bindPopup(popupDiv);
                  pemantauanCluster.addLayer(pemantauanPointMarkers[p.id]);
                } else {
                  pemantauanPointMarkers[p.id].setPopupContent(popupDiv);
                  pemantauanPointMarkers[p.id].setIcon(createAgencyIcon('#eab304', PEMANTAUAN_ICON));
                  pemantauanPointMarkers[p.id].setLatLng([p.lat, p.lng]);
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