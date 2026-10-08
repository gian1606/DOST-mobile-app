import { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
// ─── Web-platform map (Expo Web / browser) ────────────────────────────────────
// srcDoc iframes block CDN scripts (null origin). Instead, mount a div and init
// mapboxgl directly in the DOM — same pattern as the web app's MapView.jsx.
function WebMapCard({ mapData, routeStops, routeColor = '#1976D2', height = 300 }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  const STATUS_COLOR = {
    FULL: '#DC2626', EMPTY: '#2E7D32', QUEUED: '#7C3AED',
    PENDING: '#D97706', COLLECTED: '#1976D2',
  };

  // Load Mapbox GL JS from CDN and init map once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function initMap() {
      if (!containerRef.current || mapRef.current) return;
      /* global mapboxgl */
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [121.0583, 13.7565],
        zoom: 13,
      });
      map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      // Set mapRef immediately so downstream effects can detect the instance
      mapRef.current = map;
      // Notify subscribers that the map is ready to receive data
      map.on('load', () => {
        // Trigger a re-render so the marker/route effects re-run with a non-null map
        setMapReady(true);
      });
    }

    if (!document.getElementById('mapbox-css-mobile')) {
      const link = document.createElement('link');
      link.id   = 'mapbox-css-mobile';
      link.rel  = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      document.head.appendChild(link);
    }

    if (window.mapboxgl) {
      initMap();
    } else {
      const script  = document.createElement('script');
      script.src    = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Plot markers whenever mapData changes OR map becomes ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const plot = () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      const lngLats = [];

      (mapData || []).forEach(bin => {
        const lng = parseFloat(bin.longitude ?? bin.lng);
        const lat = parseFloat(bin.latitude  ?? bin.lat);
        if (isNaN(lng) || isNaN(lat)) return;

        if (bin.is_depot) {
          const el = document.createElement('div');
          el.textContent = '🏭';
          el.style.cssText = 'width:32px;height:32px;border-radius:8px;background:#D97706;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
          markersRef.current.push(
            new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map)
          );
          return;
        }

        lngLats.push([lng, lat]);
        const status = String(bin.status || 'EMPTY').toUpperCase();
        const color  = STATUS_COLOR[status] || '#9E9E9E';

        // Stable 1px anchor so the marker never drifts on layout reflow
        const anchor = document.createElement('div');
        anchor.style.cssText = 'width:1px;height:1px;overflow:visible;pointer-events:none;';

        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:absolute;bottom:0;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;cursor:pointer;pointer-events:auto;';

        const dot = document.createElement('div');
        dot.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);transition:transform 0.15s;pointer-events:none;`;

        const label = document.createElement('div');
        label.textContent = bin.name || 'Bin';
        label.style.cssText = 'margin-top:3px;background:rgba(255,255,255,0.96);border-radius:4px;padding:2px 6px;font-size:9px;font-family:sans-serif;font-weight:700;color:#0D1F1A;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.2);pointer-events:none;';

        wrap.onmouseenter = () => { dot.style.transform = 'scale(1.7)'; };
        wrap.onmouseleave = () => { dot.style.transform = 'scale(1)'; };
        wrap.onclick = () => map.flyTo({ center: [lng, lat], zoom: 16, speed: 0.9 });

        wrap.appendChild(dot);
        wrap.appendChild(label);
        anchor.appendChild(wrap);

        markersRef.current.push(
          new mapboxgl.Marker({ element: anchor, anchor: 'center' }).setLngLat([lng, lat]).addTo(map)
        );
      });

      if (lngLats.length > 0) {
        const bounds = lngLats.reduce(
          (b, c) => b.extend(c),
          new mapboxgl.LngLatBounds(lngLats[0], lngLats[0])
        );
        map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 600 });
      }
    };

    // Map is already loaded (mapReady=true), so call plot directly
    plot();
  }, [mapData, mapReady]); // eslint-disable-line

  // Draw route line whenever routeStops changes OR map becomes ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const draw = async () => {
      ['route-line-web', 'route-glow-web'].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
      if (map.getSource('route-web')) map.removeSource('route-web');

      const stops = (routeStops || []).filter(
        s => !isNaN(parseFloat(s.lat)) && !isNaN(parseFloat(s.lng))
      );
      console.log('[WebMapCard] drawRoute stops:', stops.length, stops[0], stops[stops.length-1]);
      if (stops.length < 2) return;

      const coordStr = stops.slice(0, 25)
        .map(s => `${parseFloat(s.lng).toFixed(6)},${parseFloat(s.lat).toFixed(6)}`)
        .join(';');
      try {
        const res  = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordStr}` +
          `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
        );
        const data = await res.json();
        if (!data.routes?.[0]) return;
        const coords = data.routes[0].geometry.coordinates;
        const color  = routeColor || '#1976D2';
        map.addSource('route-web', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({ id: 'route-glow-web', type: 'line', source: 'route-web', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': color, 'line-width': 10, 'line-opacity': 0.15 } });
        map.addLayer({ id: 'route-line-web', type: 'line', source: 'route-web', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': color, 'line-width': 4,  'line-opacity': 0.9  } });
      } catch (_) {}
    };

    // Map is already loaded (mapReady=true), call draw directly
    draw();
  }, [routeStops, routeColor, mapReady]); // eslint-disable-line

  return (
    <View style={[styles.card, { height: height + 36 }]}>
      {/* Plain div — mapboxgl mounts directly here, no iframe */}
      <div ref={containerRef} style={{ width: '100%', height, display: 'block' }} />
      <View style={styles.footer}>
        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.footerText}>Batangas City — Live Waste Map</Text>
      </View>
    </View>
  );
}

// Safely import WebView — won't exist in plain Expo Go
let WebView = null;
let webViewAvailable = false;
try {
  if (Platform.OS !== 'web') {
    const mod = require('react-native-webview');
    WebView = mod.WebView;
    webViewAvailable = !!WebView;
  }
} catch (_) {
  webViewAvailable = false;
}

function buildMapboxHTML(token) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'><\/script>
  <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #D6EAE0;
      /* Force a real layout size so the GL canvas never inits at 0x0 */
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
    }
    #map {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100%;
      height: 100%;
    }

    /* ── Diagnostic overlay (only shown on WebGL/init failure) ── */
    #diag {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      background: #D6EAE0;
      font-family: sans-serif;
      color: #374151;
      text-align: center;
      padding: 24px;
      z-index: 999;
    }
    #diag h3 { margin-bottom: 8px; font-size: 15px; }
    #diag p  { font-size: 11px; color: #6B7280; word-break: break-word; }

    /* ── Bin marker ──
       IMPORTANT: the element passed to new mapboxgl.Marker({element}) must
       have a FIXED, STABLE size.  Mapbox reads it once at creation and
       positions it so that the "anchor" point sits on the map coordinate.
       If the element changes size (due to flexbox re-layout, scale, etc.)
       Mapbox does NOT re-read the size — the pin appears to drift.

       Solution:
       • outer (.bin-marker-anchor) — 1×1 px transparent box, anchor:"center"
         This is what Mapbox moves and its size never changes.
       • inner (.bin-marker-wrap) — the visible dot+label, absolutely
         positioned so it can't affect the outer box's dimensions.
    ── */
    .bin-marker-anchor {
      width: 1px;
      height: 1px;
      overflow: visible;
      pointer-events: none;
    }
    .bin-marker-wrap {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: auto;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      cursor: pointer;
    }
    .bin-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      background: #9E9E9E;
    }
    .bin-label {
      margin-top: 3px;
      background: rgba(255,255,255,0.96);
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 9px;
      font-family: sans-serif;
      font-weight: 700;
      color: #0D1F1A;
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      pointer-events: none;
    }

    /* ── Depot marker ── */
    .depot-marker {
      width: 36px;
      height: 36px;
      background: #D97706;
      border-radius: 10px;
      border: 2.5px solid #fff;
      box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      line-height: 1;
      touch-action: manipulation;
    }

    /* ── Legend ── */
    #legend {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(255,255,255,0.93);
      border-radius: 8px;
      padding: 7px 10px;
      font-family: sans-serif;
      font-size: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.14);
      z-index: 10;
      display: none;
      pointer-events: none;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      gap: 5px;
    }
    .legend-item:last-child { margin-bottom: 0; }
    .legend-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="legend"></div>
  <div id="diag">
    <h3>Map failed to load</h3>
    <p id="diag-msg"></p>
  </div>

  <script>
    function post(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(msg);
      }
    }

    function showDiag(message) {
      var d = document.getElementById('diag');
      var m = document.getElementById('diag-msg');
      m.textContent = message;
      d.style.display = 'flex';
      post('MAP_ERROR:' + message);
    }

    // Catch any uncaught error early (helps diagnose blank-screen cases)
    window.addEventListener('error', function(e) {
      showDiag('JS error: ' + (e && e.message ? e.message : 'unknown'));
    });

    mapboxgl.accessToken = '${token}';

    // ── WebGL support check ──────────────────────────────────────────────
    if (!mapboxgl.supported()) {
      showDiag('WebGL is not supported in this WebView. Ensure the WebView ' +
                'has androidLayerType="hardware" and hardware acceleration ' +
                'is enabled for the app.');
      throw new Error('mapboxgl not supported');
    }

    const STATUS_COLORS = {
      FULL:      '#DC2626',
      EMPTY:     '#2E7D32',
      QUEUED:    '#7C3AED',
      PENDING:   '#D97706',
      COLLECTED: '#1976D2',
    };

    const STATUS_LABELS = {
      FULL:      'Full',
      EMPTY:     'Empty',
      QUEUED:    'Queued',
      PENDING:   'Pending',
      COLLECTED: 'Collected',
    };

    let map;
    try {
      map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [121.0583, 13.7565],
        zoom: 13,
        // Avoid Android WebView issues with certain antialiasing/context configs
        antialias: false,
        failIfMajorPerformanceCaveat: false,
      });
    } catch (err) {
      showDiag('Map init threw: ' + String(err));
    }

    if (map) {
      map.on('error', function(e) {
        showDiag('Mapbox error: ' + (e && e.error ? String(e.error.message || e.error) : 'unknown'));
      });

      map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    }

    let currentMarkers = [];
    let routeLayerAdded = false;

    // ── updateMap(bins) ──────────────────────────────────────────────────────
    function updateMap(bins) {
      if (!map) return;
      currentMarkers.forEach((m) => m.remove());
      currentMarkers = [];

      const presentStatuses = new Set();
      var binLngLats = []; // collect non-depot coords for fitBounds

      bins.forEach(function(bin) {
        var lng = parseFloat(bin.longitude != null ? bin.longitude : bin.lng);
        var lat = parseFloat(bin.latitude  != null ? bin.latitude  : bin.lat);
        if (isNaN(lng) || isNaN(lat)) return;

        if (bin.is_depot) {
          var depotEl = document.createElement('div');
          depotEl.className = 'depot-marker';
          depotEl.textContent = '🏭';
          var m = new mapboxgl.Marker({ element: depotEl, anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(map);
          currentMarkers.push(m);
          return; // don't add depot to binLngLats — it's far east
        }

        binLngLats.push([lng, lat]);

        var status = String(bin.status || 'EMPTY').toUpperCase();
        var color  = STATUS_COLORS[status] || '#9E9E9E';
        presentStatuses.add(status);

        var anchor = document.createElement('div');
        anchor.className = 'bin-marker-anchor';

        var wrap = document.createElement('div');
        wrap.className = 'bin-marker-wrap';

        var dotEl = document.createElement('div');
        dotEl.className = 'bin-dot';
        dotEl.style.background = color;

        var labelEl = document.createElement('div');
        labelEl.className = 'bin-label';
        labelEl.textContent = bin.name || 'Bin';

        wrap.appendChild(dotEl);
        wrap.appendChild(labelEl);
        anchor.appendChild(wrap);

        var marker = new mapboxgl.Marker({ element: anchor, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map);

        function flyToMarker(e) {
          e.preventDefault();
          e.stopPropagation();
          map.flyTo({ center: [lng, lat], zoom: 16, speed: 0.9 });
        }
        wrap.addEventListener('touchend',  flyToMarker, { passive: false });
        wrap.addEventListener('click',     flyToMarker);

        currentMarkers.push(marker);
      });

      // Auto-fit to show all bin markers (not the far-east depot)
      if (binLngLats.length > 0) {
        var bounds = binLngLats.reduce(function(b, coord) {
          return b.extend(coord);
        }, new mapboxgl.LngLatBounds(binLngLats[0], binLngLats[0]));
        map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 600 });
      }

      renderLegend(presentStatuses);
    }

    // ── updateRoute(stops, color) ────────────────────────────────────────────
    var routeDrawing = false; // prevent concurrent calls racing on addSource
    async function updateRoute(stops, color) {
      if (!map) return;
      if (routeDrawing) return; // already drawing, skip duplicate call
      routeDrawing = true;
      removeRouteLayer();
      if (!stops || stops.length < 2) { routeDrawing = false; return; }

      // Keep all valid stops — depot is included so the route line visually
      // starts and ends at the waste facility (San Jose Sico).
      var binStops = stops.filter(function(s) {
        var lng = parseFloat(s.lng);
        var lat = parseFloat(s.lat);
        return !isNaN(lng) && !isNaN(lat);
      });
      if (binStops.length < 2) { routeDrawing = false; return; }

      post('ROUTE_DEBUG:stops=' + binStops.length + ' first=' + JSON.stringify(binStops[0]) + ' last=' + JSON.stringify(binStops[binStops.length-1]));

      var routeColor = color || '#1976D2';
      var CHUNK = 25;
      var allCoords = [];

      try {
        for (var i = 0; i < binStops.length; i += (CHUNK - 1)) {
          var chunk = binStops.slice(i, i + CHUNK);
          if (chunk.length < 2) break;

          var coordStr = chunk
            .map(function(s) {
              return parseFloat(s.lng).toFixed(6) + ',' + parseFloat(s.lat).toFixed(6);
            })
            .join(';');

          var url = 'https://api.mapbox.com/directions/v5/mapbox/driving/'
            + coordStr
            + '?geometries=geojson&overview=full&access_token=${token}';

          var resp = await fetch(url);
          if (!resp.ok) {
            post('ROUTE_DEBUG:fetch_err=' + resp.status + ' ' + await resp.text().catch(()=>''));
            continue;
          }
          var data = await resp.json();
          if (!data.routes || !data.routes[0]) {
            post('ROUTE_DEBUG:no_route_in_response code=' + (data.code||'?') + ' msg=' + (data.message||'?'));
            continue;
          }

          var segCoords = data.routes[0].geometry.coordinates;
          if (allCoords.length > 0) {
            allCoords = allCoords.concat(segCoords.slice(1));
          } else {
            allCoords = segCoords.slice();
          }
        }

        post('ROUTE_DEBUG:allCoords.length=' + allCoords.length);
        if (allCoords.length < 2) { routeDrawing = false; return; }

        // Remove stale layers/source one more time right before adding
        removeRouteLayer();

        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: allCoords },
          },
        });

        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': routeColor, 'line-width': 10, 'line-opacity': 0.15 },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': routeColor, 'line-width': 4, 'line-opacity': 0.9 },
        });

        routeLayerAdded = true;
        post('ROUTE_DEBUG:drawn_ok');
      } catch (err) {
        post('ROUTE_DEBUG:exception=' + String(err));
        console.error('Route draw error:', String(err));
      }
      routeDrawing = false;
    }

    function removeRouteLayer() {
      if (!map) return;
      try {
        if (map.getLayer('route-line')) map.removeLayer('route-line');
        if (map.getLayer('route-glow')) map.removeLayer('route-glow');
        if (map.getSource('route'))     map.removeSource('route');
      } catch (_) {}
      routeLayerAdded = false;
    }

    // ── Legend ───────────────────────────────────────────────────────────────
    function renderLegend(statusSet) {
      var el = document.getElementById('legend');
      if (statusSet.size === 0) { el.style.display = 'none'; return; }
      el.innerHTML = '';
      statusSet.forEach(function(status) {
        var color = STATUS_COLORS[status] || '#9E9E9E';
        var label = STATUS_LABELS[status] || status;
        var item  = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML =
          '<div class="legend-dot" style="background:' + color + '"></div>' +
          '<span>' + label + '</span>';
        el.appendChild(item);
      });
      el.style.display = 'block';
    }

    // Exposed for RN-triggered relayout (fixes 0x0-canvas-at-init cases)
    function forceResize() {
      if (map) {
        try { map.resize(); } catch (_) {}
      }
    }
    window.forceResize = forceResize;

    // ── Signal map ready ─────────────────────────────────────────────────────
    if (map) {
      var readyFired = false;
      function signalReady() {
        if (readyFired) return;
        readyFired = true;
        setTimeout(function() {
          forceResize();
          post('MAP_READY');
        }, 100);
      }
      // Fire on idle (first time map fully renders) for reliability on Android
      map.once('idle', signalReady);
      // Fallback: also fire on load in case idle doesn't fire
      map.on('load', function() { setTimeout(signalReady, 200); });
    }
  <\/script>
</body>
</html>`;
}

