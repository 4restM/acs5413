import { requireBackendUrl, rtdbClient } from '@/lib/http';

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
