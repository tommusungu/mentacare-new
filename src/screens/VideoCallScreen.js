"use client"

import { useEffect, useState } from "react"
import { View, Text, SafeAreaView, StatusBar, Alert } from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { useStreamVideoClient, StreamCall, useCallStateHooks, ParticipantView } from "@stream-io/video-react-native-sdk"
import { PermissionsAndroid, Platform } from "react-native"
import CallStatusBar from "../components/CallStatusBar"
import { PrimaryCallControls, SecondaryCallControls } from "../components/CallControls"
import { SingleParticipantView, MultiParticipantGrid } from "../components/ParticipantGrid"

const requestPermissions = async () => {
  if (Platform.OS === "android") {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ])
  }
}

const CustomCallContent = ({ call }) => {
  const navigation = useNavigation()
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const { useParticipants, useLocalParticipant, useCallSession } = useCallStateHooks()
  const participants = useParticipants()
  const localParticipant = useLocalParticipant()
  const session = useCallSession()

  // Timer for call duration
  useEffect(() => {
    let interval
    if (session) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [session])

  const toggleMute = async () => {
    try {
      if (isMuted) {
        await call.microphone.enable()
      } else {
        await call.microphone.disable()
      }
      setIsMuted(!isMuted)
    } catch (error) {
      console.error("Error toggling microphone:", error)
    }
  }

  const toggleVideo = async () => {
    try {
      if (isVideoOff) {
        await call.camera.enable()
      } else {
        await call.camera.disable()
      }
      setIsVideoOff(!isVideoOff)
    } catch (error) {
      console.error("Error toggling camera:", error)
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
  }

  const endCall = async () => {
    Alert.alert("End Call", "Are you sure you want to end this call?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Call",
        style: "destructive",
        onPress: async () => {
          try {
            await call.leave()
            navigation.goBack()
          } catch (error) {
            console.error("Error ending call:", error)
            navigation.goBack()
          }
        },
      },
    ])
  }

  const handleOpenChat = () => {
    console.log("Open chat")
  }

  const handleShowParticipants = () => {
    console.log("Show participants")
  }

  const handleShowMore = () => {
    console.log("Show more options")
  }

  const remoteParticipants = participants.filter((p) => p.userId !== localParticipant?.userId)
  const allParticipants = participants
  const isConnected = session !== null

  const renderVideoContent = () => {
    if (remoteParticipants.length === 0) {
      // Waiting for others - show only local participant
      return (
        <View className="flex-1 relative">
          {localParticipant ? (
            <View className="flex-1">
              <ParticipantView participant={localParticipant} style={{ flex: 1 }} />
              {isVideoOff && (
                <View className="absolute inset-0 bg-gray-800 justify-center items-center">
                  <View className="w-32 h-32 bg-gray-700 rounded-full justify-center items-center mb-4">
                    <Text className="text-4xl">👤</Text>
                  </View>
                  <Text className="text-white text-xl font-semibold">{localParticipant.name || "You"}</Text>
                </View>
              )}

              {/* Waiting overlay */}
              <View className="absolute inset-0 bg-transparent bg-opacity-40 justify-center items-center">
                <View className="bg-gray-800 rounded-xl p-6 mx-8">
                  <View className="items-center">
                    <View className="w-16 h-16 bg-gray-700 rounded-full justify-center items-center mb-4">
                      <Text className="text-2xl" style={{ color: "#ea580c" }}>
                        👥
                      </Text>
                    </View>
                    <Text className="text-white text-xl font-semibold mb-2">Waiting for others to join...</Text>
                    <Text className="text-gray-400 text-center">
                      Ensure that the scheduled appointment time has been reached before initiating the call.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-1 justify-center items-center bg-gray-900">
              <View className="w-32 h-32 bg-gray-700 rounded-full justify-center items-center mb-4">
                <Text className="text-4xl">📹</Text>
              </View>
              <Text className="text-white text-xl font-semibold mb-2">Setting up camera...</Text>
            </View>
          )}
        </View>
      )
    } else if (remoteParticipants.length === 1) {
      // One-on-one call
      return (
        <SingleParticipantView
          participant={remoteParticipants[0]}
          localParticipant={localParticipant}
          isVideoOff={isVideoOff}
        />
      )
    } else {
      // Multiple participants
      return <MultiParticipantGrid participants={allParticipants} />
    }
  }

  const getParticipantName = () => {
    if (remoteParticipants.length === 0) {
      return "Waiting for participants..."
    } else if (remoteParticipants.length === 1) {
      return remoteParticipants[0].name || "Unknown"
    } else {
      return `${remoteParticipants.length} participants`
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Call Status Bar */}
      <CallStatusBar
        participantName={getParticipantName()}
        callDuration={callDuration}
        isConnected={isConnected}
        participantCount={participants.length}
      />

      {/* Video content area */}
      <View className="flex-1">{renderVideoContent()}</View>

      {/* Control buttons */}
      <View className="px-4 py-4 bg-gray-800">
        <PrimaryCallControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isSpeakerOn={isSpeakerOn}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleSpeaker={toggleSpeaker}
          onEndCall={endCall}
        />

       
      </View>
    </SafeAreaView>
  )
}

const VideoCallScreen = () => {
  const client = useStreamVideoClient()
  const { params } = useRoute()
  const { callId, callType } = params || {}
  const navigation = useNavigation()

  const call = client?.call(callType || "default", callId || "test-call")

  useEffect(() => {
  const setupCall = async () => {
    if (!call) return;

    try {
      await requestPermissions();

      await call.getOrCreate();         // Ensure call is created before joining
      await call.camera.enable();       // Enable local video
      await call.microphone.enable();   // Enable local audio
      await call.join();                // Join the call
    } catch (error) {
      console.error("Failed to setup call:", error);
    Alert.alert("Call Error", `Failed to setup call: ${error.message}`, [
  { text: "OK", onPress: () => navigation.goBack() },
]);

    }
  };

  setupCall();

  return () => {
    call?.leave().catch(console.error);
  };
}, [call, navigation]);

  if (!call) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-white text-lg">Setting up call...</Text>
      </SafeAreaView>
    )
  }

  return (
    <StreamCall call={call}>
      <CustomCallContent call={call} />
    </StreamCall>
  )
}

export default VideoCallScreen
