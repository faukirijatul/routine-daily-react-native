import {
  DAYS_OF_WEEK,
  DayOfWeek,
  RoutineItem,
  RoutineStatus,
} from "../types/routine";

export function dayForDate(date: Date): DayOfWeek {
  return DAYS_OF_WEEK[date.getDay()];
}

export function isDayOfWeek(value: unknown): value is DayOfWeek {
  return typeof value === "string" && DAYS_OF_WEEK.includes(value as DayOfWeek);
}

export function isValidTime(value: string): boolean {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return false;
  return true;
}

export function getDailyStats(items: RoutineItem[]) {
  const completed = items.filter((item) => item.status === "completed").length;
  const failed = items.filter((item) => item.status === "failed").length;
  const pending = items.filter((item) => item.status === "pending").length;

  return {
    completed,
    failed,
    pending,
    percentage: items.length ? Math.round((completed / items.length) * 100) : 0,
  };
}

export function nextRoutineStatus(status: RoutineStatus): RoutineStatus {
  if (status === "pending") return "completed";
  if (status === "completed") return "failed";
  return "pending";
}

export function parseRoutineJson(json: string): RoutineItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("JSON tidak valid. Periksa tanda kutip dan koma.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Data JSON harus berupa array jadwal.");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`Jadwal ke-${index + 1} harus berupa objek.`);
    }

    const item = entry as Record<string, unknown>;
    if (!isDayOfWeek(item.day)) {
      throw new Error(
        `Hari pada jadwal ke-${index + 1} harus salah satu dari: ${DAYS_OF_WEEK.join(", ")}.`,
      );
    }
    if (typeof item.title !== "string" || !item.title.trim()) {
      throw new Error(`Judul jadwal ke-${index + 1} tidak boleh kosong.`);
    }
    if (typeof item.startTime !== "string" || !isValidTime(item.startTime)) {
      throw new Error(`Jam mulai jadwal ke-${index + 1} harus berformat HH:mm.`);
    }
    if (typeof item.endTime !== "string" || !isValidTime(item.endTime)) {
      throw new Error(`Jam selesai jadwal ke-${index + 1} harus berformat HH:mm.`);
    }
    if (item.startTime === item.endTime) {
      throw new Error(`Jam mulai dan selesai jadwal ke-${index + 1} tidak boleh sama.`);
    }

    return {
      id: `${Date.now()}-${index}`,
      day: item.day,
      startTime: item.startTime,
      endTime: item.endTime,
      title: item.title.trim(),
      status: "pending",
    };
  });
}
