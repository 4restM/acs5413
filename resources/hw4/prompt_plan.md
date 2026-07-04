# Implementation Plan: HW4 — Grid Layout App Launcher (Expo / React Native)

> Executor: implement exactly this plan. No code exists yet — `hw4/` is empty. Reference image: `resources/hw4/Grid Layout.png` (mimic the right/"Grid" panel).

## Requirements
- Home screen mimics the iOS Assistive Access **2-column grid**: rounded white cards, large icon on top, app name below, on a light gray background.
- **8 apps** (4 even rows): Calls, Camera, Messages, Music, Photos, **Discord, Slack, Teams**.
- Tapping a card uses **dynamic screen navigation** to a detail screen showing a per-app message.
- Detail screen has a **visible back button at the top** returning to home.
- Core techniques being graded: **Flexbox** + **FlatList with `numColumns={2}`**.
- Runs in **Expo Go** (SDK 54, expo-router, TypeScript) — no `ios/`/`android/` dirs. Match hw3 conventions (`src/` layout, `@/` alias, kebab-case component files).

## Key Decisions (settled — do not relitigate)
1. **Routing:** single dynamic route `src/app/[appId].tsx` with `useLocalSearchParams<{ appId: string }>()` — one route template resolving 8 destinations from a runtime param. Not 8 static screens, no route group.
2. **Back button:** native Stack header. In `_layout.tsx`: `index` gets `headerShown: false`, `[appId]` gets `headerShown: true`. The platform back chevron satisfies "visible back button at top" with zero custom code. Set the title dynamically inside `[appId].tsx` via `<Stack.Screen options={{ title: app.label }} />`.
3. **Grid:** `FlatList` with `numColumns={2}`, `keyExtractor={(item) => item.id}`, `columnWrapperStyle={{ gap: 12 }}` (column gap), `contentContainerStyle={{ gap: 12, padding: 16 }}` (row gap + outer padding). Cards use `flex: 1` + `aspectRatio: 1` — square, responsive, **no `Dimensions.get()` or hardcoded widths**.
4. **Icons:** `@expo/vector-icons` (bundled with Expo — no install, no image downloads). Ionicons for 7 apps; MaterialCommunityIcons only for Teams. Render via a small switch on `iconSet`.
5. **Look:** iOS system colors, not OU theme — screen background `#F2F2F7`, white cards, dark label text. Do **not** reuse/overload `ou-theme.ts`; use a small `src/constants/colors.ts`.
6. **Messages are data**, not derived — the assignment's examples are non-uniform ("Make calls from Here" vs "Welcome to the Photos Screen").
7. **Safe areas:** `SafeAreaView` from `react-native-safe-area-context` (not RN core) on the grid screen; the Stack header already handles the top inset on the detail screen — don't double-pad. Add `<StatusBar style="dark" />` from `expo-status-bar`.

## Target File Structure
```
hw4/
  app.json                # slug hw4; typedRoutes on (match hw3)
  package.json            # expo ~54, expo-router ~6 (match hw3 versions)
  tsconfig.json           # "@/*" -> "./src/*"
  src/
    app/
      _layout.tsx         # Stack; index headerShown:false, [appId] headerShown:true
      index.tsx           # grid home: FlatList numColumns={2}
      [appId].tsx         # dynamic detail screen (param lookup + fallback)
    components/
      app-card.tsx        # the ONLY extracted component
    constants/
      apps.ts             # AppItem type + APPS array
      colors.ts           # { background: '#F2F2F7', card: '#FFFFFF', label: '#1A1A1A', muted }
```

## Data Model (`src/constants/apps.ts`)
```ts
export type IconSet = 'ionicons' | 'material-community';

export type AppItem = {
  id: string;       // URL-safe slug, matches [appId] param
  label: string;    // card label
  message: string;  // detail-screen text
  iconSet: IconSet;
  iconName: string; // glyph name (string; `as any` at the icon call site is acceptable)
  tint: string;     // per-app icon color
};

export const APPS = [...] as const satisfies readonly AppItem[];
```

| id | label | iconSet | iconName | tint | message |
|---|---|---|---|---|---|
| calls | Calls | ionicons | `call` | `#34C759` | Make calls from Here |
| camera | Camera | ionicons | `camera` | `#8E8E93` | Welcome to the camera app |
| messages | Messages | ionicons | `chatbubble` | `#34C759` | Welcome to your Messages |
| music | Music | ionicons | `musical-notes` | `#FA243C` | Welcome to the Music Selection Screen |
| photos | Photos | ionicons | `images` | `#F148A0` | Welcome to the Photos Screen |
| discord | Discord | ionicons | `logo-discord` | `#5865F2` | Welcome to your Discord servers |
| slack | Slack | ionicons | `logo-slack` | `#4A154B` | Welcome to your Slack workspace |
| teams | Teams | material-community | `microsoft-teams` | `#464EB8` | Welcome to Microsoft Teams |

