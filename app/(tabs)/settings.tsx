import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, FileJson2, Trash2 } from "lucide-react-native";
import { AppModal } from "../../src/components/AppModal";
import { parseRoutineJson } from "../../src/domain/routine";
import { clearRoutines, saveRoutines } from "../../src/services/routineData";
import { syncCurrentTaskNotifications, showCurrentTaskNow } from "../../src/services/currentTaskNotification";
import { refreshWidget } from "../../src/widget/updateWidget";

const JSON_EXAMPLE = `[
  {
    "day": "Monday",
    "startTime": "08:00",
    "endTime": "09:00",
    "title": "Study"
  },
  {
    "day": "Tuesday",
    "startTime": "10:00",
    "endTime": "11:00",
    "title": "Exercise"
  }
]`;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [importVisible, setImportVisible] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [clearConfirmationVisible, setClearConfirmationVisible] =
    useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const handleShowNotification = async () => {
    try {
      const title = await showCurrentTaskNow();
      if (!title) {
        setFeedback({
          title: "No routine",
          message: "There is no routine in progress right now.",
        });
      }
    } catch (error) {
      console.error("Failed to show notification:", error);
      setFeedback({
        title: "Failed to show notification",
        message: "Check the notification permission and try again.",
      });
    }
  };

  const handleImport = async () => {
    try {
      const routines = parseRoutineJson(jsonText);
      await saveRoutines(routines);
      await syncCurrentTaskNotifications();
      refreshWidget();
      setJsonText("");
      setImportVisible(false);
      const importedDays = [...new Set(routines.map((routine) => routine.day))];
      setFeedback({
        title: "Import successful",
        message: routines.length
          ? `${routines.length} ${routines.length === 1 ? "routine" : "routines"} imported for ${importedDays.join(", ")}. Open Manage Routines and select one of those days.`
          : "The JSON contains no routines, so the routine list is now empty.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The routines could not be imported.";
      setImportVisible(false);
      setFeedback({ title: "Import failed", message });
    }
  };

  const handleClear = async () => {
    setClearConfirmationVisible(false);
    try {
      await clearRoutines();
      await syncCurrentTaskNotifications();
      refreshWidget();
      setFeedback({
        title: "Routines deleted",
        message: "All routines have been deleted.",
      });
    } catch (error) {
      console.error("Failed to delete routines:", error);
      setFeedback({
        title: "Failed to delete routines",
        message: "The routines could not be deleted. Please try again.",
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity onPress={handleShowNotification} style={styles.card}>
        <View style={styles.cardIcon}>
          <Bell size={21} color="#2563eb" strokeWidth={2} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Show notification now</Text>
          <Text style={styles.cardSubtitle}>
            Show the notification for the routine in progress
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setImportVisible(true)}
        style={styles.card}
      >
        <View style={styles.cardIcon}>
          <FileJson2 size={21} color="#2563eb" strokeWidth={2} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Import routines from JSON</Text>
          <Text style={styles.cardSubtitle}>
            Replace all routines with valid JSON data
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setClearConfirmationVisible(true)}
        style={styles.card}
      >
        <View style={styles.cardIcon}>
          <Trash2 size={21} color="#2563eb" strokeWidth={2} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Delete all routines</Text>
          <Text style={styles.cardSubtitle}>
            Clear the routines for every day
          </Text>
        </View>
      </TouchableOpacity>

      <AppModal
        visible={importVisible}
        title="Import routines from JSON"
        description="The format must be an array. Each routine requires day, startTime, endTime, and title. Statuses will be reset."
        actions={[
          {
            label: "Cancel",
            onPress: () => setImportVisible(false),
            variant: "secondary",
          },
          {
            label: "Validate and import",
            onPress: handleImport,
            variant: "primary",
          },
        ]}
        onRequestClose={() => setImportVisible(false)}
      >
        <TextInput
          style={styles.jsonInput}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={JSON_EXAMPLE}
          placeholderTextColor="#64748b"
          value={jsonText}
          onChangeText={setJsonText}
        />
      </AppModal>

      <AppModal
        visible={clearConfirmationVisible}
        title="Delete all routines?"
        description="All routines for every day will be deleted. This action cannot be undone."
        actions={[
          {
            label: "Cancel",
            onPress: () => setClearConfirmationVisible(false),
            variant: "secondary",
          },
          {
            label: "Delete all",
            onPress: handleClear,
            variant: "destructive",
          },
        ]}
        onRequestClose={() => setClearConfirmationVisible(false)}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
    marginBottom: 12,
    gap: 14,
  },
  cardIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#eff6ff",
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  cardSubtitle: { fontSize: 12, color: "#64748b", marginTop: 4 },
  jsonInput: {
    minHeight: 220,
    maxHeight: 360,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 12,
    padding: 12,
    color: "#1e293b",
    fontSize: 13,
    marginBottom: 14,
  },
});
