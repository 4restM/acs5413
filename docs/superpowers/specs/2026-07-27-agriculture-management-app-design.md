# Agriculture Management App Design

**Status:** Approved

**Source:** `live-session-class-activity/Agriculture_Vibe_Coding_Activity.md`

**Goal:** Build a complete, offline-first agriculture management MVP covering the mandatory Farm Map and Inventory features plus Plant Rotation, Money In/Out, and Local Weather.

**Target:** A new Expo SDK 54 application at `live-session-class-activity/agriculture-app/`.

## Product Scope

The application serves a single farm and a single local user. It does not require an account, cloud synchronization, multi-farm support, or a backend. SQLite is the canonical store for farm settings and all operational records. Only fresh weather data requires a network connection.

The five selected features are:

1. Farm Map with persistent markers
2. Inventory of Supplies
3. Plant Rotation
4. Money In/Out
5. Local Weather

The dashboard provides navigation to these features but is not counted as a sixth feature.

### Stakeholders

- Farm owner or manager, who maintains farm locations, supplies, crop history, and finances
- Field worker, who needs quick access to locations, inventory, and weather
- Bookkeeper, who reviews income and expense records
- Agronomist, a secondary stakeholder who may review crop-rotation history

### Core User Stories

- As a field worker, I can place and reopen farm markers so important locations remain available after the app restarts.
- As a farm manager, I can add, update, and remove supply records while offline.
- As a manager or agronomist, I can record and review crop cycles for each field.
- As a farm owner, I can record income and expenses and see the resulting balance.
- As a field worker, I can view weather for the farm or the last successful forecast when connectivity is unavailable.

## Constraints and Non-Goals

- Use Expo SDK 54, React Native, TypeScript, and Expo Router.
- Run in Expo Go without generated `ios/` or `android/` directories.
- Use `expo-sqlite` for persistent local storage.
- Use `react-native-maps` with the platform-default provider.
- Use Open-Meteo through ordinary `fetch` for weather.
- Keep all CRUD workflows usable offline.
- Do not add Redux, an ORM, authentication, cloud sync, or a custom backend.
- Do not request device location. “Local weather” means weather at the saved farm center.
- Do not add inventory movement history, purchasing, budgets, invoices, recurring transactions, accounting reports, crop recommendations, or automatic links between inventory and finance.
- Native basemap tiles are not guaranteed offline. Offline map support covers persisted marker data and the marker list.

## Architecture

The app uses a modular SQLite-backed architecture:

```text
live-session-class-activity/agriculture-app/
  src/
    app/
      _layout.tsx
      index.tsx
      map.tsx
      inventory.tsx
      rotation.tsx
      money.tsx
      weather.tsx
    components/
      form-modal.tsx
      screen-state.tsx
    constants/
      map.ts
      theme.ts
    db/
      migrate.ts
    features/
      farm/
        repository.ts
      map/
        repository.ts
      inventory/
        repository.ts
      rotation/
        repository.ts
      money/
        repository.ts
      weather/
        api.ts
        repository.ts
        types.ts
    utils/
      currency.ts
      validation.ts
```

The exact implementation plan may add focused test files beside these modules, but it must preserve the responsibility boundaries below:

- `src/app/` owns route rendering, local form state, navigation, and screen refresh.
- `src/db/migrate.ts` owns versioned schema initialization, pragmas, and seed data.
- Feature repositories own typed, parameterized SQLite queries.
- `weather/api.ts` is the only network boundary and owns request cancellation, response validation, and normalization.
- SQLite is canonical application state. A screen re-queries after a successful mutation and when it regains focus.
- Shared components remove repeated modal and loading/empty/error presentation without becoming a general UI framework.

The root route wraps the Stack with `SQLiteProvider`. Database initialization must finish successfully before feature routes render.

## Navigation and Screen Design

### Dashboard

The dashboard contains five accessible cards linking to the feature routes. Cards include a title and short description. Cross-feature analytics are deferred.

### Farm Map

- Open at the saved farm center.
- Show persisted markers for `field`, `equipment`, `storage`, and `other`.
- A visible Add Marker action enters placement mode; long-pressing the map is an optional shortcut.
- After selecting a coordinate, collect marker name, type, and optional notes.
- Tapping a marker or its corresponding list row opens edit and delete actions.
- Display a marker list beneath or alongside the map so records remain accessible to screen readers and when tiles are unavailable.
- “Save visible center as farm” stores the last settled map center in `farm_settings`.
- “Focus Farm” returns the map to the saved center.

### Inventory

- List supply name, category, quantity, and unit.
- Support add, edit, and confirmed delete.
- Permit zero quantity but not negative or nonnumeric quantity.
- Provide a clear empty state that leads to Add Supply.

### Plant Rotation

- Populate the field selector only from map markers whose type is `field`.
- Show the selected field’s crop cycles newest-first.
- Support add, edit, and confirmed delete for crop name, season, year, status, and notes.
- Limit status to `planned`, `growing`, or `complete`.
- If no field markers exist, show an explanation and a direct navigation action to Farm Map.
- Prevent deletion of a field that still has crop-cycle records.

### Money In/Out

- Display a computed balance above a chronological ledger.
- Support add, edit, and confirmed delete.
- Each entry contains `income` or `expense`, a positive amount, category, occurrence date, and optional note.
- Store amounts in integer cents and derive the balance with a SQL aggregate.

### Local Weather

- Show the saved farm name and weather-cache age.
- Show current temperature, apparent temperature, precipitation, weather condition, wind speed, and a three-day forecast.
- Render matching cached data immediately.
- Refresh automatically when the cache is absent or older than 30 minutes.
- Provide manual Retry.
- Clearly distinguish fresh, stale, and unavailable states with text rather than color alone.

