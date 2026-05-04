#!/usr/bin/env node
/**
 * Quick validation script for the Review Booster Chrome extension.
 * Run: node validate.cjs
 */

const { readFileSync, existsSync } = require("fs");
const { join } = require("path");

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

// 1. Manifest
console.log("\n[1] Manifest");
const raw = readFileSync(join(__dirname, "manifest.json"), "utf-8");
let manifest;
try {
  manifest = JSON.parse(raw);
  assert(true, "Valid JSON");
} catch {
  assert(false, "Valid JSON");
  process.exit(1);
}

assert(manifest.manifest_version === 3, "Manifest version is 3");
assert(manifest.name, "Has name");
assert(manifest.version, "Has version");
assert(manifest.action?.default_popup, "Has popup");
assert(manifest.background?.service_worker, "Has service worker");
assert(manifest.content_scripts?.length > 0, "Has content scripts");
assert(
  manifest.content_scripts[0].matches.some((m) => m.includes("google.com/maps")),
  "Content script matches Google Maps"
);

// 2. File existence
console.log("\n[2] Required files");
const requiredFiles = [
  manifest.action.default_popup,
  "popup/popup.css",
  "popup/popup.js",
  manifest.background.service_worker,
  manifest.content_scripts[0].js[0],
  manifest.icons["16"],
  manifest.icons["48"],
  manifest.icons["128"],
];
for (const f of requiredFiles) {
  const filePath = join(__dirname, f);
  assert(existsSync(filePath), `${f} exists`);
}

// 3. Icon dimensions
console.log("\n[3] Icons");
const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
for (const [key, iconPath] of Object.entries(manifest.icons)) {
  const data = readFileSync(join(__dirname, iconPath));
  assert(data.slice(0, 8).equals(pngSig), `${iconPath} is a valid PNG`);

  const w = data.readUInt32BE(16);
  const h = data.readUInt32BE(20);
  const expected = parseInt(key, 10);
  assert(w === expected && h === expected, `${iconPath} is ${expected}x${expected}`);
}

// 4. Popup UI structure
console.log("\n[4] Popup UI");
const popupHTML = readFileSync(join(__dirname, manifest.action.default_popup), "utf-8");
assert(popupHTML.includes('id="status"') || popupHTML.includes('id="statusDot"'), "Has status indicator");
assert(popupHTML.includes('id="generateBtn"') || popupHTML.includes("generateBtn"), "Has Generate button");
assert(popupHTML.includes('id="statusText"'), "Has status text element");
assert(popupHTML.includes("popup.css"), "Links to popup.css");
assert(popupHTML.includes("popup.js"), "Links to popup.js");

// 5. Content script functionality
console.log("\n[5] Content script");
const contentJS = readFileSync(join(__dirname, manifest.content_scripts[0].js[0]), "utf-8");
assert(contentJS.includes("chrome.runtime.onMessage"), "Listens for messages");
assert(contentJS.includes("generateReview"), "Handles generateReview action");

// 6. CSP (security)
console.log("\n[6] Security");
assert(
  manifest.content_security_policy?.extension_pages,
  "Content Security Policy defined for extension pages"
);

// Summary
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
