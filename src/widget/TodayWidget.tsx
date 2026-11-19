"use no memo";
import type { ReactElement } from "react";
import {
  FlexWidget,
  ListWidget,
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

// Sisa waktu sampai kegiatan berakhir, contoh: "1j 23m" atau "45m"
function formatRemaining(endTime: string): string {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const diff = Math.max(0, timeToMinutes(endTime) - nowMin);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
}

// Progress bar: lebar diatur lewat rasio flex, bukan persen
const ProgressBar = ({
  progress,
  marginTop = 0,
}: {
  progress: number;
  marginTop?: number;
}) => (
  <FlexWidget
    style={{
      width: "match_parent",
      height: 6,
      flexDirection: "row",
      backgroundColor: "#bfdbfe",
      borderRadius: 4,
      marginTop,
    }}
  >
    <FlexWidget
      style={{
        flex: Math.max(progress, 1),
        height: 6,
        backgroundColor: "#2563eb",
        borderRadius: 4,
      }}
    />
    <FlexWidget style={{ flex: Math.max(100 - progress, 1), height: 6 }} />
  </FlexWidget>
);

const Stat = ({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: `#${string}`;
}) => (
  <FlexWidget style={{ flex: 1, alignItems: "center" }}>
    <TextWidget
      text={value}
      style={{ fontSize: 15, fontWeight: "bold", color }}
    />
    <TextWidget
      text={label}
      style={{ fontSize: 10, color: "#dbeafe", marginTop: 2 }}
    />
  </FlexWidget>
);

// Wrapper pemberi jarak antar baris. Jarak lewat padding karena
// marginBottom pada child langsung ListWidget sering diabaikan di Android.
const Row = ({
  children,
  gap = 10,
}: {
  children: ReactElement;
  gap?: number;
}) => (
  <FlexWidget
    style={{
      width: "match_parent",
      paddingBottom: gap,
    }}
  >
    {children}
  </FlexWidget>
);

export function TodayWidget({
  day,
  stats,
  items,
}: {
  day: string;
  stats: DailyStats;
  items: RoutineItem[];
}) {
  const { activeId, progress } = getActiveInfo(items);
  const activeItem = items.find((i) => i.id === activeId) || null;

  // Setiap elemen di array ini menjadi satu baris di ListWidget terluar
  const rows: ReactElement[] = [];

  // ========== HEADER WIDGET ==========
  rows.push(
    <Row key="header" gap={10}>
      <FlexWidget
        style={{
          width: "match_parent",
          backgroundColor: "#2563eb",
          borderRadius: 18,
          padding: 14,
          flexDirection: "column",
        }}
      >
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <TextWidget
            text="Jadwal Hari Ini"
            style={{ fontSize: 15, fontWeight: "bold", color: "#ffffff" }}
          />
          <FlexWidget
            style={{
              backgroundColor: "#1d4ed8",
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 10,
            }}
          >
            <TextWidget
              text={day}
              style={{ fontSize: 11, fontWeight: "600", color: "#ffffff" }}
            />
          </FlexWidget>
        </FlexWidget>

        <TextWidget
          text="Pantau performa rutinitas harian Anda."
          style={{ fontSize: 11, color: "#dbeafe", marginBottom: 10 }}
        />

        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            backgroundColor: "#ffffff1a",
            paddingVertical: 8,
            paddingHorizontal: 6,
            borderRadius: 14,
          }}
        >
          <Stat
            value={String(stats.completed)}
            label="Selesai"
            color="#ffffff"
          />
          <Stat value={String(stats.failed)} label="Gagal" color="#ffffff" />
          <Stat value={String(stats.pending)} label="Belum" color="#ffffff" />
          <Stat value={`${stats.percentage}%`} label="Sukses" color="#ffffff" />
        </FlexWidget>
      </FlexWidget>
    </Row>,
  );

  // ========== SEDANG BERLANGSUNG ==========
  if (activeItem) {
    rows.push(
      <Row key="active" gap={12}>
        <FlexWidget
          style={{
            width: "match_parent",
            backgroundColor: "#dbeafe",
            borderRadius: 16,
            padding: 12,
            borderWidth: 1.5,
            borderColor: "#60a5fa",
            flexDirection: "column",
          }}
        >
          <FlexWidget
            style={{
              width: "match_parent",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
              <FlexWidget
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#2563eb",
                  marginRight: 6,
                }}
              />
              <TextWidget
                text="Sedang Berlangsung"
                style={{ fontSize: 12, fontWeight: "600", color: "#1d4ed8" }}
              />
            </FlexWidget>
            <TextWidget
              text={`${progress}%`}
              style={{ fontSize: 12, fontWeight: "700", color: "#1d4ed8" }}
            />
          </FlexWidget>

          <TextWidget
            text={activeItem.title}
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: 2,
            }}
          />

          <TextWidget
            text={`${activeItem.startTime} - ${activeItem.endTime} • sisa ${formatRemaining(activeItem.endTime)}`}
            style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}
          />

          <ProgressBar progress={progress} />
        </FlexWidget>
      </Row>,
    );
  }

  // ========== JUDUL LIST ==========
  rows.push(
    <Row key="list-title" gap={6}>
      <TextWidget
        text="Daftar Jadwal & Aksi"
        style={{
          fontSize: 14,
          fontWeight: "bold",
          color: "#1e293b",
          marginLeft: 2,
        }}
      />
    </Row>,
  );

  // ========== ITEM JADWAL ==========
  if (items.length === 0) {
    rows.push(
      <Row key="empty" gap={8}>
        <FlexWidget
          style={{
            width: "match_parent",
            padding: 16,
            alignItems: "center",
            backgroundColor: "#ffffff",
            borderRadius: 14,
          }}
        >
          <TextWidget
            text="Tidak ada jadwal untuk hari ini."
            style={{ fontSize: 13, color: "#94a3b8" }}
          />
        </FlexWidget>
      </Row>,
    );
  } else {
    items.forEach((item) => {
      const isActive = item.id === activeId;
      const isCompleted = item.status === "completed";
      const isFailed = item.status === "failed";

      let bg: `#${string}` = "#ffffff";
      let borderColor: `#${string}` = "#dbeafe";
      let titleColor: `#${string}` = "#1e293b";

      // Item aktif tetap memakai warna status (selesai/gagal) bila sudah ditandai
      if (isCompleted) {
        bg = "#eff6ff";
        borderColor = "#93c5fd";
        titleColor = "#64748b";
      } else if (isFailed) {
        bg = "#f1f5f9";
        borderColor = "#cbd5e1";
      }
      if (isActive) {
        bg = "#dbeafe";
        borderColor = "#60a5fa";
      }

      rows.push(
        <Row key={item.id} gap={8}>
          <FlexWidget
            style={{
              width: "match_parent",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: bg,
              borderRadius: 14,
              padding: 12,
              borderWidth: isActive ? 1.5 : 1,
              borderColor: borderColor,
            }}
            clickAction="OPEN_APP"
            accessibilityLabel={`Buka aplikasi untuk jadwal ${item.title}`}
          >
            <FlexWidget style={{ flex: 1, marginRight: 10 }}>
              <TextWidget
                text={`${item.startTime} - ${item.endTime}`}
                style={{ fontSize: 11, color: "#64748b", fontWeight: "500" }}
              />
              <TextWidget
                text={item.title}
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: titleColor,
                  marginTop: 2,
                }}
              />

              {/* Bar, persen, dan sisa waktu untuk item yang sedang aktif */}
              {isActive && (
                <FlexWidget
                  style={{ width: "match_parent", flexDirection: "column" }}
                >
                  <ProgressBar progress={progress} marginTop={8} />
                  <TextWidget
                    text={`${progress}% berlangsung • sisa ${formatRemaining(item.endTime)}`}
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: "#1d4ed8",
                      marginTop: 4,
                    }}
                  />
                </FlexWidget>
              )}
            </FlexWidget>

            <FlexWidget
              style={{
                width: 54,
                height: 26,
                paddingHorizontal: 6,
                borderRadius: 13,
                backgroundColor: isCompleted
                  ? "#2563eb"
                  : isFailed
                    ? "#475569"
                    : "#eff6ff",
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
              />
            </FlexWidget>
          </FlexWidget>
        </Row>,
      );
    });
  }

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#eff6ff",
        borderRadius: 20,
        padding: 4,
      }}
      clickAction="OPEN_APP"
      accessibilityLabel="Buka aplikasi Routine Daily"
    >
      {/* Scroll di paling luar: seluruh konten ada di dalam ListWidget ini */}
      <ListWidget
        style={{
          height: "match_parent",
          width: "match_parent",
        }}
      >
        {rows}
      </ListWidget>
    </FlexWidget>
  );
}
