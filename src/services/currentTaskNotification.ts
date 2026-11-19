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
const STEP_MS = 5 * 60 * 1000; // cadangan: trigger terjadwal tiap 5 menit
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
    name: "Tugas Berjalan",
    importance: AndroidImportance.LOW, // tanpa bunyi/popup
    visibility: AndroidVisibility.PUBLIC,
  });
}

function formatRemaining(ms: number) {
  const diff = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
}

// Isi notifikasi untuk satu jadwal pada waktu t (dipakai trigger cadangan)
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
    id: NOTIF_ID, // id sama = notifikasi diganti, bukan menumpuk
    title: item.title,
    body: `${item.startTime} - ${item.endTime}  •  ${pct}%  •  sisa ${formatRemaining(end - t)}`,
    android: {
      channelId,
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      smallIcon: "ic_launcher",
      progress: { max: 100, current: pct },
      timeoutAfter: end - t,
      pressAction: { id: "default" },
    },
  };
}

// Cari jadwal yang sedang berjalan (cek hari ini + kemarin untuk jadwal lewat tengah malam)
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

// Notifikasi versi foreground service (terkunci, tanpa timeoutAfter)
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
      smallIcon: "ic_launcher",
      pressAction: { id: "default" },
    },
  };

  if (!current) {
    await notifee.displayNotification({
      ...base,
      title: "Routine Daily",
      body: "Tidak ada jadwal berjalan",
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
    body: `${item.startTime} - ${item.endTime}  •  ${pct}%  •  sisa ${formatRemaining(end - now)}`,
    android: {
      ...base.android,
      progress: { max: 100, current: pct },
    },
  });
}

// ===== Foreground service: update tiap pergantian menit =====
let stopRequested = false;

// Dipanggil sekali saat modul dimuat. Pastikan file ini di-import di entry (index.js).
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
          // Memposting ulang tiap menit: kalau user sempat menghapusnya, muncul lagi
          await postServiceNotification();
        } catch (e) {
          console.error("Gagal update notifikasi:", e);
        }
        const delay = 60000 - (Date.now() % 60000) + 300; // tepat di awal menit berikutnya
        setTimeout(tick, delay);
      };

      tick();
    }),
);

// Mulai (atau segarkan) notifikasi permanen
export async function startCurrentTaskService() {
  await notifee.requestPermission();
  await postServiceNotification();
}

export async function stopCurrentTaskService() {
  stopRequested = true;
  await notifee.stopForegroundService();
}

// Dipakai tombol di Pengaturan
export async function showCurrentTaskNow(): Promise<string | null> {
  await startCurrentTaskService();
  const current = await findCurrent(Date.now());
  return current ? current.item.title : null;
}

// Trigger terjadwal sebagai cadangan bila timer service tertunda saat HP idle
export async function syncCurrentTaskNotifications() {
  await notifee.requestPermission();
  // Hanya batalkan trigger, jangan notifikasi foreground service yang sedang tampil
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
