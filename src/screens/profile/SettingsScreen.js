"use client"
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation } from "@react-navigation/native"
import { useDispatch } from "react-redux"
import { clearUser, logoutUser } from "../../redux/slices/userSlice"
import { useToast } from "react-native-toast-notifications"
import { Moon, Sun, LogOut, User, Bell, Shield, HelpCircle, Info, ChevronRight } from "lucide-react-native"

export default function SettingsScreen({ onLogout }) {
  const { isDark, themeMode, toggleTheme } = useTheme()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const toast = useToast()

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await dispatch(logoutUser())
            await dispatch(clearUser())
            onLogout()
            toast.show("Logged out successfully", {
              type: "success",
              placement: "top",
              duration: 3000,
            })
          } catch (error) {
            console.error("Logout error:", error)
            toast.show("Failed to logout", {
              type: "danger",
              placement: "top",
              duration: 3000,
            })
          }
        },
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
      {type === "arrow" && <ChevronRight size={20} color={isDark ? "#FFFFFF80" : "#00000080"} />}
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
          () => navigation.navigate("EditProfile"),
        )}
        {renderSettingItem(
          <Bell size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "Notifications",
          "Manage notification preferences",
          () => navigation.navigate("NotificationSettings"),
        )}
        {renderSettingItem(
          <Shield size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "Privacy",
          "Control your privacy settings",
          () => navigation.navigate("PrivacySettings"),
        )}
      </View>

      <View className="mb-6">
        <Text className={`text-base font-bold mx-4 my-2 ${isDark ? "text-white" : "text-black"}`}>Support</Text>
        {renderSettingItem(
          <HelpCircle size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "Help & Support",
          "Get help with the app",
          () => navigation.navigate("HelpSupport"),
        )}
        {renderSettingItem(
          <Info size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "About",
          "App version and information",
          () => navigation.navigate("About"),
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

