"use client"

import { useEffect, useState, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Image,
  RefreshControl,
  StatusBar,
  SafeAreaView,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "../../context/ThemeContext"
import { Search, Plus, User, Users, Settings } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { db } from "../../config/firebase"
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from "firebase/firestore"
import * as Haptics from "expo-haptics"

export default function ChannelListScreen({ userId: propUserId, userRole }) {
  const navigation = useNavigation()
  const { isDark } = useTheme()
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredChannels, setFilteredChannels] = useState([])
  const [userId, setUserId] = useState(propUserId)
  const [userName, setUserName] = useState(null)
  const [userProfiles, setUserProfiles] = useState({})

  const channelsListenerRef = useRef(null)

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        let id = userId
        if (!id) {
          id = await AsyncStorage.getItem("userId")
          setUserId(id)
        }

        const name = await AsyncStorage.getItem("userName")
        setUserName(name)

        if (id) {
          // Set up channels listener
          setupChannelsListener(id)
        } else {
          console.error("User ID not found")
          setLoading(false)
        }
      } catch (error) {
        console.error("Error loading user info:", error)
        setLoading(false)
      }
    }

    loadUserInfo()

    // Clean up listener on unmount
    return () => {
      if (channelsListenerRef.current) {
        channelsListenerRef.current()
      }
    }
  }, [propUserId])

  useEffect(() => {
    // Filter channels based on search query
    if (!searchQuery.trim()) {
      setFilteredChannels(channels)
    } else {
      const filtered = channels.filter(
        (channel) =>
          channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          channel.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredChannels(filtered)
    }
  }, [searchQuery, channels])

  const setupChannelsListener = (userId) => {
    // Clean up existing listener
    if (channelsListenerRef.current) {
      channelsListenerRef.current()
    }

    // Query channels where the user is a member
    const channelsQuery = query(
      collection(db, "channels"),
      where("members", "array-contains", userId),
      orderBy("lastMessageAt", "desc"),
    )

    channelsListenerRef.current = onSnapshot(
      channelsQuery,
      async (snapshot) => {
        const channelsData = []
        const profilesNeeded = new Set()

        // First pass: collect channel data and identify profiles we need
        for (const doc of snapshot.docs) {
          const channelData = doc.data()

          // For direct messages, identify the other user
          if (channelData.type === "direct" && channelData.members?.length === 2) {
            const otherUserId = channelData.members.find((id) => id !== userId)
            if (otherUserId) {
              profilesNeeded.add(otherUserId)
            }
          }

          channelsData.push({
            id: doc.id,
            ...channelData,
            lastMessageAt: channelData.lastMessageAt?.toDate() || new Date(0),
          })
        }

        // Fetch user profiles we need
        const newProfiles = { ...userProfiles }
        const profilesToFetch = [...profilesNeeded].filter((id) => !userProfiles[id])

        if (profilesToFetch.length > 0) {
          await Promise.all(
            profilesToFetch.map(async (userId) => {
              try {
                const userDoc = await getDoc(doc(db, "users", userId))
                if (userDoc.exists()) {
                  const userData = userDoc.data()
                  newProfiles[userId] = {
                    id: userId,
                    name: userData.displayName || userData.name || userId,
                    avatar: userData.photoURL,
                  }
                }
              } catch (error) {
                console.error(`Error fetching user ${userId}:`, error)
              }
            }),
          )

          setUserProfiles(newProfiles)
        }

        // Second pass: process channel data with user profiles
        const processedChannels = channelsData.map((channel) => {
          // Get other user's info for direct messages
          let channelName = channel.name
          let channelImage = null
          let otherUserId = null

          if (channel.type === "direct" && channel.members?.length === 2) {
            otherUserId = channel.members.find((id) => id !== userId)
            if (otherUserId && newProfiles[otherUserId]) {
              channelName = newProfiles[otherUserId].name
              channelImage = newProfiles[otherUserId].avatar
            }
          }

          // Format last message time
          let lastMessageTime = null
          if (channel.lastMessageAt) {
            const date = new Date(channel.lastMessageAt)
            const now = new Date()
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

            if (diffDays === 0) {
              lastMessageTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            } else if (diffDays === 1) {
              lastMessageTime = "Yesterday"
            } else if (diffDays < 7) {
              const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
              lastMessageTime = days[date.getDay()]
            } else {
              lastMessageTime = date.toLocaleDateString([], { month: "short", day: "numeric" })
            }
          }

          // Check if channel is unread
          const isUnread =
            channel.lastMessageBy !== userId &&
            (!channel.readBy?.[userId] ||
              (channel.lastMessageAt && new Date(channel.lastMessageAt) > new Date(channel.readBy[userId])))

          // Check if last message is from current user
          const isMyLastMessage = channel.lastMessageBy === userId

          return {
            id: channel.id,
            name: channelName,
            image: channelImage,
            lastMessage: channel.lastMessage,
            lastMessageTime,
            isUnread,
            type: channel.type || "group",
            otherUserId,
            isMyLastMessage,
            members: channel.members,
          }
        })

        setChannels(processedChannels)
        setFilteredChannels(processedChannels)
        setLoading(false)
        setRefreshing(false)
      },
      (error) => {
        console.error("Error listening for channels:", error)
        setLoading(false)
        setRefreshing(false)
      },
    )
  }

  const handleChannelPress = (channel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // console.log("channel is ",channel)
    navigation.navigate("Channel", {
      channelId: channel.id,
      channelName: channel.name,
      otherUserId: channel.otherUserId,
    })
  }

  const handleCreateChannel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
     navigation.navigate("Appointments", {
                    screen: "ProfessionalsList",
                  })
  }

  // const handleContactsPress = () => {
  //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  //   navigation.navigate("Contacts")
  // }

  // const handleSettingsPress = () => {
  //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  //   navigation.navigate("Settings")
  // }

  const onRefresh = () => {
    setRefreshing(true)
    if (userId) {
      setupChannelsListener(userId)
    } else {
      setRefreshing(false)
    }
  }

  const renderChannelItem = ({ item }) => {
    // Get first letter of name for avatar placeholder
    const firstLetter = item.name ? item.name.charAt(0).toUpperCase() : "?"
const baseUrl = "https://ui-avatars.com/api/";
    const initials = encodeURIComponent(item?.name || "User");
    const profileImage = item?.photoURL || `${baseUrl}?name=${initials}&background=0D47A1&color=fff`
    
    return (
      <TouchableOpacity
        className={`flex-row items-center p-4 ${isDark ? "border-gray-800" : "border-gray-200"} border-b`}
        onPress={() => handleChannelPress(item)}
      >
        {/* Avatar */}
       
          <Image source={{ uri: item.image || profileImage}} className="w-12 h-12 rounded-full mr-3" />
       

        {/* Channel info */}
        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <Text
              className={`font-semibold text-base ${isDark ? "text-white" : "text-black"} ${item.isUnread ? "font-bold" : ""}`}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.lastMessageTime && (
              <Text
                className={`text-xs ${
                  item.isUnread
                    ? isDark
                      ? "text-[#ea580c] font-medium"
                      : "text-[#ea580c] font-medium"
                    : isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                }`}
              >
                {item.lastMessageTime}
              </Text>
            )}
          </View>

          {item.lastMessage && (
            <View className="flex-row justify-between items-center mt-1">
              <Text
                className={`text-sm ${
                  item.isUnread
                    ? isDark
                      ? "text-white font-semibold"
                      : "text-black font-semibold"
                    : isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                }`}
                numberOfLines={1}
                style={{ maxWidth: "85%" }}
              >
                {item.isMyLastMessage ? `You: ${item.lastMessage}` : item.lastMessage}
              </Text>

              {item.isUnread && (
                <View className="bg-[#ea580c] rounded-full w-6 h-6 justify-center items-center">
                  <Text className="text-white text-xs font-bold">1</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  if (loading && !refreshing) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    )
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="flex-row justify-between items-center p-2 mb-1">
        {/* <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>Chats</Text>

        <View className="flex-row">
          <TouchableOpacity
            className="w-10 h-10 rounded-full justify-center items-center mr-2"
            onPress={handleSettingsPress}
          >
            <Settings size={22} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Search bar */}
      <View className="px-4 pb-2">
        <View className={`flex-row items-center rounded-full px-4 py-2 ${isDark ? "bg-[#2C2C2C]" : "bg-gray-100"}`}>
          <Search size={18} color={isDark ? "#999999" : "#777777"} />
          <TextInput
            className={`flex-1 py-2 ml-2 ${isDark ? "text-white" : "text-black"}`}
            placeholder="Search conversations..."
            placeholderTextColor={isDark ? "#999999" : "#777777"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Channel list */}
      <FlatList
        data={filteredChannels}
        keyExtractor={(item) => item.id}
        renderItem={renderChannelItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#ea580c"]}
            tintColor={isDark ? "#FFFFFF" : "#ea580c"}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-10">
            <Text className={`text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {searchQuery ? "No conversations match your search" : "No conversations yet. Start chatting!"}
            </Text>
          </View>
        }
      />

      {/* Action buttons */}
      <View className="flex-row justify-end p-4">
        

        <TouchableOpacity
          className="w-12 h-12 rounded-full bg-[#ea580c] justify-center items-center shadow-md"
          onPress={handleCreateChannel}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 5,
          }}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
