"use client"
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { Moon, Sun, LogOut, User, Bell, Shield, HelpCircle, Info } from "lucide-react-native"

export default function SettingsScreen({ route }) {
  const { onLogout } = route.params
  const { isDark, themeMode, toggleTheme } = useTheme()

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: onLogout,
        style: "destructive",
      },
    ])
  }

  const renderSettingItem = (icon, title, subtitle, action, type = "arrow") => (
    <TouchableOpacity
      className={`flex-row items-center py-3 px-4 border-b ${isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"}`}
      onPress={action}
    >
      <View className="w-10 justify-center items-center">{icon}</View>
      <View className="flex-1 ml-3">
        <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>{title}</Text>
        {subtitle && <Text className={`text-sm mt-0.5 ${isDark ? "text-white/80" : "text-black/80"}`}>{subtitle}</Text>}
      </View>
      {type === "arrow" && <Text className={`text-xl font-bold ${isDark ? "text-white/80" : "text-black/80"}`}>›</Text>}
      {type === "switch" && (
        <Switch
          value={isDark}
          onValueChange={(value) => toggleTheme(value ? "dark" : "light")}
          trackColor={{ false: isDark ? "#2C2C2C" : "#E0E0E0", true: "#ea580c" }}
          thumbColor="#FFFFFF"
        />
      )}
      {type === "system" && (
        <TouchableOpacity
          className={`px-3 py-1.5 rounded-full ${themeMode === "system" ? "bg-[#ea580c]" : "bg-transparent"}`}
          onPress={() => toggleTheme("system")}
        >
          <Text
            className={`text-sm font-medium ${
              themeMode === "system" ? "text-white" : isDark ? "text-white" : "text-black"
            }`}
          >
            System
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="mb-6">
        <Text className={`text-base font-bold mx-4 my-2 ${isDark ? "text-white" : "text-black"}`}>Appearance</Text>
        {renderSettingItem(
          <Moon size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "Dark Mode",
          "Toggle between light and dark mode",
          () => {},
          "switch",
        )}
        
        {renderSettingItem(
          <Sun size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "Use System Settings",
          "Automatically switch based on device settings",
          () => {},
          "system",
        )}
      </View>

      <View className="mb-6">
        <Text className={`text-base font-bold mx-4 my-2 ${isDark ? "text-white" : "text-black"}`}>Account</Text>
        {renderSettingItem(
          <User size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "Profile",
          "Edit your profile information",
          () => {},
        )}
        {renderSettingItem(
          <Bell size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "Notifications",
          "Manage notification preferences",
          () => {},
        )}
        {renderSettingItem(
          <Shield size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "Privacy",
          "Control your privacy settings",
          () => {},
        )}
      </View>

      <View className="mb-6">
        <Text className={`text-base font-bold mx-4 my-2 ${isDark ? "text-white" : "text-black"}`}>Support</Text>
        {renderSettingItem(
          <HelpCircle size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "Help & Support",
          "Get help with the app",
          () => {},
        )}
        {renderSettingItem(
          <Info size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "About",
          "App version and information",
          () => {},
        )}
      </View>

      <TouchableOpacity
        className="mx-4 my-6 h-12 rounded-lg flex-row justify-center items-center bg-[#FF3B30]"
        onPress={handleLogout}
      >
        <LogOut size={20} color="#FFFFFF" />
        <Text className="ml-2 text-white text-base font-bold">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

