fn main() {
    // Add Npcap SDK library path
    println!("cargo:rustc-link-search=native=C:/Users/Miguel/AppData/Local/Temp/opencode/npcap-sdk/Lib/x64");

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
