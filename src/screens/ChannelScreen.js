"use client"

import { useEffect, useState, useRef } from "react"
import { View, Text, TouchableOpacity, ActivityIndicator, BackHandler } from "react-native"
import { Channel, MessageList, MessageInput, Chat } from "stream-chat-expo"
import { useTheme } from "../context/ThemeContext"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useChat } from "../context/ChatContext"
import { Video, Phone, ArrowLeft, Info } from "lucide-react-native"
import * as Haptics from "expo-haptics"
import { useToast } from "react-native-toast-notifications"

export default function ChannelScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { isDark } = useTheme()
  const { chatClient, refreshUnreadCount } = useChat()
  const { channelId, channelName } = route.params
  const [channel, setChannel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [otherUser, setOtherUser] = useState(null)
  const [isDirectMessage, setIsDirectMessage] = useState(false)

  const messageListRef = useRef(null)
  const toast = useToast()

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      navigation.goBack()
      // Refresh unread count when navigating back
      setTimeout(() => refreshUnreadCount(), 500)
      return true
    }

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction)

    return () => backHandler.remove()
  }, [navigation, refreshUnreadCount])

  useEffect(() => {
    const loadChannel = async () => {
      try {
        if (!chatClient) {
          console.error("Chat client not initialized")
          setLoading(false)
          return
        }

        console.log("Loading channel with ID:", channelId)
        setLoading(true)

        const channel = chatClient.channel("messaging", channelId)
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries) {
          try {
            await channel.watch()
            console.log("Channel loaded successfully:", channel.id)

            // Mark channel as read when opened
            await channel.markRead()
            console.log("Channel marked as read")

            // Check if this is a direct message (2 members)
            const memberCount = Object.keys(channel.state.members).length
            setIsDirectMessage(memberCount === 2)
            console.log("Is direct message:", memberCount === 2)

            // Get the other user in direct messages
            if (memberCount === 2) {
              const otherMember = Object.values(channel.state.members).find(
                (member) => member.user.id !== chatClient.userID,
              )
              if (otherMember) {
                setOtherUser(otherMember.user)
                console.log("Other user in conversation:", otherMember.user.id)
              }
            }

            setChannel(channel)
            break // Success, exit retry loop
          } catch (error) {
            retryCount++
            if (retryCount === maxRetries) {
              throw error
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          }
        }
      } catch (error) {
        console.error("Error loading channel:", error)
        toast.show("Failed to load conversation", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    loadChannel()

    // Refresh unread count when leaving the screen
    return () => {
      refreshUnreadCount()
    }
  }, [channelId, chatClient])

  const startVideoCall = () => {
    if (channel && isDirectMessage && otherUser) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      navigation.navigate("VideoCall", {
        channelId: channel.id,
        callType: "video",
        participants: [otherUser.id],
      })
    }
  }

  const startVoiceCall = () => {
    if (channel && isDirectMessage && otherUser) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      navigation.navigate("VideoCall", {
        channelId: channel.id,
        callType: "audio",
        participants: [otherUser.id],
      })
    }
  }

  const viewUserProfile = () => {
    if (otherUser) {
      navigation.navigate("UserProfile", {
        userId: otherUser.id,
        userName: otherUser.name || otherUser.id,
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

  if (!channel) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <Text className={`text-lg ${isDark ? "text-white" : "text-black"}`}>
          Channel not found or error loading channel
        </Text>
      </View>
    )
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      {chatClient ? (
        <Chat client={chatClient}>
          <Channel channel={channel} keyboardVerticalOffset={80}>
            <View className="flex-row justify-between items-center p-2 border-b border-gray-700">
              <TouchableOpacity className="flex-row items-center" onPress={() => navigation.goBack()}>
                <ArrowLeft size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                <Text className={`ml-2 font-medium ${isDark ? "text-white" : "text-black"}`}>Back</Text>
              </TouchableOpacity>

              <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>{channelName}</Text>

              <View className="flex-row">
                {isDirectMessage && (
                  <>
                    <TouchableOpacity
                      className="w-10 h-10 rounded-full justify-center items-center ml-2"
                      onPress={viewUserProfile}
                    >
                      <Info size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="w-10 h-10 rounded-full bg-[#ea580c] justify-center items-center ml-2"
                      onPress={startVoiceCall}
                    >
                      <Phone color="#FFFFFF" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="w-10 h-10 rounded-full bg-[#ea580c] justify-center items-center ml-2"
                      onPress={startVideoCall}
                    >
                      <Video color="#FFFFFF" size={20} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            <MessageList ref={messageListRef} />
            <MessageInput />
          </Channel>
        </Chat>
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className={`text-lg ${isDark ? "text-white" : "text-black"}`}>
            Chat client not initialized
          </Text>
        </View>
      )}
    </View>
  )
}