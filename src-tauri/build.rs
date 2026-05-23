use std::env;
use std::path::PathBuf;

fn main() {
    // Add Npcap SDK library path (bundled in project)
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let lib_path = PathBuf::from(&manifest_dir).join("libs");
    println!("cargo:rustc-link-search=native={}", lib_path.display());

    // Embed Windows manifest for admin elevation
    #[cfg(target_os = "windows")]
    {
        let mut res = tauri_build::WindowsAttributes::new();
        res = res.app_manifest(include_str!("netglobe.exe.manifest"));
        let attrs = tauri_build::Attributes::new().windows_attributes(res);
        tauri_build::try_build(attrs).expect("failed to run build script");
    }
    #[cfg(not(target_os = "windows"))]
    {
        tauri_build::build();
    }
}
