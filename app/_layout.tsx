import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#ff5a5f", // red when selected
        tabBarInactiveTintColor: "#b5b5b5", // grey when not

        tabBarStyle: {
          height: 78,
          paddingTop: 8,
          paddingBottom: 18,
          borderTopWidth: 1,
          borderTopColor: "#eee",
          backgroundColor: "#fff",
        },

        tabBarItemStyle: {
          paddingTop: 0,
          paddingBottom: 12,
        },

        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: new Date()
            .toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })
            .replace("/", "-"),

          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="book" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="coins" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="ellipsis-horizontal-outline"
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
