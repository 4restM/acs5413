# MTG Trade Binder

An Expo/React Native app for comparing in-person Magic: The Gathering trade binders.

## Run the app

```bash
npm install
npx expo start
```

The app provides five dark-themed tabs: Home, Binder, Trade, Stores, and History. See `PLAN.md`
for the complete implementation roadmap.

## Firebase setup

1. Create a Firebase Realtime Database on the Spark plan.
2. Copy `.env.example` to `.env.local` and replace the sample value with the database URL.
3. Paste `database.rules.json` into the Realtime Database Rules tab and publish it.
4. Restart Expo after changing the environment file.

The first launch creates a device UUID in AsyncStorage and asks for a handle. Creating the
profile writes `/users/{uid}/profile` to Realtime Database. The UUID and handle remain on the
device so future launches skip onboarding.

## Card-data pipeline

Card lists can use plain, Moxfield, Arena, or MTGO-style lines. The pipeline normalizes names
into Firebase-safe keys, resolves metadata in batches through Scryfall, and stores results in a
small on-device SQLite cache. Scryfall requests use batches of at most 75 cards and wait 500 ms
between requests. Run the parser and normalization tests with `npm test`.

The Binder tab switches between haves and wants, searches locally, and opens cache-backed card
details. The import modal previews resolved cards before sending one Firebase `PATCH`; quantity
changes and removals are saved from the card-detail screen.

The Trade tab generates a small UUID-only QR code, scans QR codes with a guarded camera callback,
and includes a manual UUID field for simulator demos. A partner lookup compares both users' lists
by normalized card key and sends an immediate local notification when matches are found.

Matched cards can be selected by quantity and saved as a one-sided trade log. History is queried
by `loggedBy`, sorted newest-first, and supports pull-to-refresh. An optional follow-up multi-path
PATCH subtracts given cards from haves and received cards from wants; a second notification confirms
the recorded quantities.

## Store map

The Stores tab reads shared locations from `/stores`. An empty database receives a one-time,
idempotent seed of five verified Edmond and Oklahoma City shops. Native builds use
`react-native-maps` without a forced provider, request foreground-only location permission, and
show the device's current position. The web build provides the same store actions through a list
because `react-native-maps` is native-only.

Selecting a marker exposes actions to save it as the user's home store or carry its ID into the
next trade. The add-store modal validates coordinates and POSTs a community marker to Firebase.
Completed trades display their store name in History when a location was selected.

Search the source for `DISCUSSION POINT` to find concise comments explaining the more complex
Firebase object flattening, stable seed-key strategy, foreground location permission, and native
map-provider choice.

### Map demo checklist

1. Open Stores and grant location permission; confirm the user dot and five shop markers appear.
2. Tap a marker, set it as the home store, and confirm its pin turns gold.
3. Choose **Log a trade here** and confirm the Trade tab shows the selected shop.
4. Add a store with a name, address, latitude, and longitude; restart the app and confirm the
   marker remains.

`AllPrintings.sqlite` is a large local MTGJSON reference database. It is intentionally ignored
because the planned app uses Scryfall for card data and `expo-sqlite` only for a compact cache.
