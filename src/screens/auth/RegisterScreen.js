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
import { useDispatch } from "react-redux"
import { registerUser } from "../../redux/slices/userSlice"
import { useToast } from "react-native-toast-notifications"
import { Eye, EyeOff } from "lucide-react-native"
import { StatusBar } from "react-native"
import logoLight from '../../../assets/loginImage.png' 
import logoDark from '../../../assets/loginImage.png'

export default function RegisterScreen({ navigation }) {
  const { isDark } = useTheme()
  const dispatch = useDispatch()
  const toast = useToast()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async () => {
    // Validation
    if (!name.trim()) {
      setError("Name is required")
      return
    }

    if (!email.trim()) {
      setError("Email is required")
      return
    }

    if (!password.trim()) {
      setError("Password is required")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      // We'll just create the basic user here, then navigate to role selection
      // The full profile will be completed in subsequent screens
      const resultAction = await dispatch(
        registerUser({
          email,
          password,
          name,
          role: null, // Will be set in role selection
          profileData: {
            createdAt: new Date().toISOString(),
            isProfileComplete: false,
          },
        }),
      )

      if (registerUser.fulfilled.match(resultAction)) {
        toast.show("Account created successfully!", {
          type: "success",
          placement: "top",
          duration: 3000,
        })

        // Navigate to role selection with the user data
        navigation.navigate("RoleSelection", { userData: resultAction.payload })
      } else {
        setError(resultAction.payload || "Registration failed. Please try again.")
        toast.show("Registration failed", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      }
    } catch (error) {
      setError("Registration failed. Please try again.")
      toast.show("Registration error", {
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
        <StatusBar
                barStyle={`${isDark ? "light-content" : "dark-content"}`}
                backgroundColor={`${isDark ? "#121212" : "#FFFFFF"}`}
              />
        <View className="items-center mt-8 mb-6">
          <Image
                               source={isDark ? logoDark : logoLight}
                               className="w-auto h-[250px] rounded-xl mb-4"
                               resizeMode="contain"
                             />
         
        </View>

        <Text className={`text-2xl font-bold mb-6 text-center ${isDark ? "text-white" : "text-black"}`}>
          Create Account
        </Text>

        <View className="px-6">
          <TextInput
            className={`h-12 rounded-lg px-4 mb-4 text-base ${
              isDark
                ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
            }`}
            placeholder="Full Name"
            placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
            value={name}
            onChangeText={setName}
          />

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

          <View className="relative mb-4">
            <TextInput
              className={`h-12 rounded-lg px-4 pr-12 text-base ${
                isDark
                  ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                  : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
              }`}
              placeholder="Password"
              placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity className="absolute right-3 top-3" onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={24} color={isDark ? "#FFFFFF80" : "#00000080"} />
              ) : (
                <Eye size={24} color={isDark ? "#FFFFFF80" : "#00000080"} />
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            className={`h-12 rounded-lg px-4 mb-4 text-base ${
              isDark
                ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
            }`}
            placeholder="Confirm Password"
            placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />

          {error ? <Text className="text-[#FF3B30] mb-4 text-center">{error}</Text> : null}

          <TouchableOpacity
            className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-2"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-bold">Sign Up</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className={`text-sm ${isDark ? "text-white" : "text-black"}`}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text className="text-[#ea580c] text-sm font-medium">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

