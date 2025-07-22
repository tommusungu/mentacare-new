"use client"

import { createContext, useState, useContext, useEffect, useRef } from "react"
import { db } from "../config/firebase"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  limit,
} from "firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useToast } from "react-native-toast-notifications"
import { View, ActivityIndicator, Text } from "react-native"
import { v4 as uuidv4 } from "uuid"
import { useTheme } from "./ThemeContext"

const ChatContext = createContext()

export const ChatProvider = ({ children }) => {
    const { isDark } = useTheme()
  
  const [conversations, setConversations] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState(null)
  const toast = useToast()
  const conversationsListenerRef = useRef(null)
  const unreadListenerRef = useRef(null)

  // Initialize chat
  useEffect(() => {
    const initChat = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId")
        const storedUserName = (await AsyncStorage.getItem("userName")) || storedUserId

        if (!storedUserId) {
          console.log("Missing user ID for chat")
          setIsReady(true)
          return
        }

        setIsConnecting(true)
        setUserId(storedUserId)
        setUserName(storedUserName)

        // Set up listeners for conversations
        setupConversationsListener(storedUserId)

        setIsConnecting(false)
        setIsReady(true)
      } catch (error) {
        console.error("Error initializing chat:", error)
        toast.show("Failed to connect to chat service", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
        setIsConnecting(false)
        setIsReady(true)
      }
    }

    initChat()

    // Cleanup on unmount
    return () => {
      if (conversationsListenerRef.current) {
        conversationsListenerRef.current()
      }
      if (unreadListenerRef.current) {
        unreadListenerRef.current()
      }
    }
  }, [])

  const setupConversationsListener = (userId) => {
    // Clean up existing listener
    if (conversationsListenerRef.current) {
      conversationsListenerRef.current()
    }

    // Query conversations where the user is a member
    const q = query(
      collection(db, "conversations"),
      where("members", "array-contains", userId),
      orderBy("lastMessageAt", "desc"),
    )

    // Set up real-time listener
    conversationsListenerRef.current = onSnapshot(
      q,
      (snapshot) => {
        const conversationsData = []
        let totalUnread = 0

        snapshot.forEach((doc) => {
          const data = doc.data()
          const conversation = {
            id: doc.id,
            ...data,
          }

          // Calculate unread count for this conversation
          if (data.unreadCount && data.unreadCount[userId]) {
            totalUnread += data.unreadCount[userId]
          }

          conversationsData.push(conversation)
        })

        setConversations(conversationsData)
        setUnreadCount(totalUnread)
      },
      (error) => {
        console.error("Error listening to conversations:", error)
      },
    )
  }

  // Create a new conversation
  const createConversation = async (members, name = "", isGroup = false) => {
    try {
      if (!userId) return null

      // For direct messages, check if conversation already exists
      if (!isGroup && members.length === 1) {
        const otherUserId = members[0]
        const existingConversation = await findDirectConversation(userId, otherUserId)

        if (existingConversation) {
          return existingConversation
        }
      }

      // Create new conversation
      const allMembers = [userId, ...members]
      const conversationData = {
        name: name || "",
        isGroup: isGroup,
        members: allMembers,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessage: {
          text: "Conversation created",
          senderId: userId,
          senderName: userName,
          timestamp: serverTimestamp(),
        },
        unreadCount: {},
      }

      // Initialize unread counts to 0 for all members except creator
      allMembers.forEach((memberId) => {
        if (memberId !== userId) {
          conversationData.unreadCount[memberId] = 0
        }
      })

      const docRef = await addDoc(collection(db, "conversations"), conversationData)

      return {
        id: docRef.id,
        ...conversationData,
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast.show("Failed to create conversation", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
      return null
    }
  }

  // Find existing direct conversation between two users
  const findDirectConversation = async (userId1, userId2) => {
    try {
      // Query for conversations that have exactly these two members
      const q = query(
        collection(db, "conversations"),
        where("members", "array-contains", userId1),
        where("isGroup", "==", false),
      )

      const snapshot = await getDocs(q)

      let conversation = null
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.members.length === 2 && data.members.includes(userId2)) {
          conversation = {
            id: doc.id,
            ...data,
          }
        }
      })

      return conversation
    } catch (error) {
      console.error("Error finding direct conversation:", error)
      return null
    }
  }

  // Send a message
  const sendMessage = async (conversationId, text, attachments = []) => {
    try {
      if (!userId || !conversationId) return null

      // Get conversation reference
      const conversationRef = doc(db, "conversations", conversationId)
      const conversationSnap = await getDoc(conversationRef)

      if (!conversationSnap.exists()) {
        throw new Error("Conversation not found")
      }

      const conversationData = conversationSnap.data()

      // Create message
      const messageId = uuidv4()
      const message = {
        id: messageId,
        text,
        senderId: userId,
        senderName: userName,
        timestamp: serverTimestamp(),
        attachments: attachments || [],
        read: {
          [userId]: true,
        },
      }

      // Add message to messages subcollection
      await addDoc(collection(db, "conversations", conversationId, "messages"), message)

      // Update conversation with last message
      const updateData = {
        lastMessage: {
          text: text,
          senderId: userId,
          senderName: userName,
          timestamp: serverTimestamp(),
        },
        lastMessageAt: serverTimestamp(),
      }

      // Update unread counts for all members except sender
      const unreadUpdates = {}
      conversationData.members.forEach((memberId) => {
        if (memberId !== userId) {
          unreadUpdates[`unreadCount.${memberId}`] = (conversationData.unreadCount?.[memberId] || 0) + 1
        }
      })

      await updateDoc(conversationRef, {
        ...updateData,
        ...unreadUpdates,
      })

      return message
    } catch (error) {
      console.error("Error sending message:", error)
      toast.show("Failed to send message", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
      return null
    }
  }

  // Mark conversation as read
  const markConversationAsRead = async (conversationId) => {
    try {
      if (!userId || !conversationId) return

      const conversationRef = doc(db, "conversations", conversationId)

      // Reset unread count for current user
      await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: 0,
      })

      // Update unread count state
      setUnreadCount((prev) => {
        const conversation = conversations.find((c) => c.id === conversationId)
        const conversationUnread = conversation?.unreadCount?.[userId] || 0
        return Math.max(0, prev - conversationUnread)
      })
    } catch (error) {
      console.error("Error marking conversation as read:", error)
    }
  }

  // Get messages for a conversation with pagination
  const getMessages = async (conversationId, lastMessageTimestamp = null, pageSize = 20) => {
    try {
      if (!conversationId) return []

      let messagesQuery

      if (lastMessageTimestamp) {
        messagesQuery = query(
          collection(db, "conversations", conversationId, "messages"),
          orderBy("timestamp", "desc"),
          where("timestamp", "<", lastMessageTimestamp),
          limit(pageSize),
        )
      } else {
        messagesQuery = query(
          collection(db, "conversations", conversationId, "messages"),
          orderBy("timestamp", "desc"),
          limit(pageSize),
        )
      }

      const snapshot = await getDocs(messagesQuery)

      const messages = []
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      return messages
    } catch (error) {
      console.error("Error getting messages:", error)
      return []
    }
  }

  // Set up real-time listener for messages in a conversation
  const subscribeToMessages = (conversationId, callback) => {
    if (!conversationId) return () => {}

    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("timestamp", "desc"),
      limit(50),
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const messages = []
        snapshot.forEach((doc) => {
          messages.push({
            id: doc.id,
            ...doc.data(),
          })
        })

        callback(messages)
      },
      (error) => {
        console.error("Error listening to messages:", error)
      },
    )
  }

  // Get user details
  const getUserDetails = async (userId) => {
    try {
      if (!userId) return null

      const userDoc = await getDoc(doc(db, "users", userId))

      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data(),
        }
      }

      return null
    } catch (error) {
      console.error("Error getting user details:", error)
      return null
    }
  }

  // Get multiple users
  const getUsers = async (excludeCurrentUser = true, limit = 30) => {
    try {
      let usersQuery

      if (excludeCurrentUser && userId) {
        usersQuery = query(collection(db, "users"), where("uid", "!=", userId), limit(limit))
      } else {
        usersQuery = query(collection(db, "users"), limit(limit))
      }

      const snapshot = await getDocs(usersQuery)

      const users = []
      snapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      return users
    } catch (error) {
      console.error("Error getting users:", error)
      return []
    }
  }

  // Search users
  const searchUsers = async (searchTerm) => {
    try {
      if (!searchTerm) return []

      // Firebase doesn't support text search directly
      // This is a simple implementation - in production, consider using Algolia or similar
      const usersSnapshot = await getDocs(collection(db, "users"))

      const searchTermLower = searchTerm.toLowerCase()
      const results = []

      usersSnapshot.forEach((doc) => {
        const userData = doc.data()

        // Skip current user
        if (userData.uid === userId) return

        const nameMatch = userData.name && userData.name.toLowerCase().includes(searchTermLower)
        const emailMatch = userData.email && userData.email.toLowerCase().includes(searchTermLower)

        if (nameMatch || emailMatch) {
          results.push({
            id: doc.id,
            ...userData,
          })
        }
      })

      return results
    } catch (error) {
      console.error("Error searching users:", error)
      return []
    }
  }

  // Refresh unread count
  const refreshUnreadCount = async () => {
    try {
      if (!userId) return

      const q = query(collection(db, "conversations"), where("members", "array-contains", userId))

      const snapshot = await getDocs(q)

      let totalUnread = 0
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.unreadCount && data.unreadCount[userId]) {
          totalUnread += data.unreadCount[userId]
        }
      })

      setUnreadCount(totalUnread)
    } catch (error) {
      console.error("Error refreshing unread count:", error)
    }
  }

  if (!isReady) {

    return (
      <View 
      className={`flex-1 justify-center items-center ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
      >
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    )
  }

  return (
    <ChatContext.Provider
      value={{
        userId,
        userName,
        conversations,
        unreadCount,
        isConnecting,
        createConversation,
        sendMessage,
        getMessages,
        subscribeToMessages,
        markConversationAsRead,
        getUserDetails,
        getUsers,
        searchUsers,
        refreshUnreadCount,
        findDirectConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => useContext(ChatContext)
