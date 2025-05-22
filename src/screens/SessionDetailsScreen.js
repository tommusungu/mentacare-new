"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { useNavigation, useRoute } from "@react-navigation/native"
import { db } from "../config/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useToast } from "react-native-toast-notifications"
import { Calendar, Clock, User, FileText, Video, Phone, ArrowLeft } from "lucide-react-native"

export default function SessionDetailsScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const toast = useToast()

  const { appointmentId, inCall } = route.params
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId))
        if (appointmentDoc.exists()) {
          setAppointment({ id: appointmentDoc.id, ...appointmentDoc.data() })
        } else {
          toast.show("Appointment not found", {
            type: "danger",
            placement: "top",
            duration: 3000,
          })
        }
      } catch (error) {
        console.error("Error fetching appointment details:", error)
        toast.show("Failed to load appointment details", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAppointmentDetails()
  }, [appointmentId])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>Loading session details...</Text>
      </View>
    )
  }

  if (!appointment) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <Text className={`text-lg ${isDark ? "text-white" : "text-black"}`}>Session not found</Text>
        <TouchableOpacity className="mt-4 p-3 bg-[#ea580c] rounded-lg" onPress={() => navigation.goBack()}>
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        {inCall && (
          <TouchableOpacity className="flex-row items-center mb-6" onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>Back to Call</Text>
          </TouchableOpacity>
        )}

        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Session Details</Text>

        <View className={`p-4 rounded-lg mb-6 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          <View className="flex-row items-center mb-4">
            <Calendar size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>
              {formatDate(appointment.scheduledFor)}
            </Text>
          </View>

          <View className="flex-row items-center mb-4">
            <Clock size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>
              {formatTime(appointment.scheduledFor)}
            </Text>
          </View>

          <View className="flex-row items-center mb-4">
            <User size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>
              Patient: {appointment.patientName}
            </Text>
          </View>

          <View className="flex-row items-center mb-4">
            <User size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>
              Professional: {appointment.professionalName}
            </Text>
          </View>

          <View className="flex-row items-center">
            <FileText size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>
              Status: {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Text>
          </View>
        </View>

        {appointment.reason && (
          <View className="mb-6">
            <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
              Reason for Appointment
            </Text>
            <View className={`p-4 rounded-lg ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              <Text className={`${isDark ? "text-white" : "text-black"}`}>{appointment.reason}</Text>
            </View>
          </View>
        )}

        {appointment.notes && appointment.notes.sessionNotes && (
          <View className="mb-6">
            <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Session Notes</Text>
            <View className={`p-4 rounded-lg ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              <Text className={`${isDark ? "text-white" : "text-black"}`}>{appointment.notes.sessionNotes}</Text>
            </View>
          </View>
        )}

        {appointment.notes && appointment.notes.followUpNeeded && (
          <View className="mb-6">
            <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Follow-up Notes</Text>
            <View className={`p-4 rounded-lg ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              <Text className={`${isDark ? "text-white" : "text-black"}`}>
                {appointment.notes.followUpNotes || "Follow-up needed, but no specific notes provided."}
              </Text>
            </View>
          </View>
        )}

        {!inCall && appointment.status === "confirmed" && (
          <View className="mt-4">
            <TouchableOpacity
              className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mb-4"
              onPress={() => {
                navigation.navigate("VideoCall", {
                  appointmentId: appointment.id,
                  channelId: `appointment-${appointment.id}`,
                  callType: "video",
                  participants: [appointment.patientId, appointment.professionalId],
                  professionalId: appointment.professionalId,
                  patientId: appointment.patientId,
                  appointmentData: appointment,
                })
              }}
            >
              <View className="flex-row items-center">
                <Video size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-bold ml-2">Join Video Session</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="h-12 rounded-lg justify-center items-center border border-[#ea580c]"
              onPress={() => {
                navigation.navigate("VideoCall", {
                  appointmentId: appointment.id,
                  channelId: `appointment-${appointment.id}`,
                  callType: "audio",
                  participants: [appointment.patientId, appointment.professionalId],
                  professionalId: appointment.professionalId,
                  patientId: appointment.patientId,
                  appointmentData: appointment,
                })
              }}
            >
              <View className="flex-row items-center">
                <Phone size={20} color="#ea580c" />
                <Text className="text-[#ea580c] text-base font-bold ml-2">Join Audio Session</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

