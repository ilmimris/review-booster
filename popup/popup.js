const generateBtn = document.getElementById("generateBtn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const statusEl = document.getElementById("status");
const messageEl = document.getElementById("message");

// Check if we're on a Google Maps page via the background service worker
async function checkPageStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && tab.url.includes("google.com/maps")) {
      setStatus(true, "Active");
      generateBtn.disabled = false;
      messageEl.textContent = "Ready to generate reviews";
    } else {
      setStatus(false, "Inactive");
      generateBtn.disabled = true;
      messageEl.textContent = "Navigate to Google Maps to use this extension";
    }
  } catch (err) {
    console.error("Error checking page status:", err);
    setStatus(false, "Error");
    generateBtn.disabled = true;
    messageEl.textContent = "Could not determine page status";
  }
}

function setStatus(active, text) {
  if (active) {
    statusEl.classList.add("active");
  } else {
    statusEl.classList.remove("active");
  }
  statusText.textContent = text;
}

// Generate button click handler
generateBtn.addEventListener("click", async () => {
  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";
  messageEl.textContent = "Generating review...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
      // Send message to content script to start review generation
      await chrome.tabs.sendMessage(tab.id, { action: "generateReview" });
      messageEl.textContent = "Review generation started!";
    }
  } catch (err) {
    console.error("Error sending generate message:", err);
    messageEl.textContent = "Error: Could not connect to page";
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate";
  }
});

// Initialize on popup open
checkPageStatus();
