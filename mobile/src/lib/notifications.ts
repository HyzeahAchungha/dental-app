/**
 * Expo Notifications setup.
 * Push notifications for appointment reminders with deep links.
 * No PHI/sensitive dental info on lock screen (see PLAN.md Platform Specifics).
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;
  if (finalStatus !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    finalStatus = newStatus;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: Record<string, string>) {
  await Notifications.sendPushNotificationAsync({
    to: expoPushToken,
    title,
    body,
    data,
    // No PHI in notification content - see PLAN.md Platform Specifics
  });
}
