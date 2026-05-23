export interface GeoLocation {
  lat: number;
  lng: number;
  country: string;
  city: string;
}

export interface Connection {
  id: string;
  dst_ip: string;
  protocol: string;
  port: number;
  location: GeoLocation;
  bytes: number;
  packets: number;
  timestamp: number;
}

export interface OriginLocation {
  ip: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
}

export interface Stats {
  totalConnections: number;
  activeConnections: number;
  totalBytes: number;
  packetsPerSecond: number;
  topCountries: { country: string; count: number }[];
}
