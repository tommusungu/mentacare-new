"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation, useRoute } from "@react-navigation/native"
import { db } from "../../config/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useToast } from "react-native-toast-notifications"
import { Calendar, Star, MessageCircle, Video, Award, BookOpen, Briefcase } from "lucide-react-native"

export default function ProfessionalDetailsScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const toast = useToast()

  const { professionalId, professionalName } = route.params
  const [professional, setProfessional] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

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

        // Fetch reviews
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("professionalId", "==", professionalId),
          where("isPublished", "==", true),
        )

        const reviewsSnapshot = await getDocs(reviewsQuery)
        const reviewsData = []

        reviewsSnapshot.forEach((doc) => {
          reviewsData.push({ id: doc.id, ...doc.data() })
        })

        setReviews(reviewsData)
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
  }, [professionalId])

  const getAverageRating = () => {
    if (reviews.length === 0) return 0

    const sum = reviews.reduce((total, review) => total + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>
          Loading professional profile...
        </Text>
      </View>
    )
  }

  if (!professional) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <Text className={`text-lg ${isDark ? "text-white" : "text-black"}`}>Professional not found</Text>
        <TouchableOpacity className="mt-4 p-3 bg-[#ea580c] rounded-lg" onPress={() => navigation.goBack()}>
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-[#ea580c] justify-center items-center">
            <Text className="text-white text-3xl font-bold">
              {professional.name ? professional.name[0].toUpperCase() : "?"}
            </Text>
          </View>

          <Text className={`text-2xl font-bold mt-4 ${isDark ? "text-white" : "text-black"}`}>{professional.name}</Text>

          <Text className={`text-base ${isDark ? "text-white/70" : "text-black/70"}`}>
            {professional.title || "Therapist"}
          </Text>

          <View className="flex-row items-center mt-2">
            <Star size={16} color="#FFD700" fill="#FFD700" />
            <Text className={`ml-1 ${isDark ? "text-white" : "text-black"}`}>
              {getAverageRating()} ({reviews.length} reviews)
            </Text>
          </View>
        </View>

        <View className="flex-row justify-around mb-6">
          <TouchableOpacity
            className="items-center bg-[#ea580c] p-3 rounded-lg w-[100px]"
            onPress={() => navigation.navigate("BookAppointment", { professionalId })}
          >
            <Calendar size={24} color="#FFFFFF" />
            <Text className="text-white mt-2 font-medium">Book</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center bg-[#ea580c] p-3 rounded-lg w-[100px]"
            onPress={() => {
              navigation.navigate("Chat", {
                screen: "CreateChannel",
                params: {
                  userId: professionalId,
                  userName: professional.name,
                },
              })
            }}
          >
            <MessageCircle size={24} color="#FFFFFF" />
            <Text className="text-white mt-2 font-medium">Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center bg-[#ea580c] p-3 rounded-lg w-[100px]"
            onPress={() => {
              // Create a direct call
              navigation.navigate("VideoCall", {
                channelId: `direct-${Date.now()}`,
                callType: "video",
                participants: [professionalId],
              })
            }}
          >
            <Video size={24} color="#FFFFFF" />
            <Text className="text-white mt-2 font-medium">Call</Text>
          </TouchableOpacity>
        </View>

        {professional.bio && (
          <View className={`p-4 rounded-xl mb-6 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>About</Text>
            <Text className={`${isDark ? "text-white" : "text-black"}`}>{professional.bio}</Text>
          </View>
        )}

        <View className="mb-6">
          <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Specialties</Text>

          <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <View className="flex-row items-center mb-3">
              <Award size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>
                {professional.specialization || "General Mental Health"}
              </Text>
            </View>

            <View className="flex-row items-center mb-3">
              <Briefcase size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>
                {professional.experience || "5"} years of experience
              </Text>
            </View>

            {professional.certifications && professional.certifications.length > 0 && (
              <View className="flex-row items-center">
                <BookOpen size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>
                  {professional.certifications.length} certifications
                </Text>
              </View>
            )}
          </View>
        </View>

        {professional.education && professional.education.length > 0 && (
          <View className="mb-6">
            <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Education</Text>

            <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              {professional.education.map((edu, index) => (
                <View key={index} className={`${index > 0 ? "mt-3 pt-3 border-t border-gray-700" : ""}`}>
                  <Text className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{edu.degree}</Text>
                  <Text className={`${isDark ? "text-white/70" : "text-black/70"}`}>
                    {edu.institution}, {edu.year}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {professional.certifications && professional.certifications.length > 0 && (
          <View className="mb-6">
            <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Certifications</Text>

            <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              {professional.certifications.map((cert, index) => (
                <View key={index} className={`${index > 0 ? "mt-3 pt-3 border-t border-gray-700" : ""}`}>
                  <Text className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{cert.name}</Text>
                  <Text className={`${isDark ? "text-white/70" : "text-black/70"}`}>
                    {cert.issuer}, {cert.year}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>
              Reviews ({reviews.length})
            </Text>
            {reviews.length > 3 && (
              <TouchableOpacity>
                <Text className="text-[#ea580c]">See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {reviews.length === 0 ? (
            <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              <Text className={`text-center ${isDark ? "text-white/70" : "text-black/70"}`}>No reviews yet</Text>
            </View>
          ) : (
            reviews.slice(0, 3).map((review, index) => (
              <View key={review.id} className={`p-4 rounded-xl mb-3 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-[#ea580c]/50 justify-center items-center mr-2">
                      <Text className="text-white font-bold">
                        {review.patientName ? review.patientName[0].toUpperCase() : "U"}
                      </Text>
                    </View>
                    <Text className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                      {review.patientName || "Anonymous"}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Text className={`ml-1 ${isDark ? "text-white" : "text-black"}`}>{review.rating}</Text>
                  </View>
                </View>

                <Text className={`${isDark ? "text-white" : "text-black"}`}>{review.comment}</Text>

                <Text className={`text-xs mt-2 ${isDark ? "text-white/50" : "text-black/50"}`}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mb-6"
          onPress={() => navigation.navigate("BookAppointment", { professionalId })}
        >
          <Text className="text-white text-base font-bold">Book a Session</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

