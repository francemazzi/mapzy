# 🏃‍♂️ Mapzy

> Map your running & cycling workouts on an interactive map.

Mapzy is a small vanilla-JavaScript app: click anywhere on the map, log a
running or cycling workout, and it gets pinned with a marker and saved in your
browser. Reload the page and your workouts are still there.

## Features

- 📍 **Geolocation** — the map centers on your position (with an automatic
  fallback location if permission is denied or unavailable, so the map always
  loads and stays clickable).
- 🏃 **Running & 🚴 cycling** workouts, each with its own metrics (pace &
  cadence / speed & elevation gain).
- 🗺️ **Markers & popups** for every workout on the map.
- 🧭 **Click a workout** in the sidebar to pan the map to its marker.
- ❌ **Delete** a workout — removes it from the list, the map and storage.
- 💾 **Persistence** via `localStorage`: your workouts survive reloads.

## Tech stack

- Vanilla JavaScript (ES classes, private fields, modules-free)
- [Leaflet 1.8](https://leafletjs.com/) (loaded from CDN) with
  [OpenStreetMap](https://www.openstreetmap.org/) tiles
- Browser Geolocation API and `localStorage`
- No build step, no framework

## Run locally

Geolocation requires a *secure context*, so the app must be served over
`http://localhost` (or HTTPS) — opening `index.html` directly from the file
system (`file://`) will not work. The `npm start` script handles this for you:

```bash
git clone https://github.com/francemazzi/mapzy.git
cd mapzy
npm start          # serves the app on http://localhost:3000
```

No install or build step is needed — `npm start` fetches a tiny static server
on the fly. If you prefer not to use Node, any static server works, e.g.:

```bash
python3 -m http.server 3000   # then open http://localhost:3000
```

## Usage

1. Allow (or deny) location access — either way the map appears.
2. **Click on the map** to open the form.
3. Pick a type, fill in distance, duration and pace/elevation, press **OK**.
4. The workout is added to the sidebar and pinned on the map.
5. Click a workout to fly to it, or click **❌** to delete it.

## Requirements

- A modern browser (ES classes & private fields, Geolocation, `localStorage`)
- An internet connection (Leaflet and the map tiles are loaded from CDNs)

> **Note** — the UI labels are in Italian (Tipo, Distanza, Durata…).

## License

[MIT](LICENSE) © FraSma
