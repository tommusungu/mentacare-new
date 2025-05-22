"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "../../context/ThemeContext"
import { Search, Check, X, User } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { db } from "../../config/firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "react-native-toast-notifications"

export default function CreateChannelScreen() {
  const navigation = useNavigation()
  const { isDark } = useTheme()
  const toast = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState(null)
  const [channelName, setChannelName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const loadUserInfo = async () => {
      const storedUserId = await AsyncStorage.getItem("userId")
      const storedUserName = await AsyncStorage.getItem("userName")
      setUserId(storedUserId)
      setUserName(storedUserName)
    }

    loadUserInfo()
  }, [])

  const searchUsers = async () => {
    if (!searchQuery.trim() || !userId) return

    try {
      setSearching(true)

      // Query users by name or email
      const usersQuery = query(
        collection(db, "users"),
        where("searchTerms", "array-contains", searchQuery.toLowerCase()),
      )

      const snapshot = await getDocs(usersQuery)

      const usersData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.id !== userId) // Exclude current user

      setUsers(usersData)
      setSearching(false)
    } catch (error) {
      console.error("Error searching users:", error)
      toast.show("Failed to search users", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
      setSearching(false)
    }
  }

  const toggleUserSelection = (user) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const createChannel = async () => {
    if (selectedUsers.length === 0) {
      toast.show("Please select at least one user", {
        type: "warning",
        placement: "top",
        duration: 3000,
      })
      return
    }

    try {
      setIsCreating(true)

      // Determine channel type and name
      const isDirectMessage = selectedUsers.length === 1
      const channelType = isDirectMessage ? "direct" : "group"

      let finalChannelName = channelName.trim()
      if (!finalChannelName && !isDirectMessage) {
        finalChannelName = `Group with ${selectedUsers.map((u) => u.displayName || u.name || u.id).join(", ")}`
      } else if (!finalChannelName && isDirectMessage) {
        finalChannelName = selectedUsers[0].displayName || selectedUsers[0].name || selectedUsers[0].id
      }

      // Check if direct message channel already exists
      if (isDirectMessage) {
        const existingChannelQuery = query(
          collection(db, "channels"),
          where("type", "==", "direct"),
          where("members", "array-contains", userId),
        )

        const snapshot = await getDocs(existingChannelQuery)

        const existingChannel = snapshot.docs.find((doc) => {
          const data = doc.data()
          return data.members.includes(selectedUsers[0].id) && data.members.length === 2
        })

        if (existingChannel) {
          // Navigate to existing channel
          navigation.replace("Channel", {
            channelId: existingChannel.id,
            channelName: finalChannelName,
          })
          return
        }
      }

      // Create new channel
      const channelData = {
        name: finalChannelName,
        type: channelType,
        members: [userId, ...selectedUsers.map((u) => u.id)],
        createdBy: userId,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(), // Initialize with creation time
      }

      const channelRef = await addDoc(collection(db, "channels"), channelData)

      // Navigate to new channel
      navigation.replace("Channel", {
        channelId: channelRef.id,
        channelName: finalChannelName,
      })

      toast.show("Conversation created", {
        type: "success",
        placement: "top",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error creating channel:", error)
      toast.show("Failed to create conversation", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
      setIsCreating(false)
    }
  }

  const renderUserItem = ({ item }) => {
    const isSelected = selectedUsers.some((u) => u.id === item.id)

    return (
      <TouchableOpacity
        className={`flex-row items-center p-3 ${isDark ? "border-gray-800" : "border-gray-200"} border-b`}
        onPress={() => toggleUserSelection(item)}
      >
        <View className="w-10 h-10 rounded-full bg-[#005FFF] justify-center items-center mr-3">
          <User size={20} color="#FFFFFF" />
        </View>

        <View className="flex-1">
          <Text className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
            {item.displayName || item.name || item.id}
          </Text>
          {item.email && <Text className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{item.email}</Text>}
        </View>

        <View
          className={`w-6 h-6 rounded-full justify-center items-center ${
            isSelected ? "bg-[#005FFF]" : isDark ? "bg-gray-700" : "bg-gray-300"
          }`}
        >
          {isSelected && <Check size={16} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-3">
        <View className={`flex-row items-center rounded-full px-3 py-2 ${isDark ? "bg-[#2C2C2C]" : "bg-gray-100"}`}>
          <Search size={20} color={isDark ? "#999999" : "#777777"} />
          <TextInput
            className={`flex-1 ml-2 ${isDark ? "text-white" : "text-black"}`}
            placeholder="Search users..."
            placeholderTextColor={isDark ? "#999999" : "#777777"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchUsers}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={20} color={isDark ? "#999999" : "#777777"} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {selectedUsers.length > 0 && (
        <View className="px-3 pb-3">
          <Text className={`mb-2 font-medium ${isDark ? "text-white" : "text-black"}`}>
            {selectedUsers.length === 1 ? "Selected User" : "Selected Users"}
          </Text>
          <FlatList
            data={selectedUsers}
            keyExtractor={(item) => item.id}
            horizontal
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`mr-2 p-2 rounded-full flex-row items-center ${isDark ? "bg-[#2C2C2C]" : "bg-gray-200"}`}
                onPress={() => toggleUserSelection(item)}
              >
                <Text className={`mr-1 ${isDark ? "text-white" : "text-black"}`}>
                  {item.displayName || item.name || item.id}
                </Text>
                <X size={16} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {selectedUsers.length > 1 && (
        <View className="px-3 pb-3">
          <TextInput
            className={`p-3 rounded-lg ${isDark ? "bg-[#2C2C2C] text-white" : "bg-gray-100 text-black"}`}
            placeholder="Group name (optional)"
            placeholderTextColor={isDark ? "#999999" : "#777777"}
            value={channelName}
            onChangeText={setChannelName}
          />
        </View>
      )}

      {searching ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#005FFF" />
          <Text className={`mt-2 ${isDark ? "text-white" : "text-black"}`}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center p-10">
              <Text className={`text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {searchQuery ? "No users found. Try a different search." : "Search for users to start a conversation."}
              </Text>
            </View>
          }
        />
      )}

      <View className="p-3">
        <TouchableOpacity
          className={`p-3 rounded-lg ${
            selectedUsers.length > 0 ? "bg-[#005FFF]" : isDark ? "bg-gray-700" : "bg-gray-300"
          } justify-center items-center`}
          onPress={createChannel}
          disabled={selectedUsers.length === 0 || isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-medium">
              {selectedUsers.length === 1 ? "Start Conversation" : "Create Group"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}
