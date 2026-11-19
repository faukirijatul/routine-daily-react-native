import * as Notifications from "expo-notifications";
import { DAYS_OF_WEEK, RoutineItem } from "../types/routine";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === "granted";
}

export async function scheduleRoutineNotification(routine: RoutineItem) {
  const [hourStr, minuteStr] = routine.startTime.split(":");
  const targetHour = parseInt(hourStr, 10);
  const targetMinute = parseInt(minuteStr, 10);

  const now = new Date();
  const scheduleDate = new Date(now);
  const dayOffset = (weekDayIndex(routine.day) - now.getDay() + 7) % 7;
  scheduleDate.setDate(scheduleDate.getDate() + dayOffset);
  scheduleDate.setHours(targetHour, targetMinute, 0, 0);
  if (scheduleDate.getTime() <= now.getTime()) {
    scheduleDate.setDate(scheduleDate.getDate() + 7);
  }
  scheduleDate.setMinutes(scheduleDate.getMinutes() - 30);
  if (scheduleDate.getTime() <= now.getTime()) {
    scheduleDate.setDate(scheduleDate.getDate() + 7);
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Peringatan rutinitas",
        body: `"${routine.title}" dimulai 30 menit lagi (${routine.startTime}).`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduleDate,
      },
    });
  } catch (error) {
    console.error("Gagal menjadwalkan notifikasi:", error);
  }
}

function weekDayIndex(day: RoutineItem["day"]): number {
  return DAYS_OF_WEEK.indexOf(day);
}
