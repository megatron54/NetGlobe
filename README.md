# NetGlobe

Real-time 3D network traffic visualization. Captures live packets, resolves their geographic destinations via GeoIP, and renders animated arcs on an interactive globe.

## Overview

NetGlobe is a desktop application that monitors your network interface and maps outbound connections to their real-world geographic locations. Each connection appears as an animated arc from your origin to the destination server, color-coded by protocol.

**Architecture:**
- **Backend:** Rust (Tauri v2) — packet capture via libpcap, IP geolocation via MaxMind GeoLite2, batched event emission
- **Frontend:** React + TypeScript + globe.gl — interactive WebGL globe with live-updating arcs, connection list, and traffic statistics

## Features

- Live packet capture with automatic network interface detection
- GeoIP resolution mapping destination IPs to coordinates
- Protocol classification (HTTPS, HTTP, DNS, UDP, TCP) with color coding
- Animated arc visualization showing active connections in real-time
- Connection list with destination IP, location, protocol, and data volume
- Traffic statistics: active connections, bandwidth, packets/sec, top countries
- Origin detection via ipinfo.io
- Graceful fallback to demo mode when capture is unavailable

## Requirements

- [Npcap](https://npcap.com/) (Windows) — required for packet capture
- [GeoLite2-City.mmdb](https://github.com/P3TERX/GeoLite.mmdb/releases) — place in `src-tauri/resources/`

## Development

```bash
npm install
npm run tauri dev
```

## Production Build

```bash
npm run tauri build
```

The installer bundles the GeoIP database from `src-tauri/resources/`.

## Project Structure

```
src/                      Frontend (React + TypeScript)
├── App.tsx               Root layout and state orchestration
├── components/
│   ├── GlobeView.tsx     Globe initialization, arc/point updates
│   ├── ConnectionList.tsx Sidebar with live connection entries
│   └── StatsPanel.tsx    Traffic metrics overlay
├── hooks/
│   └── useTraffic.ts     Tauri event subscription, state management
├── lib/
│   └── protocol.ts       Protocol classification, color mapping, formatters
└── styles/
    └── index.css         Base styles + Tailwind

src-tauri/                Backend (Rust)
├── src/
│   ├── lib.rs            Tauri setup, origin resolution command
│   ├── capture.rs        Packet capture (pcap + pnet parsing)
│   ├── geoip.rs          MaxMind GeoIP resolver
│   └── aggregator.rs     Connection aggregation, batched event emission
└── resources/
    └── GeoLite2-City.mmdb  (user-provided)
```

## Protocol Colors

| Protocol | Color |
|----------|-------|
| HTTPS (443) | Sky blue |
| DNS (53) | Amber |
| UDP | Violet |
| TCP | Emerald |

## License

MIT
