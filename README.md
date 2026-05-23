# NetGlobe

Real-time 3D network traffic visualization globe. See where your data goes, live.

## Features

- **Live packet capture** - Monitors your network traffic in real-time
- **3D interactive globe** - Futuristic visualization with animated arcs
- **GeoIP resolution** - Maps destination IPs to real-world locations
- **Protocol coloring** - HTTPS (cyan), DNS (amber), UDP (purple), TCP (green)
- **Stats dashboard** - Active connections, bandwidth, top destinations
- **One-click app** - No configuration needed, just launch

## Tech Stack

- **Backend:** Rust + Tauri v2 + pcap + MaxMind GeoLite2
- **Frontend:** React + TypeScript + Three.js + Tailwind CSS
- **Rendering:** Custom GLSL shaders, bloom post-processing

## Prerequisites

- [Npcap](https://npcap.com/) installed (Windows) for packet capture
- GeoLite2-City.mmdb in `src-tauri/resources/` (download from [here](https://github.com/P3TERX/GeoLite.mmdb/releases))

## Development

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

## License

MIT
