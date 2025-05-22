"use client"

import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image, ScrollView } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation } from "@react-navigation/native"
import { db } from "../../config/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useToast } from "react-native-toast-notifications"
import { Search, Star } from "lucide-react-native"

export default function ProfessionalsListScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const toast = useToast()

  const [professionals, setProfessionals] = useState([])
  const [filteredProfessionals, setFilteredProfessionals] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [specializations, setSpecializations] = useState([])
  const [selectedSpecialization, setSelectedSpecialization] = useState(null)

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const professionalsQuery = query(
          collection(db, "users"),
          where("role", "==", "professional"),
          where("isProfileComplete", "==", true),
        )

        const professionalsSnapshot = await getDocs(professionalsQuery)
        const professionalsData = []
        const specializationsSet = new Set()

        professionalsSnapshot.forEach((doc) => {
          const data = doc.data()
          professionalsData.push({ id: doc.id, ...data })

          if (data.specialization) {
            specializationsSet.add(data.specialization)
          }
        })

        setProfessionals(professionalsData)
        setFilteredProfessionals(professionalsData)
        setSpecializations(Array.from(specializationsSet))
      } catch (error) {
        console.error("Error fetching professionals:", error)
        toast.show("Failed to load professionals", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfessionals()
  }, [])

  useEffect(() => {
    filterProfessionals()
  }, [searchQuery, selectedSpecialization, professionals])

  const filterProfessionals = () => {
    let filtered = [...professionals]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (prof) =>
          prof.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prof.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prof.specialization?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by specialization
    if (selectedSpecialization) {
      filtered = filtered.filter((prof) => prof.specialization === selectedSpecialization)
    }

    setFilteredProfessionals(filtered)
  }

  const renderProfessionalItem = ({ item }) => (
    <TouchableOpacity
      className={`mb-4 p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
      onPress={() =>
        navigation.navigate("ProfessionalDetails", {
          professionalId: item.id,
          professionalName: item.name,
        })
      }
    >
      <View className="flex-row">
        <View className="w-16 h-16 rounded-full bg-[#ea580c] justify-center items-center mr-3">
          <Text className="text-white text-xl font-bold">{item.name ? item.name[0].toUpperCase() : "?"}</Text>
        </View>

        <View className="flex-1">
          <Text className={`text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>{item.name}</Text>

          <Text className={`text-sm mb-1 ${isDark ? "text-white/70" : "text-black/70"}`}>
            {item.title || "Therapist"}
          </Text>

          {item.specialization && (
            <View className="flex-row items-center">
              <View className="px-2 py-1 rounded-full bg-[#ea580c]/20 mr-2">
                <Text className="text-xs text-[#ea580c]">{item.specialization}</Text>
              </View>

              {item.experience && (
                <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>
                  {item.experience} years experience
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-700">
        <View className="flex-row items-center">
          <Star size={16} color="#FFD700" fill="#FFD700" />
          <Text className={`ml-1 ${isDark ? "text-white" : "text-black"}`}>
            {item.rating || "4.8"} ({item.reviewCount || "24"})
          </Text>
        </View>

        <TouchableOpacity
          className="bg-[#ea580c] py-2 px-4 rounded-lg"
          onPress={() => navigation.navigate("BookAppointment", { professionalId: item.id })}
        >
          <Text className="text-white font-medium">Book Session</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center py-10">
      <Image
        source={{ uri: "https://placeholder.svg?height=100&width=100" }}
        className="w-[100px] h-[100px]"
        resizeMode="contain"
      />
      <Text className={`text-lg mt-4 text-center ${isDark ? "text-white" : "text-black"}`}>No professionals found</Text>
      <Text className={`text-sm mt-2 text-center ${isDark ? "text-white/70" : "text-black/70"}`}>
        Try adjusting your search or filters
      </Text>
    </View>
  )

  return (
    <View className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-4">
        <View
          className={`flex-row items-center h-12 rounded-lg px-4 mb-4 ${
            isDark ? "bg-[#1E1E1E] border-[#2C2C2C]" : "bg-[#F5F5F5] border-[#E0E0E0]"
          } border`}
        >
          <Search size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          <TextInput
            className={`flex-1 ml-2 text-base ${isDark ? "text-white" : "text-black"}`}
            placeholder="Search professionals"
            placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        

        {specializations.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <TouchableOpacity
              className={`mr-2 px-4 py-2 rounded-full ${
                selectedSpecialization === null ? "bg-[#ea580c]" : isDark ? "bg-[#2C2C2C]" : "bg-[#E0E0E0]"
              }`}
              onPress={() => setSelectedSpecialization(null)}
            >
              <Text
                className={`${selectedSpecialization === null ? "text-white" : isDark ? "text-white" : "text-black"}`}
              >
                All
              </Text>
            </TouchableOpacity>

            {specializations.map((specialization, index) => (
              <TouchableOpacity
                key={index}
                className={`mr-2 px-4 py-2 rounded-full ${
                  selectedSpecialization === specialization ? "bg-[#ea580c]" : isDark ? "bg-[#2C2C2C]" : "bg-[#E0E0E0]"
                }`}
                onPress={() => setSelectedSpecialization(specialization)}
              >
                <Text
                  className={`${
                    selectedSpecialization === specialization ? "text-white" : isDark ? "text-white" : "text-black"
                  }`}
                >
                  {specialization}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : (
        <FlatList
          data={filteredProfessionals}
          renderItem={renderProfessionalItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={renderEmptyList}
        />
      )}
    </View>
  )
}

