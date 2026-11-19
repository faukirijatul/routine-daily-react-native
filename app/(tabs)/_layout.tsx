import { Tabs } from "expo-router";
import { CalendarDays, House, Settings2 } from "lucide-react-native";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarShowLabel: true,
        headerShown: false,
        tabBarButton: (props) => (
          <Pressable
            {...props}
            ref={undefined}
            android_ripple={{ color: "#eff6ff", borderless: false }}
          />
        ),
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 0,
          shadowColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        tabBarItemStyle: { elevation: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Jadwal Hari Ini",
          tabBarIcon: ({ color, size, focused }) => (
            <House color={color} size={size} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: "Kelola Jadwal",
          tabBarIcon: ({ color, size, focused }) => (
            <CalendarDays
              color={color}
              size={size}
              strokeWidth={focused ? 2.4 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Pengaturan",
          tabBarIcon: ({ color, size, focused }) => (
            <Settings2
              color={color}
              size={size}
              strokeWidth={focused ? 2.4 : 1.8}
            />
          ),
        }}
      />
    </Tabs>
  );
}