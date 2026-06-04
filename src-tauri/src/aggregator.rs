use crate::capture::{self, RawConnection};
use crate::geoip::{Connection, GeoIpResolver, GeoLocation};
use std::collections::HashMap;
use std::sync::{mpsc, Arc};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};

const BATCH_INTERVAL: Duration = Duration::from_millis(100);
const RECV_TIMEOUT: Duration = Duration::from_millis(50);

/// Starts the packet capture pipeline and emits batched connection events.
pub fn run(app: AppHandle, geoip: Arc<GeoIpResolver>) -> Result<(), String> {
    let (tx, rx) = mpsc::channel::<RawConnection>();

    capture::start(tx)?;

    let mut connections: HashMap<String, Connection> = HashMap::new();
    let mut batch: Vec<Connection> = Vec::new();
    let mut last_emit = Instant::now();

    loop {
        match rx.recv_timeout(RECV_TIMEOUT) {
            Ok(raw) => {
                let key = format!("{}:{}:{}", raw.dst_ip, raw.protocol, raw.port);
                let now_secs = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();

                let entry = connections.entry(key.clone()).or_insert_with(|| {
                    let location = geoip.lookup(raw.dst_ip).unwrap_or(GeoLocation {
                        lat: 0.0,
                        lng: 0.0,
                        country: "Unknown".into(),
                        city: "Unknown".into(),
                    });

                    Connection {
                        id: key.clone(),
                        dst_ip: raw.dst_ip.to_string(),
                        protocol: raw.protocol.clone(),
                        port: raw.port,
                        location,
                        bytes: 0,
                        packets: 0,
                        timestamp: now_secs,
                    }
                });

                entry.bytes += raw.bytes;
                entry.packets += 1;
                entry.timestamp = now_secs;
                batch.push(entry.clone());
            }
            Err(mpsc::RecvTimeoutError::Timeout) => {}
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        }

        // Emit accumulated batch
        if last_emit.elapsed() >= BATCH_INTERVAL && !batch.is_empty() {
            let _ = app.emit("connections", &batch);
            batch.clear();
            last_emit = Instant::now();
        }
    }

    Ok(())
}
