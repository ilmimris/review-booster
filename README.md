# Review Booster

AI-powered Chrome extension for generating Google Maps reviews.

## Structure

```
├── manifest.json          # Manifest V3 configuration
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
├── content/
│   └── content.js         # Content script (injected on Google Maps)
├── background/
│   └── service-worker.js  # Background service worker
└── icons/                 # Extension icons (16/48/128px)
```

## Testing

```bash
# Run all tests (validation + unit tests)
bash test.sh

# Or run individually:
node validate.cjs          # Structural validation (31 checks)
node popup/popup.test.cjs  # Unit tests (41 checks)
```

## Installation

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked** → select this project directory
4. Navigate to [Google Maps](https://www.google.com/maps)
5. Click the extension icon to open the popup

## Usage

- The popup displays your public IP and connection safety status:
  - **Aman** (green) — safe public IP detected, ready to generate
  - **Bahaya** (red) — private/local IP detected, use a safer network
- Navigate to Google Maps to enable the **Generate** button
- Click **Generate** to trigger review generation on the current place
- A toast notification appears on the Maps page confirming the action

## License

See LICENSE file.
