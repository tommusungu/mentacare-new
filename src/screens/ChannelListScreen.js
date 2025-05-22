"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { Chat, ChannelList } from "stream-chat-expo"
import { useTheme } from "../context/ThemeContext"
import { Plus } from "lucide-react-native"
import { useChat } from "../context/ChatContext"

export default function ChannelListScreen({ navigation }) {
  const { chatClient } = useChat()
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState("messaging")

  const filters = {
    members: { $in: [chatClient?.userID] },
    type: activeTab,
  }

  const sort = { last_message_at: -1 }

  const handleChannelSelect = (channel) => {
    navigation.navigate("Channel", {
      channelId: channel.id,
      channelName: channel.data.name || channel.data.id,
    })
  }

  const handleCreateChannel = () => {
    navigation.navigate("CreateChannel")
  }

  if (!chatClient) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <Text className={`text-lg ${isDark ? "text-white" : "text-black"}`}>Loading chat...</Text>
      </View>
    )
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <Chat client={chatClient}>
        <ChannelList
          filters={filters}
          sort={sort}
          onSelect={handleChannelSelect}
          options={{
            state: true,
            watch: true,
          }}
        />
      </Chat>

      <TouchableOpacity
        className="absolute w-14 h-14 rounded-full bg-[#ea580c] right-5 bottom-5 justify-center items-center shadow-md"
        onPress={handleCreateChannel}
      >
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>
    </View>
  )
}

