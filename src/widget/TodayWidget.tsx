import {
  FlexWidget,
  TextWidget,
} from "react-native-android-widget";
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
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
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

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
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

function RoutineRow({
  item,
  isActive,
  isCompleted,
  isFailed,
}: {
  item: RoutineItem;
  isActive: boolean;
  isCompleted: boolean;
  isFailed: boolean;
}) {
  const backgroundColor = isActive
    ? "#dbeafe"
    : isCompleted
      ? "#eff6ff"
      : isFailed
        ? "#f1f5f9"
        : "#ffffff";
  const borderColor = isActive
    ? "#60a5fa"
    : isCompleted
      ? "#93c5fd"
      : isFailed
        ? "#cbd5e1"
        : "#dbeafe";
  const statusColor = isCompleted
    ? "#2563eb"
    : isFailed
      ? "#475569"
      : "#eff6ff";

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor,
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor,
        marginTop: 6,
      }}
      clickAction="OPEN_APP"
      accessibilityLabel={`Buka aplikasi untuk jadwal ${item.title}`}
    >
      <FlexWidget style={{ flex: 1, marginRight: 8 }}>
        <TextWidget
          text={`${item.startTime} - ${item.endTime}`}
          style={{ fontSize: 10, color: "#64748b", fontWeight: "500" }}
          maxLines={1}
          truncate="END"
        />
        <TextWidget
          text={item.title}
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: isCompleted ? "#64748b" : "#1e293b",
            marginTop: 1,
          }}
          maxLines={1}
          truncate="END"
        />
      </FlexWidget>
      <FlexWidget
        style={{
          width: 34,
          height: 26,
          borderRadius: 13,
          backgroundColor: statusColor,
          alignItems: "center",
          justifyContent: "center",
        }}
        clickAction="TOGGLE_STATUS"
        clickActionData={{ id: item.id }}
        accessibilityLabel={`Ubah status ${item.title}`}
      >
        <TextWidget
          text={isCompleted ? "✓" : isFailed ? "×" : "○"}
          style={{
            fontSize: 13,
            color: isCompleted || isFailed ? "#ffffff" : "#1d4ed8",
            fontWeight: "600",
          }}
          maxLines={1}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export function TodayWidget({
  day,
  stats,
  items,
  width = 250,
  height = 350,
}: {
  day: string;
  stats: DailyStats;
  items: RoutineItem[];
  width?: number;
  height?: number;
}) {
  const { activeId, progress } = getActiveInfo(items);
  const activeItem = items.find((item) => item.id === activeId) ?? null;
  const reservedHeight = activeItem ? 238 : 178;
  const rowHeight = 48;
  const visibleCount = Math.max(
    items.length > 0 ? 1 : 0,
    Math.min(
      6,
      Math.floor(Math.max(height - reservedHeight, rowHeight) / rowHeight),
    ),
  );
  const visibleItems = items.slice(0, visibleCount);
  const remainingCount = Math.max(0, items.length - visibleItems.length);
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
      accessibilityLabel="Buka aplikasi Routine Daily"
    >
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "column",
          backgroundColor: "#2563eb",
          borderRadius: 16,
          padding: compact ? 9 : 11,
        }}
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
            text="Jadwal Hari Ini"
            style={{ fontSize: compact ? 13 : 14, fontWeight: "bold", color: "#ffffff" }}
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
          <Stat value={String(stats.completed)} label="Selesai" />
          <Stat value={String(stats.failed)} label="Gagal" />
          <Stat value={String(stats.pending)} label="Belum" />
          <Stat value={`${stats.percentage}%`} label="Sukses" />
        </FlexWidget>
      </FlexWidget>

      {activeItem ? (
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "column",
            backgroundColor: "#dbeafe",
            borderRadius: 13,
            padding: compact ? 8 : 9,
            borderWidth: 1,
            borderColor: "#60a5fa",
            marginTop: 7,
          }}
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
              text="Sedang berlangsung"
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
            text={`${activeItem.startTime}-${activeItem.endTime} · sisa ${formatRemaining(activeItem.endTime)}`}
            style={{ fontSize: 9, color: "#64748b", marginTop: 1, marginBottom: 4 }}
            maxLines={1}
            truncate="END"
          />
          <ProgressBar progress={progress} />
        </FlexWidget>
      ) : null}

      <TextWidget
        text="Daftar jadwal"
        style={{
          fontSize: 12,
          fontWeight: "bold",
          color: "#1e293b",
          marginTop: 9,
          marginBottom: 1,
        }}
        maxLines={1}
      />

      {items.length === 0 ? (
        <TextWidget
          text="Tidak ada jadwal untuk hari ini."
          style={{ fontSize: 11, color: "#64748b", marginTop: 7 }}
          maxLines={1}
          truncate="END"
        />
      ) : (
        visibleItems.map((item) => (
          <RoutineRow
            key={item.id}
            item={item}
            isActive={item.id === activeId}
            isCompleted={item.status === "completed"}
            isFailed={item.status === "failed"}
          />
        ))
      )}

      {remainingCount > 0 ? (
        <TextWidget
          text={`+${remainingCount} jadwal lainnya · buka aplikasi`}
          style={{
            fontSize: 9,
            color: "#1d4ed8",
            fontWeight: "600",
            marginTop: 6,
          }}
          maxLines={1}
          truncate="END"
        />
      ) : null}
    </FlexWidget>
  );
}
