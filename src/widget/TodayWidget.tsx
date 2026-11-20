import { FlexWidget, TextWidget } from "react-native-android-widget";
import { DailyStats, RoutineItem } from "../types/routine";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function getActiveInfo(items: RoutineItem[]) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const item of items) {
    const start = timeToMinutes(item.startTime);
    const end = timeToMinutes(item.endTime);

    if (currentMinutes >= start && currentMinutes < end) {
      const duration = end - start;
      const progress =
        duration > 0
          ? Math.min(
              100,
              Math.round(((currentMinutes - start) / duration) * 100),
            )
          : 0;
      return { activeId: item.id, progress };
    }
  }
  return { activeId: null as string | null, progress: 0 };
}

function formatRemaining(endTime: string): string {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const diff = Math.max(0, timeToMinutes(endTime) - nowMin);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: 5,
        flexDirection: "row",
        backgroundColor: "#bfdbfe",
        borderRadius: 3,
      }}
    >
      <FlexWidget
        style={{
          flex: Math.max(progress, 1),
          height: 5,
          backgroundColor: "#2563eb",
          borderRadius: 3,
        }}
      />
      <FlexWidget style={{ flex: Math.max(100 - progress, 1), height: 5 }} />
    </FlexWidget>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <FlexWidget style={{ flex: 1, alignItems: "center" }}>
      <TextWidget
        text={value}
        style={{ fontSize: 13, fontWeight: "bold", color: "#ffffff" }}
        maxLines={1}
        truncate="END"
      />
      <TextWidget
        text={label}
        style={{ fontSize: 9, color: "#dbeafe", marginTop: 1 }}
        maxLines={1}
        truncate="END"
      />
    </FlexWidget>
  );
}

export function TodayWidget({
  day,
  stats,
  items,
  width = 250,
}: {
  day: string;
  stats: DailyStats;
  items: RoutineItem[];
  width?: number;
}) {
  const { activeId, progress } = getActiveInfo(items);
  const activeItem = items.find((item) => item.id === activeId) ?? null;
  const compact = width < 220;

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: "match_parent",
        flexDirection: "column",
        backgroundColor: "#eff6ff",
        borderRadius: 20,
        padding: compact ? 8 : 10,
      }}
      clickAction="OPEN_APP"
      accessibilityLabel="Open Routine Daily app"
    >
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "column",
          backgroundColor: "#2563eb",
          borderRadius: 16,
          padding: compact ? 9 : 11,
        }}
        clickAction="OPEN_APP"
        accessibilityLabel="Open Routine Daily app"
      >
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TextWidget
            text="Today's Routine"
            style={{
              fontSize: compact ? 13 : 14,
              fontWeight: "bold",
              color: "#ffffff",
            }}
            maxLines={1}
            truncate="END"
          />
          <TextWidget
            text={day}
            style={{ fontSize: 10, fontWeight: "600", color: "#ffffff" }}
            maxLines={1}
            truncate="END"
          />
        </FlexWidget>
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            backgroundColor: "#1d4ed8",
            paddingVertical: 6,
            borderRadius: 12,
            marginTop: 7,
          }}
        >
          <Stat value={String(stats.completed)} label="Completed" />
          <Stat value={String(stats.failed)} label="Failed" />
          <Stat value={String(stats.pending)} label="Pending" />
          <Stat value={`${stats.percentage}%`} label="Success" />
        </FlexWidget>
      </FlexWidget>

      {activeItem ? (
        <FlexWidget
          style={{
            width: "match_parent",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "#dbeafe",
            borderRadius: 13,
            padding: compact ? 8 : 9,
            borderWidth: 1,
            borderColor: "#60a5fa",
            marginTop: 7,
          }}
          clickAction="OPEN_APP"
          accessibilityLabel="Open the routine in progress"
        >
          <FlexWidget
            style={{
              width: "match_parent",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TextWidget
              text="In progress"
              style={{ fontSize: 10, fontWeight: "600", color: "#1d4ed8" }}
              maxLines={1}
              truncate="END"
            />
            <TextWidget
              text={`${progress}%`}
              style={{ fontSize: 10, fontWeight: "700", color: "#1d4ed8" }}
              maxLines={1}
            />
          </FlexWidget>
          <TextWidget
            text={activeItem.title}
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#1e293b",
              marginTop: 2,
            }}
            maxLines={1}
            truncate="END"
          />
          <TextWidget
            text={`${activeItem.startTime}-${activeItem.endTime} · ${formatRemaining(activeItem.endTime)} left`}
            style={{
              fontSize: 9,
              color: "#64748b",
              marginTop: 1,
              marginBottom: 4,
            }}
            maxLines={1}
            truncate="END"
          />
          <ProgressBar progress={progress} />
        </FlexWidget>
      ) : (
        <FlexWidget
          style={{
            width: "match_parent",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#dbeafe",
            borderRadius: 13,
            borderWidth: 1,
            borderColor: "#93c5fd",
            marginTop: 7,
          }}
          clickAction="OPEN_APP"
          accessibilityLabel="Open Routine Daily app"
        >
          <TextWidget
            text="No routine in progress"
            style={{ fontSize: 11, fontWeight: "600", color: "#1d4ed8" }}
            maxLines={2}
            truncate="END"
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
