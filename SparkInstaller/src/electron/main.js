// THIS INSTALLER IS SPECIFICALLY MADE FOR WINDOWS

let os = require("os");

if (os.platform() !== "win32") {
    throw new Error("This installer is specifically made for Windows. Please use the appropriate installer for your operating system.");
}

// Electron
let { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
let path = require("path");

let createWindow = () => {
    let window = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 400,
        icon: path.join(__dirname, "../img/SI.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        },
    });

    // window.setMenu(null);

    // Prompt the user if they want to close the installer
    window.on("close", async (event) => {
        event.preventDefault();
        let result = await dialog.showMessageBox(window, {
            type: "question",
            buttons: ["Yes", "No"],
            defaultId: 1,
            cancelId: 1,
            title: "Exit Installer",
            message: "Are you sure you want to close the installer?",
            detail: "Any changes made will not be saved."
        });

        if (result.response === 0) {
            window.destroy();
        }
    });

    window.loadFile(path.join(__dirname, "../index.html"));
}

app.on("ready", createWindow);

// Check admin privileges
let child_process = require("child_process");

function isAdmin() {
    if (os.platform() === "win32") {
        try {
            return child_process.execSync("net session", { stdio: "ignore" });
        } catch (error) {
            return false;
        }
    }
}

// Installer functionality
let fs = require("fs");
let installerConfig = require("../installer-config.json");
let uninstallerConfig = require("../uninstaller-config.json");

// Handle the dialog to check if a path exists
ipcMain.handle("dialog:checkPath", async (event, pathToCheck) => {
    try {
        if (fs.existsSync(pathToCheck)) {
            return true;
        }
        else {
            return false;
        }
    } 
    catch (error) {
        console.error("Error checking path:", error);
        return false;
    }
});

// Handle the dialog to open a folder
ipcMain.handle("dialog:openFolder", async (event) => {
    let result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
    });
    if (result.canceled) {
        return null;
    } 
    else {
        return result.filePaths[0];
    }
});

// Handle the app data sent from the renderer process
ipcMain.handle("appData", async (event, copyDir, startMenuIcon, desktopIcon) => {
    try {
        await installApp(installerConfig.app.exeDirectory, copyDir, startMenuIcon, desktopIcon);
        return true;
    }
    catch (error) {
        console.error("Error during app installation:", error);
        return false;
    }
});

// Handle the admin check request
ipcMain.handle("isAdmin", async (event) => {
    try {
        return isAdmin();
    } 
    catch (error) {
        console.error("Error checking admin privileges:", error);
        return false;
    }
});

// Handle the dialog to confirm exit
ipcMain.handle("dialog:confirmExit", async (event, title, message, detail) => {
    let result = await dialog.showMessageBox({
        type: "question",
        buttons: ["Yes", "No"],
        defaultId: 1,
        cancelId: 1,
        title: title,
        message: message,
        detail: detail
    });

    return result.response === 0; 
});

// Handle the dialog to show an alert
ipcMain.handle("dialog:showAlert", async (event, title, message, detail) => {
    await dialog.showMessageBox({
        type: "info",
        buttons: ["OK"],
        title: title,
        message: message,
        detail: detail
    });
});

// Function to read all files and directories recursively in a given directory
function readAllDirSync(dir) {
    let files = fs.readdirSync(dir);
    let allFiles = [];
    files.forEach(file => {
        let subDir = path.join(dir, file);
        if (!fs.statSync(subDir).isDirectory()) {
            allFiles.push({ name: file, path: subDir, type: "file" });
        }
        else {
            allFiles.push({name: file, path: subDir, type: "directory", children: readAllDirSync(subDir)})
        }
    });

    return allFiles;
}

// Function to find the executable in a directory
function findExecutable(dir , noError = false) {
    let files = readAllDirSync(dir);
    let execPath = [];
    files.forEach(file => {
        if (file.type === "file" && (file.name.endsWith(".exe"))) {
            execPath.push(file.path);
        }
        else if (file.type === "directory") {
            let result = findExecutable(file.path, true);
            if (typeof result === "array" && result.length > 0) {
                execPath = execPath.concat(result);
            }
        }
    });

    if (execPath.length === 1 && !noError) {
        return execPath[0];
    } 
    else if (execPath.length > 1 && !noError) {
        throw new Error("Multiple executables found in the directory: " + dir);
    } 
    else if (execPath.length === 0 && !noError) {
        throw new Error("No executable found in the directory: " + dir);
    }

    if (noError && execPath.length === 0) {
        return null;
    }

    return execPath;
}

