import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// AsyncStorage is flat, so prefix our keys.
const UID_STORAGE_KEY = 'mtgtb:uid';
const HANDLE_STORAGE_KEY = 'mtgtb:handle';
const HOME_STORE_STORAGE_KEY = 'mtgtb:home-store';

export type LocalIdentity = {
  uid: string;
  handle: string | null;
  homeStoreId: string | null;
};

export async function loadOrCreateIdentity(): Promise<LocalIdentity> {
  const storedValues = await AsyncStorage.multiGet([
    UID_STORAGE_KEY,
    HANDLE_STORAGE_KEY,
    HOME_STORE_STORAGE_KEY,
  ]);
  const storedUid = storedValues[0][1];
  const storedHandle = storedValues[1][1];
  const storedHomeStoreId = storedValues[2][1];

  const uid = storedUid || Crypto.randomUUID();
  if (!storedUid) {
    await AsyncStorage.setItem(UID_STORAGE_KEY, uid);
  }

  return {
    uid,
    handle: storedHandle?.trim() || null,
    homeStoreId: storedHomeStoreId?.trim() || null,
  };
}

export async function saveLocalHandle(handle: string) {
  await AsyncStorage.setItem(HANDLE_STORAGE_KEY, handle);
}

export async function saveLocalHomeStore(homeStoreId: string) {
  await AsyncStorage.setItem(HOME_STORE_STORAGE_KEY, homeStoreId);
}

export async function resetLocalIdentity(): Promise<LocalIdentity> {
  const uid = Crypto.randomUUID();
  await AsyncStorage.multiRemove([HANDLE_STORAGE_KEY, HOME_STORE_STORAGE_KEY]);
  await AsyncStorage.setItem(UID_STORAGE_KEY, uid);
  return { uid, handle: null, homeStoreId: null };
}
