# 🏪 StoreManager — Expo React Native App

A full-featured store management app built with Expo and React Native.

## Features

- **📊 Dashboard** — Weekly revenue chart (react-native-chart-kit), daily KPIs, top products, low stock alerts
- **📦 Stock Management** — Full CRUD for products, category filtering, search by name/barcode, low stock badges
- **📱 Barcode Scanner** — Camera-based barcode scan (EAN-13/8, QR, Code128, etc.) with sell modal, quantity picker
- **🧾 Sales History** — Grouped by date, filter by Today / This Week / All
- **⚙️ More** — Financial overview, inventory value summary

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo`
- Expo Go app on your phone (for quick testing)

### Install & Run

```bash
cd StoreManager
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS).

---

## Project Structure

```
StoreManager/
├── app/
│   ├── _layout.tsx          # Root layout (wraps StoreProvider)
│   ├── index.tsx            # Redirects to tabs
│   └── (tabs)/
│       ├── _layout.tsx      # Bottom tab navigator
│       ├── index.tsx        # Dashboard screen
│       ├── stock.tsx        # Inventory management
│       ├── scanner.tsx      # Barcode scanner + sell
│       ├── sales.tsx        # Sales history
│       └── settings.tsx     # Overview & info
├── components/
│   └── theme.ts             # Color palette & font styles
├── data/
│   └── StoreContext.tsx     # Global state (products, sales)
├── app.json                 # Expo config
└── package.json
```

---

## Barcode Testing

The app ships with sample products. Use one of these barcodes to test scanning:

| Barcode         | Product             |
|-----------------|---------------------|
| 7894900011517   | Coca-Cola 350ml     |
| 7896085400026   | Água Mineral 500ml  |
| 7891000100103   | Leite Integral 1L   |
| 7896006752711   | Arroz Branco 5kg    |
| 7896089011112   | Café Pilão 500g     |

You can print/display a barcode for any of the above and scan it with the app.

---

## Tech Stack

| Library | Purpose |
|---|---|
| `expo-router` | File-based navigation |
| `expo-camera` | Barcode scanning |
| `react-native-chart-kit` | Weekly revenue chart |
| `@expo/vector-icons` | Ionicons |
| `react-native-safe-area-context` | Safe area insets |

---

## Notes

- Data is stored **in-memory** only (resets on app restart). For persistence, swap `useState` in `StoreContext.tsx` with `AsyncStorage` calls.
- Camera permission is requested on first use of the Scanner tab.
