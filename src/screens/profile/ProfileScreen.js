"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation } from "@react-navigation/native"
import { useDispatch } from "react-redux"
import { useToast } from "react-native-toast-notifications"
import { User, Settings, Edit, Calendar, Star, Shield, HelpCircle, Info, Bell } from "lucide-react-native"

export default function ProfileScreen({ userId, userRole, userData }) {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const toast = useToast()

  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    averageRating: 0,
  })

  useEffect(() => {
    const fetchUserStats = async () => {
      setLoading(true)
      try {
        // In a real app, you would fetch this data from your backend
        // This is mock data for demonstration purposes
        setStats({
          totalSessions: 12,
          completedSessions: 8,
          upcomingSessions: 4,
          averageRating: 4.8,
        })
      } catch (error) {
        console.error("Error fetching user stats:", error)
        toast.show("Failed to load profile data", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserStats()
  }, [userId])

  const renderPatientProfile = () => (
    <>
      <View className="items-center mb-6">
        <View className="w-24 h-24 rounded-full bg-[#ea580c] justify-center items-center">
          <Text className="text-white text-3xl font-bold">{userData?.name ? userData.name[0].toUpperCase() : "?"}</Text>
        </View>

        <Text className={`text-2xl font-bold mt-4 ${isDark ? "text-white" : "text-black"}`}>{userData?.name}</Text>

        <Text className={`text-base ${isDark ? "text-white/70" : "text-black/70"}`}>Patient</Text>

        <TouchableOpacity
          className="mt-4 flex-row items-center bg-[#ea580c] px-4 py-2 rounded-lg"
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Edit size={16} color="#FFFFFF" />
          <Text className="text-white ml-2">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-6">
        <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Your Stats</Text>

        <View className="flex-row justify-between">
          <View className={`p-4 rounded-xl flex-1 mr-2 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Total Sessions</Text>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>{stats.totalSessions}</Text>
          </View>

          <View className={`p-4 rounded-xl flex-1 ml-2 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Upcoming</Text>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
              {stats.upcomingSessions}
            </Text>
          </View>
        </View>
      </View>

      <View className="mb-6">
        <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Personal Information</Text>

        <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          {userData?.email && (
            <View className="mb-3">
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Email</Text>
              <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>{userData.email}</Text>
            </View>
          )}

          {userData?.age && (
            <View className="mb-3">
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Age</Text>
              <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>{userData.age}</Text>
            </View>
          )}

          {userData?.gender && (
            <View className="mb-3">
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Gender</Text>
              <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>{userData.gender}</Text>
            </View>
          )}

          {userData?.emergencyContact && (
            <View>
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Emergency Contact</Text>
              <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>{userData.emergencyContact}</Text>
            </View>
          )}
        </View>
      </View>
    </>
  )

  const renderProfessionalProfile = () => (
    <>
      <View className="items-center mb-6">
        <View className="w-24 h-24 rounded-full bg-[#ea580c] justify-center items-center">
          <Text className="text-white text-3xl font-bold">{userData?.name ? userData.name[0].toUpperCase() : "?"}</Text>
        </View>

        <Text className={`text-2xl font-bold mt-4 ${isDark ? "text-white" : "text-black"}`}>{userData?.name}</Text>

        <Text className={`text-base ${isDark ? "text-white/70" : "text-black/70"}`}>
          {userData?.title || "Therapist"}
        </Text>

        <View className="flex-row items-center mt-2">
          <Star size={16} color="#FFD700" fill="#FFD700" />
          <Text className={`ml-1 ${isDark ? "text-white" : "text-black"}`}>{stats.averageRating} Rating</Text>
        </View>

        <TouchableOpacity
          className="mt-4 flex-row items-center bg-[#ea580c] px-4 py-2 rounded-lg"
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Edit size={16} color="#FFFFFF" />
          <Text className="text-white ml-2">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-6">
        <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Your Stats</Text>

        <View className="flex-row justify-between mb-2">
          <View className={`p-4 rounded-xl flex-1 mr-2 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Total Sessions</Text>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>{stats.totalSessions}</Text>
          </View>

          <View className={`p-4 rounded-xl flex-1 ml-2 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Completed</Text>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
              {stats.completedSessions}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between">
          <View className={`p-4 rounded-xl flex-1 mr-2 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Upcoming</Text>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
              {stats.upcomingSessions}
            </Text>
          </View>

          <View className={`p-4 rounded-xl flex-1 ml-2 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Rating</Text>
            <View className="flex-row items-center">
              <Text className={`text-xl font-bold mr-1 ${isDark ? "text-white" : "text-black"}`}>
                {stats.averageRating}
              </Text>
              <Star size={16} color="#FFD700" fill="#FFD700" />
            </View>
          </View>
        </View>

        <TouchableOpacity
          className="mt-4 flex-row items-center justify-center bg-[#1E1E1E] p-3 rounded-lg"
          onPress={() => navigation.navigate("ProfessionalStats")}
        >
          <Text className={`${isDark ? "text-white" : "text-white"}`}>View Detailed Stats</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-6">
        <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
          Professional Information
        </Text>

        <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          {userData?.email && (
            <View className="mb-3">
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Email</Text>
              <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>{userData.email}</Text>
            </View>
          )}

          {userData?.specialization && (
            <View className="mb-3">
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Specialization</Text>
              <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>{userData.specialization}</Text>
            </View>
          )}

          {userData?.experience && (
            <View className="mb-3">
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Experience</Text>
              <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>{userData.experience} years</Text>
            </View>
          )}

          <TouchableOpacity
            className="mt-2 flex-row items-center"
            onPress={() => navigation.navigate("AvailabilitySettings")}
          >
            <Calendar size={16} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>Manage Availability</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )

  const renderSettingsOptions = () => (
    <View className="mb-6">
      <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Settings</Text>

      <View className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
        <TouchableOpacity
          className="flex-row items-center p-4 border-b border-gray-700"
          onPress={() => navigation.navigate("Settings")}
        >
          <Settings size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          <Text className={`ml-3 ${isDark ? "text-white" : "text-black"}`}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center p-4 border-b border-gray-700"
          onPress={() => navigation.navigate("ThemeSettings")}
        >
          <User size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          <Text className={`ml-3 ${isDark ? "text-white" : "text-black"}`}>Theme</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center p-4 border-b border-gray-700"
          onPress={() => navigation.navigate("NotificationSettings")}
        >
          <Bell size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          <Text className={`ml-3 ${isDark ? "text-white" : "text-black"}`}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center p-4 border-b border-gray-700"
          onPress={() => navigation.navigate("PrivacySettings")}
        >
          <Shield size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          <Text className={`ml-3 ${isDark ? "text-white" : "text-black"}`}>Privacy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center p-4 border-b border-gray-700"
          onPress={() => navigation.navigate("HelpSupport")}
        >
          <HelpCircle size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          <Text className={`ml-3 ${isDark ? "text-white" : "text-black"}`}>Help & Support</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center p-4" onPress={() => navigation.navigate("About")}>
          <Info size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          <Text className={`ml-3 ${isDark ? "text-white" : "text-black"}`}>About</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>Loading profile...</Text>
      </View>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        {userRole === "patient" ? renderPatientProfile() : renderProfessionalProfile()}
        {renderSettingsOptions()}
      </View>
    </ScrollView>
  )
}

