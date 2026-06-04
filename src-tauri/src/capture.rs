use pnet::packet::ethernet::{EtherTypes, EthernetPacket};
use pnet::packet::ip::IpNextHeaderProtocols;
use pnet::packet::ipv4::Ipv4Packet;
use pnet::packet::tcp::TcpPacket;
use pnet::packet::udp::UdpPacket;
use pnet::packet::Packet;
use std::net::IpAddr;
use std::sync::mpsc;

#[derive(Debug, Clone)]
pub struct RawConnection {
    pub dst_ip: IpAddr,
    pub protocol: String,
    pub port: u16,
    pub bytes: u64,
}

/// Opens the first suitable network interface and begins capturing IP packets.
/// Parsed connections are sent to `tx`. Runs in a background thread.
pub fn start(tx: mpsc::Sender<RawConnection>) -> Result<(), String> {
    let device = pcap::Device::list()
        .map_err(|e| format!("Failed to enumerate network devices: {}", e))?
        .into_iter()
        .find(|d| {
            d.flags.connection_status == pcap::ConnectionStatus::Connected
                && !d.flags.is_loopback()
                && d.addresses.iter().any(|a| matches!(a.addr, IpAddr::V4(_)))
        })
        .ok_or_else(|| "No suitable network interface found. Is Npcap installed?".to_string())?;

    let mut cap = pcap::Capture::from_device(device)
        .map_err(|e| format!("Failed to open capture device: {}", e))?
        .promisc(false)
        .snaplen(128)
        .timeout(100)
        .open()
        .map_err(|e| format!("Failed to activate capture: {}", e))?;

    cap.filter("ip", true)
        .map_err(|e| format!("Failed to apply BPF filter: {}", e))?;

    std::thread::spawn(move || loop {
        match cap.next_packet() {
            Ok(packet) => {
                if let Some(conn) = parse_packet(packet.data) {
                    if is_public_ip(&conn.dst_ip) {
                        let _ = tx.send(conn);
                    }
                }
            }
            Err(pcap::Error::TimeoutExpired) => continue,
            Err(_) => break,
        }
    });

    Ok(())
}

fn parse_packet(data: &[u8]) -> Option<RawConnection> {
    let ethernet = EthernetPacket::new(data)?;
    if ethernet.get_ethertype() != EtherTypes::Ipv4 {
        return None;
    }

    let ipv4 = Ipv4Packet::new(ethernet.payload())?;
    let dst_ip = IpAddr::V4(ipv4.get_destination());
    let total_len = ipv4.get_total_length() as u64;

    let (protocol, port) = match ipv4.get_next_level_protocol() {
        IpNextHeaderProtocols::Tcp => {
            let tcp = TcpPacket::new(ipv4.payload())?;
            ("TCP".to_string(), tcp.get_destination())
        }
        IpNextHeaderProtocols::Udp => {
            let udp = UdpPacket::new(ipv4.payload())?;
            ("UDP".to_string(), udp.get_destination())
        }
        other => (format!("{:?}", other), 0),
    };

    Some(RawConnection {
        dst_ip,
        protocol,
        port,
        bytes: total_len,
    })
}

fn is_public_ip(ip: &IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            !v4.is_private()
                && !v4.is_loopback()
                && !v4.is_link_local()
                && !v4.is_broadcast()
                && !v4.is_unspecified()
        }
        IpAddr::V6(_) => false,
    }
}
