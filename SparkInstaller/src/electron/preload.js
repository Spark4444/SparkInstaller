let { contextBridge, ipcRenderer } = require("electron");

// Expose functions to the renderer process
contextBridge.exposeInMainWorld("electron", {
    // Function to select a folder using the dialog
    selectFolder: () => {
        return ipcRenderer.invoke("dialog:openFolder")
    },
    // Check if a path exists
    checkPath: (path) => {
        return ipcRenderer.invoke("dialog:checkPath", path);
    },
    // 
    sendAppData: (copyDir = "C:\Program Files", startMenuIcon = false, desktopIcon = false) => {
        ipcRenderer.send("appData", copyDir, startMenuIcon, desktopIcon);
    },
});