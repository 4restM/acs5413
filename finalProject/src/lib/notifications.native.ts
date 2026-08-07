import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { LocalNotificationInput } from '@/lib/notifications';

const ANDROID_CHANNEL_ID = 'trade-feedback';

// Foreground notifications are silent unless the app supplies a presentation handler.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configureNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Trade feedback',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermissions.status;
  if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  return finalStatus === Notifications.PermissionStatus.GRANTED;
}

export async function sendLocalNotification(input: LocalNotificationInput) {
  try {
    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.status !== Notifications.PermissionStatus.GRANTED) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        data: input.data,
        sound: 'default',
      },
      trigger: Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null,
    });
    return true;
  } catch (error) {
    console.warn('Local notification could not be scheduled:', error);
    return false;
  }
}
