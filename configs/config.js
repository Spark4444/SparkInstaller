// This script sets up the directory structure and copies necessary configuration files for the Spark Installer.
// Node js requirements
let path = require("path");
let fs = require("fs");

// Paths
let outDir = path.join(__dirname, "../SparkInstaller/out");
let installerDir = path.join(outDir, "sparkinstaller-win32-x64");
let appDir = path.join(installerDir, "app");
let uninstallerConfigSrc = path.join(__dirname, "uninstaller-config.json");
let uninstallerConfigDest = path.join(installerDir, "uninstaller-config.json");
let configSrc = path.join(__dirname, "installer-config.json"); 
let configDest = path.join(installerDir, "installer-config.json");

// Ensure out directory exists
if (!fs.existsSync(installerDir)) {
    fs.mkdirSync(installerDir, { recursive: true });
}

// Copy installer-config.json to out/sparkinstaller-win32-x64 as well as uninstaller-config.json
fs.copyFileSync(configSrc, configDest);
fs.copyFileSync(uninstallerConfigSrc, uninstallerConfigDest);

// Create App folder inside out/sparkinstaller-win32-x64
if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
}

// Create a dummy test.exe file in the app directory for testing purposes and to ensure app can actually run even if no other files are present
let testExePath = path.join(appDir, "test.exe");
fs.closeSync(fs.openSync(testExePath, 'w'))