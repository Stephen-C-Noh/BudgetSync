import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  const todayLabel = new Date()
    .toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
    })
    .replace("/", "-");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#00D9FF",
        tabBarInactiveTintColor: "#A7B1C2",
        tabBarStyle: {
          backgroundColor: "#081826",
          borderTopWidth: 0,
          height: 78,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      {/* 1️⃣ FIRST TAB - RECORD / DATE */}
      <Tabs.Screen
        name="index"
        options={{
          title: new Date()
            .toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })
            .replace("/", "-"),

          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 2️⃣ SECOND TAB - STATS ✅ */}
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={24} color={color} />
          ),
        }}
      />

      {/* 3️⃣ THIRD TAB - AI CHAT */}
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: "AI Chat",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbox-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 4️⃣ FOURTH TAB - ACCOUNTS */}
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="wallet-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 5️⃣ FIFTH TAB - MORE */}
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <Ionicons name="ellipsis-horizontal" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}