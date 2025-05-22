"use client"

import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { StreamChat } from "stream-chat"
import { Search, MessageCircle, Video, Phone } from "lucide-react-native"
import { useNavigation } from "@react-navigation/native"

export default function ContactsScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const chatClient = StreamChat.getInstance("jb6vn5n47nvj")

    const fetchUsers = async () => {
      try {
        const response = await chatClient.queryUsers({ id: { $ne: chatClient.userID } }, { id: 1 }, { limit: 30 })
        setUsers(response.users)
        setFilteredUsers(response.users)
      } catch (error) {
        console.log("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const startChat = async (user) => {
    try {
      const chatClient = StreamChat.getInstance("jb6vn5n47nvj")

      const channel = chatClient.channel("messaging", {
        members: [chatClient.userID, user.id],
      })

      await channel.create()

      navigation.navigate("Chat", {
        screen: "Channel",
        params: {
          channelId: channel.id,
          channelName: user.name || user.id,
        },
      })
    } catch (error) {
      console.log("Error creating chat:", error)
    }
  }

  const startVideoCall = async (user) => {
    try {
      const chatClient = StreamChat.getInstance("jb6vn5n47nvj")

      const channel = chatClient.channel("messaging", {
        members: [chatClient.userID, user.id],
      })

      await channel.create()

      navigation.navigate("Video", {
        screen: "VideoCall",
        params: {
          channelId: channel.id,
          callType: "video",
          participants: [user.id],
        },
      })
    } catch (error) {
      console.log("Error starting video call:", error)
    }
  }

  const startVoiceCall = async (user) => {
    try {
      const chatClient = StreamChat.getInstance("jb6vn5n47nvj")

      const channel = chatClient.channel("messaging", {
        members: [chatClient.userID, user.id],
      })

      await channel.create()

      navigation.navigate("Video", {
        screen: "VideoCall",
        params: {
          channelId: channel.id,
          callType: "audio",
          participants: [user.id],
        },
      })
    } catch (error) {
      console.log("Error starting voice call:", error)
    }
  }

  const viewUserProfile = (user) => {
    navigation.navigate("UserProfile", {
      userId: user.id,
      userName: user.name || user.id,
    })
  }

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      className={`flex-row items-center justify-between p-4 rounded-xl mb-3 ${
        isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"
      }`}
      onPress={() => viewUserProfile(item)}
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-full bg-[#ea580c] justify-center items-center">
          <Text className="text-white text-xl font-bold">{(item.name || item.id)[0].toUpperCase()}</Text>
        </View>
        <Text className={`ml-3 text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
          {item.name || item.id}
        </Text>
      </View>

      <View className="flex-row">
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-[#ea580c] justify-center items-center ml-2"
          onPress={() => startChat(item)}
        >
          <MessageCircle size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-[#ea580c] justify-center items-center ml-2"
          onPress={() => startVoiceCall(item)}
        >
          <Phone size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-[#ea580c] justify-center items-center ml-2"
          onPress={() => startVideoCall(item)}
        >
          <Video size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <View className={`flex-1 p-4 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View
        className={`flex-row items-center h-12 rounded-full px-4 mb-4 ${
          isDark ? "bg-[#1E1E1E] border-[#2C2C2C]" : "bg-[#F5F5F5] border-[#E0E0E0]"
        } border`}
      >
        <Search size={20} color={isDark ? "#FFFFFF" : "#000000"} />
        <TextInput
          className={`flex-1 ml-2 text-base ${isDark ? "text-white" : "text-black"}`}
          placeholder="Search contacts"
          placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ea580c" className="flex-1" />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          className="flex-grow"
          ListEmptyComponent={
            <Text className={`text-center mt-10 text-base ${isDark ? "text-white" : "text-black"}`}>
              No contacts found
            </Text>
          }
        />
      )}
    </View>
  )
}

