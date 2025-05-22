"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { useTheme } from "../context/ThemeContext"

export default function AuthScreen({ onLogin }) {
  const { isDark } = useTheme()
  const [isLogin, setIsLogin] = useState(true)
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAuth = async () => {
    if (!userId.trim()) {
      setError("User ID is required")
      return
    }

    if (!isLogin && !userName.trim()) {
      setError("Name is required")
      return
    }

    if (!password.trim()) {
      setError("Password is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      // In a real app, you would call your backend API here
      // This is a mock implementation for demo purposes

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock token - in a real app, this would come from your backend
      const token = "mock_token_" + userId

      // Call the login callback
      onLogin(userId, userName || userId, token)
    } catch (error) {
      setError("Authentication failed. Please try again.")
      console.log("Auth error:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setError("")
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}
    >
      <ScrollView className="flex-grow">
        <View className="items-center mt-16 mb-10">
          <Image
            source={{ uri: "https://getstream.io/static/0e56fedb4d06c4df5f1b37596153af4c/b5964/logo.webp" }}
            className="w-[200px] h-[60px]"
            resizeMode="contain"
          />
        </View>

        <Text className={`text-2xl font-bold mb-6 text-center ${isDark ? "text-white" : "text-black"}`}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </Text>

        <View className="px-6">
          <TextInput
            className={`h-12 rounded-lg px-4 mb-4 text-base ${
              isDark
                ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
            }`}
            placeholder="User ID"
            placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
          />

          {!isLogin && (
            <TextInput
              className={`h-12 rounded-lg px-4 mb-4 text-base ${
                isDark
                  ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                  : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
              }`}
              placeholder="Name"
              placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
              value={userName}
              onChangeText={setUserName}
            />
          )}

          <TextInput
            className={`h-12 rounded-lg px-4 mb-4 text-base ${
              isDark
                ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
            }`}
            placeholder="Password"
            placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text className="text-[#FF3B30] mb-4 text-center">{error}</Text> : null}

          <TouchableOpacity
            className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-2"
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-bold">{isLogin ? "Sign In" : "Sign Up"}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleAuthMode} className="mt-6 items-center">
            <Text className="text-[#ea580c] text-sm">
              {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

