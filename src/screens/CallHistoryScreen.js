"use client"

import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { useNavigation } from "@react-navigation/native"
import { Video, Phone, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react-native"

// In a real app, this would come from the Stream Video API
// This is mock data for demonstration purposes
const MOCK_CALL_HISTORY = [
  {
    id: "1",
    type: "video",
    direction: "outgoing",
    participants: ["user1"],
    participantNames: ["John Doe"],
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    duration: 125, // seconds
  },
  {
    id: "2",
    type: "audio",
    direction: "incoming",
    participants: ["user2"],
    participantNames: ["Jane Smith"],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    duration: 305, // seconds
  },
  {
    id: "3",
    type: "video",
    direction: "outgoing",
    participants: ["user3"],
    participantNames: ["Mike Johnson"],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    duration: 0, // missed call
  },
  {
    id: "4",
    type: "audio",
    direction: "incoming",
    participants: ["user1"],
    participantNames: ["John Doe"],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    duration: 62, // seconds
  },
]

export default function CallHistoryScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const [callHistory, setCallHistory] = useState([])

  useEffect(() => {
    // In a real app, you would fetch call history from Stream Video API
    // For demo purposes, we're using mock data
    setCallHistory(MOCK_CALL_HISTORY)
  }, [])

  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const diffMs = now - timestamp
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Today
      return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      // Yesterday
      return "Yesterday"
    } else if (diffDays < 7) {
      // This week
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      return days[timestamp.getDay()]
    } else {
      // Older
      return timestamp.toLocaleDateString()
    }
  }

  const formatDuration = (seconds) => {
    if (seconds === 0) {
      return "Missed"
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes === 0) {
      return `${remainingSeconds}s`
    } else {
      return `${minutes}m ${remainingSeconds}s`
    }
  }

  const startCall = (callType, participants) => {
    navigation.navigate("VideoCall", {
      channelId: `call-${Math.random().toString(36).substring(2, 10)}`,
      callType,
      participants,
    })
  }

  const renderCallItem = ({ item }) => (
    <TouchableOpacity
      className={`flex-row items-center p-4 rounded-xl mb-3 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
      onPress={() => {}}
    >
      <View
        className={`w-10 h-10 rounded-full justify-center items-center ${
          item.duration === 0 ? "bg-[#FF3B30]" : "bg-[#ea580c]"
        }`}
      >
        {item.type === "video" ? <Video size={20} color="#FFFFFF" /> : <Phone size={20} color="#FFFFFF" />}
      </View>

      <View className="flex-1 ml-3">
        <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
          {item.participantNames.join(", ")}
        </Text>

        <View className="flex-row items-center mt-1">
          {item.direction === "outgoing" ? (
            <ArrowUpRight size={14} color={isDark ? "#FFFFFF80" : "#00000080"} />
          ) : (
            <ArrowDownLeft size={14} color={isDark ? "#FFFFFF80" : "#00000080"} />
          )}

          <Text className={`ml-1 mr-2 text-sm ${isDark ? "text-white/80" : "text-black/80"}`}>
            {formatTimestamp(item.timestamp)}
          </Text>

          <Clock size={14} color={isDark ? "#FFFFFF80" : "#00000080"} />

          <Text
            className={`ml-1 text-sm ${
              item.duration === 0 ? "text-[#FF3B30]" : isDark ? "text-white/80" : "text-black/80"
            }`}
          >
            {formatDuration(item.duration)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className="w-10 h-10 rounded-full bg-[#ea580c] justify-center items-center"
        onPress={() => startCall(item.type, item.participants)}
      >
        {item.type === "video" ? <Video size={20} color="#FFFFFF" /> : <Phone size={20} color="#FFFFFF" />}
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <View className={`flex-1 p-4 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <FlatList
        data={callHistory}
        renderItem={renderCallItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text className={`text-center mt-10 text-base ${isDark ? "text-white" : "text-black"}`}>No call history</Text>
        }
      />
    </View>
  )
}

