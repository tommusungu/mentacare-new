"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { StreamChat } from "stream-chat"
import { Check, X } from "lucide-react-native"
import { useNavigation } from "@react-navigation/native"

export default function CreateChannelScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const [channelName, setChannelName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const chatClient = StreamChat.getInstance("jb6vn5n47nvj")

    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await chatClient.queryUsers({ id: { $ne: chatClient.userID } }, { id: 1 }, { limit: 30 })
        setUsers(response.users)
      } catch (error) {
        console.log("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : users

  const toggleUserSelection = (user) => {
    if (selectedUsers.some((selectedUser) => selectedUser.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((selectedUser) => selectedUser.id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const createChannel = async () => {
    if (selectedUsers.length === 0) {
      return
    }

    setCreating(true)
    try {
      const chatClient = StreamChat.getInstance("jb6vn5n47nvj")

      const channelId = Math.random().toString(36).substring(2, 10)
      const channel = chatClient.channel("messaging", channelId, {
        name: channelName || selectedUsers.map((user) => user.name || user.id).join(", "),
        members: [chatClient.userID, ...selectedUsers.map((user) => user.id)],
      })

      await channel.create()

      navigation.replace("Channel", {
        channelId: channel.id,
        channelName: channel.data.name,
      })
    } catch (error) {
      console.log("Error creating channel:", error)
    } finally {
      setCreating(false)
    }
  }

  const renderUserItem = ({ item }) => {
    const isSelected = selectedUsers.some((user) => user.id === item.id)

    return (
      <TouchableOpacity
        className={`flex-row items-center justify-between py-3 px-4 rounded-lg mb-2 ${
          isSelected ? (isDark ? "bg-[#ea580c]/20" : "bg-[#ea580c]/10") : "bg-transparent"
        }`}
        onPress={() => toggleUserSelection(item)}
      >
        <View className="flex-row items-center">
          <View className={`w-10 h-10 rounded-full bg-[#ea580c] justify-center items-center`}>
            <Text className="text-white text-lg font-bold">{(item.name || item.id)[0].toUpperCase()}</Text>
          </View>
          <Text className={`ml-3 text-base ${isDark ? "text-white" : "text-black"}`}>{item.name || item.id}</Text>
        </View>

        <View
          className={`w-6 h-6 rounded-full justify-center items-center ${
            isSelected ? "bg-[#ea580c]" : "border border-gray-300"
          }`}
        >
          {isSelected && <Check size={16} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View className={`flex-1 p-4 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <TextInput
        className={`h-12 rounded-lg px-3 mb-4 text-base ${
          isDark ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]" : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
        }`}
        placeholder="Channel Name (optional)"
        placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
        value={channelName}
        onChangeText={setChannelName}
      />

      <TextInput
        className={`h-12 rounded-lg px-3 mb-4 text-base ${
          isDark ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]" : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
        }`}
        placeholder="Search users"
        placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <Text className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
        Selected Users ({selectedUsers.length})
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#ea580c" className="flex-1" />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          className="flex-grow"
        />
      )}

      <View className="flex-row justify-between mt-4">
        <TouchableOpacity
          className={`flex-1 flex-row h-12 rounded-lg items-center justify-center mr-2 border ${
            isDark ? "border-[#2C2C2C]" : "border-[#E0E0E0]"
          }`}
          onPress={() => navigation.goBack()}
        >
          <X size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          <Text className={`ml-2 font-bold ${isDark ? "text-white" : "text-black"}`}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 flex-row h-12 rounded-lg items-center justify-center ml-2 bg-[#ea580c] ${
            selectedUsers.length === 0 ? "opacity-50" : "opacity-100"
          }`}
          onPress={createChannel}
          disabled={selectedUsers.length === 0 || creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={20} color="#FFFFFF" />
              <Text className="ml-2 text-white font-bold">Create</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

