# HW7 Campus Marker Replacement Design

## Goal

Replace the BOK Center and Turner Falls entries in `hw7/src/constants/map.ts`
with markers for the centers of Oklahoma State University's main Stillwater
campus and the University of Central Oklahoma's main Edmond campus.

## Design

Keep the existing `MapMarker` type and `MARKERS` array structure. Update the two
marker objects in place:

- Replace `bok-center` with `osu-campus`, titled `Oklahoma State University`,
  described as its main campus in Stillwater, Oklahoma, at latitude `36.1224`
  and longitude `-97.0698`.
- Replace `turner-falls` with `uco-campus`, titled
  `University of Central Oklahoma`, described as its main campus in Edmond,
  Oklahoma, at latitude `35.65833` and longitude `-97.47194`.

The OU Stadium and Oklahoma State Capitol markers remain unchanged. The initial
and focus regions remain centered on the University of Oklahoma campus.

## Error Handling

No runtime error handling is needed because the markers are static typed data.
Keeping the existing object shape lets TypeScript continue checking every
marker.

## Verification

Run the project's lint command. Search the map constants to confirm that both
new IDs, titles, descriptions, and coordinate pairs are present and that the
old BOK Center and Turner Falls marker data is absent.
