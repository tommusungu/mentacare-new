"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useDispatch } from "react-redux"
import { updateUserProfile } from "../../redux/slices/userSlice"
import { useToast } from "react-native-toast-notifications"
import { fetchChatToken } from "../../hooks/fetchChatTokenHook"

export default function PatientProfileSetupScreen({ navigation, route, onLogin }) {
  const { userData } = route.params
  const { isDark } = useTheme()
  const dispatch = useDispatch()
  const toast = useToast()

  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [concerns, setConcerns] = useState("")
  const [emergencyContact, setEmergencyContact] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleComplete = async () => {
    // Validation
    if (!age.trim()) {
      setError("Age is required")
      return
    }

    if (!gender.trim()) {
      setError("Gender is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Update user profile in Firestore
      const profileData = {
        age: Number.parseInt(age),
        gender,
        concerns: concerns.trim() || null,
        emergencyContact: emergencyContact.trim() || null,
        isProfileComplete: true,
        updatedAt: new Date().toISOString(),
      }

      const resultAction = await dispatch(
        updateUserProfile({
          userId: userData.uid,
          profileData,
        }),
      )

      if (updateUserProfile.fulfilled.match(resultAction)) {
        toast.show("Profile completed successfully!", {
          type: "success",
          placement: "top",
          duration: 3000,
        })

        // Generate a mock token for Stream - in a real app, this would come from your backend
        const mockToken = await fetchChatToken(userData.uid)
        console.log('mockToken: ',mockToken)

        // Call the login callback to set up Stream clients and complete the auth flow
        onLogin(userData.uid, userData.name, mockToken, "patient", { ...userData, ...profileData })
      } else {
        setError(resultAction.payload || "Failed to update profile. Please try again.")
        toast.show("Profile update failed", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      }
    } catch (error) {
      setError("Failed to update profile. Please try again.")
      toast.show("Profile update error", {
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
          Complete Your Profile
        </Text>

        <Text className={`text-base mb-8 text-center ${isDark ? "text-white/80" : "text-black/80"}`}>
          This information helps us personalize your experience and connect you with the right professionals
        </Text>

        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          placeholder="Age"
          placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <View
          className={`mb-4 rounded-lg overflow-hidden ${
            isDark ? "bg-[#1E1E1E] border border-[#2C2C2C]" : "bg-[#F5F5F5] border border-[#E0E0E0]"
          }`}
        >
          <View className="px-2">
            <Text className={`text-sm pt-2 px-2 ${isDark ? "text-white/80" : "text-black/80"}`}>Gender</Text>
            <View className="flex-row flex-wrap">
              {["Male", "Female", "Non-binary", "Prefer not to say"].map((option) => (
                <TouchableOpacity
                  key={option}
                  className={`m-2 px-4 py-2 rounded-full ${
                    gender === option ? "bg-[#ea580c]" : isDark ? "bg-[#2C2C2C]" : "bg-[#E0E0E0]"
                  }`}
                  onPress={() => setGender(option)}
                >
                  <Text className={`${gender === option ? "text-white" : isDark ? "text-white" : "text-black"}`}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TextInput
          className={`h-24 rounded-lg px-4 py-2 mb-4 text-base ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          placeholder="What brings you here? (Optional)"
          placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
          value={concerns}
          onChangeText={setConcerns}
          multiline
          textAlignVertical="top"
        />

        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          placeholder="Emergency Contact (Optional)"
          placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
          value={emergencyContact}
          onChangeText={setEmergencyContact}
        />

        {error ? <Text className="text-[#FF3B30] mb-4 text-center">{error}</Text> : null}

        <TouchableOpacity
          className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-6"
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-bold">Complete Profile</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity className="mt-4" onPress={() => navigation.goBack()}>
          <Text className="text-[#ea580c] text-center">Go Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

