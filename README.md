# NetGlobe

Real-time 3D network traffic visualization on an interactive globe. Connections appear as animated arcs from origin to destination, color-coded by protocol.

**[Live Demo](https://megatron54.github.io/NetGlobe/)**

## Overview

NetGlobe visualizes network connections as animated arcs on a 3D globe. Each connection is mapped to its geographic destination and rendered in real-time with protocol-based color coding. The simulation generates realistic traffic patterns demonstrating the visualization capabilities.

## Features

- Interactive 3D globe with high-resolution night-sky earth texture
- Animated arcs showing active connections from origin to destination
- Protocol classification with color coding (HTTPS, DNS, UDP, TCP)
- Live connection list with IP, location, protocol, and data volume
- Traffic statistics panel: active connections, bandwidth, packets/sec
- Top destination countries with visual breakdown
- Smooth orbit controls with damping

## Tech Stack

- **React 19** + TypeScript (strict mode)
- **globe.gl** — WebGL globe rendering with arc/point/ring layers
- **Tailwind CSS 4** — utility-first styling
- **Vite 7** — build tooling
- **GitHub Pages** — static deployment via Actions

## Protocol Colors

| Protocol | Color | Description |
|----------|-------|-------------|
| HTTPS (443) | Sky blue | Encrypted web traffic |
| DNS (53) | Amber | Domain resolution |
| UDP | Violet | User datagram protocol |
| TCP | Emerald | General TCP connections |

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173/NetGlobe/`

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── App.tsx                 Root layout
├── components/
│   ├── GlobeView.tsx       Globe initialization + data binding
│   ├── ConnectionList.tsx  Left sidebar with live entries
│   └── StatsPanel.tsx      Traffic metrics overlay
├── hooks/
│   └── useTraffic.ts       Traffic simulation + state
├── lib/
│   └── protocol.ts         Classification, colors, formatters
└── styles/
    └── index.css           Base styles + Tailwind
```

## Deployment

Automatic via GitHub Actions on push to `master`. Deploys to GitHub Pages.

## License

MIT
