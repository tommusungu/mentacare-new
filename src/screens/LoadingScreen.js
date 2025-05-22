"use client"
import { View, ActivityIndicator, Text } from "react-native"
// import { useTheme } from "../context/ThemeContext"

export default function LoadingScreen() {
  const isDark  = "dark";

  return (
    <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <ActivityIndicator size="large" color="#ea580c" />
      <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-[#333333]"}`}>Loading...</Text>
    </View>
  )
}

