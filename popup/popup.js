const generateBtn = document.getElementById("generateBtn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const statusEl = document.getElementById("status");
const ipAddressEl = document.getElementById("ipAddress");
const instructionEl = document.getElementById("instruction");
const instructionIcon = document.getElementById("instructionIcon");
const instructionText = document.getElementById("instructionText");
const messageEl = document.getElementById("message");

// Matches both www.google.com/maps and maps.google.com, plus country TLDs
function isGoogleMapsUrl(url) {
  try {
    const u = new URL(url);
    const isGoogleHost =
      u.hostname === "www.google.com" ||
      u.hostname === "maps.google.com" ||
      /^maps\.google\.[a-z]{2,}(\.[a-z]{2})?$/.test(u.hostname) ||
      /^www\.google\.[a-z]{2,}(\.[a-z]{2})?$/.test(u.hostname);
    return isGoogleHost && u.pathname.startsWith("/maps");
  } catch {
    return false;
  }
}

// ── IP fetching ──
const IP_API = "https://api.ipify.org?format=json";

async function fetchPublicIP() {
  try {
    const res = await fetch(IP_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.ip;
  } catch (err) {
    console.error("Failed to fetch public IP:", err);
    return null;
  }
}

// ── IP safety heuristic ──
// Checks whether an IP is a routable public address.
// Private, loopback, link-local, and reserved ranges are flagged as danger.
function isPublicIP(ip) {
  if (!ip) return false;

  // ── IPv6 ──
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    // ::1 loopback
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return false;
    // fc00::/7 unique-local
    if (/^f[cd]/.test(lower)) return false;
    // fe80::/10 link-local
    if (/^fe[89ab]/.test(lower)) return false;
    // :: (unspecified)
    if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return false;
    return true;
  }

  // ── IPv4 ──
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) return false;

  const [a, b] = parts;

  // 10.0.0.0/8
  if (a === 10) return false;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return false;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return false;
  // 127.0.0.0/8 (loopback)
  if (a === 127) return false;
  // 169.254.0.0/16 (link-local)
  if (a === 169 && b === 254) return false;
  // 0.0.0.0
  if (a === 0) return false;

  return true;
}

// ── UI state helpers ──
function setSafe() {
  statusEl.className = "status safe";
  statusText.textContent = "Aman";
  instructionEl.className = "instruction safe";
  instructionIcon.textContent = "✅";
  instructionText.textContent =
    "Koneksi Anda aman. Anda dapat melanjutkan generate review.";
  generateBtn.disabled = false;
  generateBtn.className = "btn btn-safe";
}

function setDanger(reason) {
  statusEl.className = "status danger";
  statusText.textContent = "Bahaya";
  instructionEl.className = "instruction danger";
  instructionIcon.textContent = "⚠️";
  instructionText.textContent =
    reason || "IP terdeteksi tidak aman. Gunakan jaringan yang lebih terpercaya sebelum generate.";
  generateBtn.disabled = true;
  generateBtn.className = "btn btn-danger";
}

function setLoading() {
  statusEl.className = "status";
  statusText.textContent = "Memeriksa…";
  instructionEl.className = "instruction";
  instructionIcon.textContent = "⏳";
  instructionText.textContent = "Memeriksa keamanan koneksi…";
  generateBtn.disabled = true;
}

function setError(msg) {
  statusEl.className = "status danger";
  statusText.textContent = "Error";
  instructionEl.className = "instruction danger";
  instructionIcon.textContent = "❌";
  instructionText.textContent = msg || "Gagal memeriksa status koneksi.";
  generateBtn.disabled = true;
}

// ── Main init ──
async function init() {
  setLoading();

  // Check if on Google Maps first
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const onMaps = tab?.url && isGoogleMapsUrl(tab.url);

  const ip = await fetchPublicIP();

  if (!ip) {
    setError("Tidak dapat mendeteksi IP publik. Periksa koneksi internet Anda.");
    ipAddressEl.textContent = "—";
    return;
  }

  ipAddressEl.textContent = ip;

  if (!onMaps) {
    // On Maps takes priority for enabling, but still show IP status
    if (isPublicIP(ip)) {
      setSafe();
      instructionText.textContent =
        "Koneksi aman. Buka Google Maps untuk mulai generate review.";
    } else {
      setDanger(
        "IP terdeteksi sebagai alamat privat/lokal. Gunakan jaringan publik yang aman."
      );
    }
    generateBtn.disabled = true;
    messageEl.textContent = "Buka Google Maps terlebih dahulu";
    return;
  }

  if (isPublicIP(ip)) {
    setSafe();
  } else {
    setDanger(
      "IP ini terdeteksi sebagai alamat privat/lokal. Gunakan jaringan publik yang aman sebelum generate."
    );
  }
}

// ── Generate button handler ──
generateBtn.addEventListener("click", async () => {
  generateBtn.disabled = true;
  generateBtn.textContent = "Generating…";
  messageEl.textContent = "Sedang memproses…";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      throw new Error("Tab aktif tidak ditemukan");
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: "generateReview" });

    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (response?.status === "success") {
      messageEl.textContent = `Review dimulai untuk: ${response.placeInfo?.name || "tempat ini"}`;
    } else {
      messageEl.textContent = response?.reason || "Terjadi kesalahan";
    }
  } catch (err) {
    console.error("Error sending generate message:", err);
    messageEl.textContent = "Error: Tidak dapat terhubung ke halaman";
  } finally {
    generateBtn.textContent = "Generate";
    // Re-check tab state before re-enabling
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const onMaps = tab?.url && isGoogleMapsUrl(tab.url);
    if (onMaps && ipAddressEl.textContent !== "—") {
      generateBtn.disabled = false;
    } else {
      generateBtn.disabled = true;
    }
  }
});

// Run on popup open
init();
