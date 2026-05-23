mod aggregator;
mod capture;
mod geoip;

use aggregator::Aggregator;
use geoip::GeoIpResolver;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{Emitter, Manager};

#[derive(Debug, Serialize, Deserialize)]
struct IpInfo {
    ip: String,
    loc: Option<String>,
    city: Option<String>,
    country: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OriginLocation {
    pub ip: String,
    pub lat: f64,
    pub lng: f64,
    pub city: String,
    pub country: String,
}

#[tauri::command]
async fn get_origin_location() -> Result<OriginLocation, String> {
    let resp: IpInfo = reqwest::get("https://ipinfo.io/json")
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let (lat, lng) = resp
        .loc
        .as_ref()
        .and_then(|loc| {
            let parts: Vec<&str> = loc.split(',').collect();
            if parts.len() == 2 {
                Some((
                    parts[0].parse::<f64>().unwrap_or(0.0),
                    parts[1].parse::<f64>().unwrap_or(0.0),
                ))
            } else {
                None
            }
        })
        .unwrap_or((0.0, 0.0));

    Ok(OriginLocation {
        ip: resp.ip,
        lat,
        lng,
        city: resp.city.unwrap_or_else(|| "Unknown".to_string()),
        country: resp.country.unwrap_or_else(|| "Unknown".to_string()),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_origin_location])
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Load GeoIP database from resources
            let resource_path = app
                .path()
                .resource_dir()
                .expect("failed to get resource dir")
                .join("resources")
                .join("GeoLite2-City.mmdb");

            let geoip_path = resource_path.to_string_lossy().to_string();

            // Start capture in background
            std::thread::spawn(move || {
                match GeoIpResolver::new(&geoip_path) {
                    Ok(resolver) => {
                        let geoip = Arc::new(resolver);
                        let aggregator = Aggregator::new();
                        aggregator.start(app_handle, geoip);
                    }
                    Err(e) => {
                        eprintln!("GeoIP init failed: {}", e);
                        let _ = app_handle.emit("capture-error", format!("GeoIP failed: {}", e));
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
