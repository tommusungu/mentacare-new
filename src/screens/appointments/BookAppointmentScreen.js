"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from "react-native"
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

  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
const [customReason, setCustomReason] = useState("");

// quick list you can extend or fetch from the DB later
const presetReasons = [
  "Anxiety and panic attacks Management",
  "Stress and burnout",
  "Depression and burnout",
  "Grief and Loss support",
  "Anger management",
  "Coping with chronic illness",
  "Personal growth and self discovery",
  "Suicidal thoughts",
  "Family therapy",
  "Behavioural concerns",
  "Addiction counseling",
];

  const { professionalId } = route.params
  const [professional, setProfessional] = useState(null)
  // console.log("selected professional: ",professional)
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
      professionalEmail: professional?.email,
      
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

        <Text
  className={`text-lg font-bold mb-2 ${
    isDark ? "text-white" : "text-black"
  }`}
>
  Reason for Appointment
</Text>

{/* main touchable “input” */}
<TouchableOpacity
  onPress={() => setIsDropdownVisible(true)}
  className={`rounded-xl p-4 mb-6 ${
    isDark
      ? "bg-[#1E1E1E] border border-[#2C2C2C]"
      : "bg-[#F5F5F5] border border-[#E0E0E0]"
  }`}
>
  <Text
    className={`${reason ? "" : "italic"} ${
      isDark ? "text-white" : "text-black"
    }`}
  >
    {reason || "Select a reason…"}
  </Text>
</TouchableOpacity>

        <TouchableOpacity
          className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-4"
          onPress={handleContinue}
        >
          <Text className="text-white text-base font-bold">Continue to Select Time</Text>
        </TouchableOpacity>
      </View>

      <Modal
  visible={isDropdownVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setIsDropdownVisible(false)}
>
  {/* backdrop */}
  <TouchableOpacity
    className="flex-1 justify-end items-center bg-black/50"
    activeOpacity={1}
    onPress={() => setIsDropdownVisible(false)}
  >
    {/* dropdown container */}
    <View
      className={`w-full max-h-[60%] rounded-t-[32px] p-2 px-4 pt-8 ${
        isDark ? "bg-[#1E1E1E]" : "bg-white"
      }`}
    >
      <ScrollView>
        {presetReasons.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => {
              if (item.startsWith("Other")) {
                // show a text input for custom reason
                setCustomReason("");
              } else {
                setReason(item);
                setIsDropdownVisible(false);
              }
            }}
            className={` py-3 mx-3 border-b  ${
                isDark ? "border-[#404040]" : "border-gray-200"
              }`}
          >
            <Text
              className={`text-base ${
                isDark ? "text-gray-200" : "text-black"
              }`}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* custom reason field (only visible if user tapped “Other…”) */}
      {/* {customReason !== null && (
        <View className="p-4">
          <Text
            className={`mb-2 font-medium ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            Enter custom reason
          </Text>
          <TextInput
            value={customReason}
            onChangeText={setCustomReason}
            placeholder="Type your reason…"
            placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
            multiline
            className={`rounded-lg p-3 min-h-[100px] ${
              isDark
                ? "bg-[#2C2C2C] text-white"
                : "bg-[#F5F5F5] text-black"
            }`}
            textAlignVertical="top"
          />

          <TouchableOpacity
            onPress={() => {
              if (customReason.trim()) {
                setReason(customReason.trim());
                setIsDropdownVisible(false);
              }
            }}
            className="mt-4 h-11 rounded-lg bg-[#ea580c] justify-center items-center"
          >
            <Text className="text-white font-bold">Save Reason</Text>
          </TouchableOpacity>
        </View>
      )} */}
    </View>
  </TouchableOpacity>
</Modal>
    </ScrollView>
  )
}

