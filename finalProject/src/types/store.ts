export type StoreRecord = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  addedBy: string;
  createdAt: string;
};

export type Store = StoreRecord & {
  id: string;
};

export type NewStore = Pick<StoreRecord, 'name' | 'address' | 'lat' | 'lng'>;

export type SeedStore = NewStore & {
  id: string;
};
