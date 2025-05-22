"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useDispatch } from "react-redux"
import { updateUserProfile } from "../../redux/slices/userSlice"
import { useToast } from "react-native-toast-notifications"
import { Check } from "lucide-react-native"

export default function RoleSelectionScreen({ navigation, route }) {
  const { userData } = route.params
  const { isDark } = useTheme()
  const dispatch = useDispatch()
  const toast = useToast()

  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.show("Please select a role to continue", {
        type: "warning",
        placement: "top",
        duration: 3000,
      })
      return
    }

    setLoading(true)

    try {
      // Update user role in Firestore
      await dispatch(
        updateUserProfile({
          userId: userData.uid,
          profileData: { role: selectedRole },
        }),
      )

      // Navigate to the appropriate profile setup screen
      if (selectedRole === "patient") {
        navigation.navigate("PatientProfileSetup", { userData: { ...userData, role: selectedRole } })
      } else {
        navigation.navigate("ProfessionalProfileSetup", { userData: { ...userData, role: selectedRole } })
      }
    } catch (error) {
      toast.show("Error updating role. Please try again.", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="px-6 py-8">
        <Text className={`text-2xl font-bold mb-6 text-center ${isDark ? "text-white" : "text-black"}`}>
          How will you use Mentacare?
        </Text>

        <Text className={`text-base mb-8 text-center ${isDark ? "text-white/80" : "text-black/80"}`}>
          Select your role to personalize your experience
        </Text>

        <TouchableOpacity
          className={`p-6 rounded-xl mb-6 border-2 ${
            selectedRole === "patient"
              ? "border-[#ea580c] bg-[#ea580c]/10"
              : isDark
                ? "border-[#2C2C2C]"
                : "border-[#E0E0E0]"
          }`}
          onPress={() => setSelectedRole("patient")}
        >
          <View className="flex-row items-center">
            <Image
              source={{ uri: "https://placeholder.svg?height=60&width=60" }}
              className="w-[60px] h-[60px] rounded-full"
            />
            <View className="ml-4 flex-1">
              <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>I'm seeking support</Text>
              <Text className={`text-sm mt-1 ${isDark ? "text-white/80" : "text-black/80"}`}>
                Connect with mental health professionals, schedule appointments, and access resources
              </Text>
            </View>
            {selectedRole === "patient" && (
              <View className="w-8 h-8 rounded-full bg-[#ea580c] justify-center items-center">
                <Check size={20} color="#FFFFFF" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`p-6 rounded-xl mb-6 border-2 ${
            selectedRole === "professional"
              ? "border-[#ea580c] bg-[#ea580c]/10"
              : isDark
                ? "border-[#2C2C2C]"
                : "border-[#E0E0E0]"
          }`}
          onPress={() => setSelectedRole("professional")}
        >
          <View className="flex-row items-center">
            <Image
              source={{ uri: "https://placeholder.svg?height=60&width=60" }}
              className="w-[60px] h-[60px] rounded-full"
            />
            <View className="ml-4 flex-1">
              <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>
                I'm a mental health professional
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? "text-white/80" : "text-black/80"}`}>
                Provide support, manage appointments, and connect with patients
              </Text>
            </View>
            {selectedRole === "professional" && (
              <View className="w-8 h-8 rounded-full bg-[#ea580c] justify-center items-center">
                <Check size={20} color="#FFFFFF" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-8 ${
            !selectedRole ? "opacity-50" : "opacity-100"
          }`}
          onPress={handleContinue}
          disabled={!selectedRole || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-bold">Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

