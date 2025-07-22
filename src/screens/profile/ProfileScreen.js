"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation } from "@react-navigation/native"
import { useDispatch } from "react-redux"
import { useToast } from "react-native-toast-notifications"
import { User, Settings, Edit, Calendar, Star, Shield, HelpCircle, Info, Bell, ChevronRight } from "lucide-react-native"
import YourStats from "../../components/YourStats"

export default function ProfileScreen({ userId, userRole, userData }) {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const toast = useToast()

  const baseUrl = "https://ui-avatars.com/api/";
    const initials = encodeURIComponent(userData?.name || "User");
    const [profileImage, setProfileImage] = useState(
      userData?.photoURL || `${baseUrl}?name=${initials}&background=0D47A1&color=fff`
    );
  

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
          averageRating: 0,
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
        {/* <View className="w-24 h-24 rounded-full bg-[#ea580c] justify-center items-center">
          <Text className="text-white text-3xl font-bold">{userData?.name ? userData.name[0].toUpperCase() : "?"}</Text>
        </View> */}
        <Image
                  source={{ uri: profileImage }}
                  className="w-24 h-24 rounded-full "
                />

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
          <YourStats isDark={isDark}/>
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
        {/* <View className="w-24 h-24 rounded-full bg-[#ea580c] justify-center items-center">
          <Text className="text-white text-3xl font-bold">{userData?.name ? userData.name[0].toUpperCase() : "?"}</Text>
        </View> */}
<Image
                  source={{ uri: profileImage }}
                  className="w-24 h-24 rounded-full "
                />
        <Text className={`text-2xl font-bold mt-4 ${isDark ? "text-white" : "text-black"}`}>{userData?.name}</Text>

        <Text className={`text-base ${isDark ? "text-white/70" : "text-black/70"}`}>
          {userData?.title || "Therapist"}
        </Text>

        <View className="flex-row items-center mt-2">
          <Star size={16} color="#FFD700" fill="#FFD700" />
          <Text className={`ml-1 ${isDark ? "text-white" : "text-black"}`}>{stats.averageRating} Rating</Text>
        </View>

        <View className="flex-row items-center mt-2">
 

  <View
    className={` px-2 py-0.5 border rounded-full ${
      userData?.isVerified
        ? "bg-green-200 border-green-300" 
        : "bg-red-200 border-red-300"
    }`}
  >
    <Text
      className={`text-sm font-semibold ${
        userData?.isVerified ? "text-green-700" : "text-red-700"
      }`}
    >
      {userData?.isVerified ? "Approved" : "Pending approval"}
    </Text>
  </View>
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
        <View className="">
          <YourStats isDark={isDark}/>
        </View>



        {/* <TouchableOpacity
          className="mt-4 flex-row items-center justify-center bg-[#1E1E1E] p-3 rounded-lg"
          onPress={() => navigation.navigate("ProfessionalStats")}
        >
          <Text className={`${isDark ? "text-white" : "text-white"}`}>View Detailed Stats</Text>
        </TouchableOpacity> */}
        <TouchableOpacity
                                  className="mt-4 flex-1 bg-[#ea580c] p-3 rounded-lg flex-row items-center justify-center gap-2"
                                              onPress={() => navigation.navigate("AvailabilitySettings")}

                                >
                                  <Calendar size={16} color={isDark ? "#FFFFFF" : "#FFFFFF"} />
                                  <Text className={` ${isDark ? "text-white" : "text-white"}`}>Manage Availability</Text>
                                
                                
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

          
          
        </View>
      </View>
    </>
  )

  const renderSettingsOptions = () => (
   <View className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
    <View className="mb-6">
      <Text className={`text-lg font-bold px-6 mb-2 ${isDark ? "text-white" : "text-black"}`}>Settings</Text>

      
       <TouchableOpacity
  className={`flex-row items-center py-5 px-4 border-b ${isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"}`}
  onPress={() => navigation.navigate("Settings")}
>
  <View className="w-10 justify-center items-center">
    <Settings size={20} color={isDark ? "#FFFFFF" : "#000000"} />
  </View>
  <View className="flex-1 ml-3">
    <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Settings</Text>
  </View>
  <ChevronRight size={20} color={isDark ? "#FFFFFF80" : "#00000080"} />
</TouchableOpacity>

<TouchableOpacity
  className={`flex-row items-center py-5 px-4 border-b ${isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"}`}
  onPress={() => navigation.navigate("ThemeSettings")}
>
  <View className="w-10 justify-center items-center">
    <User size={20} color={isDark ? "#FFFFFF" : "#000000"} />
  </View>
  <View className="flex-1 ml-3">
    <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Theme</Text>
  </View>
  <ChevronRight size={20} color={isDark ? "#FFFFFF80" : "#00000080"} />
</TouchableOpacity>

<TouchableOpacity
  className={`flex-row items-center py-5 px-4 border-b ${isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"}`}
  onPress={() => navigation.navigate("NotificationSettings")}
>
  <View className="w-10 justify-center items-center">
    <Bell size={20} color={isDark ? "#FFFFFF" : "#000000"} />
  </View>
  <View className="flex-1 ml-3">
    <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Notifications</Text>
  </View>
  <ChevronRight size={20} color={isDark ? "#FFFFFF80" : "#00000080"} />
</TouchableOpacity>

<TouchableOpacity
  className={`flex-row items-center py-5 px-4 border-b ${isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"}`}
  onPress={() => navigation.navigate("PrivacySettings")}
>
  <View className="w-10 justify-center items-center">
    <Shield size={20} color={isDark ? "#FFFFFF" : "#000000"} />
  </View>
  <View className="flex-1 ml-3">
    <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Privacy</Text>
  </View>
  <ChevronRight size={20} color={isDark ? "#FFFFFF80" : "#00000080"} />
</TouchableOpacity>

<TouchableOpacity
  className={`flex-row items-center py-5 px-4 border-b ${isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"}`}
  onPress={() => navigation.navigate("HelpSupport")}
>
  <View className="w-10 justify-center items-center">
    <HelpCircle size={20} color={isDark ? "#FFFFFF" : "#000000"} />
  </View>
  <View className="flex-1 ml-3">
    <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Help & Support</Text>
  </View>
  <ChevronRight size={20} color={isDark ? "#FFFFFF80" : "#00000080"} />
</TouchableOpacity>

<TouchableOpacity
  className={`flex-row items-center py-5 px-4 border-b ${isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"}`}
  onPress={() => navigation.navigate("About")}
>
  <View className="w-10 justify-center items-center">
    <Info size={20} color={isDark ? "#FFFFFF" : "#000000"} />
  </View>
  <View className="flex-1 ml-3">
    <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>About</Text>
  </View>
  <ChevronRight size={20} color={isDark ? "#FFFFFF80" : "#00000080"} />
</TouchableOpacity>

      
    </View>
    </View>
  )

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        {/* <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>Loading profile...</Text> */}
      </View>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="py-6">
        <View className="px-5">
        {userRole === "patient" ? renderPatientProfile() : renderProfessionalProfile()}

        </View>

        {renderSettingsOptions()}

        <Text className={`text-center text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
          © {new Date().getFullYear()} Mentacare. All rights reserved.
        </Text>
      </View>
       
    </ScrollView>
  )
}

