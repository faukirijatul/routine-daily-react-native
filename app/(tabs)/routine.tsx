import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Pencil, Trash2 } from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dayForDate, isValidTime } from "../../src/domain/routine";
import { scheduleRoutineNotification } from "../../src/services/notification";
import { loadRoutines, saveRoutines } from "../../src/services/routineData";
import { DAYS_OF_WEEK, DayOfWeek, RoutineItem } from "../../src/types/routine";
import { syncCurrentTaskNotifications } from "@/src/services/currentTaskNotification";
import { refreshWidget } from "@/src/widget/updateWidget";
import { AppModal } from "../../src/components/AppModal";

const DAYS: DayOfWeek[] = [...DAYS_OF_WEEK];

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    dayForDate(new Date()),
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoutineItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const loadData = useCallback(async () => {
    try {
      setRoutines(await loadRoutines());
    } catch (error) {
      console.error("Failed to load routines:", error);
      setFeedback({
        title: "Failed to load routines",
        message: "Check the app storage and try again.",
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void Promise.resolve().then(loadData);
    }, [loadData]),
  );

  const saveData = async (items: RoutineItem[]) => {
    const savedItems = await saveRoutines(items);
    setRoutines(savedItems);
    await syncCurrentTaskNotifications();
    refreshWidget();
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormError(null);
    setTitle("");
    setStartTime("");
    setEndTime("");
    setModalVisible(true);
  };

  const handleOpenEdit = (item: RoutineItem) => {
    setEditId(item.id);
    setFormError(null);
    setTitle(item.title);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !isValidTime(startTime) || !isValidTime(endTime)) {
      setFormError("Enter a title and times in a valid HH:mm format.");
      return;
    }
    if (startTime === endTime) {
      setFormError("Start and end time cannot be the same.");
      return;
    }
    setFormError(null);

    let updated: RoutineItem[];
    let newItem: RoutineItem | null = null;
    if (editId) {
      updated = routines.map((item) =>
        item.id === editId
          ? { ...item, title: title.trim(), startTime, endTime }
          : item,
      );
    } else {
      newItem = {
        id: Date.now().toString(),
        day: selectedDay,
        startTime,
        endTime,
        title: title.trim(),
        status: "pending",
      };
      updated = [...routines, newItem];
    }

    try {
      await saveData(updated);
      setModalVisible(false);
      if (newItem) await scheduleRoutineNotification(newItem);
    } catch (error) {
      console.error("Failed to save routine:", error);
      setModalVisible(false);
      setFeedback({
        title: "Failed to save",
        message: "The routine could not be saved. Please try again.",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const updated = routines.filter((item) => item.id !== deleteTarget.id);
    setDeleteTarget(null);
    try {
      await saveData(updated);
    } catch (error) {
      console.error("Failed to delete routine:", error);
      setFeedback({
        title: "Failed to delete",
        message: "The routine could not be deleted. Please try again.",
      });
    }
  };

  const filteredList = routines.filter((item) => item.day === selectedDay);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Manage Routines</Text>
        <TouchableOpacity onPress={handleOpenAdd} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Day filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContentContainer}
      >
        {DAYS.map((day) => (
          <TouchableOpacity
            key={day}
            onPress={() => setSelectedDay(day)}
            style={[
              styles.tabButton,
              selectedDay === day && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                selectedDay === day && styles.tabTextActive,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Routine list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredList.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No routines for {selectedDay}.
            </Text>
          </View>
        )}
        {filteredList.map((item) => (
          <View key={item.id} style={styles.routineCard}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.itemTime}>
                {item.startTime} - {item.endTime}
              </Text>
              <Text style={styles.itemTitle}>{item.title}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.title}`}
                onPress={() => handleOpenEdit(item)}
                style={styles.iconBtn}
              >
                <Pencil size={19} color="#2563eb" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.title}`}
                onPress={() => setDeleteTarget(item)}
                style={styles.iconBtn}
              >
                <Trash2 size={19} color="#2563eb" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add/Edit form modal */}
      <AppModal
        visible={modalVisible}
        title={editId ? "Edit Routine" : "New Routine"}
        description={formError ?? undefined}
        actions={[
          {
            label: "Cancel",
            onPress: () => setModalVisible(false),
            variant: "secondary",
          },
          {
            label: "Save",
            onPress: handleSave,
            variant: "primary",
          },
        ]}
        onRequestClose={() => setModalVisible(false)}
      >
        <Text style={styles.label}>Activity Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Study coding"
          placeholderTextColor="#94a3b8"
          value={title}
          onChangeText={setTitle}
          returnKeyType="next"
        />
        <View style={styles.timeInputRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Start Time (HH:mm)</Text>
            <TextInput
              style={styles.input}
              placeholder="08:00"
              placeholderTextColor="#94a3b8"
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>End Time (HH:mm)</Text>
            <TextInput
              style={styles.input}
              placeholder="09:00"
              placeholderTextColor="#94a3b8"
              value={endTime}
              onChangeText={setEndTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>
      </AppModal>

      <AppModal
        visible={deleteTarget !== null}
        title="Delete routine?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be deleted. This action cannot be undone.`
            : undefined
        }
        actions={[
          {
            label: "Cancel",
            onPress: () => setDeleteTarget(null),
            variant: "secondary",
          },
          {
            label: "Delete",
            onPress: handleDelete,
            variant: "destructive",
          },
        ]}
        onRequestClose={() => setDeleteTarget(null)}
      />

      <AppModal
        visible={feedback !== null}
        title={feedback?.title ?? ""}
        description={feedback?.message}
        actions={[
          {
            label: "OK",
            onPress: () => setFeedback(null),
            variant: "primary",
          },
        ]}
        onRequestClose={() => setFeedback(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#1e293b" },
  addButton: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  addButtonText: { color: "#ffffff", fontWeight: "600", fontSize: 14 },
  tabScroll: { maxHeight: 50, marginBottom: 16 },
  tabContentContainer: { alignItems: "center", paddingRight: 16 },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    height: 38,
    justifyContent: "center",
  },
  tabButtonActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  tabTextActive: { color: "#ffffff" },
  routineCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbeafe",
    elevation: 1,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  emptyText: { color: "#64748b", fontSize: 14 },
  itemTime: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemTitle: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  actionRow: { flexDirection: "row", gap: 8 },
  iconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
  },
  label: { fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    color: "#1e293b",
    fontSize: 14,
  },
  timeInputRow: { flexDirection: "row", gap: 12 },
});
