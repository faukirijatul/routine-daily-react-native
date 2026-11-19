import {
  clearRoutineRecords,
  loadRoutineRecords,
  saveRoutineRecords,
} from "../data/routineRepository";
import { dayForDate, getDailyStats, nextRoutineStatus } from "../domain/routine";
import { DailyStats, RoutineItem } from "../types/routine";

export const loadRoutines = loadRoutineRecords;

export async function saveRoutines(items: RoutineItem[]): Promise<RoutineItem[]> {
  return saveRoutineRecords(items);
}

export async function clearRoutines(): Promise<void> {
  await clearRoutineRecords();
}

export async function toggleRoutineStatus(
  id: string,
): Promise<RoutineItem[]> {
  const items = await loadRoutines();
  const updated = items.map((item) =>
    item.id === id
      ? { ...item, status: nextRoutineStatus(item.status) }
      : item,
  );
  return saveRoutines(updated);
}

export async function getWidgetData(): Promise<{
  day: string;
  stats: DailyStats;
  items: RoutineItem[];
}> {
  const day = dayForDate(new Date());
  const items = (await loadRoutines()).filter((item) => item.day === day);
  return { day, stats: getDailyStats(items), items };
}