const mapboxHTML = buildMapboxHTML(MAPBOX_TOKEN);

// ─── MapCard component ────────────────────────────────────────────────────────
export default function MapCard({
  mapData,
  routeStops,
  routeColor = '#1976D2',
  height = 300,
}) {
  const webviewRef  = useRef(null);
  const mapReadyRef = useRef(false);
  const pendingRef  = useRef(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [diagMessage, setDiagMessage] = useState(null);

  function inject(bins, stops, color) {
    if (!webviewRef.current) return;
    const binsJSON  = JSON.stringify(bins  || []);
    const stopsJSON = JSON.stringify(stops || []);
    const colorJSON = JSON.stringify(color || '#1976D2');
    const script = `(function(){try{updateMap(${binsJSON});${
      stops && stops.length >= 2
        ? `updateRoute(${stopsJSON},${colorJSON});`
        : 'removeRouteLayer();'
    }}catch(e){console.error('inject:',String(e));}})();true;`;
    webviewRef.current.injectJavaScript(script);
  }

  function handleMessage(event) {
    const data = event.nativeEvent.data;

    if (data === 'MAP_READY') {
      mapReadyRef.current = true;
      if (pendingRef.current) {
        const { bins, stops, color } = pendingRef.current;
        pendingRef.current = null;
        // Give the map a moment to fully settle after 'load' fires
        setTimeout(() => inject(bins, stops, color), 150);
      }
      return;
    }

    if (typeof data === 'string' && data.startsWith('MAP_ERROR:')) {
      console.warn('[MapCard] WebGL/Mapbox init failed:', data);
      setDiagMessage(data.replace('MAP_ERROR:', ''));
    }

    if (typeof data === 'string' && data.startsWith('ROUTE_DEBUG:')) {
      console.log('[MapCard Route]', data.replace('ROUTE_DEBUG:', ''));
    }
  }

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const bins  = Array.isArray(mapData)    ? mapData    : [];
    const stops = Array.isArray(routeStops) ? routeStops : [];
    const color = routeColor || '#1976D2';

    if (mapReadyRef.current) {
      // Map already ready — inject immediately, then retry once after a short
      // delay as a safety net in case the first inject races with a style reload
      inject(bins, stops, color);
      setTimeout(() => inject(bins, stops, color), 300);
    } else {
      // Always overwrite pendingRef so the latest data wins when MAP_READY fires
      pendingRef.current = { bins, stops, color };
    }
  }, [mapData, routeStops, routeColor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-trigger a resize once RN has settled layout, as a second safety net
  // against the "container was 0x0 when the map initialized" failure mode.
  function handleLayout() {
    if (webviewRef.current && mapReadyRef.current) {
      webviewRef.current.injectJavaScript(
        '(function(){try{window.forceResize && window.forceResize();}catch(e){}})();true;'
      );
    }
  }

  if (Platform.OS === 'web') {
    return (
      <WebMapCard
        mapData={mapData}
        routeStops={routeStops}
        routeColor={routeColor}
        height={height}
      />
    );
  }

  // Native but WebView not linked (plain Expo Go) — show a clear fallback
  if (!webViewAvailable) {
    return (
      <View style={[styles.card, styles.fallback, { height: height + 36 }]}>
        <Ionicons name="map-outline" size={36} color="#9CA3AF" />
        <Text style={styles.fallbackTitle}>Map not available</Text>
        <Text style={styles.fallbackText}>
          Build the dev client APK to enable the live map.{'\n'}
          Run: <Text style={styles.fallbackCode}>eas build --profile development</Text>
        </Text>
      </View>
    );
  }

  // WebView itself failed to load (no network, DNS, etc.)
  if (loadFailed) {
    return (
      <View style={[styles.card, styles.fallback, { height: height + 36 }]}>
        <Ionicons name="cloud-offline-outline" size={36} color="#9CA3AF" />
        <Text style={styles.fallbackTitle}>Map failed to load</Text>
        <Text style={styles.fallbackText}>
          Check your internet connection and try again.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card} onLayout={handleLayout}>
      {/*
        FIX 1: androidLayerType="hardware" — this is the primary fix for
        blank/green WebGL canvases inside react-native-webview on Android.
        Without it, Chromium's WebView frequently fails to composite GL
        canvases even though the JS-side map object initializes fine.

        FIX 2: Do NOT use overflow:hidden on this container — it clips
        the WebView to zero on Android when combined with borderRadius.
        borderRadius is applied only on the outer `card` style below.
      */}
      <View style={{ height, width: '100%' }}>
        <WebView
          ref={webviewRef}
          source={{ html: mapboxHTML }}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mixedContentMode="always"
          androidLayerType="hardware"
          setSupportMultipleWindows={false}
          overScrollMode="never"
          style={{ flex: 1, width: '100%', height }}
          scrollEnabled={false}
          onMessage={handleMessage}
          onError={() => setLoadFailed(true)}
          onHttpError={() => setLoadFailed(true)}
          renderError={() => null /* handled by loadFailed state above */}
        />
      </View>
      {diagMessage ? (
        <View style={styles.diagBanner}>
          <Text style={styles.diagText} numberOfLines={2}>
            Map issue: {diagMessage}
          </Text>
        </View>
      ) : null}
      <View style={styles.footer}>
        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.footerText}>Batangas City — Live Waste Map</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: '#D6EAE0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: colors.secondary ?? '#fff',
  },
  footerText: { fontSize: typography.size.xs, color: colors.textSecondary },
  diagBanner: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  diagText: {
    fontSize: 10,
    color: '#92400E',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    gap: 10,
    padding: 20,
  },
  fallbackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  fallbackText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  fallbackCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
});