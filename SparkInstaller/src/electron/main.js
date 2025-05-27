// THIS INSTALLER IS SPECIFICALLY MADE FOR WINDOWS

// Electron
let { app, BrowserWindow, ipcMain, dialog } = require("electron");
let path = require("path");

let createWindow = () => {
    let window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        },
    });

    window.setMenu(null);

    window.loadFile(path.join(__dirname, "../index.html"));
}

app.on("ready", createWindow);

// Installer functionality
let fs = require("fs");
let settings = require("../settings.json");

// Copy the app to a specified directory (e.g. installation dir) and also add an icon to start menu, desktop if specified
function installApp(pathToApp, copyDir = "C:\Program Files", startMenuIcon = false, desktopIcon = false) {
    // Validate the arguments
    if (typeof pathToApp === "string" && typeof copyDir === "string" && typeof startMenuIcon === "boolean" && typeof desktopIcon === "boolean") {
        // Check if the app exists at the specified path

        // Check if the copy directory is empty otherwise throw a warning
    }
    else {
        throw new Error("Invalid arguments passed to installApp function.");
    }
}

function uninstallApp(uninstallDir = "C:\Program Files", startMenuIcon = false, desktopIcon = false) {
    // Remove the app from the specified directory
    // Remove the start menu icon if it exists
    // Remove the desktop icon if it exists
}