**Detail-route lookup (untrusted param — validate at the boundary):**
```tsx
const { appId } = useLocalSearchParams<{ appId: string }>();
const app = APPS.find((a) => a.id === appId);
if (!app) return <Redirect href="/" />;  // or a small "App not found" view
```
Navigate from the grid with `router.push(`/${item.id}`)`.

## Phases

### Phase 1 — Scaffold `hw4/`
- `npx create-expo-app@latest hw4` (SDK 54, matches hw3's `expo ~54.0.34` / RN 0.81.5), then run the reset/strip and reshape to `src/` layout: `src/app/`, `src/components/`, `src/constants/`; set `"@/*": ["./src/*"]` in `tsconfig.json`. No extra deps needed (`@expo/vector-icons`, `react-native-safe-area-context`, `expo-status-bar` all ship with the scaffold).
- **Acceptance:** `npm install` succeeds; `npx tsc --noEmit` and `npm run lint` clean; `npx expo start` boots.

### Phase 2 — Constants
- `src/constants/colors.ts` (iOS palette above) and `src/constants/apps.ts` (type + 8-item table above).
- **Acceptance:** `npx tsc --noEmit` passes; 8 items, unique ids.

### Phase 3 — Grid home screen (core objective)
- `src/components/app-card.tsx`: kebab-case file, `type Props = { app: AppItem; onPress: () => void }`, default export, `StyleSheet.create` at bottom (match hw3's `todo-item.tsx` conventions). `TouchableOpacity` root with `flex: 1`, `aspectRatio: 1`, white bg, `borderRadius ~16`, subtle shadow/elevation, centered icon (`size ~44`) over label. Add `accessibilityRole="button"` and `accessibilityLabel={app.label}`.
- `src/app/index.tsx`: `SafeAreaView` (safe-area-context, edges top/left/right) + a simple screen title + the `FlatList` per Decision 3. `onPress` → `router.push(`/${item.id}`)`.
- **Acceptance:** 2-column grid of 8 white cards on gray background visually matching the reference; even columns/gaps; `tsc` + lint clean.

### Phase 4 — Dynamic detail screen
- `src/app/_layout.tsx`: `Stack` with the two `Stack.Screen` entries per Decision 2.
- `src/app/[appId].tsx`: param lookup per the snippet above; render label + `message` centered; `<Stack.Screen options={{ title: app.label }} />` for the dynamic header title (back button comes free).
- **Acceptance:** tapping each card opens its message; back button visible at top and returns home; unknown param (`/nonsense`) handled safely without a crash; `tsc` + lint clean.

### Phase 5 — Polish + verification
- Compare against `resources/hw4/Grid Layout.png`: card radius, icon size, spacing, shadow.
- **Full verification (required before claiming done):** `npx tsc --noEmit` → 0 errors; `npm run lint` → 0 errors; manual Expo Go run confirming grid render, all 8 icons visible (esp. the three brand glyphs), all 8 navigations + back button.

## Pitfalls (from architecture review)
- FlatList **is** the scroll container — never nest it in a ScrollView.
- Odd-item-count note: 8 is even, but `flex: 1` cards + `gap` (not `justifyContent: 'space-between'`) is the pattern that also survives odd counts without a stretched last card.
- If a brand glyph name is wrong it renders blank — verify `logo-discord`, `logo-slack`, `microsoft-teams` exist in the installed sets during Phase 2/5.
- hw3's `AGENTS.md` points at Expo v56 docs but the project is SDK 54 — read the **v54** docs.

## Overengineering to avoid
No custom back button/header, no route groups, no `Dimensions.get()`, no state library, no extra components beyond `app-card.tsx`, no OU theming.

## Verification Strategy
No test runner exists in this repo. Gates: `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), manual Expo Go run. Every completion claim must cite a fresh run of these commands.

## Estimated Complexity: LOW
~6 short files; the only Medium-effort spots are FlatList grid spacing (the learning objective) and dynamic-route wiring.

---

## Previous Plan

# Implementation Plan: HW3 — OU TO-DO List (Expo / React Native)

## Requirements
- TODO list app (student organizing tasks), **core RN components only**, no 3rd-party UI libs.
- Demonstrate **FlatList** (scrollable list) and a **Modal** (add-item dialog).
- **Add** and **delete** items.
- Integrate an **OU logo image** + style UI in **OU colors** with good contrast.
- Runs in **Expo Go** on iOS.
- Deliverables (user): Kaltura/OneDrive demo video link + GitHub link.

## Decisions
- **Logo:** user provides OU logo PNG in `hw3/assets/images/`. Wire in with placeholder guard so app runs before file lands.
- **Scaffold:** `create-expo-app` default (SDK 54, expo-router, TS) matching hw1, stripped to a single screen.

*(hw3 is complete — see git history for the implemented result.)*
