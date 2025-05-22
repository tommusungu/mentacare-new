"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { StreamChat } from "stream-chat"
import { MessageCircle, Phone, Video } from "lucide-react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useToast } from "react-native-toast-notifications"

export default function UserProfileScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const toast = useToast()
  const { userId, userName } = route.params
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const chatClient = StreamChat.getInstance("jb6vn5n47nvj")

    const fetchUserDetails = async () => {
      try {
        const response = await chatClient.queryUsers({ id: userId })
        if (response.users.length > 0) {
          setUser(response.users[0])
        }
      } catch (error) {
        console.log("Error fetching user details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserDetails()
  }, [userId])

  const startChat = async () => {
    try {
      const chatClient = StreamChat.getInstance("jb6vn5n47nvj")

      const channel = chatClient.channel("messaging", {
        members: [chatClient.userID, userId],
      })

      await channel.create()

      navigation.navigate("Chat", {
        screen: "Channel",
        params: {
          channelId: channel.id,
          channelName: userName,
        },
      })
    } catch (error) {
      console.log("Error creating chat:", error)
    }
  }

  const startVideoCall = async () => {
    try {
      const chatClient = StreamChat.getInstance("jb6vn5n47nvj")

      const channel = chatClient.channel("messaging", {
        members: [chatClient.userID, userId],
      })

      await channel.create()

      navigation.navigate("VideoCall", {
        channelId: channel.id,
        callType: "video",
        participants: [userId],
      })
    } catch (error) {
      console.error("Error starting video call:", error)
      toast.show("Failed to start video call: " + error.message, {
        type: "error",
        placement: "top",
      })
    }
  }

  const startVoiceCall = async () => {
    try {
      const chatClient = StreamChat.getInstance("jb6vn5n47nvj")

      const channel = chatClient.channel("messaging", {
        members: [chatClient.userID, userId],
      })

      await channel.create()

      navigation.navigate("VideoCall", {
        channelId: channel.id,
        callType: "audio",
        participants: [userId],
      })
    } catch (error) {
      console.error("Error starting voice call:", error)
      toast.show("Failed to start voice call: " + error.message, {
        type: "error",
        placement: "top",
      })
    }
  }

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="items-center p-5">
        <View className="w-24 h-24 rounded-full bg-[#ea580c] justify-center items-center mb-4">
          <Text className="text-white text-4xl font-bold">{userName[0].toUpperCase()}</Text>
        </View>
        <Text className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>{userName}</Text>
        <Text className={`text-base ${isDark ? "text-white/80" : "text-black/80"}`}>@{userId}</Text>
      </View>

      <View
        className="flex-row justify-around py-5 border-b border-t mb-4 
        ${isDark ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}"
      >
        <TouchableOpacity className="items-center bg-[#ea580c] p-3 rounded-lg w-[100px]" onPress={startChat}>
          <MessageCircle size={24} color="#FFFFFF" />
          <Text className="text-white mt-2 font-medium">Message</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center bg-[#ea580c] p-3 rounded-lg w-[100px]" onPress={startVoiceCall}>
          <Phone size={24} color="#FFFFFF" />
          <Text className="text-white mt-2 font-medium">Voice Call</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center bg-[#ea580c] p-3 rounded-lg w-[100px]" onPress={startVideoCall}>
          <Video size={24} color="#FFFFFF" />
          <Text className="text-white mt-2 font-medium">Video Call</Text>
        </TouchableOpacity>
      </View>

      {user && user.custom_data && (
        <View className={`mx-4 p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>About</Text>
          <Text className={`text-base leading-6 ${isDark ? "text-white" : "text-black"}`}>
            {user.custom_data.about || "No information available"}
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