## SQLite Design

Initialization enables:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
```

Schema evolution uses `PRAGMA user_version`. Version 1 creates the following tables.

### `farm_settings`

A singleton row with `id = 1`:

- `farm_name`
- `latitude`
- `longitude`
- `updated_at`

The initial seed uses the existing `hw7` Norman, Oklahoma map center. The user can replace it from Farm Map.

### `map_markers`

- `id`
- `name`
- `kind`
- `latitude`
- `longitude`
- `notes`
- `created_at`
- `updated_at`

Constraints reject blank names, invalid marker kinds, and coordinates outside valid latitude and longitude ranges.

### `supply_items`

- `id`
- `name`
- `category`
- `unit`
- `quantity`
- `created_at`
- `updated_at`

Quantity is finite and nonnegative.

### `crop_cycles`

- `id`
- `field_marker_id`
- `crop_name`
- `season`
- `year`
- `status`
- `notes`
- `created_at`
- `updated_at`

`field_marker_id` references `map_markers(id)` with `ON DELETE RESTRICT`. An index covers `field_marker_id` and `year`. The UI only offers field markers, and repository validation verifies the referenced marker remains a field. Multiple plantings for the same field and season are allowed.

### `cash_entries`

- `id`
- `kind`
- `amount_cents`
- `category`
- `occurred_on`
- `note`
- `created_at`
- `updated_at`

`kind` is `income` or `expense`, and `amount_cents` is a positive integer. The balance is calculated with `SUM(CASE ...)` rather than stored.

### `weather_cache`

A singleton row for the current farm coordinates:

- `id`
- `latitude`
- `longitude`
- `fetched_at`
- `payload_json`

Changing the farm center clears the cache so weather from a previous location cannot be mislabeled.

## Data and Mutation Flow

Every local mutation follows:

1. Normalize and validate form input.
2. Execute a parameterized repository write.
3. Re-query the authoritative SQLite state.
4. Close the form only after the write and refresh succeed.

Database constraints remain the final integrity layer. Failed writes preserve the user’s entered values.

Weather follows:

1. Read farm settings and any cache matching its coordinates.
2. Display matching cache immediately with its age.
3. When absent or older than 30 minutes, request Open-Meteo data with an eight-second timeout.
4. Validate numeric fields and array lengths.
5. Normalize only the required current conditions and three daily rows.
6. Replace the cache only after a valid response.
7. If refresh fails, retain stale data indefinitely and show a nonblocking warning.
8. If no cache exists, show an unavailable state with Retry.

Weather failure never blocks application startup or local CRUD.

## Validation and Error Handling

- Trim required strings and reject blank values.
- Validate latitude as `-90...90` and longitude as `-180...180`.
- Parse inventory quantities as finite numbers greater than or equal to zero.
- Require a field, crop name, season, valid year, and allowed status for crop cycles.
- Accept currency strings with at most two decimal places, then convert them to integer cents.
- Store user-entered dates as `YYYY-MM-DD`; do not add a date-picker dependency.
- Validate external weather data before use or caching.
- Bind all user values rather than interpolating SQL.
- Show field-level validation close to the affected input.
- Show concise, actionable database and network messages.
- Provide loading, empty, and error states on every feature route.
- Confirm destructive actions.
- Explain that a field’s crop cycles must be removed before the field can be deleted.
- Treat database initialization failure as a blocking error screen.

## Accessibility

- Use at least 44-point interaction targets.
- Give controls explicit accessibility labels, roles, states, and helpful hints.
- Keep focus order aligned with visual order and make forms keyboard-safe.
- Do not encode marker type, income versus expense, crop status, or weather state through color alone.
- Keep the marker list as the accessible alternative to map-only interaction.
- Announce successful save and delete actions to screen readers without stealing focus.

## Testing and Verification

This project explicitly does **not** use test-driven development. Implement each feature first, then add and run that feature’s tests before beginning the next feature. The implementation plan must not include intentionally failing tests or red-green-refactor steps.

Post-implementation tests cover:

- Input validation
- Currency parsing and formatting
- Ledger balance calculation
- Weather response normalization
- Weather cache freshness policy
- Empty and error screen states
- Invalid form submission
- Successful save behavior
- Preservation of form values after repository failure

Native SQLite persistence and map behavior receive Expo Go integration testing. Final verification includes:

```bash
npm test
npm run lint
npx tsc --noEmit
```

Manual acceptance checks cover:

- Fresh database initialization
- CRUD persistence after app restart
- Marker creation through visible placement controls
- Accessible marker-list operation with unavailable tiles
- Inventory quantity validation
- Field-only rotation linkage and restricted field deletion
- Accurate income/expense balance
- Farm-center update and weather-cache invalidation
- Fresh, stale, failed, and no-cache weather states
- Airplane-mode operation for all local CRUD features

## Risks and Mitigations

- **Map tiles are not reliably offline:** keep marker records and the marker list fully functional without tiles.
- **Map provider configuration can break Expo Go:** use the platform-default provider and the SDK-compatible package version.
- **Weather is an external dependency:** isolate it, time it out, validate it, and retain stale cache.
- **Rotation can grow into agronomy software:** limit it to historical and planned crop records.
- **Finance can grow into accounting software:** limit it to a local income/expense ledger and computed balance.
- **Five features can encourage oversized files:** keep route, repository, validation, and network responsibilities separate.

## Resolved Decisions

- Build all five features; do not constrain the plan to the activity’s 25-minute coding segment.
- Use a modular SQLite-backed architecture.
- Create the app under `live-session-class-activity/agriculture-app/`.
- Use saved farm coordinates rather than device location.
- Show a three-day forecast and cache it for 30 minutes.
- Implement features before writing their tests.
- No unresolved product or architecture questions remain.
