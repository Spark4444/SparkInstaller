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

// Navigates to the next window in the installer
function nextWindow() {
    if (currentWindowIndex === 1) {
        // Validate the installation path
        let installPath = document.querySelector(".installPath").value;
        // Double validation to via regex and Electron's checkPath function which makes use of less recources since it checks the path via regex first
        // And if the path invalid it will not check it via the filesystem
        if (isValidWindowsPath(installPath)) {
            if (window.electron &&  window.electron.checkPath) {
                let diskPath = installPath.split("\\")[0] + "\\";
                window.electron.checkPath(diskPath).then(isValid => {
                    if (!isValid) {
                        alert("Please enter a valid disk path that exists on your device (e.g., 'C:\\').");
                        return;
                    }
                });
            }
        }
        else {
            alert("Please enter a valid Windows installation path (e.g., 'C:\\Path To Installation Folder').");
            return;
        }
    }

    if (currentWindowIndex === 2) {
        if (window.electron && window.electron.sendAppData) {
            let installPath = document.querySelector(".installPath").value;
            window.electron.sendAppData(installPath, startMenuIcon, desktopIcon);
        }
    }

    if (currentWindowIndex < windows.length - 1) {
        windows[currentWindowIndex].style.display = "none";
        currentWindowIndex++;
        windows[currentWindowIndex].style.display = "";
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
function closeWindow() {
    if (confirm("Are you sure you want to close the installer? Any changes made will not be saved.")) {
        window.close();
    }
}

// Validates Windows file paths starting with drive letter (e.g., C:\)
function isValidWindowsPath(path) {
    const regex = /^[a-zA-Z]:\\(?:[^<>:"/\\|?*\r\n]+\\)*[^<>:"/\\|?*\r\n]*$/;
    return regex.test(path);
}