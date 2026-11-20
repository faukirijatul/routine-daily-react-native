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
    throw new Error("Invalid JSON. Check the quotes and commas.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("JSON data must be an array of routines.");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`Routine #${index + 1} must be an object.`);
    }

    const item = entry as Record<string, unknown>;
    if (!isDayOfWeek(item.day)) {
      throw new Error(
        `Day of routine #${index + 1} must be one of: ${DAYS_OF_WEEK.join(", ")}.`,
      );
    }
    if (typeof item.title !== "string" || !item.title.trim()) {
      throw new Error(`Title of routine #${index + 1} cannot be empty.`);
    }
    if (typeof item.startTime !== "string" || !isValidTime(item.startTime)) {
      throw new Error(`Start time of routine #${index + 1} must use HH:mm format.`);
    }
    if (typeof item.endTime !== "string" || !isValidTime(item.endTime)) {
      throw new Error(`End time of routine #${index + 1} must use HH:mm format.`);
    }
    if (item.startTime === item.endTime) {
      throw new Error(`Start and end time of routine #${index + 1} cannot be the same.`);
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
