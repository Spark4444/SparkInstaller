// DOM elemnts
let windows = document.querySelectorAll(".window");

// Numbers
let currentWindowIndex = 0;

// Boleans
let startMenuIcon = false;
let desktopIcon = false;

// Add buttons to each window if they don't already exist
windows.forEach((window, index) => {
    if (!window.querySelector(".buttons")) {
        if (index === 0) {
            window.innerHTML += `
                <div class="buttons">
                    <div class="backBtn" style="visibility: hidden;">back</div>
                    <div class="nextBtn">next</div>
                    <div class="closeBtn">close</div>
                </div>`;
        }
        else {
            window.innerHTML += `
                <div class="buttons">
                    <div class="backBtn">back</div>
                    <div class="nextBtn">next</div>
                    <div class="closeBtn">close</div>
                </div>`;
        }
    }

    if (currentWindowIndex !== index) {
        window.style.display = "none";
    }
});

// Functionality for the next button
document.querySelectorAll(".nextBtn").forEach(btn => {
    btn.addEventListener("click", nextWindow);
});

// Functionality for the back button
document.querySelectorAll(".backBtn").forEach(btn => {
    btn.addEventListener("click", backWindow);
});

// Functionality for the close button
document.querySelectorAll(".closeBtn").forEach(btn => {
    btn.addEventListener("click", closeWindow);
});

// Functionality for the finish button
document.querySelectorAll(".finishBtn").forEach(btn => {
    btn.addEventListener("click", () => {
        window.close();
    });
});

// Functionality for the checkboxes
document.querySelector(".desktopShortcut").addEventListener("change", (e) => {
    desktopIcon = e.target.checked;
});

document.querySelector(".startMenuShortcut").addEventListener("change", (e) => {
    startMenuIcon = e.target.checked;
});

// Functionality for the folder selection button
document.querySelector(".browseBtn").addEventListener("click", async () => {
    if (window.electron && window.electron.selectFolder) {
        let folder = await window.electron.selectFolder();
        if (folder) {
            document.querySelector(".installPath").value = folder;
        }
    }
})

function nextWindowNoCheck() {
    if (currentWindowIndex < windows.length - 1) {
        windows[currentWindowIndex].style.display = "none";
        currentWindowIndex++;
        windows[currentWindowIndex].style.display = "";
    }
}

// Navigates to the next window in the installer
function nextWindow() {
    if (currentWindowIndex === 1) {
        // Validate the installation path
        let installPath = document.querySelector(".installPath").value;
        isValidWindowsPath(installPath).then(isValid => {
            if (isValid === true) {
                if (window.electron && window.electron.checkPath) {
                    window.electron.checkPath(installPath)
                    .then(pathExists => {
                        if (pathExists) {
                            nextWindowNoCheck();
                        } 
                        else {
                            if (window.electron && window.electron.showAlert) {
                                window.electron.showAlert(
                                    "Invalid Path",
                                    "The path you entered does not exist.",
                                    "Please enter a valid Windows installation path (e.g., 'C:\\Path To Installation Folder')."
                                );
                            }
                        }
                    });
                }
            } 
            else if (isValid === "admin") {
                if (window.electron && window.electron.showAlert) {
                    window.electron.showAlert(
                        "Admin Privileges Required",
                        "The path you entered requires admin privileges.",
                        "Please run the installer as an administrator or choose a different path."
                    );
                }
            } 
            else {
                if (window.electron && window.electron.showAlert) {
                    window.electron.showAlert(
                        "Invalid Path",
                        "The path you entered is not valid.",
                        "Please enter a valid Windows installation path (e.g., 'C:\\Path To Installation Folder')."
                    );
                }
            }
        });
    }

    else if (currentWindowIndex === 2) {
        nextWindowNoCheck();
        if (window.electron && window.electron.sendAppData) {
            let installPath = document.querySelector(".installPath").value;
            window.electron.sendAppData(installPath, startMenuIcon, desktopIcon)
            .then(success => {
                if (success) {
                    nextWindowNoCheck();
                } 
                else {
                    if (window.electron && window.electron.showAlert) {
                        window.electron.showAlert(
                            "Installation Error",
                            "An error occurred during installation.",
                            "Please try again."
                        );
                    }
                    location.reload();
                }
            });
        }
    }

    else {
        nextWindowNoCheck();
    }
}

// Navigates back to the previous window in the installer
function backWindow() {
    if (currentWindowIndex > 0) {
        windows[currentWindowIndex].style.display = "none";
        currentWindowIndex--;
        windows[currentWindowIndex].style.display = "";
    }
}

// Closes the installer window with a confirmation dialog
async function closeWindow() {
    if (window.electron && window.electron.confirmExit) {
        let confirmExit = await window.electron.confirmExit(
            "Confirm Exit",
            "Are you sure you want to close the installer?",
            "Any changes made will not be saved."
        );
        if (confirmExit) {
            window.close();
        }
    }
}

// Validates Windows file paths starting with drive letter (e.g., C:\)
function isValidWindowsPath(path) {
    let regex = /^[a-zA-Z]:\\(?:[^<>:"/\\|?*\r\n]+\\)*[^<>:"/\\|?*\r\n]*$/;
    let adminFolders = [
        ":\\",
        ":\\Program Files",
        ":\\Program Files (x86)",
        ":\\Windows",
        ":\\System32",
        ":\\ProgramData",
        ":\\Users"
    ];

    return new Promise(async (resolve) => {
        if (!regex.test(path)) {
            resolve(false);
            return;
        }
        if (window.electron && window.electron.isUserRunningAsAdmin) {
            let isAdmin = await window.electron.isUserRunningAsAdmin();
            if (isAdmin) {
                resolve(true);
            } 
            else if (adminFolders.some(folder => path.endsWith(folder))) {
                resolve("admin");
            } 
            else {
                resolve(true);
            }
        } 
        else {
            resolve(true);
        }
    });
}