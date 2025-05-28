let { contextBridge, ipcRenderer } = require("electron");

// Expose functions to the renderer process
contextBridge.exposeInMainWorld("electron", {
    // Function to send drive info e.g. drive space, free space, the size of the app.
    sendDriveInfo: (driveInfo) => {
        ipcRenderer.invoke("driveInfo", driveInfo);
    },
    // Function to select a folder using the dialog
    selectFolder: () => {
        return ipcRenderer.invoke("dialog:openFolder")
    },
    // Check if a path exists
    checkPath: (path) => {
        return ipcRenderer.invoke("dialog:checkPath", path);
    },
    // Function to send app data for installation
    sendAppData: (copyDir = "C:\Program Files", startMenuIcon = false, desktopIcon = false) => {
        return ipcRenderer.invoke("appData", copyDir, startMenuIcon, desktopIcon);
    },
    // Function to check if the user has admin privileges
    isUserRunningAsAdmin: () => {
        return ipcRenderer.invoke("isAdmin");
    },

    // Function to confirm exit
    confirmExit: (title, message, detail) => {
        return ipcRenderer.invoke("dialog:confirmExit", title, message, detail);
    },

    // Function to show an alert dialog
    showAlert: (title, message, detail) => {
        return ipcRenderer.invoke("dialog:showAlert", title, message, detail);
    }
});