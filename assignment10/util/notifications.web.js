// Keep the web build from calling the native Expo notification API.
export async function configureNotifications() {
  return false;
}

export async function sendLocalNotification() {
  return false;
}
