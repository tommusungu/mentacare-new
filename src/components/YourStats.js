import React, { useState, useMemo, useEffect } from 'react'
import { View, Text } from 'react-native'
import { useSelector } from 'react-redux'

const YourStats = ({ 
  isDark = false, 
  showTitle = true, 
  titleText = "Your Stats",
  containerStyle = {},
  statItemStyle = {}
}) => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    unreadMessages: 0,
  })

  // Get data from Redux store
  const appointments = useSelector((state) => state.appointments.appointments)
  const notifications = useSelector((state) => state.notifications.notifications)
  const unreadNotifications = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  // Memoized stats calculation
  const memoizedStats = useMemo(() => {
    const now = new Date()
    const upcomingAppointmentsCount = appointments.filter(
      (app) => new Date(app.scheduledFor) > now && app.status !== "cancelled",
    ).length

    return {
      totalSessions: appointments.filter((app) => app.status === "completed").length,
      upcomingSessions: upcomingAppointmentsCount,
      unreadMessages: unreadNotifications,
    }
  }, [appointments, unreadNotifications])

  // Update stats when memoized stats change
  useEffect(() => {
    setStats(memoizedStats)
  }, [memoizedStats])

  return (
    <>
      {showTitle && (
        <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
          {titleText}
        </Text>
      )}

      <View className="flex-row justify-between" style={containerStyle}>
        <View
          className={`p-4 rounded-xl flex-1 mr-2 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
          style={[{ elevation: 2 }, statItemStyle]}
        >
          <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>
            Total Sessions
          </Text>
          <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
            {stats.totalSessions}
          </Text>
        </View>

        <View
          className={`p-4 rounded-xl flex-1 mx-2 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
          style={[{ elevation: 2 }, statItemStyle]}
        >
          <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>
            Upcoming
          </Text>
          <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
            {stats.upcomingSessions}
          </Text>
        </View>

        <View
          className={`p-4 rounded-xl flex-1 ml-2 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
          style={[{ elevation: 2 }, statItemStyle]}
        >
          <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>
            Unread
          </Text>
          <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
            {stats.unreadMessages}
          </Text>
        </View>
      </View>
    </>
  )
}

export default YourStats