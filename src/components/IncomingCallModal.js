"use client"

import { View, Text, TouchableOpacity, Modal } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { useCall } from "../context/CallContext"
import { Phone, Video, PhoneOff, User } from "lucide-react-native"
import * as Haptics from "expo-haptics"
import { useNavigation } from "@react-navigation/native"

export default function IncomingCallModal() {
  const { isDark } = useTheme()
  const { incomingCall, acceptCall, rejectCall } = useCall()
  const navigation = useNavigation()

  if (!incomingCall) return null

  // Safely determine if this is a video call
  const isVideoCall = incomingCall.callType === "video"

  // Safely get caller name
  const callerName = incomingCall.callerName || "Unknown"

  const handleAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    acceptCall(navigation)
  }

  const handleReject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    rejectCall()
  }

  return (
    <Modal visible={!!incomingCall} transparent animationType="slide">
      <View className="flex-1 justify-center items-center bg-black/70">
        <View className={`w-[90%] rounded-xl p-6 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}>
          <Text className={`text-xl font-bold text-center mb-2 ${isDark ? "text-white" : "text-black"}`}>
            {isVideoCall ? "Incoming Video Call" : "Incoming Call"}
          </Text>

          <View className="items-center my-6">
            <View className="w-20 h-20 rounded-full bg-[#005FFF] justify-center items-center mb-3">
              <User size={40} color="#FFFFFF" />
            </View>
            <Text className={`text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>{callerName}</Text>
          </View>

          <View className="flex-row justify-around mt-4">
            <TouchableOpacity className="items-center" onPress={handleReject}>
              <View className="w-16 h-16 rounded-full bg-[#FF3B30] justify-center items-center mb-2">
                <PhoneOff size={30} color="#FFFFFF" />
              </View>
              <Text className={`${isDark ? "text-white" : "text-black"}`}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center" onPress={handleAccept}>
              <View className="w-16 h-16 rounded-full bg-[#34C759] justify-center items-center mb-2">
                {isVideoCall ? <Video size={30} color="#FFFFFF" /> : <Phone size={30} color="#FFFFFF" />}
              </View>
              <Text className={`${isDark ? "text-white" : "text-black"}`}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
