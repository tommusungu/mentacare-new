"use client"

import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { useNavigation } from "@react-navigation/native"
import { useDispatch, useSelector } from "react-redux"
import { fetchUserNotifications, markNotificationAsRead } from "../redux/slices/notificationSlice"
import { useNotifications } from "../context/NotificationContext"
import { Bell, Calendar, MessageCircle, Info, Check, Phone } from "lucide-react-native"
import { format, formatDistanceToNow } from "date-fns"

export default function NotificationsScreen({ userId }) {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const { refreshNotifications } = useNotifications()

  const [refreshing, setRefreshing] = useState(false)

  const notifications = useSelector((state) => state.notifications.notifications)
  const loading = useSelector((state) => state.notifications.loading)

  useEffect(() => {
    loadNotifications()
  }, [userId])

  const loadNotifications = async () => {
    try {
      await dispatch(fetchUserNotifications(userId))
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadNotifications()
    setRefreshing(false)
  }

  const handleNotificationPress = async (notification) => {
    // Mark as read if not already
    if (!notification.read) {
      await dispatch(markNotificationAsRead(notification.id))

      // Refresh notification badge
      refreshNotifications()
    }

    // Navigate based on notification type
    if (notification.type === "appointment" && notification.data?.appointmentId) {
      navigation.navigate("AppointmentDetails", {
        appointmentId: notification.data.appointmentId,
      })
    } else if (notification.type === "message" && notification.data?.channelId) {
      navigation.navigate("Chat", {
        screen: "Channel",
        params: {
          channelId: notification.data.channelId,
          channelName: notification.data.channelName || "Chat",
        },
      })
    } else if (notification.type === "call" && notification.data?.callId) {
      navigation.navigate("VideoCall", {
        callId: notification.data.callId,
        callType: notification.data.callType || "video",
        participants: notification.data.participants || [],
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)

      for (const notification of unreadNotifications) {
        await dispatch(markNotificationAsRead(notification.id))
      }

      // Refresh notification badge
      refreshNotifications()
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "appointment":
        return <Calendar size={24} color={isDark ? "#FFFFFF" : "#000000"} />
      case "message":
        return <MessageCircle size={24} color={isDark ? "#FFFFFF" : "#000000"} />
      case "call":
        return <Phone size={24} color={isDark ? "#FFFFFF" : "#000000"} />
      case "system":
        return <Info size={24} color={isDark ? "#FFFFFF" : "#000000"} />
      default:
        return <Bell size={24} color={isDark ? "#FFFFFF" : "#000000"} />
    }
  }

  const formatNotificationTime = (timestamp) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInHours = Math.abs(now - date) / 36e5 // hours

      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true })
      } else {
        return format(date, "MMM d, yyyy")
      }
    } catch (error) {
      return "Unknown time"
    }
  }

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      className={`mb-3 p-4 rounded-xl ${
        item.read
          ? isDark
            ? "bg-[#1E1E1E]"
            : "bg-[#F5F5F5]"
          : isDark
            ? "bg-[#1E1E1E] border border-[#ea580c]"
            : "bg-[#F5F5F5] border border-[#ea580c]"
      }`}
      onPress={() => handleNotificationPress(item)}
    >
      <View className="flex-row">
        <View
          className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${
            item.read ? (isDark ? "bg-[#2C2C2C]" : "bg-[#E0E0E0]") : "bg-[#ea580c]"
          }`}
        >
          {getNotificationIcon(item.type)}
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>{item.title}</Text>
            <Text className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
              {formatNotificationTime(item.createdAt)}
            </Text>
          </View>

          <Text
            className={`mt-1 ${
              item.read ? (isDark ? "text-white/70" : "text-black/70") : isDark ? "text-white" : "text-black"
            }`}
          >
            {item.body}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center py-10">
      <Bell size={60} color={isDark ? "#FFFFFF40" : "#00000040"} />
      <Text className={`text-lg mt-4 ${isDark ? "text-white" : "text-black"}`}>No notifications</Text>
      <Text className={`text-sm mt-2 ${isDark ? "text-white/70" : "text-black/70"}`}>You're all caught up!</Text>
    </View>
  )

  const hasUnreadNotifications = notifications.some((n) => !n.read)

  return (
    <View className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      {hasUnreadNotifications && (
        <TouchableOpacity
          className="m-4 p-3 bg-[#ea580c] rounded-lg flex-row justify-center items-center"
          onPress={markAllAsRead}
        >
          <Check size={18} color="#FFFFFF" />
          <Text className="text-white ml-2 font-medium">Mark all as read</Text>
        </TouchableOpacity>
      )}

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#ea580c"]}
              tintColor={isDark ? "#FFFFFF" : "#000000"}
            />
          }
        />
      )}
    </View>
  )
}

