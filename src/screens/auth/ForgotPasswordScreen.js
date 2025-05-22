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
import { useTheme } from "../../context/ThemeContext"
import { useToast } from "react-native-toast-notifications"
import { auth } from "../../config/firebase"
import { sendPasswordResetEmail } from "firebase/auth"

export default function ForgotPasswordScreen({ navigation }) {
  const { isDark } = useTheme()
  const toast = useToast()

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("Email is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess(true)
      toast.show("Password reset email sent!", {
        type: "success",
        placement: "top",
        duration: 3000,
      })
    } catch (error) {
      setError("Failed to send reset email. Please check your email address.")
      toast.show("Reset password failed", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}
    >
      <ScrollView className="flex-grow">
        <View className="items-center mt-10 mb-8">
          <Image
            source={{ uri: "https://placeholder.svg?height=80&width=240" }}
            className="w-[240px] h-[80px]"
            resizeMode="contain"
          />
        </View>

        <Text className={`text-2xl font-bold mb-6 text-center ${isDark ? "text-white" : "text-black"}`}>
          Reset Password
        </Text>

        {success ? (
          <View className="px-6">
            <View className={`p-4 rounded-lg mb-6 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>
                Password reset email sent! Please check your inbox and follow the instructions to reset your password.
              </Text>
            </View>

            <TouchableOpacity
              className="h-12 rounded-lg justify-center items-center bg-[#ea580c]"
              onPress={() => navigation.navigate("Login")}
            >
              <Text className="text-white text-base font-bold">Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-6">
            <Text className={`text-base mb-6 text-center ${isDark ? "text-white/80" : "text-black/80"}`}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>

            <TextInput
              className={`h-12 rounded-lg px-4 mb-4 text-base ${
                isDark
                  ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                  : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
              }`}
              placeholder="Email"
              placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {error ? <Text className="text-[#FF3B30] mb-4 text-center">{error}</Text> : null}

            <TouchableOpacity
              className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-2"
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-bold">Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity className="mt-6" onPress={() => navigation.navigate("Login")}>
              <Text className="text-[#ea580c] text-center">Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

