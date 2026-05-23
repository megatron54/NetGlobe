use crate::capture::{start_capture, RawConnection};
use crate::geoip::{Connection, GeoIpResolver, GeoLocation};
use std::collections::HashMap;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};

pub struct Aggregator {
    connections: Arc<Mutex<HashMap<String, Connection>>>,
}

impl Aggregator {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn start(&self, app: AppHandle, geoip: Arc<GeoIpResolver>) {
        let (tx, rx) = mpsc::channel::<RawConnection>();
        let connections = self.connections.clone();

        // Start packet capture
        match start_capture(tx) {
            Ok(_) => println!("Packet capture started"),
            Err(e) => {
                eprintln!("Failed to start capture: {}", e);
                // Emit error to frontend
                let _ = app.emit("capture-error", e);
                return;
            }
        }

        // Aggregation thread - batches events every 100ms
        std::thread::spawn(move || {
            let mut batch: Vec<Connection> = Vec::new();
            let mut last_emit = std::time::Instant::now();

            loop {
                match rx.recv_timeout(std::time::Duration::from_millis(50)) {
                    Ok(raw) => {
                        let key = format!("{}:{}:{}", raw.dst_ip, raw.protocol, raw.port);

                        let mut conns = connections.lock().unwrap();
                        let entry = conns.entry(key.clone()).or_insert_with(|| {
                            let location = geoip
                                .lookup(raw.dst_ip)
                                .unwrap_or(GeoLocation {
                                    lat: 0.0,
                                    lng: 0.0,
                                    country: "Unknown".to_string(),
                                    city: "Unknown".to_string(),
                                });

                            Connection {
                                id: key.clone(),
                                dst_ip: raw.dst_ip.to_string(),
                                protocol: raw.protocol.clone(),
                                port: raw.port,
                                location,
                                bytes: 0,
                                packets: 0,
                                timestamp: SystemTime::now()
                                    .duration_since(UNIX_EPOCH)
                                    .unwrap()
                                    .as_secs(),
                            }
                        });

                        entry.bytes += raw.bytes;
                        entry.packets += 1;
                        entry.timestamp = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_secs();

                        batch.push(entry.clone());
                    }
                    Err(mpsc::RecvTimeoutError::Timeout) => {}
                    Err(mpsc::RecvTimeoutError::Disconnected) => break,
                }

                // Emit batch every 100ms
                if last_emit.elapsed() >= std::time::Duration::from_millis(100) && !batch.is_empty()
                {
                    let _ = app.emit("connections", &batch);
                    batch.clear();
                    last_emit = std::time::Instant::now();
                }
            }
        });
    }
}
