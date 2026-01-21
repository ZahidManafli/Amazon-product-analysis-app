# eBay Dropshipping Market Analyzer

Web app to analyze Amazon products (via Rainforest API) for eBay dropshipping viability, with Firebase auth + Firestore storage.

## Environment variables (.env)

Create a `.env` file in the project root (next to `package.json`). Because this is a Vite app, variables must start with **`VITE_`**.

Required variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_RAINFOREST_API_KEY`

Setup guide (where to get each value): see [`docs/ENV_SETUP.md`](docs/ENV_SETUP.md).

## Run locally

```bash
npm install
npm run dev
```

## Disclaimer

This tool is for research purposes only. We are not affiliated with Amazon or eBay.
