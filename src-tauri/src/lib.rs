mod aggregator;
mod capture;
mod geoip;

use geoip::GeoIpResolver;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{Emitter, Manager};

#[derive(Debug, Serialize, Deserialize)]
struct IpInfoResponse {
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
    let resp: IpInfoResponse = reqwest::get("https://ipinfo.io/json")
        .await
        .map_err(|e| format!("Network request failed: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

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
        city: resp.city.unwrap_or_else(|| "Unknown".into()),
        country: resp.country.unwrap_or_else(|| "--".into()),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_origin_location])
        .setup(|app| {
            let app_handle = app.handle().clone();

            let resource_path = app
                .path()
                .resource_dir()
                .expect("failed to resolve resource directory")
                .join("resources")
                .join("GeoLite2-City.mmdb");

            let geoip_path = resource_path.to_string_lossy().to_string();

            // Background capture thread
            std::thread::spawn(move || {
                let resolver = match GeoIpResolver::new(&geoip_path) {
                    Ok(r) => Arc::new(r),
                    Err(e) => {
                        let _ = app_handle.emit(
                            "capture-error",
                            format!("GeoIP database not found: {}", e),
                        );
                        return;
                    }
                };

                if let Err(e) = aggregator::run(app_handle.clone(), resolver) {
                    let _ = app_handle.emit("capture-error", e);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to launch application");
}
