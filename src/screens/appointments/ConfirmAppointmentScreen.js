"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useDispatch, useSelector } from "react-redux"
import { createAppointment, checkTimeSlotAvailability, clearAvailabilityMap } from "../../redux/slices/appointmentSlice"
import { createNotification } from "../../redux/slices/notificationSlice"
import { useToast } from "react-native-toast-notifications"
import { Calendar, Clock, User, Check } from "lucide-react-native"
import { format } from "date-fns"

export default function ConfirmAppointmentScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const dispatch = useDispatch()
  const toast = useToast()

  const { professionalId, professionalName, reason, scheduledFor, timeSlot } = route.params
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const timeSlotAvailable = useSelector((state) => state.appointments.timeSlotAvailable)
  const availabilityMap = useSelector((state) => state.appointments.availabilityMap)

  const currentUser = useSelector((state) => state.user.currentUser)

  // Clear availability map when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearAvailabilityMap())
    }
  }, [dispatch])

  useEffect(() => {
    // Check availability when screen loads
    const checkAvailability = async () => {
      setCheckingAvailability(true)
      try {
        console.log(`Checking availability for scheduledFor: ${scheduledFor}`)
        await dispatch(checkTimeSlotAvailability({
          professionalId,
          scheduledFor
        }))
      } catch (error) {
        console.error("Error checking time slot availability:", error)
        toast.show("Failed to check time slot availability", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setCheckingAvailability(false)
      }
    }

    checkAvailability()
  }, [professionalId, scheduledFor, dispatch])

  const handleConfirm = async () => {
    // Check if we have the availability status for this time slot
    if (availabilityMap[scheduledFor] === false) {
      toast.show("This time slot is no longer available", {
        type: "warning",
        placement: "top",
        duration: 3000,
      })
      navigation.goBack()
      return
    }
    
    if (timeSlotAvailable === false) {
      toast.show("This time slot is no longer available", {
        type: "warning",
        placement: "top",
        duration: 3000,
      })
      navigation.goBack()
      return
    }

    setSubmitting(true)

    try {
      // Double check availability before creating appointment
      console.log(`Double checking availability for scheduledFor: ${scheduledFor}`)
      const isAvailable = await dispatch(checkTimeSlotAvailability({
        professionalId,
        scheduledFor
      })).unwrap()

      if (!isAvailable) {
        toast.show("This time slot is no longer available", {
          type: "warning",
          placement: "top",
          duration: 3000,
        })
        navigation.goBack()
        return
      }

      const appointmentData = {
        professionalId,
        professionalName,
        patientId: currentUser.uid,
        patientName: currentUser.name,
        scheduledFor,
        reason,
        notes: notes.trim() || null,
        status: "pending",
        createdAt: new Date().toISOString(),
      }
      
      console.log(`Creating appointment with data:`, appointmentData)

      const resultAction = await dispatch(createAppointment(appointmentData))

      if (createAppointment.fulfilled.match(resultAction)) {
        const appointment = resultAction.payload

        // Create notifications
        dispatch(
          createNotification({
            userId: professionalId,
            title: "New Appointment Request",
            body: `${currentUser.name} has requested an appointment`,
            type: "appointment",
            data: { appointmentId: appointment.id },
          }),
        )

        dispatch(
          createNotification({
            userId: currentUser.uid,
            title: "Appointment Requested",
            body: `Your appointment with ${professionalName} has been requested`,
            type: "appointment",
            data: { appointmentId: appointment.id },
          }),
        )

        toast.show("Appointment requested successfully", {
          type: "success",
          placement: "top",
          duration: 3000,
        })

        // Navigate to appointment details
        navigation.reset({
          index: 1,
          routes: [
            { name: "AppointmentsList" },
            { name: "AppointmentDetails", params: { appointmentId: appointment.id } },
          ],
        })
      } else {
        const errorMessage = resultAction.payload || "Failed to create appointment"
        console.error("Failed to create appointment:", errorMessage)
        
        if (errorMessage.includes("Time slot is no longer available")) {
          toast.show("This time slot was just booked by someone else", {
            type: "warning",
            placement: "top",
            duration: 3000,
          })
          navigation.goBack()
        } else {
          toast.show("Failed to create appointment", {
            type: "danger",
            placement: "top",
            duration: 3000,
          })
        }
      }
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast.show("Failed to create appointment", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return format(date, "EEEE, MMMM d, yyyy")
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return format(date, "h:mm a")
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Confirm Appointment</Text>

        {checkingAvailability ? (
          <View className="flex-1 justify-center items-center py-4">
            <ActivityIndicator size="small" color="#ea580c" />
            <Text className={`mt-2 ${isDark ? "text-white/70" : "text-black/70"}`}>Checking availability...</Text>
          </View>
        ) : timeSlotAvailable === false ? (
          <View className="flex-1 justify-center items-center py-4">
            <Text className={`text-base text-center ${isDark ? "text-white/70" : "text-black/70"}`}>
              This time slot is no longer available
            </Text>
            <TouchableOpacity
              className="mt-4 p-3 bg-[#ea580c] rounded-lg"
              onPress={() => navigation.goBack()}
            >
              <Text className="text-white">Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View className={`p-4 rounded-xl mb-6 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              <View className="flex-row items-center mb-4">
                <Calendar size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>{formatDate(scheduledFor)}</Text>
              </View>

              <View className="flex-row items-center mb-4">
                <Clock size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>{formatTime(scheduledFor)}</Text>
              </View>

              <View className="flex-row items-center">
                <User size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>{professionalName}</Text>
              </View>
            </View>

            <View className="mb-6">
              <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
                Reason for Appointment
              </Text>
              <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
                <Text className={`${isDark ? "text-white" : "text-black"}`}>{reason}</Text>
              </View>
            </View>

            <View className="mb-6">
              <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
                Additional Notes (Optional)
              </Text>
              <TextInput
                className={`rounded-xl p-4 min-h-[100px] ${
                  isDark
                    ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                    : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
                }`}
                placeholder="Add any additional information that might be helpful..."
                placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View className={`p-4 rounded-xl mb-6 bg-[#34C759]/10`}>
              <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>
                Your appointment request will be sent to {professionalName} for confirmation. You'll receive a notification
                once it's confirmed.
              </Text>
            </View>

            <TouchableOpacity
              className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-4"
              onPress={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View className="flex-row items-center">
                  <Check size={20} color="#FFFFFF" />
                  <Text className="text-white text-base font-bold ml-2">Confirm Appointment</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="h-12 rounded-lg justify-center items-center border border-[#ea580c] mt-4"
              onPress={() => navigation.goBack()}
              disabled={submitting}
            >
              <Text className="text-[#ea580c] text-base font-bold">Go Back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  )
}

