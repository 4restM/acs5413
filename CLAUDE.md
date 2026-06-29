# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Repository Structure

This is a mobile development class repo (ACS 5413). Each assignment lives in its own top-level directory (`hw1/`, `hw2/`, `hw3/`, etc.).

- **hw1**: Expo / React Native (Expo Go) — TypeScript, expo-router
- **hw2**: Native Android (Kotlin/Compose) — Android AVD only, no Expo
- **hw3+**: Expo / React Native (Expo Go) — default for all future assignments

## Expo Projects (hw1, hw3+)

All Expo projects target **Expo Go** for development. Do not generate native build configs (`ios/`, `android/`) unless the assignment explicitly requires it.

### Commands (run from the assignment directory)

```bash
npm install          # install dependencies
npx expo start       # start dev server (scan QR with Expo Go)
npx expo start --android  # open in Android emulator
npx expo start --ios      # open in iOS simulator
npm run lint         # run ESLint via expo lint
npx tsc --noEmit     # type-check without building
```

There is no test runner configured in any assignment yet.

### Architecture — Expo Projects

All Expo projects use **expo-router** (file-based routing). The canonical layout:

```
app/
  _layout.tsx          # root Stack navigator; wraps everything in ThemeProvider
  (tabs)/
    _layout.tsx        # bottom-tab navigator
    index.tsx          # Home screen
    explore.tsx        # Explore screen
  modal.tsx            # modal screen (presentation: 'modal')
components/            # shared UI primitives
  ui/                  # platform-specific icons (icon-symbol.tsx / .ios.tsx)
constants/
  theme.ts             # Colors (light/dark) and Fonts (Platform.select)
hooks/
  use-color-scheme.ts  # wraps RN useColorScheme; .web.ts for web override
  use-theme-color.ts   # resolves a color key against the active scheme
```

Path alias `@/` maps to the project root (configured in `tsconfig.json`).

Dark/light theming flows through `useColorScheme` → `ThemeProvider` → `ThemedText` / `ThemedView`. Use `useThemeColor` to pull a color token from `constants/theme.ts` in new components.

**Expo version note:** hw1 targets Expo SDK 54. Always read versioned docs at `https://docs.expo.dev/versions/v54.0.0/` before writing Expo-specific code — APIs change across SDK versions.

## Android Project (hw2)

hw2 is a pure Kotlin/Compose Android project built with Gradle. Run from the `hw2/` directory or use Android Studio with an AVD.

```bash
./gradlew assembleDebug    # build debug APK
./gradlew installDebug     # install to connected device/emulator
```

## Decision Rules

**Handle uncertainty by type:**
- **(a) Uncertain what to build** (intent, architecture, requirements): if the decision is costly to reverse (schema, public API, security), ask before writing code. If it's cheap to reverse, proceed on the most reasonable interpretation and record the assumption.
- **(b) Uncertain whether something works** (an approach, a library behavior, a performance assumption): don't ask — run a small, localized, low-risk experiment yourself, then bring me the hypothesis and result.

Never proceed silently under either branch.

**Implement the most direct solution that fully solves the problem, scaling rigor to its difficulty** — trivial fixes get minimal code, harder problems get more careful design. Never strip, hide, bypass, or weaken existing behavior (UI states, validation, error handling, etc.) to reduce the amount of code written. Don't add speculative abstraction or defensive code for needs that don't exist yet. For complex problems, state your approach and trade-offs before writing code.

**Stay in scope.** Don't touch code unrelated to the task, except where a change is genuinely necessary for the fix to be correct (e.g. a type signature or interface used elsewhere) — that's in scope.

I'm always open to better ways of doing things, especially when the impact is long-lasting rather than tactical — don't hesitate to suggest them. Keep pushback bounded: flag real deviations from standards or genuine risks, don't relitigate minor style preferences.
