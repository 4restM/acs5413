# hw9 — Offline Data Storage with SQLite

Expo Router app demonstrating full CRUD (create, read, update, delete) against
a local SQLite database via [`expo-sqlite`](https://docs.expo.dev/versions/latest/sdk/sqlite/),
styled in University of Oklahoma colors (crimson and cream).

Based on the video walkthrough and starter code:
- Video: [React Native Expo: Offline Data Storage with SQLite](https://youtu.be/vgPdAARd6Gw)
- Starter repo: [aaronksaunders/my-app-sqlite-no-template](https://github.com/aaronksaunders/my-app-sqlite-no-template)

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

Scan the QR code with Expo Go, or press `a`/`i` to open an Android/iOS
emulator.

## What it does

- `src/app/_layout.tsx` wraps the app in a `SQLiteProvider` and creates the
  `users` table (`id`, `name`, `email`, `image`) on first launch.
- `src/app/(tabs)/index.tsx` lists all users from SQLite and lets you **Edit**
  or **Delete** (with a confirmation prompt) each row.
- `src/app/modal.tsx` is the add/edit form — it inserts a new row or updates
  the existing one depending on whether an `id` was passed in.
- `src/constants/ou-theme.ts` holds the OU crimson/cream color tokens shared
  across the app.
