"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useDispatch, useSelector } from "react-redux"
import { db, writeBatch } from "../../config/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useToast } from "react-native-toast-notifications"
import { Clock, Plus, Trash2, Check, X } from "lucide-react-native"

export default function AvailabilitySettingsScreen({userData}) {
  const { isDark } = useTheme()
  const dispatch = useDispatch()
  const toast = useToast()

  const currentUser =  useSelector((state) => state.user.currentUser) || userData.uid
  console.log('currentUser: ', userData)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [availability, setAvailability] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  })
  const [activeDay, setActiveDay] = useState("monday")
  const [showTimeSelector, setShowTimeSelector] = useState(false)
  const [selectedTime, setSelectedTime] = useState("09:00")

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists() && userDoc.data().availability) {
          setAvailability(userDoc.data().availability)
        }
      } catch (error) {
        console.error("Error fetching availability:", error)
        toast.show("Failed to load availability settings", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [currentUser.uid])

  const handleSave = async () => {
    setSaving(true)
    try {
      console.log('Saving availability:', availability)
      
      // Create a new batch
      const batch = writeBatch(db)
      
      // Update user document
      const userRef = doc(db, "users", currentUser.uid)
      batch.update(userRef, {
        availability,
        lastAvailabilityUpdate: new Date().toISOString()
      })
      
      // Update availability collection
      const availabilityRef = doc(db, "availability", currentUser.uid)
      batch.set(availabilityRef, {
        ...availability,
        lastUpdated: new Date().toISOString(),
        professionalId: currentUser.uid
      })

      console.log('Committing batch...')
      await batch.commit()
      console.log('Batch committed successfully')

      toast.show("Availability settings updated", {
        type: "success",
        placement: "top",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error updating availability:", error)
      console.error("Error details:", JSON.stringify(error))
      toast.show("Failed to update availability", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    } finally {
      setSaving(false)
    }
  }

  const addTimeSlot = () => {
    if (!selectedTime) return

    // Check if time already exists
    if (availability[activeDay].includes(selectedTime)) {
      toast.show("This time slot already exists", {
        type: "warning",
        placement: "top",
        duration: 2000,
      })
      return
    }

    // Check for overlapping time slots (30-minute intervals)
    const [hours, minutes] = selectedTime.split(":").map(Number)
    const selectedTimeMinutes = hours * 60 + minutes

    const hasOverlap = availability[activeDay].some(existingTime => {
      const [existingHours, existingMinutes] = existingTime.split(":").map(Number)
      const existingTimeMinutes = existingHours * 60 + existingMinutes
      
      // Check if the new time slot overlaps with any existing slot
      // (considering 30-minute intervals)
      return Math.abs(selectedTimeMinutes - existingTimeMinutes) < 30
    })

    if (hasOverlap) {
      toast.show("This time slot overlaps with an existing slot", {
        type: "warning",
        placement: "top",
        duration: 2000,
      })
      return
    }

    // Add time and sort
    const newTimes = [...availability[activeDay], selectedTime].sort((a, b) => {
      const [aHours, aMinutes] = a.split(":").map(Number)
      const [bHours, bMinutes] = b.split(":").map(Number)
      return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes)
    })

    setAvailability({
      ...availability,
      [activeDay]: newTimes,
    })

    setShowTimeSelector(false)
  }

  const removeTimeSlot = (day, time) => {
    const newTimes = availability[day].filter((t) => t !== time)
    setAvailability({
      ...availability,
      [day]: newTimes,
    })
  }

  const generateTimeOptions = () => {
    const times = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, "0")
        const formattedMinute = minute.toString().padStart(2, "0")
        times.push(`${formattedHour}:${formattedMinute}`)
      }
    }
    return times
  }

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const formattedHours = hours % 12 || 12
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  const renderDayTab = (day, label) => (
    <TouchableOpacity
      className={`py-2 px-3 rounded-lg mr-2 ${
        activeDay === day ? "bg-[#ea580c]" : isDark ? "bg-[#2C2C2C]" : "bg-[#E0E0E0]"
      }`}
      onPress={() => setActiveDay(day)}
    >
      <Text className={`${activeDay === day ? "text-white" : isDark ? "text-white" : "text-black"}`}>{label}</Text>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>
          Loading availability settings...
        </Text>
      </View>
    )
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <ScrollView className="flex-1 p-6">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Manage Availability</Text>

        <Text className={`text-base mb-4 ${isDark ? "text-white/70" : "text-black/70"}`}>
          Set your available time slots for appointments. Patients will only be able to book during these times.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {renderDayTab("monday", "Mon")}
          {renderDayTab("tuesday", "Tue")}
          {renderDayTab("wednesday", "Wed")}
          {renderDayTab("thursday", "Thu")}
          {renderDayTab("friday", "Fri")}
          {renderDayTab("saturday", "Sat")}
          {renderDayTab("sunday", "Sun")}
        </ScrollView>

        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>
              {activeDay.charAt(0).toUpperCase() + activeDay.slice(1)} Availability
            </Text>

            <TouchableOpacity
              className="flex-row items-center bg-[#ea580c] px-3 py-1.5 rounded-lg"
              onPress={() => setShowTimeSelector(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text className="text-white ml-1">Add Time</Text>
            </TouchableOpacity>
          </View>

          {availability[activeDay].length === 0 ? (
            <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              <Text className={`text-center ${isDark ? "text-white/70" : "text-black/70"}`}>
                No time slots added for this day
              </Text>
            </View>
          ) : (
            <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              {availability[activeDay].map((time, index) => (
                <View key={index} className="flex-row justify-between items-center mb-2 last:mb-0">
                  <View className="flex-row items-center">
                    <Clock size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                    <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>{formatTime(time)}</Text>
                  </View>

                  <TouchableOpacity className="p-2" onPress={() => removeTimeSlot(activeDay, time)}>
                    <Trash2 size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mb-6"
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-bold">Save Availability</Text>
          )}
        </TouchableOpacity>

        <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
            Tip: Patients will be able to book 30-minute sessions starting at the times you set. Make sure to leave
            enough buffer time between sessions.
          </Text>
        </View>
      </ScrollView>

      {showTimeSelector && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center">
          <View className={`w-[90%] rounded-xl p-4 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}>
            <Text className={`text-lg font-bold mb-4 text-center ${isDark ? "text-white" : "text-black"}`}>
              Select Time
            </Text>

            <ScrollView className="max-h-[300px] mb-4">
              <View className="flex-row flex-wrap justify-between">
                {generateTimeOptions().map((time, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`w-[30%] py-2 px-3 rounded-lg mb-2 items-center ${
                      selectedTime === time ? "bg-[#ea580c]" : isDark ? "bg-[#2C2C2C]" : "bg-[#F5F5F5]"
                    }`}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text className={`${selectedTime === time ? "text-white" : isDark ? "text-white" : "text-black"}`}>
                      {formatTime(time)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View className="flex-row justify-between">
              <TouchableOpacity
                className="flex-1 h-12 rounded-lg justify-center items-center border border-[#FF3B30] mr-2"
                onPress={() => setShowTimeSelector(false)}
              >
                <View className="flex-row items-center">
                  <X size={20} color="#FF3B30" />
                  <Text className="text-[#FF3B30] text-base font-bold ml-2">Cancel</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 h-12 rounded-lg justify-center items-center bg-[#ea580c] ml-2"
                onPress={addTimeSlot}
              >
                <View className="flex-row items-center">
                  <Check size={20} color="#FFFFFF" />
                  <Text className="text-white text-base font-bold ml-2">Add</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

