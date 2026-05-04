#!/usr/bin/env node
/**
 * Unit tests for popup.js pure utility functions.
 * Run: node popup/popup.test.cjs
 */

// Minimal URL polyfill for Node.js (built-in since Node 10)
const { URL } = require("url");

let pass = 0;
let fail = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    pass++;
  } else {
    console.error(`  ✗ ${label}`);
    fail++;
  }
}

// ── Re-implement functions here so they can be tested in Node without DOM ──

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

function isPublicIP(ip) {
  if (!ip) return false;

  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return false;
    if (/^f[cd]/.test(lower)) return false;
    if (/^fe[89ab]/.test(lower)) return false;
    if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return false;
    return true;
  }

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) return false;

  const [a, b] = parts;
  if (a === 10) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 0) return false;

  return true;
}

// ── Tests: isGoogleMapsUrl ──
console.log("\n[1] isGoogleMapsUrl — valid URLs");
assert(isGoogleMapsUrl("https://www.google.com/maps"), "www.google.com/maps");
assert(isGoogleMapsUrl("https://www.google.com/maps/place/Cafe"), "www.google.com/maps/place/...");
assert(isGoogleMapsUrl("https://www.google.com/maps/@-6.2,106.8,12z"), "www.google.com/maps/@coords");
assert(isGoogleMapsUrl("https://maps.google.com/maps"), "maps.google.com/maps");
assert(isGoogleMapsUrl("https://www.google.co.id/maps"), "www.google.co.id/maps (ID TLD)");
assert(isGoogleMapsUrl("https://www.google.co.uk/maps/place/Big+Ben"), "www.google.co.uk/maps (UK TLD)");
assert(isGoogleMapsUrl("https://maps.google.co.jp/maps"), "maps.google.co.jp/maps (JP TLD)");
assert(isGoogleMapsUrl("https://www.google.com.au/maps"), "www.google.com.au/maps (AU TLD)");

console.log("\n[2] isGoogleMapsUrl — invalid URLs");
assert(!isGoogleMapsUrl("https://www.google.com/search?q=maps"), "google.com/search (not /maps)");
assert(!isGoogleMapsUrl("https://google.com"), "google.com (no /maps)");
assert(!isGoogleMapsUrl("https://www.example.com/maps"), "non-google domain");
assert(!isGoogleMapsUrl("https://maps.google.com/"), "maps.google.com without /maps path");
assert(!isGoogleMapsUrl("not-a-url"), "malformed URL");
assert(!isGoogleMapsUrl(""), "empty string");
assert(!isGoogleMapsUrl("chrome://extensions"), "chrome:// URL");

// ── Tests: isPublicIP (IPv4) ──
console.log("\n[3] isPublicIP — public IPv4");
assert(isPublicIP("8.8.8.8"), "8.8.8.8 (Google DNS)");
assert(isPublicIP("1.1.1.1"), "1.1.1.1 (Cloudflare)");
assert(isPublicIP("203.142.67.1"), "typical ISP IP");

console.log("\n[4] isPublicIP — private/reserved IPv4");
assert(!isPublicIP("192.168.1.1"), "192.168.x.x (private)");
assert(!isPublicIP("192.168.0.255"), "192.168.0.x (private)");
assert(!isPublicIP("10.0.0.1"), "10.x.x.x (private)");
assert(!isPublicIP("10.255.255.255"), "10.x.x.x edge");
assert(!isPublicIP("172.16.0.1"), "172.16.x.x (private)");
assert(!isPublicIP("172.31.255.255"), "172.31.x.x (private edge)");
assert(isPublicIP("172.15.0.1"), "172.15.x.x (public, just outside private range)");
assert(isPublicIP("172.32.0.1"), "172.32.x.x (public, outside range)");
assert(!isPublicIP("127.0.0.1"), "127.x.x.x (loopback)");
assert(!isPublicIP("127.0.0.2"), "127.x.x.x (loopback)");
assert(!isPublicIP("169.254.0.1"), "169.254.x.x (link-local)");
assert(!isPublicIP("0.0.0.0"), "0.0.0.0 (unspecified)");

console.log("\n[5] isPublicIP — IPv6");
assert(isPublicIP("2001:db8::1"), "public IPv6 (example range)");
assert(isPublicIP("2404:6800::1"), "Google IPv6");
assert(!isPublicIP("::1"), "::1 (loopback)");
assert(!isPublicIP("::"), ":: (unspecified)");
assert(!isPublicIP("fe80::1"), "fe80::/10 (link-local)");
assert(!isPublicIP("fc00::1"), "fc00::/7 (unique-local)");
assert(!isPublicIP("fd00::1"), "fd00::/8 (unique-local)");

console.log("\n[6] isPublicIP — edge cases");
assert(!isPublicIP(null), "null");
assert(!isPublicIP(undefined), "undefined");
assert(!isPublicIP(""), "empty string");
assert(!isPublicIP("not-an-ip"), "invalid string");

// ── Summary ──
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
