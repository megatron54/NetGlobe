use std::env;
use std::path::PathBuf;

fn main() {
    // Add Npcap SDK library path (bundled in project)
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let lib_path = PathBuf::from(&manifest_dir).join("libs");
    println!("cargo:rustc-link-search=native={}", lib_path.display());

    tauri_build::build();
}
