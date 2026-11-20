import notifee, {
  AlarmType,
  AndroidForegroundServiceType,
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import { dayForDate } from "../domain/routine";
import { loadRoutines } from "./routineData";

const CHANNEL_ID = "current-task";
const NOTIF_ID = "current-task";
const STEP_MS = 5 * 60 * 1000; // fallback: scheduled trigger every 5 minutes
const DAYS_AHEAD = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

type Task = { title: string; startTime: string; endTime: string };

const at = (base: Date, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

async function ensureChannel() {
  return notifee.createChannel({
    id: CHANNEL_ID,
    name: "Ongoing Routine",
    importance: AndroidImportance.LOW, // no sound or popup
    visibility: AndroidVisibility.PUBLIC,
  });
}

function formatRemaining(ms: number) {
  const diff = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Notification content for one routine at time t (used by the fallback triggers)
function buildNotification(
  item: Task,
  channelId: string,
  start: number,
  end: number,
  t: number,
) {
  const pct = Math.min(
    100,
    Math.max(0, Math.round(((t - start) / (end - start)) * 100)),
  );
  return {
    id: NOTIF_ID, // same id = replace the notification instead of stacking
    title: item.title,
    body: `${item.startTime} - ${item.endTime}  •  ${pct}%  •  ${formatRemaining(end - t)} left`,
    android: {
      channelId,
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      smallIcon: "ic_notification",
      progress: { max: 100, current: pct },
      timeoutAfter: end - t,
      pressAction: { id: "default" },
    },
  };
}

// Find the routine in progress (checks today and yesterday for routines that cross midnight)
async function findCurrent(nowMs: number) {
  const routines = await loadRoutines();
  const nowDate = new Date(nowMs);

  for (const offset of [0, -1]) {
    const date = new Date(nowDate);
    date.setDate(date.getDate() + offset);
    const items = routines.filter((routine) => routine.day === dayForDate(date));

    for (const item of items) {
      const start = at(date, item.startTime);
      let end = at(date, item.endTime);
      if (end <= start) end += DAY_MS;
      if (nowMs >= start && nowMs < end) return { item, start, end };
    }
  }
  return null;
}

// Foreground service version of the notification (locked, no timeoutAfter)
async function postServiceNotification() {
  const channelId = await ensureChannel();
  const now = Date.now();
  const current = await findCurrent(now);

  const base = {
    id: NOTIF_ID,
    android: {
      channelId,
      asForegroundService: true,
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      ],
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      smallIcon: "ic_notification",
      pressAction: { id: "default" },
    },
  };

  if (!current) {
    await notifee.displayNotification({
      ...base,
      title: "Routine Daily",
      body: "No routine in progress",
    });
    return;
  }

  const { item, start, end } = current;
  const pct = Math.min(
    100,
    Math.max(0, Math.round(((now - start) / (end - start)) * 100)),
  );

  await notifee.displayNotification({
    ...base,
    title: item.title,
    body: `${item.startTime} - ${item.endTime}  •  ${pct}%  •  ${formatRemaining(end - now)} left`,
    android: {
      ...base.android,
      progress: { max: 100, current: pct },
    },
  });
}

// ===== Foreground service: update every minute =====
let stopRequested = false;

// Called once when the module loads. Make sure this file is imported in the entry point (index.ts).
notifee.registerForegroundService(
  () =>
    new Promise<void>((resolve) => {
      stopRequested = false;

      const tick = async () => {
        if (stopRequested) {
          resolve();
          return;
        }
        try {
          // Re-post every minute: if the user dismissed it, it comes back
          await postServiceNotification();
        } catch (e) {
          console.error("Failed to update notification:", e);
        }
        const delay = 60000 - (Date.now() % 60000) + 300; // right at the start of the next minute
        setTimeout(tick, delay);
      };

      tick();
    }),
);

// Start (or refresh) the persistent notification
export async function startCurrentTaskService() {
  await notifee.requestPermission();
  await postServiceNotification();
}

export async function stopCurrentTaskService() {
  stopRequested = true;
  await notifee.stopForegroundService();
}

// Used by the button in Settings
export async function showCurrentTaskNow(): Promise<string | null> {
  await startCurrentTaskService();
  const current = await findCurrent(Date.now());
  return current ? current.item.title : null;
}

// Scheduled triggers as a fallback in case the foreground service timer is delayed while the phone is idle
export async function syncCurrentTaskNotifications() {
  await notifee.requestPermission();
  // Only cancel triggers; do not cancel the foreground service notification that is showing
  await notifee.cancelTriggerNotifications();

  const channelId = await ensureChannel();
  const routines = await loadRoutines();
  const now = Date.now();

  for (let day = 0; day < DAYS_AHEAD; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const items = routines.filter((routine) => routine.day === dayForDate(date));

    for (const item of items) {
      const start = at(date, item.startTime);
      let end = at(date, item.endTime);
      if (end <= start) end += DAY_MS;
      if (end <= now) continue;

      const first = Math.max(start, now + 2000);

      for (let t = first; t < end; t += STEP_MS) {
        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: t,
          alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE },
        };

        await notifee.createTriggerNotification(
          buildNotification(item, channelId, start, end, t),
          trigger,
        );
      }
    }
  }

  await startCurrentTaskService();
}
