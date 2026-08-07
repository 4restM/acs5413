export type LocalNotificationInput = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export async function configureNotifications() {
  return false;
}

export async function sendLocalNotification(_input: LocalNotificationInput) {
  return false;
}
