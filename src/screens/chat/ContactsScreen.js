"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "../../context/ThemeContext"
import { Search, X, User, MessageCircle, Phone, Video } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { db } from "../../config/firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "react-native-toast-notifications"
import { useCall } from "../../context/CallContext"

export default function ContactsScreen() {
  const navigation = useNavigation()
  const { isDark } = useTheme()
  const toast = useToast()
  const { createCall } = useCall()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState(null)

  useEffect(() => {
    const loadUserInfo = async () => {
      const storedUserId = await AsyncStorage.getItem("userId")
      const storedUserName = await AsyncStorage.getItem("userName")
      setUserId(storedUserId)
      setUserName(storedUserName)

      // Load initial contacts
      loadContacts()
    }

    loadUserInfo()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)

      // Get all users except current user
      const usersQuery = query(collection(db, "users"))

      const snapshot = await getDocs(usersQuery)

      const usersData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.id !== userId) // Exclude current user

      setUsers(usersData)
      setLoading(false)
    } catch (error) {
      console.error("Error loading contacts:", error)
      toast.show("Failed to load contacts", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim() || !userId) return

    try {
      setLoading(true)

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
      setLoading(false)
    } catch (error) {
      console.error("Error searching users:", error)
      toast.show("Failed to search users", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
      setLoading(false)
    }
  }

  const startChat = async (user) => {
    try {
      // Check if direct message channel already exists
      const existingChannelQuery = query(
        collection(db, "channels"),
        where("type", "==", "direct"),
        where("members", "array-contains", userId),
      )

      const snapshot = await getDocs(existingChannelQuery)

      const existingChannel = snapshot.docs.find((doc) => {
        const data = doc.data()
        return data.members.includes(user.id) && data.members.length === 2
      })

      if (existingChannel) {
        // Navigate to existing channel
        navigation.navigate("Channel", {
          channelId: existingChannel.id,
          channelName: user.displayName || user.name || user.id,
        })
        return
      }

      // Create new channel
      const channelData = {
        name: user.displayName || user.name || user.id,
        type: "direct",
        members: [userId, user.id],
        createdBy: userId,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(), // Initialize with creation time
      }

      const channelRef = await addDoc(collection(db, "channels"), channelData)

      // Navigate to new channel
      navigation.navigate("Channel", {
        channelId: channelRef.id,
        channelName: user.displayName || user.name || user.id,
      })
    } catch (error) {
      console.error("Error starting chat:", error)
      toast.show("Failed to start conversation", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    }
  }

  const startVideoCall = async (user) => {
    try {
      // Show loading indicator
      toast.show("Setting up video call...", {
        type: "info",
        placement: "top",
        duration: 3000,
      })

      // Create the call
      const call = await createCall(user.id, user.displayName || user.name || user.id, "video")

      // Validate call data before navigating
      if (!call) {
        throw new Error("Failed to create call")
      }

      if (!call.roomId) {
        throw new Error("No room ID returned from call creation")
      }

      if (!call.authToken) {
        throw new Error("No authentication token returned from call creation")
      }

      console.log("Call created successfully:", {
        callId: call.id,
        roomId: call.roomId,
        hasAuthToken: !!call.authToken,
      })

      // Navigate to video call screen with all required parameters
      navigation.navigate("VideoCall", {
        callId: call.id,
        roomId: call.roomId,
        authToken: call.authToken,
        callType: "video",
        participants: [user.id],
        recipientName: user.displayName || user.name || user.id,
      })
    } catch (error) {
      console.error("Error starting video call:", error)
      Alert.alert("Call Error", `Failed to start video call: ${error.message}`, [{ text: "OK" }])
    }
  }

  const startVoiceCall = async (user) => {
    try {
      // Show loading indicator
      toast.show("Setting up voice call...", {
        type: "info",
        placement: "top",
        duration: 3000,
      })

      // Create the call
      const call = await createCall(user.id, user.displayName || user.name || user.id, "audio")

      // Validate call data before navigating
      if (!call) {
        throw new Error("Failed to create call")
      }

      if (!call.roomId) {
        throw new Error("No room ID returned from call creation")
      }

      if (!call.authToken) {
        throw new Error("No authentication token returned from call creation")
      }

      console.log("Call created successfully:", {
        callId: call.id,
        roomId: call.roomId,
        hasAuthToken: !!call.authToken,
      })

      // Navigate to video call screen with all required parameters
      navigation.navigate("VideoCall", {
        callId: call.id,
        roomId: call.roomId,
        authToken: call.authToken,
        callType: "audio",
        participants: [user.id],
        recipientName: user.displayName || user.name || user.id,
      })
    } catch (error) {
      console.error("Error starting voice call:", error)
      Alert.alert("Call Error", `Failed to start voice call: ${error.message}`, [{ text: "OK" }])
    }
  }

  const viewUserProfile = (user) => {
    navigation.navigate("UserProfile", {
      userId: user.id,
      userName: user.displayName || user.name || user.id,
    })
  }

  const renderUserItem = ({ item }) => {
    return (
      <TouchableOpacity
        className={`flex-row items-center p-3 ${isDark ? "border-gray-800" : "border-gray-200"} border-b`}
        onPress={() => viewUserProfile(item)}
      >
        <View className="w-12 h-12 rounded-full bg-[#005FFF] justify-center items-center mr-3">
          <User size={24} color="#FFFFFF" />
        </View>

        <View className="flex-1">
          <Text className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
            {item.displayName || item.name || item.id}
          </Text>
          {item.email && <Text className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{item.email}</Text>}
          {item.role && (
            <Text className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </Text>
          )}
        </View>

        <View className="flex-row">
          <TouchableOpacity
            className="w-10 h-10 rounded-full justify-center items-center ml-1"
            onPress={() => startChat(item)}
          >
            <MessageCircle size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-10 h-10 rounded-full justify-center items-center ml-1"
            onPress={() => startVoiceCall(item)}
          >
            <Phone size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-10 h-10 rounded-full justify-center items-center ml-1"
            onPress={() => startVideoCall(item)}
          >
            <Video size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
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
            placeholder="Search contacts..."
            placeholderTextColor={isDark ? "#999999" : "#777777"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchUsers}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("")
                loadContacts()
              }}
            >
              <X size={20} color={isDark ? "#999999" : "#777777"} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#005FFF" />
          <Text className={`mt-2 ${isDark ? "text-white" : "text-black"}`}>Loading contacts...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center p-10">
              <Text className={`text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {searchQuery ? "No contacts found. Try a different search." : "No contacts available."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}
