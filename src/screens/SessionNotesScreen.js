"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useDispatch } from "react-redux"
import { updateAppointmentStatus } from "../redux/slices/appointmentSlice"
import { createNotification } from "../redux/slices/notificationSlice"
import { useToast } from "react-native-toast-notifications"
import { db } from "../config/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Check, Clock, Calendar, User } from "lucide-react-native"

export default function SessionNotesScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const dispatch = useDispatch()
  const toast = useToast()

  const { appointmentId, duration, professionalId, patientId } = route.params

  const [notes, setNotes] = useState("")
  const [followUpNeeded, setFollowUpNeeded] = useState(false)
  const [followUpNotes, setFollowUpNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [appointmentData, setAppointmentData] = useState(null)

  useEffect(() => {
    const fetchAppointmentData = async () => {
      setLoading(true)
      try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId))
        if (appointmentDoc.exists()) {
          setAppointmentData(appointmentDoc.data())
        }
      } catch (error) {
        console.error("Error fetching appointment data:", error)
        toast.show("Failed to load appointment data", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAppointmentData()
  }, [appointmentId])

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.show("Please add session notes before submitting", {
        type: "warning",
        placement: "top",
        duration: 3000,
      })
      return
    }

    setSubmitting(true)

    try {
      // Update appointment with notes
      await dispatch(
        updateAppointmentStatus({
          appointmentId,
          status: "completed",
          notes: {
            sessionNotes: notes,
            followUpNeeded,
            followUpNotes: followUpNeeded ? followUpNotes : null,
            duration,
            completedAt: new Date().toISOString(),
          },
        }),
      )

      // Create notifications
      dispatch(
        createNotification({
          userId: professionalId,
          title: "Session Completed",
          body: `Your session has been completed and notes saved`,
          type: "appointment",
          data: { appointmentId },
        }),
      )

      dispatch(
        createNotification({
          userId: patientId,
          title: "Session Completed",
          body: `Your session has been completed`,
          type: "appointment",
          data: { appointmentId },
        }),
      )

      toast.show("Session notes saved successfully", {
        type: "success",
        placement: "top",
        duration: 3000,
      })

      // Navigate back to appointments
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      })
    } catch (error) {
      console.error("Error saving session notes:", error)
      toast.show("Failed to save session notes", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    }
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>Loading session data...</Text>
      </View>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Session Notes</Text>

        {/* Session info */}
        <View className={`p-4 rounded-lg mb-6 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          <View className="flex-row items-center mb-2">
            <Calendar size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>
              {appointmentData?.scheduledFor ? new Date(appointmentData.scheduledFor).toLocaleDateString() : "N/A"}
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <Clock size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>Duration: {formatDuration(duration)}</Text>
          </View>

          <View className="flex-row items-center">
            <User size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>
              Patient: {appointmentData?.patientName || "N/A"}
            </Text>
          </View>
        </View>

        {/* Session notes */}
        <Text className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Session Notes</Text>
        <TextInput
          className={`rounded-lg p-4 min-h-[150px] mb-6 ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          placeholder="Enter your session notes here..."
          placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />

        {/* Follow-up toggle */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            className={`w-6 h-6 rounded-md justify-center items-center mr-2 ${
              followUpNeeded ? "bg-[#ea580c]" : isDark ? "border border-white" : "border border-black"
            }`}
            onPress={() => setFollowUpNeeded(!followUpNeeded)}
          >
            {followUpNeeded && <Check size={16} color="#FFFFFF" />}
          </TouchableOpacity>
          <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>Follow-up needed</Text>
        </View>

        {/* Follow-up notes */}
        {followUpNeeded && (
          <>
            <Text className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Follow-up Notes</Text>
            <TextInput
              className={`rounded-lg p-4 min-h-[100px] mb-6 ${
                isDark
                  ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                  : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
              }`}
              placeholder="Enter follow-up notes here..."
              placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
              value={followUpNotes}
              onChangeText={setFollowUpNotes}
              multiline
              textAlignVertical="top"
            />
          </>
        )}

        {/* Submit button */}
        <TouchableOpacity
          className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-4"
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-bold">Save Session Notes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="h-12 rounded-lg justify-center items-center border border-[#ea580c] mt-4"
          onPress={() => {
            Alert.alert("Discard Notes", "Are you sure you want to discard these notes?", [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Discard",
                onPress: () => navigation.goBack(),
                style: "destructive",
              },
            ])
          }}
          disabled={submitting}
        >
          <Text className="text-[#ea580c] text-base font-bold">Discard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

