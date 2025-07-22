"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useDispatch, useSelector } from "react-redux"
import { fetchProfessionalAvailability, checkTimeSlotAvailability, clearAvailabilityMap } from "../../redux/slices/appointmentSlice"
import { db } from "../../config/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useToast } from "react-native-toast-notifications"
import { ChevronLeft, ChevronRight } from "lucide-react-native"
import { format, addDays, isSameDay, startOfDay, isBefore, isAfter } from "date-fns"

export default function AvailabilityScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const dispatch = useDispatch()
  const toast = useToast()

  const { professionalId, professionalName, professionalEmail, reason } = route.params
  const [professional, setProfessional] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [weekStart, setWeekStart] = useState(startOfDay(new Date()))
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  const availability = useSelector((state) => state.appointments.availability)
  const currentUser = useSelector((state) => state.user.currentUser)
  const timeSlotAvailable = useSelector((state) => state.appointments.timeSlotAvailable)
  const availabilityMap = useSelector((state) => state.appointments.availabilityMap)

  useEffect(() => {
    const fetchData = async () => {
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
        console.error("Error fetching data:", error)
        toast.show("Failed to load availability", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [professionalId, dispatch])

  // Clear availability map when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearAvailabilityMap())
    }
  }, [dispatch])

  const getDaysOfWeek = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }
    return days
  }

  const getAvailableTimeSlotsForDate = (date) => {
    if (!availability) return []

    const dayOfWeek = format(date, "EEEE").toLowerCase()
    const slots = availability[dayOfWeek] || []

    // Filter out past time slots if the date is today
    const now = new Date()
    const isToday = isSameDay(date, now)

    return slots.filter((slot) => {
      if (isToday) {
        const [hours, minutes] = slot.split(":").map(Number)
        const slotTime = new Date(date)
        slotTime.setHours(hours, minutes, 0, 0)
        
        // Add buffer time (30 minutes) to current time
        const bufferTime = new Date(now)
        bufferTime.setMinutes(bufferTime.getMinutes() + 30)
        
        return isAfter(slotTime, bufferTime)
      }
      return true
    }).sort((a, b) => {
      const [aHours, aMinutes] = a.split(":").map(Number)
      const [bHours, bMinutes] = b.split(":").map(Number)
      return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes)
    })
  }

  const handlePreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7))
  }

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7))
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedTimeSlot(null)
  }

  const handleTimeSlotSelect = async (timeSlot) => {
    setSelectedTimeSlot(timeSlot)
    
    // Create appointment datetime in UTC
    const [hours, minutes] = timeSlot.split(":").map(Number)
    const appointmentDate = new Date(selectedDate)
    appointmentDate.setHours(hours, minutes, 0, 0)
    
    // Convert to ISO string for consistent timezone handling
    const scheduledFor = appointmentDate.toISOString()
    console.log(`Selected time slot: ${timeSlot}, scheduledFor: ${scheduledFor}`)
    
    // Check if we already have the availability status for this time slot
    if (availabilityMap[scheduledFor] !== undefined) {
      console.log(`Using cached availability status for ${scheduledFor}: ${availabilityMap[scheduledFor]}`)
      if (!availabilityMap[scheduledFor]) {
        toast.show("This time slot is no longer available", {
          type: "warning",
          placement: "top",
          duration: 3000,
        })
        setSelectedTimeSlot(null)
      }
      return
    }

    // Check if time slot is available
    setCheckingAvailability(true)
    try {
      const result = await dispatch(checkTimeSlotAvailability({
        professionalId,
        scheduledFor
      })).unwrap()
      
      if (!result) {
        toast.show("This time slot is no longer available", {
          type: "warning",
          placement: "top",
          duration: 3000,
        })
        // Reset the selected time slot if it's not available
        setSelectedTimeSlot(null)
      }
    } catch (error) {
      console.error("Error checking time slot availability:", error)
      
      // Provide more specific error messages based on the error
      let errorMessage = "Failed to check time slot availability"
      if (error.includes("permission-denied")) {
        errorMessage = "You don't have permission to check availability"
      } else if (error.includes("not-found")) {
        errorMessage = "Professional not found"
      } else if (error.includes("network")) {
        errorMessage = "Network error. Please check your connection"
      }
      
      toast.show(errorMessage, {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
      
      // Reset the selected time slot on error
      setSelectedTimeSlot(null)
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleContinue = () => {
    if (!selectedDate || !selectedTimeSlot) {
      toast.show("Please select a date and time", {
        type: "warning",
        placement: "top",
        duration: 3000,
      })
      return
    }

    // Create appointment datetime in UTC
    const [hours, minutes] = selectedTimeSlot.split(":").map(Number)
    const appointmentDate = new Date(selectedDate)
    appointmentDate.setHours(hours, minutes, 0, 0)
    
    // Convert to ISO string for consistent timezone handling
    const scheduledFor = appointmentDate.toISOString()
    console.log(`Continuing with time slot: ${selectedTimeSlot}, scheduledFor: ${scheduledFor}`)
    
    // Check if we have the availability status for this time slot
    if (availabilityMap[scheduledFor] === false) {
      toast.show("This time slot is no longer available", {
        type: "warning",
        placement: "top",
        duration: 3000,
      })
      return
    }

    navigation.navigate("ConfirmAppointment", {
      professionalId,
      professionalName,
      professionalEmail,
      reason,
      scheduledFor,
      timeSlot: selectedTimeSlot,
    })
  }

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>Loading availability...</Text>
      </View>
    )
  }

  const daysOfWeek = getDaysOfWeek()
  const availableTimeSlots = getAvailableTimeSlotsForDate(selectedDate)
  const isPastDate = isBefore(selectedDate, startOfDay(new Date()))
  const canNavigateToPreviousWeek =
    !isSameDay(weekStart, startOfDay(new Date())) && !isBefore(weekStart, startOfDay(new Date()))

  return (
    <View className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Select Date & Time</Text>

        <Text className={`text-base mb-4 ${isDark ? "text-white" : "text-black"}`}>
          Appointment with {professionalName}
        </Text>

        {/* Calendar Week View */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity
              onPress={handlePreviousWeek}
              disabled={!canNavigateToPreviousWeek}
              className={`p-2 ${!canNavigateToPreviousWeek ? "opacity-30" : ""}`}
            >
              <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>

            <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </Text>

            <TouchableOpacity onPress={handleNextWeek} className="p-2">
              <ChevronRight size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
            {daysOfWeek.map((date, index) => {
              const isSelected = isSameDay(date, selectedDate)
              const isPast = isBefore(date, startOfDay(new Date()))
              const hasSlots = getAvailableTimeSlotsForDate(date).length > 0

              return (
                <TouchableOpacity
                  key={index}
                  className={`mr-2 p-3 rounded-xl w-16 items-center ${
                    isSelected
                      ? "bg-[#ea580c]"
                      : isPast || !hasSlots
                        ? isDark
                          ? "bg-[#1E1E1E]/50"
                          : "bg-[#F5F5F5]/50"
                        : isDark
                          ? "bg-[#1E1E1E]"
                          : "bg-[#F5F5F5]"
                  }`}
                  onPress={() => !isPast && hasSlots && handleDateSelect(date)}
                  disabled={isPast || !hasSlots}
                >
                  <Text
                    className={`text-xs ${
                      isSelected
                        ? "text-white"
                        : isPast || !hasSlots
                          ? isDark
                            ? "text-white/30"
                            : "text-black/30"
                          : isDark
                            ? "text-white"
                            : "text-black"
                    }`}
                  >
                    {format(date, "EEE")}
                  </Text>
                  <Text
                    className={`text-lg font-bold mt-1 ${
                      isSelected
                        ? "text-white"
                        : isPast || !hasSlots
                          ? isDark
                            ? "text-white/30"
                            : "text-black/30"
                          : isDark
                            ? "text-white"
                            : "text-black"
                    }`}
                  >
                    {format(date, "d")}
                  </Text>
                  {!hasSlots && (
                    <Text className={`text-xs mt-1 ${isDark ? "text-white/30" : "text-black/30"}`}>N/A</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Time Slots */}
        <View className="mb-6">
          <Text className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Available Time Slots</Text>

          {checkingAvailability ? (
            <View className="flex-1 justify-center items-center py-4">
              <ActivityIndicator size="small" color="#ea580c" />
              <Text className={`mt-2 ${isDark ? "text-white/70" : "text-black/70"}`}>Checking availability...</Text>
            </View>
          ) : isPastDate ? (
            <Text className={`text-base text-center py-4 ${isDark ? "text-white/70" : "text-black/70"}`}>
              Cannot book appointments for past dates
            </Text>
          ) : availableTimeSlots.length === 0 ? (
            <Text className={`text-base text-center py-4 ${isDark ? "text-white/70" : "text-black/70"}`}>
              No available time slots for this date
            </Text>
          ) : (
            <View className="flex-row flex-wrap">
              {availableTimeSlots.map((timeSlot, index) => {
                const isSelected = timeSlot === selectedTimeSlot
                const isUnavailable = timeSlotAvailable === false && isSelected

                return (
                  <TouchableOpacity
                    key={index}
                    className={`mr-2 mb-2 px-4 py-2 rounded-lg ${
                      isSelected 
                        ? isUnavailable 
                          ? "bg-red-500" 
                          : "bg-[#ea580c]"
                        : isDark 
                          ? "bg-[#1E1E1E]" 
                          : "bg-[#F5F5F5]"
                    }`}
                    onPress={() => handleTimeSlotSelect(timeSlot)}
                  >
                    <Text className={`${isSelected ? "text-white" : isDark ? "text-white" : "text-black"}`}>
                      {timeSlot}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>

        <TouchableOpacity
          className={`h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-4 ${
            !selectedTimeSlot || timeSlotAvailable === false ? "opacity-50" : "opacity-100"
          }`}
          onPress={handleContinue}
          disabled={!selectedTimeSlot || timeSlotAvailable === false}
        >
          <Text className="text-white text-base font-bold">Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

