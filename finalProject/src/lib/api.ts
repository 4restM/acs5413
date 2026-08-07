import { requireBackendUrl, rtdbClient } from '@/lib/http';
import { binderRecordToList, createBinderPatch } from '@/lib/binder';
import type { BinderCard, BinderCardRecord, BinderListKind } from '@/types/card';
import type { TradePartner } from '@/types/trade';

export type UserProfile = {
  handle: string;
  createdAt: string;
  homeStoreId?: string;
};

export async function saveProfile(uid: string, profile: UserProfile) {
  requireBackendUrl();
  await rtdbClient.put(`/users/${encodeURIComponent(uid)}/profile.json`, profile);
}

export async function getProfile(uid: string) {
  requireBackendUrl();
  const response = await rtdbClient.get<UserProfile | null>(
    `/users/${encodeURIComponent(uid)}/profile.json`
  );
  return response.data;
}

export async function getBinderList(uid: string, listKind: BinderListKind) {
  requireBackendUrl();
  const response = await rtdbClient.get<Record<string, BinderCardRecord> | null>(
    `/users/${encodeURIComponent(uid)}/${listKind}.json`
  );
  return binderRecordToList(response.data);
}

export async function bulkImportBinder(
  uid: string,
  listKind: BinderListKind,
  cards: BinderCard[]
) {
  requireBackendUrl();
  await rtdbClient.patch(
    `/users/${encodeURIComponent(uid)}/${listKind}.json`,
    createBinderPatch(cards)
  );
}

export async function updateBinderQuantity(
  uid: string,
  listKind: BinderListKind,
  cardKey: string,
  qty: number
) {
  requireBackendUrl();
  await rtdbClient.patch(
    `/users/${encodeURIComponent(uid)}/${listKind}/${encodeURIComponent(cardKey)}.json`,
    { qty }
  );
}

export async function removeBinderCard(
  uid: string,
  listKind: BinderListKind,
  cardKey: string
) {
  requireBackendUrl();
  await rtdbClient.delete(
    `/users/${encodeURIComponent(uid)}/${listKind}/${encodeURIComponent(cardKey)}.json`
  );
}

type FirebaseUserNode = {
  profile?: UserProfile;
  haves?: Record<string, BinderCardRecord>;
  wants?: Record<string, BinderCardRecord>;
};

export async function getTradePartner(partnerUid: string): Promise<TradePartner> {
  requireBackendUrl();
  const response = await rtdbClient.get<FirebaseUserNode | null>(
    `/users/${encodeURIComponent(partnerUid)}.json`
  );

  if (!response.data?.profile?.handle) {
    throw new Error('No trader profile was found for that device ID.');
  }

  return {
    uid: partnerUid,
    handle: response.data.profile.handle,
    haves: binderRecordToList(response.data.haves ?? null),
    wants: binderRecordToList(response.data.wants ?? null),
  };
}
