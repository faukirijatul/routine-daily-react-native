import AsyncStorage from "@react-native-async-storage/async-storage";
import { isDayOfWeek } from "../domain/routine";
import { DayOfWeek, RoutineItem, RoutineStatus } from "../types/routine";

export const ROUTINE_STORAGE_KEY = "@routine_items_v2";
const LEGACY_STORAGE_KEY = "@routine_items_v1";
const ACTIVE_DATE_KEY = "@routine_active_date_v1";

// Earlier versions of the app stored day names in Indonesian. Map them to the
// English names so existing data keeps working after upgrading.
const LEGACY_DAY_NAMES = new Map<string, DayOfWeek>([
  ["Minggu", "Sunday"],
  ["Senin", "Monday"],
  ["Selasa", "Tuesday"],
  ["Rabu", "Wednesday"],
  ["Kamis", "Thursday"],
  ["Jum'at", "Friday"],
  ["Sabtu", "Saturday"],
]);

function normalizeDay(value: unknown): unknown {
  return typeof value === "string" ? (LEGACY_DAY_NAMES.get(value) ?? value) : value;
}

type LegacyRoutine = {
  id: string;
  dayGroup: string;
  startTime: string;
  endTime: string;
  title: string;
  status?: RoutineStatus;
};

function resetStatuses(items: RoutineItem[]): RoutineItem[] {
  return items.map((item) => ({ ...item, status: "pending" }));
}

function migrateLegacyItems(value: unknown): RoutineItem[] {
  if (!Array.isArray(value)) {
    throw new Error("Legacy routine data is invalid and cannot be migrated.");
  }

  const migrated: RoutineItem[] = [];
  for (const [index, raw] of value.entries()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`Legacy routine #${index + 1} is invalid.`);
    }

    const item = raw as LegacyRoutine;
    // "Senin-Kamis" is the old Indonesian label for Monday through Thursday.
    const legacyDay = normalizeDay(item.dayGroup);
    const days: DayOfWeek[] =
      item.dayGroup === "Senin-Kamis"
        ? ["Monday", "Tuesday", "Wednesday", "Thursday"]
        : isDayOfWeek(legacyDay)
          ? [legacyDay]
          : [];

    if (
      !days.length ||
      typeof item.id !== "string" ||
      typeof item.title !== "string" ||
      typeof item.startTime !== "string" ||
      typeof item.endTime !== "string"
    ) {
      throw new Error(`Legacy routine #${index + 1} is invalid.`);
    }

    for (const day of days) {
      migrated.push({
        id: `${item.id}-${day}`,
        day,
        startTime: item.startTime,
        endTime: item.endTime,
        title: item.title,
        status: "pending",
      });
    }
  }

  return migrated;
}

function parseStoredItems(json: string): RoutineItem[] {
  const items: unknown = JSON.parse(json);
  if (!Array.isArray(items)) {
    throw new Error("Stored routine data is invalid.");
  }
  for (const [index, value] of items.entries()) {
    const item =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
    if (
      !item ||
      typeof item.id !== "string" ||
      !isDayOfWeek(normalizeDay(item.day)) ||
      typeof item.startTime !== "string" ||
      typeof item.endTime !== "string" ||
      typeof item.title !== "string" ||
      typeof item.status !== "string" ||
      !["pending", "completed", "failed"].includes(item.status)
    ) {
      throw new Error(`Stored routine #${index + 1} is invalid.`);
    }
  }
  return items.map((item) => ({
    ...item,
    day: normalizeDay(item.day),
  })) as RoutineItem[];
}

export async function loadRoutineRecords(): Promise<RoutineItem[]> {
  const today = new Date().toDateString();
  const [stored, activeDate] = await Promise.all([
    AsyncStorage.getItem(ROUTINE_STORAGE_KEY),
    AsyncStorage.getItem(ACTIVE_DATE_KEY),
  ]);

  if (stored === null) {
    const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    const items = legacy === null ? [] : migrateLegacyItems(JSON.parse(legacy));
    await AsyncStorage.multiSet([
      [ROUTINE_STORAGE_KEY, JSON.stringify(items)],
      [ACTIVE_DATE_KEY, today],
    ]);
    if (legacy !== null) await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    return items;
  }

  const items = parseStoredItems(stored);
  if (activeDate !== today) {
    const reset = resetStatuses(items);
    await AsyncStorage.multiSet([
      [ROUTINE_STORAGE_KEY, JSON.stringify(reset)],
      [ACTIVE_DATE_KEY, today],
    ]);
    return reset;
  }
  return items;
}

export async function saveRoutineRecords(
  items: RoutineItem[],
): Promise<RoutineItem[]> {
  const today = new Date().toDateString();
  const activeDate = await AsyncStorage.getItem(ACTIVE_DATE_KEY);
  const records = activeDate === today ? items : resetStatuses(items);
  await AsyncStorage.multiSet([
    [ROUTINE_STORAGE_KEY, JSON.stringify(records)],
    [ACTIVE_DATE_KEY, today],
  ]);
  return records;
}

export async function clearRoutineRecords(): Promise<void> {
  await saveRoutineRecords([]);
}
