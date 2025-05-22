"use client"

import { createContext, useState, useContext, useEffect, useRef } from "react"
import { HMSSDK } from "@100mslive/react-native-hms"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useToast } from "react-native-toast-notifications"
import { View, ActivityIndicator, Text } from "react-native"
import { db } from "../config/firebase"
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc, onSnapshot } from "firebase/firestore"
import { useNetInfo } from "@react-native-community/netinfo"

// Singleton instance for video client
let videoClientInstance = null

export const getVideoClientInstance = () => videoClientInstance

const CallContext = createContext()

// For development purposes only - replace with your actual token in production
// This token must be generated from your 100ms dashboard or backend
const DEV_AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNjQ2ZTBiMzg0YmEwZmI3MmJjMDQ3NDVkIiwicm9vbV9pZCI6IjYzOTk4M2FkNGJhMGZiNzJiYzA0NzQ1ZCIsInVzZXJfaWQiOiJ0ZXN0X3VzZXIiLCJyb2xlIjoiaG9zdCIsImlhdCI6MTY4MzEwMzY0MCwiZXhwIjoxNzE0NzI1NjQwfQ.J7U-fs1E6XWHZ0Z2SEWgr7BO_t-JFnrYeUQeNHVgPHg"

export const CallProvider = ({ children }) => {
  const [hmsInstance, setHmsInstance] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState(null)
  const [activeRoom, setActiveRoom] = useState(null)
  const toast = useToast()
  const incomingCallListenerRef = useRef(null)
  const netInfo = useNetInfo()

  // Initialize call client
  useEffect(() => {
    const initCallClient = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId")
        const storedUserName = (await AsyncStorage.getItem("userName")) || storedUserId

        if (!storedUserId) {
          console.log("Missing user ID for call client")
          setIsReady(true)
          return
        }

        setIsConnecting(true)
        setUserId(storedUserId)
        setUserName(storedUserName)

        // Initialize 100ms SDK
        try {
          const hms = await HMSSDK.build()
          setHmsInstance(hms)
          videoClientInstance = hms
          console.log("100ms SDK initialized successfully")
        } catch (error) {
          console.error("Error initializing 100ms SDK:", error)
          toast.show("Failed to initialize video service", {
            type: "danger",
            placement: "top",
            duration: 3000,
          })
        }

        // Set up incoming call listener
        setupIncomingCallListener(storedUserId)

        setIsConnecting(false)
        setIsReady(true)
      } catch (error) {
        console.error("Error initializing call client:", error)
        toast.show("Failed to connect to video service", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
        setIsConnecting(false)
        setIsReady(true)
      }
    }

    if (netInfo.isConnected || netInfo.isConnected === null) {
      initCallClient()
    }

    // Cleanup on unmount
    return () => {
      if (incomingCallListenerRef.current) {
        incomingCallListenerRef.current()
      }

      // Leave any active room
      if (hmsInstance && activeRoom) {
        hmsInstance.leave().catch((error) => {
          console.error("Error leaving room:", error)
        })
      }
    }
  }, [netInfo.isConnected])

  const setupIncomingCallListener = (userId) => {
    // Clean up existing listener
    if (incomingCallListenerRef.current) {
      incomingCallListenerRef.current()
    }

    // Listen for incoming calls directed to this user
    const userRef = doc(db, "users", userId)

    incomingCallListenerRef.current = onSnapshot(
      userRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data()

          // Check for incoming call
          if (userData.incomingCall) {
            setIncomingCall(userData.incomingCall)

            // Show notification
            toast.show(`Incoming call from ${userData.incomingCall.callerName}`, {
              type: "info",
              placement: "top",
              duration: 10000,
            })
          } else {
            setIncomingCall(null)
          }
        }
      },
      (error) => {
        console.error("Error listening for incoming calls:", error)
      },
    )
  }

  // Get auth token from server
  const getAuthToken = async (roomId, userId, role = "host") => {
    try {
      console.log("Getting auth token for room:", roomId)

      // For development purposes only - use a hardcoded token
      // In production, you must replace this with a proper token from your server
      console.log("Using development token for testing")

      // Return the development token
      // This is a long-lived token for testing only
      return DEV_AUTH_TOKEN

      // For production, you should call your backend API to get a token
      // const response = await fetch('https://your-backend.com/get-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ roomId, userId, role })
      // });
      // const data = await response.json();
      // return data.token;
    } catch (error) {
      console.error("Error getting auth token:", error)
      throw new Error("Failed to get authentication token")
    }
  }

  // Create a new call
  const createCall = async (recipientId, recipientName, callType = "video", metadata = {}) => {
    try {
      if (!netInfo.isConnected) {
        toast.show("You're offline. Please check your internet connection.", {
          type: "warning",
          placement: "top",
          duration: 3000,
        })
        return null
      }

      if (!userId || !hmsInstance) {
        console.error("Missing userId or hmsInstance for call creation")
        return null
      }

      console.log("Creating call for recipient:", recipientId)

      // IMPORTANT: Use the fixed room ID that matches your auth token
      // This must match the room_id in your DEV_AUTH_TOKEN
      const roomId = "639983ad4ba0fb72bc04745d"

      console.log("Using room ID:", roomId)

      // Get auth token
      let authToken
      try {
        authToken = await getAuthToken(roomId, userId)
        console.log("Got auth token:", authToken.substring(0, 20) + "...")
      } catch (error) {
        console.error("Failed to get auth token:", error)
        toast.show("Failed to get authentication token", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
        return null
      }

      // Store call information in Firestore
      const callData = {
        roomId,
        callType,
        callerId: userId,
        callerName: userName,
        recipientId,
        recipientName,
        status: "ringing",
        createdAt: serverTimestamp(),
        metadata: {
          ...metadata,
        },
      }

      const callRef = await addDoc(collection(db, "calls"), callData)
      console.log("Call created with ID:", callRef.id)

      // Update recipient's user document with incoming call info
      try {
        const recipientRef = doc(db, "users", recipientId)
        await updateDoc(recipientRef, {
          incomingCall: {
            callId: callRef.id,
            callerId: userId,
            callerName: userName,
            callType,
            roomId,
            timestamp: serverTimestamp(),
          },
        })
        console.log("Updated recipient with incoming call info")
      } catch (error) {
        console.error("Error updating recipient:", error)
        // Continue with the call even if notification fails
      }

      return {
        id: callRef.id,
        ...callData,
        roomId,
        authToken,
      }
    } catch (error) {
      console.error("Error creating call:", error)
      toast.show("Failed to initiate call", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
      return null
    }
  }

  // Join a call
  const joinCall = async (roomId, authToken, callType = "video") => {
    try {
      if (!netInfo.isConnected) {
        toast.show("You're offline. Please check your internet connection.", {
          type: "warning",
          placement: "top",
          duration: 3000,
        })
        return false
      }

      if (!hmsInstance) {
        throw new Error("Call client not initialized")
      }

      // Validate required parameters
      if (!roomId) {
        throw new Error("Room ID is required to join a call")
      }

      if (!authToken) {
        throw new Error("Authentication token is required to join a call")
      }

      console.log("Joining call with room ID:", roomId)

      // Configure join options - IMPORTANT: Don't specify userRole here
      // The role should be defined in the auth token
      const config = {
        authToken,
        username: userName || "User",
        settings: {
          isAudioMuted: false,
          isVideoMuted: callType !== "video",
        },
      }

      // Join the room
      await hmsInstance.join(config)
      setActiveRoom(roomId)
      console.log("Successfully joined room:", roomId)

      return true
    } catch (error) {
      console.error("Error joining call:", error)
      toast.show("Failed to join call: " + error.message, {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
      return false
    }
  }

  // Leave a call
  const leaveCall = async () => {
    try {
      if (!hmsInstance || !activeRoom) return false

      console.log("Leaving call for room:", activeRoom)
      await hmsInstance.leave()
      setActiveRoom(null)
      console.log("Successfully left room")

      return true
    } catch (error) {
      console.error("Error leaving call:", error)
      return false
    }
  }

  // Accept an incoming call
  const acceptCall = async (navigation) => {
    try {
      if (!netInfo.isConnected) {
        toast.show("You're offline. Please check your internet connection.", {
          type: "warning",
          placement: "top",
          duration: 3000,
        })
        return
      }

      if (!incomingCall || !hmsInstance) return

      const callId = incomingCall.callId
      console.log("Accepting call with ID:", callId)

      const callDoc = await getDoc(doc(db, "calls", callId))

      if (!callDoc.exists()) {
        throw new Error("Call no longer exists")
      }

      const callData = callDoc.data()
      console.log("Call data:", callData)

      // Update call status
      await updateDoc(doc(db, "calls", callId), {
        status: "connected",
        connectedAt: serverTimestamp(),
      })

      // Clear incoming call notification
      await updateDoc(doc(db, "users", userId), {
        incomingCall: null,
      })

      // Get auth token
      let authToken
      try {
        authToken = await getAuthToken(callData.roomId, userId)
        console.log("Got auth token for accepting call")
      } catch (error) {
        console.error("Failed to get auth token:", error)
        toast.show("Failed to get authentication token", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
        return
      }

      // Navigate to call screen
      navigation.navigate("VideoCall", {
        callId,
        roomId: callData.roomId,
        authToken,
        callType: callData.callType,
        participants: [callData.callerId],
        isIncoming: true,
        recipientName: callData.callerName,
      })

      setIncomingCall(null)
    } catch (error) {
      console.error("Error accepting call:", error)
      toast.show("Failed to accept call", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    }
  }

  // Reject an incoming call
  const rejectCall = async () => {
    try {
      if (!incomingCall) return

      const callId = incomingCall.callId
      console.log("Rejecting call with ID:", callId)

      // Update call status
      await updateDoc(doc(db, "calls", callId), {
        status: "rejected",
        endedAt: serverTimestamp(),
      })

      // Clear incoming call notification
      await updateDoc(doc(db, "users", userId), {
        incomingCall: null,
      })

      setIncomingCall(null)
    } catch (error) {
      console.error("Error rejecting call:", error)
      toast.show("Failed to reject call", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    }
  }

  // End a call
  const endCall = async (callId) => {
    try {
      if (!callId) return false

      console.log("Ending call with ID:", callId)

      // Update call status
      await updateDoc(doc(db, "calls", callId), {
        status: "ended",
        endedAt: serverTimestamp(),
      })

      // Leave the room
      if (hmsInstance && activeRoom) {
        await hmsInstance.leave()
        setActiveRoom(null)
      }

      return true
    } catch (error) {
      console.error("Error ending call:", error)
      return false
    }
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#005FFF" />
        <Text style={{ marginTop: 10 }}>Initializing video service...</Text>
      </View>
    )
  }

  return (
    <CallContext.Provider
      value={{
        hmsInstance,
        isConnecting,
        incomingCall,
        createCall,
        joinCall,
        leaveCall,
        acceptCall,
        rejectCall,
        endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  )
}

export const useCall = () => useContext(CallContext)
