"use client"

import { useState, useEffect } from "react"
import { View, Text, Switch, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useDispatch, useSelector } from "react-redux"
import { db } from "../../config/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useToast } from "react-native-toast-notifications"
import { Shield, Eye, UserX, Trash2, AlertCircle, MessageCircle, Activity } from "lucide-react-native"

export default function PrivacySettingsScreen() {
  const { isDark } = useTheme()
  const dispatch = useDispatch()
  const toast = useToast()

  const currentUser = useSelector((state) => state.user.currentUser)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    profileVisibility: "public",
    showOnlineStatus: true,
    allowDirectMessages: true,
    dataSharing: false,
    activityTracking: true,
  })

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists() && userDoc.data().privacySettings) {
          setSettings(userDoc.data().privacySettings)
        }
      } catch (error) {
        console.error("Error fetching privacy settings:", error)
        toast.show("Failed to load privacy settings", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPrivacySettings()
  }, [currentUser.uid])

  const handleToggle = async (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    try {
      setSaving(true)
      await updateDoc(doc(db, "users", currentUser.uid), {
        privacySettings: newSettings,
      })

      toast.show("Privacy settings updated", {
        type: "success",
        placement: "top",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error updating privacy settings:", error)
      toast.show("Failed to update settings", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })

      // Revert the change
      setSettings(settings)
    } finally {
      setSaving(false)
    }
  }

  const handleProfileVisibility = (visibility) => {
    handleToggle("profileVisibility", visibility)
  }

  const renderSettingItem = (icon, title, description, key) => (
    <View className={`flex-row items-center py-4 border-b ${isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"}`}>
      <View className="w-10 justify-center items-center">{icon}</View>
      <View className="flex-1 ml-3">
        <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>{title}</Text>
        {description && (
          <Text className={`text-sm mt-0.5 ${isDark ? "text-white/70" : "text-black/70"}`}>{description}</Text>
        )}
      </View>
      <Switch
        value={settings[key]}
        onValueChange={(value) => handleToggle(key, value)}
        trackColor={{ false: isDark ? "#2C2C2C" : "#E0E0E0", true: "#ea580c" }}
        thumbColor="#FFFFFF"
        disabled={saving}
      />
    </View>
  )

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>Loading privacy settings...</Text>
      </View>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Privacy Settings</Text>

        <View className="mb-6">
          <Text className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Profile Visibility</Text>

          <View className={`p-4 rounded-xl mb-4 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <Text className={`text-sm mb-3 ${isDark ? "text-white/70" : "text-black/70"}`}>
              Control who can see your profile information
            </Text>

            <TouchableOpacity
              className={`flex-row items-center py-2 px-3 rounded-lg mb-2 ${
                settings.profileVisibility === "public" ? "bg-[#ea580c]" : isDark ? "bg-[#2C2C2C]" : "bg-white"
              }`}
              onPress={() => handleProfileVisibility("public")}
            >
              <Text
                className={`${
                  settings.profileVisibility === "public" ? "text-white" : isDark ? "text-white" : "text-black"
                }`}
              >
                Public - Anyone can view your profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center py-2 px-3 rounded-lg mb-2 ${
                settings.profileVisibility === "connections" ? "bg-[#ea580c]" : isDark ? "bg-[#2C2C2C]" : "bg-white"
              }`}
              onPress={() => handleProfileVisibility("connections")}
            >
              <Text
                className={`${
                  settings.profileVisibility === "connections" ? "text-white" : isDark ? "text-white" : "text-black"
                }`}
              >
                Connections Only - Only people you've connected with
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center py-2 px-3 rounded-lg ${
                settings.profileVisibility === "private" ? "bg-[#ea580c]" : isDark ? "bg-[#2C2C2C]" : "bg-white"
              }`}
              onPress={() => handleProfileVisibility("private")}
            >
              <Text
                className={`${
                  settings.profileVisibility === "private" ? "text-white" : isDark ? "text-white" : "text-black"
                }`}
              >
                Private - Only you and your therapist
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <Text className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
            Communication & Status
          </Text>

          {renderSettingItem(
            <Eye size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Show Online Status",
            "Allow others to see when you are online",
            "showOnlineStatus",
          )}

          {renderSettingItem(
            <MessageCircle size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Allow Direct Messages",
            "Receive messages from professionals",
            "allowDirectMessages",
          )}
        </View>

        <View className="mb-6">
          <Text className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Data & Privacy</Text>

          {renderSettingItem(
            <Shield size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Data Sharing",
            "Share anonymous usage data to improve the app",
            "dataSharing",
          )}

          {renderSettingItem(
            <Activity size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Activity Tracking",
            "Track your app usage and session history",
            "activityTracking",
          )}
        </View>

        <View className="mb-6">
          <Text className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Account Actions</Text>

          <TouchableOpacity
            className={`flex-row items-center py-4 border-b ${isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"}`}
            onPress={() => {
              // Show deactivation confirmation
              Alert.alert(
                "Deactivate Account",
                "Are you sure you want to deactivate your account? You can reactivate it later by logging in.",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Deactivate",
                    onPress: () => {
                      toast.show("This feature is not available in the demo", {
                        type: "info",
                        placement: "top",
                        duration: 3000,
                      })
                    },
                    style: "destructive",
                  },
                ],
              )
            }}
          >
            <View className="w-10 justify-center items-center">
              <UserX size={24} color="#FF3B30" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-base font-medium text-[#FF3B30]">Deactivate Account</Text>
              <Text className={`text-sm mt-0.5 ${isDark ? "text-white/70" : "text-black/70"}`}>
                Temporarily disable your account
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center py-4 border-b ${isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"}`}
            onPress={() => {
              // Show deletion confirmation
              Alert.alert(
                "Delete Account",
                "Are you sure you want to permanently delete your account? This action cannot be undone.",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Delete",
                    onPress: () => {
                      toast.show("This feature is not available in the demo", {
                        type: "info",
                        placement: "top",
                        duration: 3000,
                      })
                    },
                    style: "destructive",
                  },
                ],
              )
            }}
          >
            <View className="w-10 justify-center items-center">
              <Trash2 size={24} color="#FF3B30" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-base font-medium text-[#FF3B30]">Delete Account</Text>
              <Text className={`text-sm mt-0.5 ${isDark ? "text-white/70" : "text-black/70"}`}>
                Permanently delete your account and all data
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          <View className="flex-row">
            <AlertCircle size={20} color={isDark ? "#FFFFFF" : "#000000"} className="mt-0.5" />
            <View className="flex-1 ml-3">
              <Text className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Privacy Notice</Text>
              <Text className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>
                Your privacy is important to us. We only collect and use your data as described in our Privacy Policy.
                You can request a copy of your data at any time.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

