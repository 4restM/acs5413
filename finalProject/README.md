# MTG Trade Binder

MTG Trade Binder is an Expo/React Native app for comparing in-person Magic: The Gathering
trade binders. Players import cards they have and want, exchange a small device-ID QR code,
view matches in both directions, record the completed trade, and find nearby card shops.

## Features

- Persistent device identity and trade handle with AsyncStorage
- Moxfield, Arena, MTGO, and plain-text card-list imports
- Scryfall metadata lookup with a small on-device SQLite cache
- Firebase-backed haves, wants, profiles, trades, and shared stores
- QR generation, guarded camera scanning, and manual UUID fallback
- Bidirectional card and quantity matching
- Two immediate local notifications: match found and trade recorded
- Optional binder quantity adjustment after a completed trade
- Trade history with pull-to-refresh and optional store location
- Native shop map, foreground user location, home-store selection, and add-store form
- Web-safe store-list fallback because `react-native-maps` is native-only
- Loading, empty, stale-data, validation, and network-error states

## Requirements

- A current Node.js/npm installation
- Expo Go compatible with Expo SDK 54
- A free Firebase project using Realtime Database
- Internet access for Firebase, Scryfall, and remote card images
- A physical iOS or Android device for the complete QR-camera demonstration

The simulator or web build can exercise the match workflow through the manual partner UUID
field. Map and location behavior are best verified on a physical device.

## Firebase setup

1. Create a Firebase project on the free **Spark** plan.
2. Open **Build → Realtime Database → Create Database**.
3. Copy `.env.example` to `.env.local`.
4. Replace the example value with the database URL. Keep the variable name unchanged:

   ```dotenv
   EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   ```

5. Copy `database.rules.json` into the Firebase Realtime Database **Rules** tab and publish it.
6. Restart Expo with a cleared bundler cache after adding or changing the URL.

   ```bash
   npx expo start -c
   ```

### Security limitation

The included database rules intentionally allow public reads and writes. Reading another user's
binder is required by this no-authentication classroom prototype, but these rules are **not safe
for a production app**. A production version should use Firebase Authentication and rules that
validate ownership, field shapes, and allowed trade-partner access.

## Install and run

```bash
npm install
npx expo start
```

Scan the terminal QR code with Expo Go, or press the terminal shortcut for an available platform.

Quality checks:

```bash
npm run lint
npm run typecheck
npm test
npx expo export --platform web
npx expo export --platform ios
```

## Suggested demo data

The import screen accepts quantities, optional `x`, set codes, collector numbers, section labels,
comments, and double-faced names. For example:

```text
Deck
4 Lightning Bolt
2x Counterspell (2XM) 50
1 Sol Ring
1 Delver of Secrets // Insectile Aberration (MID) 47
```

For a bidirectional match, one identity needs at least one card in `haves` that appears in the
other identity's `wants`, and vice versa.

## Seeded demo trader

Firebase contains a ready-to-scan test account with 45 unique cards, each at quantity one:

- **Handle:** `@demo-trader-45`
- **Device UUID:** `54130000-0000-4000-8000-000000000045`
- **Binder:** 25 haves and 20 wants

Scan this code from the app's **Trade → Scan** screen. Display the README on another screen so the
phone camera can see it. On a simulator or the same physical device, paste the UUID into the manual
partner field instead.

<img src="assets/demo-trader-45-qr.png" alt="QR code for the demo-trader-45 UUID" width="320" />

### Demo account cards

| Haves (25) | Wants (20) |
|---|---|
| Lightning Bolt | Swords to Plowshares |
| Counterspell | Llanowar Elves |
| Sol Ring | Birds of Paradise |
| Arcane Signet | Dockside Extortionist |
| Command Tower | Cyclonic Rift |
| Path to Exile | Demonic Tutor |
| Beast Within | Vampiric Tutor |
| Chaos Warp | Smothering Tithe |
| Cultivate | Teferi's Protection |
| Kodama's Reach | Jeska's Will |
| Rhystic Study | Esper Sentinel |
| Mystic Remora | Deflecting Swat |
| Swiftfoot Boots | Fierce Guardianship |
| Lightning Greaves | The Great Henge |
| Reliquary Tower | Mana Drain |
| Farseek | Toxic Deluge |
| Nature's Lore | Austere Command |
| Brainstorm | Farewell |
| Ponder | Boseiju, Who Endures |
| Dark Ritual | Otawara, Soaring City |
| Sign in Blood | — |
| Blasphemous Act | — |
| Vandalblast | — |
| Heroic Intervention | — |
| Eternal Witness | — |

### Guaranteed bidirectional match

Import these cards into **your Wants** so the demo trader has cards for you:

```text
1 Lightning Bolt
1 Counterspell
1 Sol Ring
```

Import these cards into **your Haves** so you have cards the demo trader wants:

```text
1 Swords to Plowshares
1 Llanowar Elves
1 Birds of Paradise
```

Scanning the demo QR will then produce six possible matches: three in each direction. It also
triggers the first local notification. Select at least one card on the log-trade screen and save
to test Firebase trade persistence and the second notification.

The account can be recreated from the documented lists and current Scryfall metadata with:

```bash
npm run seed:demo
```

The seed command refuses to overwrite an existing demo account. Use
`npm run seed:demo -- --force` only when you intentionally want to reset it.

### Reset before recording

Development builds show a **Recording tools** card at the bottom of Home. Choose
**Reset recording state → Reset** to generate a fresh device UUID and return immediately to
handle onboarding. The reset clears only the app's local UUID, handle, home-store selection, and
in-memory contexts. It deliberately preserves Firebase records, permissions, the SQLite card
cache, shared stores, and `@demo-trader-45`. The card is guarded by `__DEV__` and is omitted from
production bundles.

