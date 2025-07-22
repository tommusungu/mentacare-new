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
import { loginUser, setUser } from "../../redux/slices/userSlice"
import { useToast } from "react-native-toast-notifications"
import { Eye, EyeOff } from "lucide-react-native"
import { StatusBar } from "react-native"
import logoDark from '../../../assets/loginImage.png'

export default function LoginScreen({ navigation, onLogin }) {
  const { isDark } = useTheme()
  const dispatch = useDispatch()
  const toast = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!email.trim()) {
      setError("Email is required")
      return
    }

    if (!password.trim()) {
      setError("Password is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const resultAction = await dispatch(loginUser({ email, password }))

      if (loginUser.fulfilled.match(resultAction)) {
        const userData = resultAction.payload


        // Call the login callback to set up Stream clients
        onLogin(userData.uid, userData.name, userData.role, userData)
        console.log('userData:',userData)
        
       dispatch(setUser(userData))

        toast.show("Login successful!", {
          type: "success",
          placement: "top",
          duration: 3000,
        })
      } else {
        setError(resultAction.payload || "Login failed. Please try again.")
        toast.show("Login failed", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      }
    } catch (error) {
      setError("Authentication failed. Please try again.")
      toast.show("Authentication error", {
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
        <View className="items-center mt-10 mb-8">
          <Image
                      source={logoDark}
                      className="w-auto h-[250px] rounded-xl mb-4"
                      resizeMode="contain"
                    />
          
        </View>

        <Text className={`text-2xl font-bold mb-6 text-center ${isDark ? "text-white" : "text-black"}`}>
          Welcome Back
        </Text>

        <View className="px-6">
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

          <TouchableOpacity className="self-end mb-6" onPress={() => navigation.navigate("ForgotPassword")}>
            <Text className="text-[#ea580c] text-sm">Forgot Password?</Text>
          </TouchableOpacity>

          {error ? <Text className="text-[#FF3B30] mb-4 text-center">{error}</Text> : null}

          <TouchableOpacity
            className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-2"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-bold">Sign In</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className={`text-sm ${isDark ? "text-white" : "text-black"}`}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text className="text-[#ea580c] text-sm font-medium">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

