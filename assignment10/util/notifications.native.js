import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const ANDROID_CHANNEL_ID = 'expense-feedback';

// COURSE COMMENT: A foreground notification needs this handler. Without it,
// a notification received while the app is open may be delivered silently.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configureNotifications() {
  // COURSE COMMENT: Android 8+ groups notifications into channels. This
  // channel controls the importance and display behavior for expense feedback.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Expense feedback',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // COURSE COMMENT: The app checks first so it only displays the operating
  // system permission prompt when notification access has not been granted.
  const existingPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermissions.status;

  if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  return finalStatus === Notifications.PermissionStatus.GRANTED;
}

export async function sendLocalNotification({ title, body, data }) {
  try {
    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.status !== Notifications.PermissionStatus.GRANTED) {
      return false;
    }

    // COURSE COMMENT: A null trigger sends immediately. Android uses the channel
    // object instead so the notification gets the configured channel behavior.
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: 'default' },
      trigger: Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null,
    });

    return true;
  } catch (error) {
    console.warn('Local notification could not be scheduled:', error);
    return false;
  }
}
