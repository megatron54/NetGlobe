use serde::{Deserialize, Serialize};
use std::net::IpAddr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeoLocation {
    pub lat: f64,
    pub lng: f64,
    pub country: String,
    pub city: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Connection {
    pub id: String,
    pub dst_ip: String,
    pub protocol: String,
    pub port: u16,
    pub location: GeoLocation,
    pub bytes: u64,
    pub packets: u64,
    pub timestamp: u64,
}

pub struct GeoIpResolver {
    reader: maxminddb::Reader<Vec<u8>>,
}

impl GeoIpResolver {
    pub fn new(db_path: &str) -> Result<Self, String> {
        let reader = maxminddb::Reader::open_readfile(db_path)
            .map_err(|e| format!("Failed to open GeoIP database: {}", e))?;
        Ok(Self { reader })
    }

    pub fn lookup(&self, ip: IpAddr) -> Option<GeoLocation> {
        let result: Result<maxminddb::geoip2::City, _> = self.reader.lookup(ip);
        match result {
            Ok(city) => {
                let location = city.location.as_ref()?;
                let lat = location.latitude?;
                let lng = location.longitude?;
                let country = city
                    .country
                    .as_ref()
                    .and_then(|c| c.names.as_ref())
                    .and_then(|n| n.get("en"))
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| "Unknown".to_string());
                let city_name = city
                    .city
                    .as_ref()
                    .and_then(|c| c.names.as_ref())
                    .and_then(|n| n.get("en"))
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| "Unknown".to_string());
                Some(GeoLocation {
                    lat,
                    lng,
                    country,
                    city: city_name,
                })
            }
            Err(_) => None,
        }
    }
}
