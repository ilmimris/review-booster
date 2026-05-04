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

## Installation

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked** → select this project directory
4. Navigate to [Google Maps](https://www.google.com/maps)
5. Click the extension icon to open the popup

## Usage

- The popup status indicator turns **green** when on a Google Maps page
- Click **Generate** to trigger review generation on the current place
- A toast notification appears on the Maps page confirming the action

## License

See LICENSE file.
