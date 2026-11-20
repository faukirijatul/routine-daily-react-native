import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Circle, CircleCheck, CircleX } from "lucide-react-native";
import {
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dayForDate, getDailyStats } from "../../src/domain/routine";
import { loadRoutines, toggleRoutineStatus } from "../../src/services/routineData";
import { DailyStats, DayOfWeek, RoutineItem, RoutineStatus } from "../../src/types/routine";
import { refreshWidget } from "../../src/widget/updateWidget";

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getActiveInfo(items: RoutineItem[]) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const item of items) {
    const start = timeToMinutes(item.startTime);
    const end = timeToMinutes(item.endTime);
    if (currentMinutes < start || currentMinutes >= end) continue;

    const duration = end - start;
    return {
      activeId: item.id,
      progress: duration
        ? Math.min(100, Math.round(((currentMinutes - start) / duration) * 100))
        : 0,
    };
  }
  return { activeId: null, progress: 0 };
}

function formatRemaining(endTime: string): string {
  const now = new Date();
  const minutesUntilEnd = Math.max(
    0,
    timeToMinutes(endTime) - (now.getHours() * 60 + now.getMinutes()),
  );
  const hours = Math.floor(minutesUntilEnd / 60);
  const minutes = minutesUntilEnd % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

const EMPTY_STATS: DailyStats = {
  completed: 0,
  failed: 0,
  pending: 0,
  percentage: 0,
};

const STATUS_LABELS: Record<RoutineStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [currentDay, setCurrentDay] = useState<DayOfWeek>(dayForDate(new Date()));
  const [stats, setStats] = useState(EMPTY_STATS);
  const [refreshing, setRefreshing] = useState(false);
  const [, setNowTick] = useState(0);

  const loadData = useCallback(async () => {
    const records = await loadRoutines();
    const day = dayForDate(new Date());
    const todayRoutines = records.filter((item) => item.day === day);
    setRoutines(records);
    setCurrentDay(day);
    setStats(getDailyStats(todayRoutines));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void Promise.resolve()
        .then(loadData)
        .catch((error) => console.error("Failed to load routines:", error));
    }, [loadData]),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick((tick) => tick + 1);
      loadData().catch((error) => console.error("Failed to refresh routines:", error));
      refreshWidget();
    }, 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setNowTick((tick) => tick + 1);
        loadData().catch((error) =>
          console.error("Failed to refresh routines:", error),
        );
        refreshWidget();
      }
    });
    return () => subscription.remove();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
      refreshWidget();
    } catch (error) {
      console.error("Failed to refresh routines:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const toggleStatus = async (id: string) => {
    try {
      const updated = await toggleRoutineStatus(id);
      const todayRoutines = updated.filter((item) => item.day === currentDay);
      setRoutines(updated);
      setStats(getDailyStats(todayRoutines));
      refreshWidget();
    } catch (error) {
      console.error("Failed to change routine status:", error);
    }
  };

  const todayList = routines.filter((item) => item.day === currentDay);
  const { activeId, progress } = getActiveInfo(todayList);
  const activeItem = todayList.find((item) => item.id === activeId) ?? null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 100,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>{"Today's Routine"}</Text>
          <View style={styles.dayBadge}>
            <Text style={styles.dayText}>{currentDay}</Text>
          </View>
        </View>
        <Text style={styles.summarySubtitle}>Daily routine summary</Text>
        <View style={styles.statsRow}>
          <Stat value={stats.completed} label="Completed" />
          <Stat value={stats.failed} label="Failed" />
          <Stat value={stats.pending} label="Pending" />
          <Stat value={`${stats.percentage}%`} label="Success" />
        </View>
      </View>

      {activeItem && (
        <View style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <Text style={styles.activeLabel}>In progress</Text>
            <Text style={styles.activeProgress}>{progress}%</Text>
          </View>
          <Text style={styles.activeTitle}>{activeItem.title}</Text>
          <Text style={styles.activeTime}>
            {activeItem.startTime} - {activeItem.endTime} · {formatRemaining(activeItem.endTime)}{" "}
            left
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Routine list</Text>
      {todayList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No routines for today.</Text>
        </View>
      ) : (
        todayList.map((item) => {
          const isActive = item.id === activeId;
          return (
            <View
              key={item.id}
              style={[
                styles.routineCard,
                item.status === "completed" && styles.cardCompleted,
                item.status === "failed" && styles.cardFailed,
                isActive && styles.cardActive,
              ]}
            >
              <View style={styles.routineInfo}>
                <Text style={styles.timeText}>
                  {item.startTime} - {item.endTime}
                </Text>
                <Text
                  style={[
                    styles.routineTitle,
                    item.status === "completed" && styles.textCompleted,
                  ]}
                >
                  {item.title}
                </Text>
                {isActive && (
                  <>
                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressFill, { width: `${progress}%` }]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {progress}% elapsed · {formatRemaining(item.endTime)} left
                    </Text>
                  </>
                )}
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Change status of ${item.title}, currently ${STATUS_LABELS[item.status]}`}
                onPress={() => toggleStatus(item.id)}
                style={[
                  styles.statusButton,
                ]}
              >
                {item.status === "completed" ? (
                  <CircleCheck size={25} color="#2563eb" strokeWidth={2.2} />
                ) : item.status === "failed" ? (
                  <CircleX size={25} color="#64748b" strokeWidth={2.2} />
                ) : (
                  <Circle size={25} color="#94a3b8" strokeWidth={1.8} />
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: "#2563eb",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  dayBadge: {
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dayText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  summarySubtitle: { color: "#dbeafe", fontSize: 13, marginTop: 8, marginBottom: 16 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 14,
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { color: "#ffffff", fontSize: 17, fontWeight: "700" },
  statLabel: { color: "#dbeafe", fontSize: 11, marginTop: 4 },
  activeCard: {
    backgroundColor: "#dbeafe",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  activeLabel: { color: "#1d4ed8", fontSize: 13, fontWeight: "600" },
  activeProgress: { color: "#1d4ed8", fontSize: 13, fontWeight: "700" },
  activeTitle: { color: "#1e293b", fontSize: 17, fontWeight: "700" },
  activeTime: { color: "#475569", fontSize: 13, marginTop: 5 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 14,
    alignItems: "center",
  },
  emptyText: { color: "#64748b", fontSize: 14 },
  routineCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  cardCompleted: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  cardFailed: { backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" },
  cardActive: { borderColor: "#3b82f6", borderWidth: 1.5 },
  routineInfo: { flex: 1, marginRight: 10 },
  timeText: { fontSize: 12, color: "#1d4ed8", fontWeight: "600" },
  routineTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 4,
  },
  textCompleted: { textDecorationLine: "line-through", color: "#64748b" },
  statusButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#eff6ff",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#bfdbfe",
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: { height: 6, backgroundColor: "#2563eb", borderRadius: 4 },
  progressText: {
    fontSize: 11,
    color: "#1d4ed8",
    fontWeight: "600",
    marginTop: 4,
  },
});
