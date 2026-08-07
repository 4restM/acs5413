import type { Store } from '@/types/store';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type StoreMapProps = {
  stores: Store[];
  homeStoreId: string | null;
  selectedStoreId: string | null;
  showsUserLocation: boolean;
  userCoordinate: MapCoordinate | null;
  onSelectStore: (store: Store) => void;
};
