"use client"

import { useEffect, useState, useRef } from "react"
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, BackHandler } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useTheme } from "../context/ThemeContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { useCall } from "../context/CallContext"
import { HMSVideoView, HMSUpdateListenerActions } from "@100mslive/react-native-hms"
import InCallManager from "react-native-incall-manager"
import { Mic, MicOff, Camera, CameraOff, PhoneOff, RotateCcw, FileText, MessageCircle } from "lucide-react-native"
import { useDispatch } from "react-redux"
import { updateAppointmentStatus } from "../redux/slices/appointmentSlice"
import { createNotification } from "../redux/slices/notificationSlice"
import { useToast } from "react-native-toast-notifications"
import * as Haptics from "expo-haptics"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNetInfo } from "@react-native-community/netinfo"

export default function VideoCallScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { isDark } = useTheme()
  const dispatch = useDispatch()
  const toast = useToast()
  const { hmsInstance, leaveCall, endCall } = useCall()
  const netInfo = useNetInfo()

  const {
    callId,
    roomId,
    authToken,
    callType = "video",
    participants = [],
    professionalId,
    patientId,
    appointmentId,
    appointmentData,
    isIncoming = false,
    recipientName,
  } = route.params || {}

  console.log("callId: ", callId)
  console.log("roomId: ", roomId)
  console.log("authToken: ", authToken)

  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(callType === "video")
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isCallConnected, setIsCallConnected] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [callState, setCallState] = useState("initializing") // initializing, connecting, connected, reconnecting, ended
  const [showChat, setShowChat] = useState(false)
  const [error, setError] = useState(null)
  const [localPeer, setLocalPeer] = useState(null)
  const [remotePeers, setRemotePeers] = useState([])

  const durationTimerRef = useRef(null)
  const controlsTimerRef = useRef(null)

  // Check if offline
  useEffect(() => {
    if (!netInfo.isConnected && netInfo.isConnected !== null && isCallConnected) {
      toast.show("You're offline. The call will end when connection is lost.", {
        type: "warning",
        placement: "top",
        duration: 3000,
      })
    }
  }, [netInfo.isConnected, isCallConnected])

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      // Prevent going back with hardware button during a call
      if (isCallConnected) {
        Alert.alert("End Call", "Are you sure you want to end this call?", [
          { text: "Cancel", style: "cancel" },
          { text: "End Call", onPress: handleEndCall, style: "destructive" },
        ])
        return true
      }
      return false
    })

    return () => backHandler.remove()
  }, [isCallConnected])

  useEffect(() => {
    // Initialize call
    const initCall = async () => {
      console.log("Starting call initialization with params:", {
        callId,
        roomId,
        callType,
        participants,
      })

      try {
        // Validate required parameters
        if (!roomId) {
          console.error("Missing roomId for call initialization")
          setError("Missing room ID. Cannot initialize call.")
          setCallState("error")
          return
        }

        if (!authToken) {
          console.error("Missing authToken for call initialization")
          setError("Missing authentication token. Cannot initialize call.")
          setCallState("error")
          return
        }

        if (!hmsInstance) {
          console.error("Video client not initialized")
          setError("Video client not initialized. Please try again.")
          setCallState("error")
          return
        }

        setCallState("connecting")
        console.log("Initializing call with room ID:", roomId)

        // Set up event listeners
        setupEventListeners()

        // Join the room
        try {
          // Get username from AsyncStorage
          const userName = (await AsyncStorage.getItem("userName")) || "User"

          console.log("Joining room with token:", authToken.substring(0, 20) + "...")

          // Configure join options - IMPORTANT: Don't specify role here
          const config = {
            authToken,
            username: userName,
            settings: {
              isAudioMuted: false,
              isVideoMuted: callType !== "video",
            },
          }

          // Join the room
          await hmsInstance.join(config)

          console.log("Successfully joined room")
          setCallState("connected")
          setIsCallConnected(true)
          startCallDurationTimer()

          // Start InCallManager
          InCallManager.start({ media: callType === "video" ? "video" : "audio" })
          InCallManager.setForceSpeakerphoneOn(true)

          // Vibrate to indicate connection
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

          // Update appointment status if this is a scheduled appointment
          if (appointmentId) {
            dispatch(
              updateAppointmentStatus({
                appointmentId,
                status: "in-progress",
              }),
            )

            // Create notification for both parties
            if (professionalId && patientId) {
              dispatch(
                createNotification({
                  userId: professionalId,
                  title: "Session Started",
                  body: `Your session with ${appointmentData?.patientName || "patient"} has started`,
                  type: "appointment",
                  data: { appointmentId },
                }),
              )

              dispatch(
                createNotification({
                  userId: patientId,
                  title: "Session Started",
                  body: `Your session with ${appointmentData?.professionalName || "professional"} has started`,
                  type: "appointment",
                  data: { appointmentId },
                }),
              )
            }
          }
        } catch (error) {
          console.error("Error joining room:", error)
          setError(`Failed to join room: ${error.message || "Unknown error"}`)
          setCallState("error")
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing call:", error)
        setError(`Failed to initialize call: ${error.message || "Unknown error"}`)
        setCallState("error")
      }
    }

    if (netInfo.isConnected || netInfo.isConnected === null) {
      initCall()
    } else {
      setError("No internet connection. Please check your network and try again.")
      setCallState("error")
    }

    // Clean up on unmount
    return () => {
      stopCallDurationTimer()
      clearTimeout(controlsTimerRef.current)
      if (hmsInstance) {
        try {
          removeEventListeners()
          hmsInstance.leave()
        } catch (error) {
          console.error("Error leaving call:", error)
        }
      }
      InCallManager.stop()
    }
  }, [hmsInstance, roomId, authToken, netInfo.isConnected])

  useEffect(() => {
    // Auto-hide controls after 5 seconds of inactivity
    if (showControls && isCallConnected) {
      clearTimeout(controlsTimerRef.current)
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false)
      }, 5000)
    }

    return () => clearTimeout(controlsTimerRef.current)
  }, [showControls, isCallConnected])

  const setupEventListeners = () => {
    if (!hmsInstance) return

    // Set up peer update listener
    hmsInstance.addEventListener(HMSUpdateListenerActions.ON_PEER_UPDATE, onPeerUpdate)

    // Set up room update listener
    hmsInstance.addEventListener(HMSUpdateListenerActions.ON_ROOM_UPDATE, onRoomUpdate)

    // Set up track update listener
    hmsInstance.addEventListener(HMSUpdateListenerActions.ON_TRACK_UPDATE, onTrackUpdate)

    // Set up error listener
    hmsInstance.addEventListener(HMSUpdateListenerActions.ON_ERROR, onError)

    // Set up reconnecting listener
    hmsInstance.addEventListener(HMSUpdateListenerActions.RECONNECTING, onReconnecting)

    // Set up reconnected listener
    hmsInstance.addEventListener(HMSUpdateListenerActions.RECONNECTED, onReconnected)
  }

  const removeEventListeners = () => {
    if (!hmsInstance) return

    hmsInstance.removeEventListener(HMSUpdateListenerActions.ON_PEER_UPDATE, onPeerUpdate)
    hmsInstance.removeEventListener(HMSUpdateListenerActions.ON_ROOM_UPDATE, onRoomUpdate)
    hmsInstance.removeEventListener(HMSUpdateListenerActions.ON_TRACK_UPDATE, onTrackUpdate)
    hmsInstance.removeEventListener(HMSUpdateListenerActions.ON_ERROR, onError)
    hmsInstance.removeEventListener(HMSUpdateListenerActions.RECONNECTING, onReconnecting)
    hmsInstance.removeEventListener(HMSUpdateListenerActions.RECONNECTED, onReconnected)
  }

  const onPeerUpdate = ({ peer, type }) => {
    console.log("Peer update:", type, peer?.name)

    // Update local peer
    if (peer?.isLocal) {
      setLocalPeer(peer)
    }

    // Update remote peers list
    hmsInstance.getRemotePeers().then((peers) => {
      setRemotePeers(peers)
      setParticipantCount(peers.length + 1) // +1 for local peer
    })

    // If a remote peer left and we're still connected
    if (type === HMSUpdateListenerActions.PEER_LEFT && !peer?.isLocal && isCallConnected) {
      toast.show("Other participant left the call", {
        type: "info",
        placement: "top",
        duration: 3000,
      })
    }
  }

  const onRoomUpdate = ({ room, type }) => {
    console.log("Room update:", type)

    if (type === HMSUpdateListenerActions.ROOM_PEER_COUNT_UPDATED) {
      setParticipantCount(room.peerCount)
    }
  }

  const onTrackUpdate = ({ track, peer, type }) => {
    console.log("Track update:", type, track?.type, peer?.name)
  }

  const onError = (error) => {
    console.error("100ms error:", error)
    toast.show("Video call error: " + error.message, {
      type: "danger",
      placement: "top",
      duration: 3000,
    })
  }

  const onReconnecting = () => {
    console.log("Reconnecting to call...")
    setCallState("reconnecting")
    toast.show("Connection unstable. Reconnecting...", {
      type: "warning",
      placement: "top",
      duration: 3000,
    })
  }

  const onReconnected = () => {
    console.log("Reconnected to call")
    setCallState("connected")
    toast.show("Reconnected successfully", {
      type: "success",
      placement: "top",
      duration: 2000,
    })
  }

  const startCallDurationTimer = () => {
    stopCallDurationTimer()
    setCallDuration(0)
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
  }

  const stopCallDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current)
      durationTimerRef.current = null
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    }
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const toggleMicrophone = async () => {
    if (!hmsInstance || !localPeer) return

    try {
      if (isMicOn) {
        await hmsInstance.localPeer.localAudioTrack()?.setMute(true)
      } else {
        await hmsInstance.localPeer.localAudioTrack()?.setMute(false)
      }
      setIsMicOn(!isMicOn)

      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch (error) {
      console.error("Error toggling microphone:", error)
      toast.show("Failed to toggle microphone", {
        type: "danger",
        placement: "top",
        duration: 2000,
      })
    }
  }

  const toggleCamera = async () => {
    if (!hmsInstance || !localPeer) return

    try {
      if (isCameraOn) {
        await hmsInstance.localPeer.localVideoTrack()?.setMute(true)
      } else {
        await hmsInstance.localPeer.localVideoTrack()?.setMute(false)
      }
      setIsCameraOn(!isCameraOn)

      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch (error) {
      console.error("Error toggling camera:", error)
      toast.show("Failed to toggle camera", {
        type: "danger",
        placement: "top",
        duration: 2000,
      })
    }
  }

  const toggleSpeaker = () => {
    InCallManager.setForceSpeakerphoneOn(!isSpeakerOn)
    setIsSpeakerOn(!isSpeakerOn)

    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const flipCamera = async () => {
    if (!hmsInstance || !localPeer || !isCameraOn) return

    try {
      await hmsInstance.switchCamera()

      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } catch (error) {
      console.error("Error flipping camera:", error)
      toast.show("Failed to flip camera", {
        type: "danger",
        placement: "top",
        duration: 2000,
      })
    }
  }

  const handleEndCall = async () => {
    try {
      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

      stopCallDurationTimer()
      InCallManager.stop()

      // End the call in Firestore
      if (callId) {
        await endCall(callId)
      }

      // Leave the room
      await leaveCall()

      // If this is a scheduled appointment, update its status
      if (appointmentId) {
        dispatch(
          updateAppointmentStatus({
            appointmentId,
            status: "completed",
            notes: {
              duration: callDuration,
              completedAt: new Date().toISOString(),
            },
          }),
        )

        // Navigate to session notes screen
        navigation.replace("SessionNotes", {
          appointmentId,
          duration: callDuration,
          professionalId,
          patientId,
        })
      } else {
        navigation.goBack()
      }
    } catch (error) {
      console.error("Error ending call:", error)
      navigation.goBack()
    }
  }

  const handleScreenTap = () => {
    if (isCallConnected) {
      setShowControls(true)

      // Reset the auto-hide timer
      clearTimeout(controlsTimerRef.current)
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false)
      }, 5000)
    }
  }

  const navigateToSessionDetails = () => {
    if (appointmentId) {
      navigation.navigate("SessionDetails", {
        appointmentId,
        inCall: true,
      })
    }
  }

  const toggleChat = () => {
    setShowChat(!showChat)

    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const renderCallStateIndicator = () => {
    switch (callState) {
      case "initializing":
        return (
          <View className="flex-row items-center bg-black/50 px-3 py-1 rounded-full">
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text className="text-white ml-2">Initializing...</Text>
          </View>
        )
      case "connecting":
        return (
          <View className="flex-row items-center bg-black/50 px-3 py-1 rounded-full">
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text className="text-white ml-2">Connecting...</Text>
          </View>
        )
      case "reconnecting":
        return (
          <View className="flex-row items-center bg-black/50 px-3 py-1 rounded-full">
            <ActivityIndicator size="small" color="#FF9500" />
            <Text className="text-white ml-2">Reconnecting...</Text>
          </View>
        )
      case "connected":
        return (
          <View className="flex-row items-center bg-black/50 px-3 py-1 rounded-full">
            <Text className="text-white">{formatDuration(callDuration)}</Text>
          </View>
        )
      case "ended":
        return (
          <View className="flex-row items-center bg-black/50 px-3 py-1 rounded-full">
            <Text className="text-white">Call ended</Text>
          </View>
        )
      case "error":
        return (
          <View className="flex-row items-center bg-[#FF3B30]/80 px-3 py-1 rounded-full">
            <Text className="text-white">Call error</Text>
          </View>
        )
      default:
        return null
    }
  }

  const renderVideoViews = () => {
    if (!hmsInstance || !localPeer) {
      return (
        <View className="flex-1 justify-center items-center bg-gray-900">
          <Text className="text-white">Connecting to video...</Text>
        </View>
      )
    }

    // If there are no remote peers, show only local video
    if (remotePeers.length === 0) {
      return (
        <View className="flex-1">
          <HMSVideoView
            trackId={localPeer.videoTrack?.trackId}
            mirror={true}
            scaleType="ASPECT_FILL"
            style={{ flex: 1 }}
          />
        </View>
      )
    }

    // If there's one remote peer, show picture-in-picture layout
    return (
      <View className="flex-1">
        {/* Remote peer (full screen) */}
        <HMSVideoView
          trackId={remotePeers[0].videoTrack?.trackId}
          mirror={false}
          scaleType="ASPECT_FILL"
          style={{ flex: 1 }}
        />

        {/* Local peer (small overlay) */}
        <View className="absolute bottom-20 right-4 w-1/3 h-1/4 rounded-lg overflow-hidden border-2 border-white">
          <HMSVideoView
            trackId={localPeer.videoTrack?.trackId}
            mirror={true}
            scaleType="ASPECT_FILL"
            style={{ flex: 1 }}
          />
        </View>
      </View>
    )
  }

  // Show offline message if no internet connection
  if (!netInfo.isConnected && netInfo.isConnected !== null && !isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center p-4">
          <View className="w-20 h-20 rounded-full bg-gray-800 justify-center items-center mb-6">
            <Text className="text-3xl">📶</Text>
          </View>
          <Text className="text-white text-2xl font-bold mb-2">You're offline</Text>
          <Text className="text-gray-400 text-center mb-8">
            Please check your internet connection to continue the call
          </Text>
          <TouchableOpacity className="bg-[#FF5722] py-3 px-6 rounded-full" onPress={() => navigation.goBack()}>
            <Text className="text-white font-medium">End Call</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <TouchableOpacity activeOpacity={1} onPress={handleScreenTap} className="flex-1">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#005FFF" />
            <Text className="text-white mt-4 text-lg">Initializing call...</Text>
            {error && <Text className="text-red-500 mt-2 text-center px-4">{error}</Text>}
          </View>
        ) : (
          <View className="flex-1">
            {/* Video content */}
            {renderVideoViews()}

            {/* Status bar */}
            {showControls && (
              <View className="absolute top-4 left-0 right-0 flex-row justify-between items-center px-4">
                <TouchableOpacity className="bg-black/50 rounded-full p-2" onPress={() => navigation.goBack()}>
                  <Text className="text-white font-medium">Exit</Text>
                </TouchableOpacity>

                {renderCallStateIndicator()}

                <View className="flex-row">
                  {appointmentId && (
                    <TouchableOpacity className="bg-black/50 rounded-full p-2 mr-2" onPress={navigateToSessionDetails}>
                      <FileText size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity className="bg-black/50 rounded-full p-2" onPress={toggleChat}>
                    <MessageCircle size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Call controls */}
            {showControls && (
              <View className="absolute bottom-0 left-0 right-0">
                <View className="flex-row justify-around p-5 bg-black/70">
                  <TouchableOpacity
                    className={`w-12 h-12 rounded-full justify-center items-center ${isMicOn ? "bg-[#005FFF]" : "bg-[#FF3B30]"}`}
                    onPress={toggleMicrophone}
                  >
                    {isMicOn ? <Mic color="#FFFFFF" size={24} /> : <MicOff color="#FFFFFF" size={24} />}
                  </TouchableOpacity>

                  {callType === "video" && (
                    <TouchableOpacity
                      className={`w-12 h-12 rounded-full justify-center items-center ${isCameraOn ? "bg-[#005FFF]" : "bg-[#FF3B30]"}`}
                      onPress={toggleCamera}
                    >
                      {isCameraOn ? <Camera color="#FFFFFF" size={24} /> : <CameraOff color="#FFFFFF" size={24} />}
                    </TouchableOpacity>
                  )}

                  {callType === "video" && isCameraOn && (
                    <TouchableOpacity
                      className="w-12 h-12 rounded-full justify-center items-center bg-[#2C2C2C]"
                      onPress={flipCamera}
                    >
                      <RotateCcw color="#FFFFFF" size={24} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    className="w-12 h-12 rounded-full justify-center items-center bg-[#2C2C2C]"
                    onPress={toggleSpeaker}
                  >
                    <Text className="text-white font-medium">{isSpeakerOn ? "On" : "Off"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="w-12 h-12 rounded-full justify-center items-center bg-[#FF3B30]"
                    onPress={handleEndCall}
                  >
                    <PhoneOff color="#FFFFFF" size={24} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Chat overlay */}
            {showChat && (
              <View className="absolute top-16 bottom-16 right-0 w-3/4 bg-black/80 rounded-l-lg">
                <View className="flex-row justify-between items-center p-3 border-b border-gray-700">
                  <Text className="text-white font-bold">Session Chat</Text>
                  <TouchableOpacity onPress={toggleChat}>
                    <Text className="text-[#005FFF]">Close</Text>
                  </TouchableOpacity>
                </View>

                {/* Chat content would go here */}
                <View className="flex-1 p-4">
                  <Text className="text-white/70 text-center">Chat functionality coming soon</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  )
}
