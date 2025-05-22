"use client"
import { View, Text, TouchableOpacity, ScrollView } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useDispatch } from "react-redux"
import { setThemeMode } from "../../redux/slices/themeSlice"
import { Moon, Sun, Smartphone, Check } from "lucide-react-native"

export default function ThemeSettingsScreen() {
  const { isDark, themeMode, toggleTheme } = useTheme()
  const dispatch = useDispatch()

  const handleThemeChange = (mode) => {
    dispatch(setThemeMode(mode))
    toggleTheme(mode)
  }

  const renderThemeOption = (icon, title, description, mode) => {
    const isSelected = themeMode === mode

    return (
      <TouchableOpacity
        className={`mb-4 p-4 rounded-xl border-2 ${
          isSelected ? "border-[#ea580c] bg-[#ea580c]/10" : isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"
        }`}
        onPress={() => handleThemeChange(mode)}
      >
        <View className="flex-row items-center">
          <View
            className={`w-10 h-10 rounded-full justify-center items-center ${
              isSelected ? "bg-[#ea580c]" : isDark ? "bg-[#2C2C2C]" : "bg-[#E0E0E0]"
            }`}
          >
            {icon}
          </View>

          <View className="flex-1 ml-3">
            <Text className={`text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>{title}</Text>
            <Text className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>{description}</Text>
          </View>

          {isSelected && (
            <View className="w-6 h-6 rounded-full bg-[#ea580c] justify-center items-center">
              <Check size={16} color="#FFFFFF" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Theme Settings</Text>

        <Text className={`text-base mb-4 ${isDark ? "text-white/70" : "text-black/70"}`}>
          Choose how Mentacare looks to you. Select a theme preference below.
        </Text>

        {renderThemeOption(
          <Sun size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "Light",
          "Use light theme regardless of system settings",
          "light",
        )}

        {renderThemeOption(
          <Moon size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "Dark",
          "Use dark theme regardless of system settings",
          "dark",
        )}

        {renderThemeOption(
          <Smartphone size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
          "System",
          "Automatically switch between light and dark themes based on your device settings",
          "system",
        )}

        <View className={`p-4 rounded-xl mt-4 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
            Dark mode can reduce eye strain in low light conditions and save battery on devices with OLED screens.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

