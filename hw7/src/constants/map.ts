// All map coordinates constants live here.

export type MapMarker = {
  id: string;
  title: string;
  description: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
};

// University of Oklahoma campus, Norman OK.
const OU_CAMPUS = {
  latitude: 35.2058,
  longitude: -97.4457,
};

// The region the map opens on.
export const INITIAL_REGION = {
  ...OU_CAMPUS,
  latitudeDelta: 2.4,
  longitudeDelta: 3.4,
};

// Where the "Focus" button flies the camera to — the same center, but zoome down to street level over campus.
export const CAMPUS_REGION = {
  ...OU_CAMPUS,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// Four points of interest, all inside Oklahoma (Norman, State Cap, Edmond and Stillwater).
export const MARKERS: MapMarker[] = [
  {
    id: 'ou-stadium',
    title: 'Gaylord Family Oklahoma Memorial Stadium',
    description: 'BOOMER! — University of Oklahoma, Norman',
    coordinate: { latitude: 35.2058, longitude: -97.4422 },
  },
  {
    id: 'state-capitol',
    title: 'Oklahoma State Capitol',
    description: 'The capital for the state of Oklahoma.',
    coordinate: { latitude: 35.4923, longitude: -97.5032 },
  },
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
];
