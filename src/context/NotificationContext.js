"use client"

import { createContext, useState, useContext, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchUserNotifications } from "../redux/slices/notificationSlice"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useToast } from "react-native-toast-notifications"
import * as Haptics from "expo-haptics"

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const [hasUnread, setHasUnread] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const dispatch = useDispatch()
  const toast = useToast()
  const intervalRef = useRef(null)

  const notifications = useSelector((state) => state.notifications.notifications)

  // Check for unread notifications
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const unreadExists = notifications.some((notification) => !notification.read)
      setHasUnread(unreadExists)
    } else {
      setHasUnread(false)
    }
  }, [notifications])

  // Initial fetch of notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!isActive) return // Don't fetch if context is inactive
        
        const userId = await AsyncStorage.getItem("userId")
        if (userId) {
          setIsRefreshing(true)
          await dispatch(fetchUserNotifications(userId))
          setIsRefreshing(false)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
        setIsRefreshing(false)
      }
    }

    fetchNotifications()

    // Set up polling for new notifications (every 30 seconds)
    intervalRef.current = setInterval(fetchNotifications, 30000)

    // Add to global intervals for cleanup
    if (!global.activeIntervals) {
      global.activeIntervals = []
    }
    global.activeIntervals.push(intervalRef.current)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        // Remove from global intervals
        if (global.activeIntervals) {
          global.activeIntervals = global.activeIntervals.filter(id => id !== intervalRef.current)
        }
      }
      setIsActive(false) // Mark context as inactive on cleanup
    }
  }, [dispatch, isActive])

  // Show toast for new notifications
  useEffect(() => {
    if (!isActive) return // Don't show notifications if context is inactive
    
    if (notifications && notifications.length > 0) {
      const latestNotification = notifications[0]

      // Check if this is a new notification (within last minute)
      const isRecent = new Date() - new Date(latestNotification.createdAt) < 60000

      if (isRecent && !latestNotification.read) {
        // Vibrate device
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

        // Show notification
        toast.show(latestNotification.body, {
          type: "info",
          placement: "top",
          duration: 5000,
          title: latestNotification.title,
        })
      }
    }
  }, [notifications, toast, isActive])

  const refreshNotifications = async () => {
    if (!isActive) return // Don't refresh if context is inactive
    
    try {
      const userId = await AsyncStorage.getItem("userId")
      if (userId) {
        setIsRefreshing(true)
        await dispatch(fetchUserNotifications(userId))
        setIsRefreshing(false)
      }
    } catch (error) {
      console.error("Error refreshing notifications:", error)
      setIsRefreshing(false)
    }
  }

  const cleanup = () => {
    setIsActive(false)
    setHasUnread(false)
    setIsRefreshing(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      // Remove from global intervals
      if (global.activeIntervals) {
        global.activeIntervals = global.activeIntervals.filter(id => id !== intervalRef.current)
      }
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        hasUnread,
        isRefreshing,
        refreshNotifications,
        cleanup,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)

