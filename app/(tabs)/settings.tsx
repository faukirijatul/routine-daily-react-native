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
    "day": "Senin",
    "startTime": "08:00",
    "endTime": "09:00",
    "title": "Belajar"
  },
  {
    "day": "Selasa",
    "startTime": "10:00",
    "endTime": "11:00",
    "title": "Olahraga"
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
          title: "Tidak ada jadwal",
          message: "Saat ini tidak ada jadwal yang sedang berjalan.",
        });
      }
    } catch (error) {
      console.error("Gagal menampilkan notifikasi:", error);
      setFeedback({
        title: "Gagal menampilkan notifikasi",
        message: "Silakan periksa izin notifikasi lalu coba lagi.",
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
        title: "Impor berhasil",
        message: routines.length
          ? `${routines.length} jadwal berhasil diimpor untuk hari ${importedDays.join(", ")}. Buka Kelola Jadwal dan pilih salah satu hari tersebut.`
          : "Tidak ada jadwal di dalam JSON, jadi daftar jadwal sekarang kosong.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Jadwal tidak dapat diimpor.";
      setImportVisible(false);
      setFeedback({ title: "Impor gagal", message });
    }
  };

  const handleClear = async () => {
    setClearConfirmationVisible(false);
    try {
      await clearRoutines();
      await syncCurrentTaskNotifications();
      refreshWidget();
      setFeedback({
        title: "Jadwal dihapus",
        message: "Semua jadwal telah dihapus.",
      });
    } catch (error) {
      console.error("Gagal menghapus jadwal:", error);
      setFeedback({
        title: "Gagal menghapus jadwal",
        message: "Jadwal tidak dapat dihapus. Silakan coba lagi.",
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Pengaturan</Text>

      <TouchableOpacity onPress={handleShowNotification} style={styles.card}>
        <View style={styles.cardIcon}>
          <Bell size={21} color="#2563eb" strokeWidth={2} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Tampilkan notifikasi sekarang</Text>
          <Text style={styles.cardSubtitle}>
            Munculkan notifikasi jadwal yang sedang berjalan
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
          <Text style={styles.cardTitle}>Impor jadwal JSON</Text>
          <Text style={styles.cardSubtitle}>
            Mengganti semua jadwal dengan data JSON yang valid
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
          <Text style={styles.cardTitle}>Hapus semua jadwal</Text>
          <Text style={styles.cardSubtitle}>
            Kosongkan jadwal untuk semua hari
          </Text>
        </View>
      </TouchableOpacity>

      <AppModal
        visible={importVisible}
        title="Impor jadwal JSON"
        description="Format harus berupa array. Setiap jadwal memerlukan day, startTime, endTime, dan title. Status akan direset."
        actions={[
          {
            label: "Batal",
            onPress: () => setImportVisible(false),
            variant: "secondary",
          },
          {
            label: "Validasi dan impor",
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
        title="Hapus semua jadwal?"
        description="Semua jadwal untuk seluruh hari akan dihapus. Tindakan ini tidak dapat dibatalkan."
        actions={[
          {
            label: "Batal",
            onPress: () => setClearConfirmationVisible(false),
            variant: "secondary",
          },
          {
            label: "Hapus semua",
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
            label: "Mengerti",
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
