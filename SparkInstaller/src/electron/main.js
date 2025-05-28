// THIS INSTALLER IS SPECIFICALLY MADE FOR WINDOWS

// Track the main process logs
let logStream = require("fs").createWriteStream("debug.log", { flags: "a" });
console.log = function (...args) {
    logStream.write(args.join(" ") + "\n");
    process.stdout.write(args.join(" ") + "\n");
};
console.error = function (...args) {
    logStream.write("[ERROR] " + args.join(" ") + "\n");
    process.stderr.write(args.join(" ") + "\n");
};

// Check if the current platform is Windows
// If not, throw an error and exit the process
let os = require("os");

if (os.platform() !== "win32") {
    throw new Error("This installer is specifically made for Windows. Please use the appropriate installer for your operating system.");
}

// Electron
let { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
let path = require("path");
let fs = require("fs");
// Get the directory of the current executable and read the installer configuration
let exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
let appFolderPath = path.join(exeDir, "App");
let installerConfigPath = path.join(exeDir, "installer-config.json");
let installerConfig = JSON.parse(fs.readFileSync(installerConfigPath, "utf-8"));
let uninstallerConfigPath = path.join(exeDir, "uninstaller-config.json");
let uninstallerConfig = JSON.parse(fs.readFileSync(uninstallerConfigPath, "utf-8"));
let forceClose = false;
let executablePath = findExecutable(appFolderPath);

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
        if (forceClose) {
            app.quit();
            return;
        }
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

    if (executablePath) {
        window.loadFile(path.join(__dirname, "../install.html"));
    }
    else if (typeof uninstallerConfig.app.installationPath === "string" && executablePath) {
        window.loadFile(path.join(__dirname, "../uninstall.html"));
    }
    else {
        forceClose = true;
        dialog.showErrorBox("Error", "The specified application directory does not exist. Please check the installer configuration.");
        app.quit();
    }
}

// Close the app when all windows are closed, except on darwin (macOS)
app.on("window-all-closed", () => {
    if (os.platform() !== "darwin") {
        app.quit();
    }
});

// Create the main window when the app is ready
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
        await installApp(copyDir, startMenuIcon, desktopIcon);
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
function installApp(copyDir, startMenuIcon = false, desktopIcon = false) {
    // Validate the arguments
    if (typeof copyDir === "string" && typeof startMenuIcon === "boolean" && typeof desktopIcon === "boolean") {
        let destinationPath = null;
        let newExePath = null;

        destinationPath = path.join(copyDir, installerConfig.app.appName);
        newExePath = path.join(destinationPath, path.basename(executablePath));

        // Copy the icons to their respective locations if specified
        if (startMenuIcon) {
            createShortcut(executablePath, "startMenu", path.basename(executablePath));
        }

        if (desktopIcon) {
            createShortcut(executablePath, "desktop", path.basename(executablePath));
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
        if (copyAllFilesSync(appFolderPath, destinationPath)) {
            uninstallerConfig.app.installationPath = destinationPath;
            uninstallerConfig.app.startMenuIconPath = startMenuIcon ? path.join(process.env.APPDATA, "Microsoft", "Windows", "Start Menu", "Programs", installerConfig.app.appName + ".lnk") : false;
            uninstallerConfig.app.desktopIconPath = desktopIcon ? path.join(process.env.USERPROFILE, "Desktop", installerConfig.app.appName + ".lnk") : false;

            fs.writeFileSync(uninstallerConfigPath, JSON.stringify(uninstallerConfig));
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