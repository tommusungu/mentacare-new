"use client"

import { useState, useEffect } from "react"
import { View, Text, Switch, ScrollView, ActivityIndicator } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useDispatch, useSelector } from "react-redux"
import { db } from "../../config/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useToast } from "react-native-toast-notifications"
import { Bell, Calendar, MessageCircle, Clock, Info, Mail } from "lucide-react-native"

export default function NotificationSettingsScreen() {
  const { isDark } = useTheme()
  const dispatch = useDispatch()
  const toast = useToast()

  const currentUser = useSelector((state) => state.user.currentUser)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    appointments: true,
    reminders: true,
    messages: true,
    updates: true,
    marketing: false,
    email: true,
    push: true,
  })

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists() && userDoc.data().notificationSettings) {
          setSettings(userDoc.data().notificationSettings)
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error)
        toast.show("Failed to load notification settings", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNotificationSettings()
  }, [currentUser.uid])

  const handleToggle = async (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    try {
      setSaving(true)
      await updateDoc(doc(db, "users", currentUser.uid), {
        notificationSettings: newSettings,
      })

      toast.show("Notification settings updated", {
        type: "success",
        placement: "top",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error updating notification settings:", error)
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
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>
          Loading notification settings...
        </Text>
      </View>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Notification Settings</Text>

        <View className="mb-6">
          <Text className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Notification Types</Text>

          {renderSettingItem(
            <Calendar size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Appointments",
            "Notifications about your upcoming appointments",
            "appointments",
          )}

          {renderSettingItem(
            <Clock size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Reminders",
            "Reminders for upcoming sessions",
            "reminders",
          )}

          {renderSettingItem(
            <MessageCircle size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Messages",
            "Notifications for new messages",
            "messages",
          )}

          {renderSettingItem(
            <Info size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "App Updates",
            "Information about new features and updates",
            "updates",
          )}

          {renderSettingItem(
            <Bell size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Marketing",
            "Promotional messages and offers",
            "marketing",
          )}
        </View>

        <View className="mb-6">
          <Text className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
            Notification Channels
          </Text>

          {renderSettingItem(
            <Bell size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Push Notifications",
            "Receive notifications on your device",
            "push",
          )}

          {renderSettingItem(
            <Mail size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Email Notifications",
            "Receive notifications via email",
            "email",
          )}
        </View>

        <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
            You can also manage notification permissions in your device settings.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

