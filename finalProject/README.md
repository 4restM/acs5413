# MTG Trade Binder

An Expo/React Native app for comparing in-person Magic: The Gathering trade binders.

## Run the scaffold

```bash
npm install
npx expo start
```

The Phase 1 scaffold provides five dark-themed tabs: Home, Binder, Trade, Stores, and History.
See `PLAN.md` for the complete implementation roadmap.

`AllPrintings.sqlite` is a large local MTGJSON reference database. It is intentionally ignored
because the planned app uses Scryfall for card data and `expo-sqlite` only for a compact cache.
