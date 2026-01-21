# Environment setup (.env)

This project uses **Vite**, so any environment variable you want available in the frontend must start with **`VITE_`**.

## 1) Create your `.env` file

In the project root (same folder as `package.json`), create a file named **`.env`** with:

```bash
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."

VITE_RAINFOREST_API_KEY="..."
```

After changing `.env`, restart `npm run dev`.

## 2) Where to get Firebase values

These values come from your **Firebase Web App config**.

1. Go to the Firebase console for your project.
2. Click the gear icon → **Project settings**.
3. Scroll to **Your apps**.
4. If you don’t have a Web App yet, click **Add app** → choose **Web** (`</>`).
5. In the Web App section, find **Firebase SDK snippet** → choose **Config**.
6. Copy values from the config object into your `.env`:

- `apiKey` → `VITE_FIREBASE_API_KEY`
- `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
- `projectId` → `VITE_FIREBASE_PROJECT_ID`
- `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
- `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `appId` → `VITE_FIREBASE_APP_ID`

## 3) Where to get Rainforest API key

1. Log in to your Rainforest API dashboard/account.
2. Go to **API keys** (or the account settings/billing area where keys are shown).
3. Copy your key into:

- `VITE_RAINFOREST_API_KEY`

## 4) Notes (important)

- Do **not** commit `.env` to git.
- In production, set these variables in your hosting provider’s environment settings.
- This app does **not** scrape Amazon directly; it uses Rainforest API only.

