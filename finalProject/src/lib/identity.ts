import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const UID_STORAGE_KEY = 'mtgtb:uid';
const HANDLE_STORAGE_KEY = 'mtgtb:handle';

export type LocalIdentity = {
  uid: string;
  handle: string | null;
};

export async function loadOrCreateIdentity(): Promise<LocalIdentity> {
  const storedValues = await AsyncStorage.multiGet([UID_STORAGE_KEY, HANDLE_STORAGE_KEY]);
  const storedUid = storedValues[0][1];
  const storedHandle = storedValues[1][1];

  const uid = storedUid || Crypto.randomUUID();
  if (!storedUid) {
    await AsyncStorage.setItem(UID_STORAGE_KEY, uid);
  }

  return {
    uid,
    handle: storedHandle?.trim() || null,
  };
}

export async function saveLocalHandle(handle: string) {
  await AsyncStorage.setItem(HANDLE_STORAGE_KEY, handle);
}
