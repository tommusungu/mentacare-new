"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useDispatch, useSelector } from "react-redux"
import { fetchProfessionalAvailability } from "../../redux/slices/appointmentSlice"
import { db } from "../../config/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useToast } from "react-native-toast-notifications"

export default function BookAppointmentScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const dispatch = useDispatch()
  const toast = useToast()

  const { professionalId } = route.params
  const [professional, setProfessional] = useState(null)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(true)

  const currentUser = useSelector((state) => state.user.currentUser)
  const availability = useSelector((state) => state.appointments.availability)

  useEffect(() => {
    const fetchProfessionalData = async () => {
      try {
        const professionalDoc = await getDoc(doc(db, "users", professionalId))
        if (professionalDoc.exists()) {
          setProfessional(professionalDoc.data())
        } else {
          toast.show("Professional not found", {
            type: "danger",
            placement: "top",
            duration: 3000,
          })
          navigation.goBack()
        }

        // Fetch professional's availability
        await dispatch(fetchProfessionalAvailability(professionalId))
      } catch (error) {
        console.error("Error fetching professional data:", error)
        toast.show("Failed to load professional data", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfessionalData()
  }, [professionalId, dispatch])

  const handleContinue = () => {
    if (!reason.trim()) {
      toast.show("Please provide a reason for your appointment", {
        type: "warning",
        placement: "top",
        duration: 3000,
      })
      return
    }

    navigation.navigate("Availability", {
      professionalId,
      professionalName: professional?.name,
      reason,
    })
  }

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>Loading professional data...</Text>
      </View>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Book a Session</Text>

        <View className={`p-4 rounded-xl mb-6 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-[#ea580c] justify-center items-center mr-3">
              <Text className="text-white text-xl font-bold">
                {professional?.name ? professional.name[0].toUpperCase() : "?"}
              </Text>
            </View>
            <View>
              <Text className={`text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>
                {professional?.name}
              </Text>
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                {professional?.title || "Therapist"}
              </Text>
            </View>
          </View>

          {professional?.specialization && (
            <View className="mt-4 pt-4 border-t border-gray-700">
              <Text className={`font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>Specialization:</Text>
              <Text className={`${isDark ? "text-white/70" : "text-black/70"}`}>{professional.specialization}</Text>
            </View>
          )}

          {professional?.experience && (
            <View className="mt-2">
              <Text className={`font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>Experience:</Text>
              <Text className={`${isDark ? "text-white/70" : "text-black/70"}`}>{professional.experience} years</Text>
            </View>
          )}
        </View>

        <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Reason for Appointment</Text>

        <TextInput
          className={`rounded-xl p-4 min-h-[150px] mb-6 ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          placeholder="Briefly describe why you're seeking this appointment..."
          placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
          value={reason}
          onChangeText={setReason}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-4"
          onPress={handleContinue}
        >
          <Text className="text-white text-base font-bold">Continue to Select Time</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

