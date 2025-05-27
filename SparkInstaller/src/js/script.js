let windows = document.querySelectorAll(".window");
let currentWindowIndex = 0;

windows.forEach((window, index) => {
    if (!window.querySelector(".buttons")) {
        if (index === 0) {
            window.innerHTML += `
                <div class="buttons">
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

document.querySelectorAll(".nextBtn").forEach(btn => {
    btn.addEventListener("click", nextWindow);
});

document.querySelectorAll(".backBtn").forEach(btn => {
    btn.addEventListener("click", backWindow);
});

document.querySelectorAll(".closeBtn").forEach(btn => {
    btn.addEventListener("click", closeWindow);
});

function nextWindow() {
    if (currentWindowIndex < windows.length - 1) {
        windows[currentWindowIndex].style.display = "none";
        currentWindowIndex++;
        windows[currentWindowIndex].style.display = "";
    }
}

function backWindow() {
    if (currentWindowIndex > 0) {
        windows[currentWindowIndex].style.display = "none";
        currentWindowIndex--;
        windows[currentWindowIndex].style.display = "";
    }
}

function closeWindow() {
    if (confirm("Are you sure you want to close the installer? Any changes made will not be saved.")) {
        window.close();
    }
}