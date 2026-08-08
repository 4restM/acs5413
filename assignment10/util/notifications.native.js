import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const ANDROID_CHANNEL_ID = 'expense-feedback';

// Show notifications even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configureNotifications() {
  // Android needs a channel before it can show expense notifications.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Expense feedback',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Only show the permission prompt when access has not already been granted.
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
      // The form still works if the user has notifications turned off.
      return false;
    }

    // A null trigger is immediate on iOS; Android points to the channel instead.
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
