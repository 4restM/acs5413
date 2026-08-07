import type { SeedStore } from '@/types/store';

// Coordinates were verified against the stores' current street addresses in August 2026.
// Stable IDs let multiple first-run devices seed the same Firebase keys without duplicates.
export const SEED_STORES: SeedStore[] = [
  {
    id: 'edmond-unplugged',
    name: 'Edmond Unplugged',
    address: '117 S Broadway, Edmond, OK 73034',
    lat: 35.653664,
    lng: -97.48156,
  },
  {
    id: 'pack-smashers',
    name: 'Pack Smashers Cards & Collectibles',
    address: '105 W 15th St, Edmond, OK 73013',
    lat: 35.6382059,
    lng: -97.4857727,
  },
  {
    id: 'breakpoint-edmond',
    name: 'Breakpoint Cards & Collectibles — Edmond',
    address: '1241 E Danforth Rd, Edmond, OK 73034',
    lat: 35.6671195,
    lng: -97.4642557,
  },
  {
    id: 'breakpoint-okc',
    name: 'Breakpoint Cards & Collectibles — OKC',
    address: '1609 N Blackwelder Ave, Oklahoma City, OK 73106',
    lat: 35.4851948,
    lng: -97.538991,
  },
  {
    id: 'game-hq',
    name: 'Game HQ',
    address: '9118 S Western Ave, Oklahoma City, OK 73139',
    lat: 35.3757861,
    lng: -97.5279883,
  },
];
