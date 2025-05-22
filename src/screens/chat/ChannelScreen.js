"use client"

import { useEffect, useState, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  FlatList,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
  Pressable,
} from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Video, Phone, ArrowLeft, Info, SendHorizonal, Check, CheckCheck, X, CornerUpLeft } from "lucide-react-native"
import * as Haptics from "expo-haptics"
import { useToast } from "react-native-toast-notifications"
import { db } from "../../config/firebase"
import {
  collection,
  doc,
  getDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCall } from "../../context/CallContext"

const MESSAGES_PER_LOAD = 30

export default function ChannelScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { isDark } = useTheme()
  const { createCall } = useCall()
  const { channelId, channelName, otherUserId } = route.params
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState("")
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const [isDirectMessage, setIsDirectMessage] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [readStatus, setReadStatus] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const [displayName, setDisplayName] = useState(channelName)
  const [loadingMore, setLoadingMore] = useState(false)
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false)

  const flatListRef = useRef(null)
  const toast = useToast()
  const messagesListenerRef = useRef(null)
  const readStatusListenerRef = useRef(null)
  const replyAnimatedValue = useRef(new Animated.Value(0)).current
  const initialScrollDone = useRef(false)

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      if (replyingTo) {
        cancelReply()
        return true
      }
      navigation.goBack()
      return true
    }

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction)

    return () => backHandler.remove()
  }, [navigation, replyingTo])

  useEffect(() => {
    const loadUserInfo = async () => {
      const storedUserId = await AsyncStorage.getItem("userId")
      const storedUserName = await AsyncStorage.getItem("userName")
      setUserId(storedUserId)
      setUserName(storedUserName)
    }

    loadUserInfo()
  }, [])

  useEffect(() => {
    const loadChannel = async () => {
      try {
        if (!userId) return

        console.log("Loading channel with ID:", channelId)

        // Get channel details
        const channelDoc = await getDoc(doc(db, "channels", channelId))

        if (!channelDoc.exists()) {
          console.error("Channel not found")
          toast.show("Conversation not found", {
            type: "danger",
            placement: "top",
            duration: 3000,
          })
          setLoading(false)
          return
        }

        const channelData = channelDoc.data()

        // Check if this is a direct message (2 members)
        const memberCount = channelData.members?.length || 0
        setIsDirectMessage(memberCount === 2)
        console.log("Is direct message:", memberCount === 2)

        // Get the other user in direct messages
        if (memberCount === 2) {
          const chatOtherUserId = otherUserId || channelData.members.find((id) => id !== userId)
          if (chatOtherUserId) {
            const otherUserDoc = await getDoc(doc(db, "users", chatOtherUserId))
            if (otherUserDoc.exists()) {
              const userData = otherUserDoc.data()
              const name = userData.displayName || userData.name || chatOtherUserId
              setOtherUser({
                id: chatOtherUserId,
                name: name,
                avatar: userData.photoURL,
              })
              setDisplayName(name)
              console.log("Other user in conversation:", chatOtherUserId)
            }
          }
        }

        // Mark channel as read
        await updateDoc(doc(db, "channels", channelId), {
          [`readBy.${userId}`]: new Date().toISOString(),
        })

        // Set up messages listener
        setupMessagesListener()

        // Set up read status listener
        setupReadStatusListener()
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

    if (userId) {
      loadChannel()
    }

    // Clean up listeners on unmount
    return () => {
      if (messagesListenerRef.current) {
        messagesListenerRef.current()
      }
      if (readStatusListenerRef.current) {
        readStatusListenerRef.current()
      }
    }
  }, [channelId, userId, otherUserId])

  // Animate reply box when replying
  useEffect(() => {
    if (replyingTo) {
      Animated.spring(replyAnimatedValue, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start()
    } else {
      Animated.timing(replyAnimatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [replyingTo])

  const setupMessagesListener = () => {
    // Clean up existing listener
    if (messagesListenerRef.current) {
      messagesListenerRef.current()
    }

    const messagesQuery = query(
      collection(db, "messages"),
      where("channelId", "==", channelId),
      orderBy("createdAt", "desc"), // Note: descending order for proper inverted FlatList
      limit(MESSAGES_PER_LOAD),
    )

    messagesListenerRef.current = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }))

        // Set all messages loaded flag if we got fewer messages than the limit
        if (messagesList.length < MESSAGES_PER_LOAD) {
          setAllMessagesLoaded(true)
        }

        setMessages(messagesList)
        setLoading(false)

        // Initial scroll is handled by inverted FlatList
        initialScrollDone.current = true
      },
      (error) => {
        console.error("Error listening for messages:", error)
      },
    )
  }

  const loadMoreMessages = async () => {
    if (loadingMore || allMessagesLoaded || messages.length === 0) return

    try {
      setLoadingMore(true)

      // Get the oldest message timestamp
      const oldestMessage = messages[messages.length - 1]

      // Query for older messages
      const olderMessagesQuery = query(
        collection(db, "messages"),
        where("channelId", "==", channelId),
        orderBy("createdAt", "desc"),
        limit(MESSAGES_PER_LOAD),
        // Start after the oldest message we already have
        ...(oldestMessage ? [startAfter(oldestMessage.createdAt)] : []),
      )

      const snapshot = await getDocs(olderMessagesQuery)
      const olderMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }))

      if (olderMessages.length < MESSAGES_PER_LOAD) {
        setAllMessagesLoaded(true)
      }

      if (olderMessages.length > 0) {
        setMessages((prevMessages) => [...prevMessages, ...olderMessages])
      }
    } catch (error) {
      console.error("Error loading more messages:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  const setupReadStatusListener = () => {
    if (readStatusListenerRef.current) {
      readStatusListenerRef.current()
    }

    const channelRef = doc(db, "channels", channelId)

    readStatusListenerRef.current = onSnapshot(
      channelRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          setReadStatus(data.readBy || {})
        }
      },
      (error) => {
        console.error("Error listening for read status:", error)
      },
    )
  }

  const sendMessage = async () => {
    if (!messageText.trim() || !userId || !channelId) return

    try {
      setIsSending(true)

      // Prepare message data
      const messageData = {
        text: messageText.trim(),
        userId: userId,
        userName: userName || userId,
        channelId: channelId,
        createdAt: serverTimestamp(),
        readBy: {
          [userId]: new Date().toISOString(),
        },
      }

      // Add reply data if replying to a message
      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          text: replyingTo.text,
          userName: replyingTo.userName,
        }
      }

      // Add message to Firestore
      await addDoc(collection(db, "messages"), messageData)

      // Update channel's last message
      await updateDoc(doc(db, "channels", channelId), {
        lastMessage: messageText.trim(),
        lastMessageAt: serverTimestamp(),
        lastMessageBy: userId,
        [`readBy.${userId}`]: new Date().toISOString(),
      })

      // Clear input and reply state
      setMessageText("")
      setReplyingTo(null)
      setIsSending(false)
    } catch (error) {
      console.error("Error sending message:", error)
      toast.show("Failed to send message", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
      setIsSending(false)
    }
  }

  const startVideoCall = async () => {
    if (isDirectMessage && otherUser) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      const call = await createCall(otherUser.id, otherUser.name, "video", { channelId })

      if (call) {
        navigation.navigate("VideoCall", {
          callId: call.id,
          roomId: call.roomId,
          authToken: call.authToken,
          callType: "video",
          participants: [otherUser.id],
        })
      }
    }
  }

  const startVoiceCall = async () => {
    if (isDirectMessage && otherUser) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      const call = await createCall(otherUser.id, otherUser.name, "audio", { channelId })

      if (call) {
        navigation.navigate("VideoCall", {
          callId: call.id,
          roomId: call.roomId,
          authToken: call.authToken,
          callType: "audio",
          participants: [otherUser.id],
        })
      }
    }
  }

  const viewUserProfile = () => {
    if (otherUser) {
      navigation.navigate("UserProfile", {
        userId: otherUser.id,
        userName: otherUser.name,
      })
    }
  }

  // Format date for message grouping
  const formatMessageDate = (date) => {
    const now = new Date()
    const messageDate = new Date(date)

    // Check if message is from today
    if (messageDate.toDateString() === now.toDateString()) {
      return "Today"
    }

    // Check if message is from yesterday
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    }

    // Return formatted date for older messages
    return messageDate.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }

  // Check if message should show date header
  const shouldShowDateHeader = (message, index) => {
    if (index === messages.length - 1) return true

    const nextMessage = messages[index + 1]
    const nextDate = new Date(nextMessage.createdAt).toDateString()
    const currentDate = new Date(message.createdAt).toDateString()

    return nextDate !== currentDate
  }

  // Check if message is read by other user
  const isMessageRead = (message) => {
    if (!isDirectMessage || !otherUser || message.userId !== userId) return false

    const otherUserId = otherUser.id
    return readStatus[otherUserId] && new Date(readStatus[otherUserId]) >= new Date(message.createdAt)
  }

  // Handle replying to a message
  const handleReplyToMessage = (message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setReplyingTo(message)
  }

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null)
  }

  // Find the original message being replied to
  const findOriginalMessage = (replyToId) => {
    return messages.find((msg) => msg.id === replyToId)
  }

  // Scroll to original message when reply is tapped
  const scrollToOriginalMessage = (messageId) => {
    const index = messages.findIndex((msg) => msg.id === messageId)
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      })

      // Highlight the message briefly
      const message = messages[index]
      handleHighlightMessage(message)
    }
  }

  // Highlight a message briefly
  const handleHighlightMessage = (message) => {
    // This would be implemented with a temporary state and animation
    // For simplicity, we'll just use the toast to indicate
    toast.show("Showing original message", {
      type: "info",
      placement: "top",
      duration: 1500,
    })
  }

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.userId === userId
    const messageTime =
      item.createdAt instanceof Date
        ? item.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    const showDateHeader = shouldShowDateHeader(item, index)
    const isRead = isMessageRead(item)

    // Check if this is the last message from the same sender
    // Note: With inverted list, we need to check the previous message in the array
    const isLastFromSender = index === 0 || messages[index - 1].userId !== item.userId

    // Check if message is a reply
    const isReply = item.replyTo && item.replyTo.id

    return (
      <>
        <Pressable
          onLongPress={() => handleReplyToMessage(item)}
          delayLongPress={200}
          className={`px-2 py-1 max-w-[80%] ${isMyMessage ? "self-end" : "self-start"}`}
        >
          <View
            className={`p-3 rounded-2xl ${
              isMyMessage ? (isDark ? "bg-[#005C4B]" : "bg-[#DCF8C6]") : isDark ? "bg-[#2C2C2C]" : "bg-[#FFFFFF]"
            } ${isMyMessage ? "rounded-tr-sm" : "rounded-tl-sm"}`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 1,
              elevation: 1,
            }}
          >
            {!isMyMessage && (
              <Text className={`text-xs mb-1 font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {item.userName}
              </Text>
            )}

            {/* Reply preview if this message is a reply */}
            {isReply && (
              <TouchableOpacity
                onPress={() => scrollToOriginalMessage(item.replyTo.id)}
                className={`mb-2 pl-2 border-l-2 ${
                  isDark ? "border-gray-500 bg-gray-800" : "border-gray-300 bg-gray-100"
                } rounded-md py-1 px-2`}
              >
                <Text className={`text-xs font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                  {item.replyTo.userName === userName ? "You" : item.replyTo.userName}
                </Text>
                <Text className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`} numberOfLines={1}>
                  {item.replyTo.text}
                </Text>
              </TouchableOpacity>
            )}

            <Text
              className={`${isMyMessage ? (isDark ? "text-white" : "text-black") : isDark ? "text-white" : "text-black"}`}
            >
              {item.text}
            </Text>
            <View className="flex-row items-center justify-end mt-1">
              <Text className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{messageTime}</Text>

              {isMyMessage && isLastFromSender && (
                <View className="ml-1">
                  {isRead ? (
                    <CheckCheck size={14} color={isDark ? "#34B7F1" : "#53BDEB"} />
                  ) : (
                    <Check size={14} color={isDark ? "#8FA6B5" : "#A8AAAC"} />
                  )}
                </View>
              )}
            </View>
          </View>
        </Pressable>

        {showDateHeader && (
          <View className="flex items-center justify-center my-4">
            <View className={`px-3 py-1 rounded-full ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
              <Text className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                {formatMessageDate(item.createdAt)}
              </Text>
            </View>
          </View>
        )}
      </>
    )
  }

  const renderFooter = () => {
    if (!loadingMore) return null

    return (
      <View className="py-4 flex items-center justify-center">
        <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#005FFF"} />
      </View>
    )
  }

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#005FFF" />
      </View>
    )
  }

  return (
    <SafeAreaView className={`flex-1 mt-10 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View
        className={`flex-row justify-between items-center p-3 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}
      >
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          <Text className={`ml-2 font-medium ${isDark ? "text-white" : "text-black"}`}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center" onPress={viewUserProfile} disabled={!isDirectMessage}>
          <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>{displayName}</Text>
          {isDirectMessage && otherUser && (
            <Text className={`text-xs ml-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {readStatus[otherUser.id] ? "online" : ""}
            </Text>
          )}
        </TouchableOpacity>

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
                className="w-10 h-10 rounded-full bg-[#005FFF] justify-center items-center ml-2"
                onPress={startVoiceCall}
              >
                <Phone color="#FFFFFF" size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                className="w-10 h-10 rounded-full bg-[#005FFF] justify-center items-center ml-2"
                onPress={startVideoCall}
              >
                <Video color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Chat area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 10,
            justifyContent: messages.length === 0 ? "flex-end" : "flex-start",
          }}
          inverted={true} // This is the key change - inverted list shows newest messages at bottom
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToIndex({ index: info.index, animated: true })
              }
            }, 100)
          }}
        />

        {/* Reply preview */}
        <Animated.View
          style={{
            transform: [
              {
                translateY: replyAnimatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
            opacity: replyAnimatedValue,
            height: replyAnimatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 60],
            }),
          }}
          className={`px-3 py-2 flex-row justify-between items-center ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"
          } border-t`}
        >
          {replyingTo && (
            <>
              <View className="flex-1 flex-row items-center">
                <CornerUpLeft size={16} color={isDark ? "#FFFFFF" : "#000000"} className="mr-2" />
                <View className="flex-1">
                  <Text className={`font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                    Replying to {replyingTo.userName === userName ? "yourself" : replyingTo.userName}
                  </Text>
                  <Text className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`} numberOfLines={1}>
                    {replyingTo.text}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={cancelReply} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* Message input */}
        <View className={`flex-row items-center p-2 border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
          <TextInput
            className={`flex-1 rounded-full px-4 py-3 mr-2 ${
              isDark ? "bg-[#2C2C2C] text-white border-gray-700" : "bg-gray-100 text-black border-gray-200"
            } border`}
            placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
            placeholderTextColor={isDark ? "#999999" : "#777777"}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxHeight={100}
          />
          <TouchableOpacity
            className={`w-12 h-12 rounded-full justify-center items-center ${
              messageText.trim() ? "bg-[#00A884]" : isDark ? "bg-gray-700" : "bg-gray-300"
            }`}
            onPress={sendMessage}
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <SendHorizonal color="#FFFFFF" size={20} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