## Demonstration walkthrough

1. Launch the app, choose a handle, and show the stable device UUID on onboarding or the Trade tab.
2. Import the sample cards into **Haves**, then import a second list into **Wants**.
3. Open Binder, search for a card, open its detail screen, and adjust its quantity.
4. On a second device, create a different identity and import overlapping lists. If only one
   device is available, paste a partner UUID whose Firebase data has already been prepared.
5. Scan or paste the UUID. Explain the two match directions and show notification #1.
6. Select exchanged quantities, optionally adjust the binder, save, and show notification #2.
7. Open History and verify the newest trade appears first.
8. Open Stores, grant foreground location, select a marker, set a home store, and choose
   **Log a trade here** to carry that store into the next trade.
9. Add a store and relaunch to demonstrate Firebase persistence.

## Architecture and data flow

The project uses Expo Router for a protected root stack and five bottom tabs. Context providers
keep identity, binder, store, and trade state available to every route. Network operations remain
in `src/lib/api.ts`; screens do not construct Firebase paths themselves.

Card import follows this sequence:

```text
Pasted list → tolerant parser → canonical card key → SQLite cache lookup
            → Scryfall batches for cache misses → preview → one Firebase PATCH
```

Trade matching follows this sequence:

```text
Partner UUID → one partner-node GET → intersect my wants/their haves
                                   → intersect their wants/my haves
                                   → local notification → optional trade POST
```

### Realtime Database shape

```text
/users/{uid}/profile             { handle, createdAt, homeStoreId }
/users/{uid}/haves/{cardKey}     { name, qty, setCode, scryfallId, imageSmall }
/users/{uid}/wants/{cardKey}     { name, qty, setCode, scryfallId, imageSmall }
/trades/{tradeId}                { loggedBy, partnerUid, given, received, storeId, notes, createdAt }
/stores/{storeId}                { name, address, lat, lng, addedBy, createdAt }
```

Firebase returns keyed objects rather than arrays. The binder, trade, and store helpers preserve
each Firebase key as a local `cardKey` or `id` while flattening those objects for React Native
lists.

## Rubric checklist

| Requirement | Implementation |
|---|---|
| Functional program | Strict TypeScript, ESLint, automated tests, and Expo export verification |
| Home plus three screens | Five tabs plus onboarding, import, card, match, log-trade, and add-store routes |
| `View`, `Text`, `StyleSheet` | Used throughout every screen and reusable component |
| `Image` | Card thumbnails in `card-row.tsx` and full card art in `card/[cardKey].tsx` |
| `TextInput` | Handle, import, binder search, manual UUID, trade notes, and add-store forms |
| `Button` | Permission, retry, parse, current-location, cancel, and modal actions |
| Integrated map | `store-map.native.tsx` with Firebase markers and live foreground location |
| Local notifications | Match result and successful trade in `match/[partnerUid].tsx` and `log-trade.tsx` |
| Firebase persistence | Profiles, binders, trades, stores, and home-store selection through REST/axios |
| External API | Batched Scryfall card resolution with required headers and pacing |
| Local persistence | AsyncStorage identity plus SQLite Scryfall metadata cache |
| Styling and interaction | Shared dark MTG theme, responsive lists, forms, steppers, QR, camera, and map actions |

## Code discussion points

Search the source for `DISCUSSION POINT`. These comments mark the best sections to explain:

- `normalize.ts`: one canonical, Firebase-safe key controls imports and both match directions.
- `match.ts`: Map-based intersections and minimum available/requested quantities.
- `scryfall.ts`: cache misses, 75-card batches, sequential requests, and rate pacing.
- `binder.ts`: one atomic multi-path Firebase PATCH for post-trade adjustments.
- `notifications.native.ts`: foreground presentation and Android channel behavior.
- `match/[partnerUid].tsx`: a ref prevents duplicate notifications when effects rerun.
- `stores.ts` and `api.ts`: Firebase object flattening and idempotent stable seed keys.
- `map.tsx` and `store-map.native.tsx`: foreground-only permission and provider-free native maps.

## Notifications

`configureNotifications()` runs once from the root layout. It creates a high-importance Android
channel, requests permission, and installs a handler so notifications are visible while the app
is in the foreground. `sendLocalNotification()` checks permission again and fails gracefully if
notifications were denied.

The two triggers are:

1. A successful partner comparison with one or more possible matches.
2. A successfully saved trade, after the Firebase POST completes.

These are local device notifications, not remote push notifications, so no Expo push token or
notification server is required.

## Error and offline behavior

- Missing Firebase configuration produces a specific setup message.
- Network and timeout failures are converted into readable retry guidance.
- Home, Binder, and History retain already-loaded data and display a stale-data warning.
- Binder and History support pull-to-refresh; Home refreshes all Firebase datasets together.
- Card metadata already in SQLite remains available without another Scryfall lookup.
- New Firebase writes still require a connection; this prototype does not queue offline writes.

## Known limitations

- Clearing app data or reinstalling Expo Go removes the local UUID and can orphan that binder.
- Identity is device-based and has no login, recovery, or cross-device account sync.
- Trade logs are one-sided; the partner does not confirm the record.
- Matching is by canonical card name, not edition, foil treatment, condition, or language.
- Scryfall prices are reference values and may be missing or delayed.
- The map's shared add-store form trusts user-entered coordinates.
- QR camera scanning, maps, location, and notification presentation vary by platform and should
  be demonstrated on the target physical device before submission.

`AllPrintings.sqlite` in the project folder is a large MTGJSON reference database. It is ignored
by Git and intentionally unused at runtime: Scryfall supplies current card metadata while
`expo-sqlite` stores only the compact cache needed by this app.
