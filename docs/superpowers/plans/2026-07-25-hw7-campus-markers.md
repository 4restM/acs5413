# HW7 Campus Marker Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the BOK Center and Turner Falls map markers with campus-center markers for OSU Stillwater and UCO Edmond.

**Architecture:** Keep the existing typed `MARKERS` array and replace two inline objects. No new abstractions, runtime dependencies, or map behavior are needed.

**Tech Stack:** TypeScript, React Native, Expo, ESLint

---

### Task 1: Replace the two map markers

**Files:**
- Modify: `hw7/src/constants/map.ts:49`
- Verify: `hw7/src/constants/map.ts`

- [x] **Step 1: Run a focused assertion and verify it fails before the edit**

Run:

```bash
node -e 'const fs=require("fs");const s=fs.readFileSync("src/constants/map.ts","utf8");for(const value of ["id: \u0027osu-campus\u0027","title: \u0027Oklahoma State University\u0027","latitude: 36.1224","longitude: -97.0698","id: \u0027uco-campus\u0027","title: \u0027University of Central Oklahoma\u0027","latitude: 35.65833","longitude: -97.47194"]){if(!s.includes(value))throw new Error("Missing expected map value: "+value)}'
```

Working directory: `hw7`

Expected: nonzero exit with `Missing expected map value: id: 'osu-campus'`
because the requested markers have not been added yet.

- [x] **Step 2: Replace the BOK Center and Turner Falls marker objects**

In `hw7/src/constants/map.ts`, replace the two existing objects with:

```typescript
  {
    id: 'osu-campus',
    title: 'Oklahoma State University',
    description: 'Main campus in Stillwater, Oklahoma',
    coordinate: { latitude: 36.1224, longitude: -97.0698 },
  },
  {
    id: 'uco-campus',
    title: 'University of Central Oklahoma',
    description: 'Main campus in Edmond, Oklahoma',
    coordinate: { latitude: 35.65833, longitude: -97.47194 },
  },
```

- [x] **Step 3: Run the focused assertion and verify it passes**

Run the Step 1 command again from `hw7`.

Expected: exit code `0` with no output.

- [x] **Step 4: Confirm the old marker data is absent**

Run:

```bash
if rg -n "bok-center|BOK Center|turner-falls|Turner Falls" src/constants/map.ts; then exit 1; fi
```

Working directory: `hw7`

Expected: exit code `0` with no output.

- [x] **Step 5: Run project verification**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Working directory: `hw7`

Expected: both commands exit `0` with no lint or TypeScript errors.

- [x] **Step 6: Review the scoped diff**

Run:

```bash
git diff --check -- hw7/src/constants/map.ts
git diff --no-index /dev/null hw7/src/constants/map.ts
```

Working directory: repository root

Expected: no whitespace errors; because `hw7` is currently untracked, the
no-index diff shows the full file with only the intended final marker data.
