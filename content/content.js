// content/content.js
// Content script injected on Google Maps pages

console.log("[Review Booster] Content script loaded on:", window.location.href);

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "generateReview") {
    const result = handleGenerateReview();
    sendResponse(result);
  }
  return true; // Keep message channel open for async response
});

function handleGenerateReview() {
  console.log("[Review Booster] Generate review triggered");

  // Extract place info from the page
  const placeInfo = extractPlaceInfo();

  if (placeInfo) {
    console.log("[Review Booster] Place info:", placeInfo);
    showNotification("Review Booster", `Preparing review for: ${placeInfo.name}`);
    return { status: "success", placeInfo };
  } else {
    showNotification("Review Booster", "Could not detect place information");
    return { status: "error", reason: "no_place_info" };
  }
}

function extractPlaceInfo() {
  try {
    // Try to get the place name from the page
    const titleEl = document.querySelector("h1") || document.querySelector(".fontHeadlineSmall");

    if (titleEl) {
      return {
        name: titleEl.textContent.trim(),
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("[Review Booster] Error extracting place info:", err);
  }

  return null;
}

function showNotification(title, message) {
  // Create a simple toast notification on the page
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  toast.textContent = `[${title}] ${message}`;
  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