// Function to create a shortcut link for the application
function createShortcut(execPath, location, appName) {
    let shortcutPath = null;
    switch (location) {
        case "desktop":
            let desktopDir = path.join(process.env.USERPROFILE, "Desktop");
            shortcutPath = path.join(desktopDir, appName + ".lnk");
            break;
        case "startMenu":
            let startMenuDir = path.join(process.env.APPDATA, "Microsoft", "Windows", "Start Menu", "Programs");
            shortcutPath = path.join(startMenuDir, appName + ".lnk");
            break;
    }

    if (!shortcutPath) {
        throw new Error("Invalid location specified for shortcut: " + location);
    }

    shell.writeShortcutLink(shortcutPath, {
        target: execPath,
        icon: execPath,
        description: appName
    });
}

// Function to copy all files from a folder to a destination path synchronously
// Fix errors with .asar files not being copied correctly
function copyAllFilesSync(folderPath, destinationPath) {
    if (!fs.existsSync(folderPath)) {
        throw new Error("The specified folder does not exist: " + folderPath);
    }

    if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath, { recursive: true });
    }

    let files = readAllDirSync(folderPath);

    files.forEach(file => {
        let destFilePath = path.join(destinationPath, file.name);
        if (file.type === "file") {
            fs.copyFileSync(file.path, destFilePath);
        } 
        else if (file.type === "directory") {
            copyAllFilesSync(file.path, destFilePath);
        }
    });

    return true;
}

// Copy the app to a specified directory (e.g. installation dir) and also add an icon to start menu, desktop if specified
function installApp(pathToApp, copyDir = "C:\Program Files", startMenuIcon = false, desktopIcon = false) {
    console.log("Installing app from:", pathToApp);
    console.log("Copying app to:", copyDir);
    console.log("Start Menu Icon:", startMenuIcon);
    console.log("Desktop Icon:", desktopIcon);
    // Validate the arguments
    if (typeof pathToApp === "string" && typeof copyDir === "string" && typeof startMenuIcon === "boolean" && typeof desktopIcon === "boolean") {
        let execPath = null;
        let destinationPath = null;

        // Check if the app exists at the specified path e.g. the exe file is present
        if (!fs.existsSync(pathToApp)) {
            throw new Error("The specified app does not exist at the given path: " + pathToApp);
        }
        else {
            execPath = findExecutable(pathToApp);
            destinationPath = path.join(copyDir, installerConfig.app.appName);
        }

        // Copy the icons to their respective locations if specified
        if (startMenuIcon) {
            createShortcut(execPath, "startMenu", installerConfig.app.appName);
        }

        if (desktopIcon) {
            createShortcut(execPath, "desktop", installerConfig.app.appName);
        }

        // Create the copy directory if it does not exist
        if (!fs.existsSync(destinationPath)) {
            fs.mkdirSync(destinationPath, { recursive: true });
        }

        // Check if the copy directory is empty otherwise throw a warning
        if (fs.readdirSync(destinationPath).length > 0) {
            console.warn("The specified copy directory is not empty: " + destinationPath);
        }

        // Copy the app to the specified directory and update the uninstaller config
        if (copyAllFilesSync(pathToApp, destinationPath)) {
            uninstallerConfig.app.installationPath = destinationPath;
            uninstallerConfig.app.startMenuIconPath = startMenuIcon ? path.join(process.env.APPDATA, "Microsoft", "Windows", "Start Menu", "Programs", installerConfig.app.appName + ".lnk") : false;
            uninstallerConfig.app.desktopIconPath = desktopIcon ? path.join(process.env.USERPROFILE, "Desktop", installerConfig.app.appName + ".lnk") : false;

            fs.writeFileSync(path.join(__dirname, "../uninstaller-config.json"), JSON.stringify(uninstallerConfig));
        }
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