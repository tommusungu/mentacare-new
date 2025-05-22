"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, ActivityIndicator } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useSelector } from "react-redux"
import { useToast } from "react-native-toast-notifications"
import { Calendar, Clock, Users, Star, TrendingUp, CheckCircle, XCircle } from "lucide-react-native"

export default function ProfessionalStatsScreen() {
  const { isDark } = useTheme()
  const toast = useToast()

  const currentUser = useSelector((state) => state.user.currentUser)

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    upcomingSessions: 0,
    totalPatients: 0,
    averageRating: 0,
    totalHours: 0,
    monthlyStats: [],
    recentReviews: [],
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // In a real app, you would fetch this data from your backend
        // This is mock data for demonstration purposes

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setStats({
          totalSessions: 48,
          completedSessions: 42,
          cancelledSessions: 3,
          upcomingSessions: 3,
          totalPatients: 15,
          averageRating: 4.8,
          totalHours: 21,
          monthlyStats: [
            { month: "Jan", sessions: 8 },
            { month: "Feb", sessions: 10 },
            { month: "Mar", sessions: 7 },
            { month: "Apr", sessions: 12 },
            { month: "May", sessions: 11 },
          ],
          recentReviews: [
            {
              id: "1",
              patientName: "John D.",
              rating: 5,
              comment: "Very helpful session, I feel much better now.",
              date: "2023-05-10",
            },
            {
              id: "2",
              patientName: "Sarah M.",
              rating: 4,
              comment: "Great advice and techniques to manage anxiety.",
              date: "2023-05-05",
            },
            {
              id: "3",
              patientName: "Robert K.",
              rating: 5,
              comment: "Excellent therapist, very understanding and supportive.",
              date: "2023-04-28",
            },
          ],
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
        toast.show("Failed to load statistics", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [currentUser.uid])

  const renderStatsCard = (icon, title, value, color = "#ea580c") => (
    <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"} w-[48%] mb-4`}>
      <View
        className={`w-10 h-10 rounded-full justify-center items-center mb-2`}
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </View>
      <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>{title}</Text>
      <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>{value}</Text>
    </View>
  )

  const renderReviewItem = (review) => (
    <View key={review.id} className={`p-4 rounded-xl mb-3 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
      <View className="flex-row justify-between items-center mb-2">
        <Text className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{review.patientName}</Text>
        <View className="flex-row items-center">
          <Star size={14} color="#FFD700" fill="#FFD700" />
          <Text className={`ml-1 ${isDark ? "text-white" : "text-black"}`}>{review.rating}</Text>
        </View>
      </View>
      <Text className={`${isDark ? "text-white/80" : "text-black/80"} mb-1`}>{review.comment}</Text>
      <Text className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
        {new Date(review.date).toLocaleDateString()}
      </Text>
    </View>
  )

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>Loading statistics...</Text>
      </View>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>
          Professional Statistics
        </Text>

        <View className="mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-black"}`}>Overview</Text>

          <View className="flex-row flex-wrap justify-between">
            {renderStatsCard(<Calendar size={24} color="#ea580c" />, "Total Sessions", stats.totalSessions)}

            {renderStatsCard(<Users size={24} color="#34C759" />, "Total Patients", stats.totalPatients, "#34C759")}

            {renderStatsCard(
              <CheckCircle size={24} color="#34C759" />,
              "Completed",
              stats.completedSessions,
              "#34C759",
            )}

            {renderStatsCard(<XCircle size={24} color="#FF3B30" />, "Cancelled", stats.cancelledSessions, "#FF3B30")}

            {renderStatsCard(<Clock size={24} color="#007AFF" />, "Total Hours", stats.totalHours, "#007AFF")}

            {renderStatsCard(<Star size={24} color="#FFD700" />, "Avg. Rating", stats.averageRating, "#FFD700")}
          </View>
        </View>

        <View className="mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-black"}`}>Monthly Sessions</Text>

          <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <View className="h-[200px] flex-row items-end justify-between">
              {stats.monthlyStats.map((item, index) => (
                <View key={index} className="items-center">
                  <View
                    className="w-8 bg-[#ea580c] rounded-t-lg"
                    style={{ height: `${(item.sessions / 12) * 100}%` }}
                  />
                  <Text className={`text-xs mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>{item.month}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-700">
              <View>
                <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Total Sessions</Text>
                <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>
                  {stats.monthlyStats.reduce((sum, item) => sum + item.sessions, 0)}
                </Text>
              </View>

              <View>
                <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Monthly Average</Text>
                <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>
                  {(
                    stats.monthlyStats.reduce((sum, item) => sum + item.sessions, 0) / stats.monthlyStats.length
                  ).toFixed(1)}
                </Text>
              </View>

              <View>
                <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>Trend</Text>
                <View className="flex-row items-center">
                  <TrendingUp size={16} color="#34C759" />
                  <Text className={`ml-1 text-[#34C759] font-bold`}>+15%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-black"}`}>Recent Reviews</Text>

          {stats.recentReviews.length > 0 ? (
            stats.recentReviews.map((review) => renderReviewItem(review))
          ) : (
            <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              <Text className={`text-center ${isDark ? "text-white/70" : "text-black/70"}`}>No reviews yet</Text>
            </View>
          )}
        </View>

        <View className={`p-4 rounded-xl mb-6 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          <Text className={`text-base font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>
            Performance Insights
          </Text>
          <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
            Your session completion rate is 87.5%, which is above average. Your patient retention rate is excellent at
            93%. Consider adding more availability slots to accommodate more patients.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

