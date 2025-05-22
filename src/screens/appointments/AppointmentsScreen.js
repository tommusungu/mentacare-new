"use client"

import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation } from "@react-navigation/native"
import { useDispatch, useSelector } from "react-redux"
import { fetchUserAppointments } from "../../redux/slices/appointmentSlice"
import { Calendar, Clock, Video, MessageCircle, Plus, CheckCircle, XCircle } from "lucide-react-native"

export default function AppointmentsScreen({ userId, userRole }) {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const dispatch = useDispatch()

  const [activeTab, setActiveTab] = useState("upcoming")
  const [refreshing, setRefreshing] = useState(false)
  const [filteredAppointments, setFilteredAppointments] = useState([])

  const appointments = useSelector((state) => state.appointments.appointments)
  const loading = useSelector((state) => state.appointments.loading)

  useEffect(() => {
    loadAppointments()
  }, [userId, userRole])

  useEffect(() => {
    filterAppointments()
  }, [activeTab, appointments])

  const loadAppointments = async () => {
    try {
      console.log(`Loading appointments for user: ${userId}, role: ${userRole}`)
      await dispatch(fetchUserAppointments({ userId, role: userRole }))
    } catch (error) {
      console.error("Error loading appointments:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAppointments()
    setRefreshing(false)
  }

  const filterAppointments = () => {
    const now = new Date()

    if (activeTab === "upcoming") {
      const upcoming = appointments
        .filter((app) => new Date(app.scheduledFor) > now && app.status !== "cancelled")
        .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))

      setFilteredAppointments(upcoming)
    } else if (activeTab === "past") {
      const past = appointments
        .filter((app) => new Date(app.scheduledFor) < now || app.status === "completed")
        .sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor))

      setFilteredAppointments(past)
    } else if (activeTab === "cancelled") {
      const cancelled = appointments
        .filter((app) => app.status === "cancelled")
        .sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor))

      setFilteredAppointments(cancelled)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FF9500" // Orange
      case "confirmed":
        return "#34C759" // Green
      case "completed":
        return "#007AFF" // Blue
      case "cancelled":
        return "#FF3B30" // Red
      case "in-progress":
        return "#5856D6" // Purple
      default:
        return "#8E8E93" // Gray
    }
  }

  const renderAppointmentItem = ({ item }) => {
    const isPast = new Date(item.scheduledFor) < new Date() && item.status !== "completed"
    const otherPersonName = userRole === "professional" ? item.patientName : item.professionalName
    const otherPersonId = userRole === "professional" ? item.patientId : item.professionalId

    return (
      <TouchableOpacity
        className={`mb-4 rounded-xl overflow-hidden ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
        onPress={() => navigation.navigate("AppointmentDetails", { appointmentId: item.id })}
      >
        <View className={`h-2 w-full`} style={{ backgroundColor: getStatusColor(item.status) }} />

        <View className="p-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className={`text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>
              Session with {otherPersonName}
            </Text>
            <View className={`px-2 py-1 rounded-full`} style={{ backgroundColor: getStatusColor(item.status) + "30" }}>
              <Text style={{ color: getStatusColor(item.status), fontWeight: "500" }}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-2">
            <Calendar size={16} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>{formatDate(item.scheduledFor)}</Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Clock size={16} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>{formatTime(item.scheduledFor)}</Text>
          </View>

          {item.reason && (
            <View className="mb-3">
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                <Text className="font-medium">Reason: </Text>
                {item.reason}
              </Text>
            </View>
          )}

          {item.status === "confirmed" && !isPast && (
            <View className="flex-row mt-2">
              <TouchableOpacity
                className="bg-[#ea580c] py-2 px-4 rounded-lg mr-2 flex-row items-center"
                onPress={() => {
                  navigation.navigate("VideoCall", {
                    appointmentId: item.id,
                    channelId: `appointment-${item.id}`,
                    callType: "video",
                    participants: [item.patientId, item.professionalId],
                    professionalId: item.professionalId,
                    patientId: item.patientId,
                    appointmentData: item,
                  })
                }}
              >
                <Video size={16} color="#FFFFFF" />
                <Text className="text-white ml-1">Join</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`py-2 px-4 rounded-lg flex-row items-center ${isDark ? "bg-[#2C2C2C]" : "bg-white"}`}
                onPress={() => {
                  navigation.navigate("Chat", {
                    screen: "Channel",
                    params: {
                      channelId: `appointment-chat-${item.id}`,
                      channelName: otherPersonName,
                    },
                  })
                }}
              >
                <MessageCircle size={16} color={isDark ? "#FFFFFF" : "#000000"} />
                <Text className={`ml-1 ${isDark ? "text-white" : "text-black"}`}>Message</Text>
              </TouchableOpacity>
            </View>
          )}

          {userRole === "professional" && item.status === "pending" && !isPast && (
            <View className="flex-row mt-2">
              <TouchableOpacity
                className="bg-[#34C759] py-2 px-4 rounded-lg mr-2 flex-row items-center"
                onPress={() => {
                  navigation.navigate("AppointmentDetails", { appointmentId: item.id })
                }}
              >
                <CheckCircle size={16} color="#FFFFFF" />
                <Text className="text-white ml-1">Confirm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#FF3B30] py-2 px-4 rounded-lg flex-row items-center"
                onPress={() => {
                  navigation.navigate("AppointmentDetails", { appointmentId: item.id })
                }}
              >
                <XCircle size={16} color="#FFFFFF" />
                <Text className="text-white ml-1">Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center py-10">
      <Calendar size={60} color={isDark ? "#FFFFFF40" : "#00000040"} />
      <Text className={`text-lg mt-4 ${isDark ? "text-white" : "text-black"}`}>No {activeTab} appointments</Text>
      {activeTab === "upcoming" && userRole === "patient" && (
        <TouchableOpacity
          className="mt-4 bg-[#ea580c] py-2 px-4 rounded-lg"
          onPress={() => navigation.navigate("ProfessionalsList")}
        >
          <Text className="text-white">Book a Session</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <View className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="flex-row p-4 border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity
          className={`flex-1 items-center py-2 ${activeTab === "upcoming" ? "border-b-2 border-[#ea580c]" : ""}`}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            className={`${
              activeTab === "upcoming" ? "text-[#ea580c] font-medium" : isDark ? "text-white" : "text-black"
            }`}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 items-center py-2 ${activeTab === "past" ? "border-b-2 border-[#ea580c]" : ""}`}
          onPress={() => setActiveTab("past")}
        >
          <Text
            className={`${activeTab === "past" ? "text-[#ea580c] font-medium" : isDark ? "text-white" : "text-black"}`}
          >
            Past
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 items-center py-2 ${activeTab === "cancelled" ? "border-b-2 border-[#ea580c]" : ""}`}
          onPress={() => setActiveTab("cancelled")}
        >
          <Text
            className={`${
              activeTab === "cancelled" ? "text-[#ea580c] font-medium" : isDark ? "text-white" : "text-black"
            }`}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointmentItem}
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

      {userRole === "patient" && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#ea580c] justify-center items-center shadow-lg"
          onPress={() => navigation.navigate("ProfessionalsList")}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  )
}

