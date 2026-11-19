import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface AppModalAction {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "destructive";
  disabled?: boolean;
}

interface AppModalProps {
  visible: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  actions: AppModalAction[];
  onRequestClose: () => void;
}

export function AppModal({
  visible,
  title,
  description,
  children,
  actions,
  onRequestClose,
}: AppModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onRequestClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.panel}>
            <Text style={styles.title}>{title}</Text>
            {description ? (
              <Text style={styles.description}>{description}</Text>
            ) : null}
            {children}
            <View
              style={[
                styles.actions,
                actions.length === 1 && styles.singleAction,
              ]}
            >
              {actions.map((action) => {
                const variant = action.variant ?? "secondary";
                return (
                  <TouchableOpacity
                    key={action.label}
                    accessibilityRole="button"
                    disabled={action.disabled}
                    onPress={() => {
                      void action.onPress();
                    }}
                    style={[
                      styles.action,
                      variant === "primary" && styles.primaryAction,
                      variant === "destructive" && styles.destructiveAction,
                      action.disabled && styles.disabledAction,
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        variant !== "secondary" && styles.primaryActionText,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  panel: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  title: {
    color: "#1e293b",
    fontSize: 19,
    fontWeight: "700",
  },
  description: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  singleAction: { justifyContent: "flex-end" },
  action: {
    minHeight: 44,
    minWidth: 92,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  primaryAction: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  destructiveAction: { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" },
  disabledAction: { opacity: 0.55 },
  actionText: { color: "#1d4ed8", fontSize: 14, fontWeight: "600" },
  primaryActionText: { color: "#ffffff" },
});
