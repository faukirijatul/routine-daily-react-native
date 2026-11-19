import { Stack } from "expo-router";
import { useEffect } from "react";
import { syncCurrentTaskNotifications } from "../src/services/currentTaskNotification";
import { registerForPushNotificationsAsync } from "../src/services/notification";
import { refreshWidget } from "../src/widget/updateWidget";

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      await registerForPushNotificationsAsync();
      await syncCurrentTaskNotifications();
      refreshWidget();
    })().catch(console.error);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
