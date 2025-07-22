"use client"
import "./global.css"

import { useEffect, useState, useCallback, useMemo } from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { NavigationContainer } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Provider } from "react-redux"
import { store } from "./src/redux/store"
import { ThemeProvider } from "./src/context/ThemeContext"
import { ChatProvider } from "./src/context/ChatContext"
import { NotificationProvider } from "./src/context/NotificationContext"
import AppNavigator from "./src/navigation/AppNavigator"
import AuthNavigator from "./src/navigation/AuthNavigator"
import { ToastProvider } from "react-native-toast-notifications"
import { initializeFirebase } from "./src/config/firebase"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import OfflineNotice from "./src/components/OfflineNotice"
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-native-sdk"
import useStreamToken from "./src/hooks/useStreamToken"
import { LogBox, StatusBar, View, Text } from "react-native"

// Initialize Firebase immediately (non-blocking)
initializeFirebase()
const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY

// Ignore specific warnings
LogBox.ignoreLogs(["Warning: ..."])

// Cache for AsyncStorage keys to avoid repeated string allocations
const STORAGE_KEYS = {
  USER_ID: "userId",
  USER_NAME: "userName",
  USER_ROLE: "userRole",
  USER_DATA: "userData",
  STREAM_TOKEN: "streamToken",
}

export default function App() {
  // Separate loading states for better UX
  const [isInitializing, setIsInitializing] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isStreamReady, setIsStreamReady] = useState(false)

  // User state
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState(null)
  const [userData, setUserData] = useState(null)
  const [streamToken, setStreamToken] = useState("")
  const [videoClient, setVideoClient] = useState(null)

  const { fetchStreamToken, loading: streamLoading, error: streamError } = useStreamToken()

  // Memoized stream user object to prevent unnecessary recreations
  const streamUser = useMemo(() => {
    if (!userId) return null

    return {
      id: userId,
      name: userName || userData?.name || userData?.displayName || "User",
      image: userData?.profileImage || userData?.avatar || userData?.photoURL,
      custom: {
        role: userRole,
        email: userData?.email,
      },
    }
  }, [userId, userName, userData, userRole])

  // Optimized function to get stored data in parallel
  const getStoredUserData = useCallback(async () => {
    try {
      const keys = Object.values(STORAGE_KEYS)
      const values = await AsyncStorage.multiGet(keys)

      const storedData = {}
      values.forEach(([key, value]) => {
        const storageKey = Object.keys(STORAGE_KEYS).find((k) => STORAGE_KEYS[k] === key)
        storedData[storageKey] = value
      })

      return {
        userId: storedData.USER_ID,
        userName: storedData.USER_NAME,
        userRole: storedData.USER_ROLE || "patient",
        userData: storedData.USER_DATA ? JSON.parse(storedData.USER_DATA) : null,
        streamToken: storedData.STREAM_TOKEN,
      }
    } catch (error) {
      console.error("Error getting stored data:", error)
      return null
    }
  }, [])

  // Optimized Stream Video client initialization
  const initializeStreamClient = useCallback(async (user, token) => {
    try {
      const client = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user,
        token,
      })

      setVideoClient(client)
      setIsStreamReady(true)
      return client
    } catch (error) {
      console.error("Error initializing Stream client:", error)
      return null
    }
  }, [])

  // Main bootstrap function with optimized loading
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Get stored data first (fast operation)
        const storedData = await getStoredUserData()

        if (!storedData?.userId) {
          setIsInitializing(false)
          return
        }

        // Set user data immediately for faster UI render
        setUserId(storedData.userId)
        setUserName(storedData.userName)
        setUserRole(storedData.userRole)
        setUserData(storedData.userData)
        setIsAuthenticated(true)
        setIsInitializing(false) // Allow UI to render while Stream initializes

        // Initialize Stream in background (non-blocking)
        let tokenToUse = storedData.streamToken

        if (!tokenToUse) {
          tokenToUse = await fetchStreamToken(storedData.userId)
          if (tokenToUse) {
            await AsyncStorage.setItem(STORAGE_KEYS.STREAM_TOKEN, tokenToUse)
          }
        }

        if (tokenToUse && storedData.userId) {
          setStreamToken(tokenToUse)

          const user = {
            id: storedData.userId,
            name: storedData.userName || "User",
            image: storedData.userData?.profileImage,
            custom: {
              role: storedData.userRole,
              email: storedData.userData?.email,
            },
          }

          // Initialize Stream client asynchronously
          await initializeStreamClient(user, tokenToUse)
        }
      } catch (error) {
        console.error("Error during bootstrap:", error)
        setIsInitializing(false)
      }
    }

    bootstrapAsync()
  }, [getStoredUserData, fetchStreamToken, initializeStreamClient])

  // Optimized login handler
  const handleLogin = useCallback(
    async (userId, userName, role, userData) => {
      try {
        // Store data in parallel
        const dataToStore = [
          [STORAGE_KEYS.USER_ID, userId],
          [STORAGE_KEYS.USER_NAME, userName],
          [STORAGE_KEYS.USER_ROLE, role],
          [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
        ]

        await AsyncStorage.multiSet(dataToStore)

        // Set state immediately for faster UI response
        setUserId(userId)
        setUserName(userName)
        setUserRole(role)
        setUserData(userData)
        setIsAuthenticated(true)

        // Initialize Stream in background
        const newStreamToken = await fetchStreamToken(userId)
        if (newStreamToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.STREAM_TOKEN, newStreamToken)
          setStreamToken(newStreamToken)

          const streamUser = {
            id: userId,
            name: userName || userData?.name || "User",
            image: userData?.profileImage || userData?.photoURL,
            custom: {
              role,
              email: userData?.email,
            },
          }

          await initializeStreamClient(streamUser, newStreamToken)
        }
      } catch (error) {
        console.error("Login error:", error)
      }
    },
    [fetchStreamToken, initializeStreamClient],
  )

  // Optimized logout handler
  const handleLogout = useCallback(async () => {
    try {
      // Disconnect Stream client first
      if (videoClient) {
        await videoClient.disconnectUser()
        setVideoClient(null)
      }

      // Clear storage in parallel
      const keysToRemove = Object.values(STORAGE_KEYS)
      await AsyncStorage.multiRemove(keysToRemove)

      // Reset state
      setIsAuthenticated(false)
      setIsStreamReady(false)
      setUserId("")
      setUserName("")
      setUserRole(null)
      setUserData(null)
      setStreamToken("")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }, [videoClient])

  // Show minimal loading screen during initialization
  if (isInitializing) {
    return (
      <View style={{ flex: 1, backgroundColor: "#121212", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#ea580c", fontSize: 18, fontWeight: "bold" }}>Loading...</Text>
      </View>
    )
  }

  // Show error state if Stream token fetch failed
  if (streamError) {
    console.error("Stream token error:", streamError)
  }

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ToastProvider>
              {isAuthenticated ? (
                // Render app immediately, Stream will connect in background
                <NavigationContainer>
                  <StatusBar style="auto" />
                  <OfflineNotice />

                  {videoClient && isStreamReady ? (
                    <StreamVideo client={videoClient}>
                      <ChatProvider>
                        <NotificationProvider>
                          <AppNavigator
                            userId={userId}
                            userName={userName}
                            userRole={userRole}
                            userData={userData}
                            onLogout={handleLogout}
                          />
                        </NotificationProvider>
                      </ChatProvider>
                    </StreamVideo>
                  ) : (
                    // Show app without Stream features while Stream initializes
                    <ChatProvider>
                      <NotificationProvider>
                        <AppNavigator
                          userId={userId}
                          userName={userName}
                          userRole={userRole}
                          userData={userData}
                          onLogout={handleLogout}
                        />
                      </NotificationProvider>
                    </ChatProvider>
                  )}
                </NavigationContainer>
              ) : (
                // Show auth navigator if not authenticated
                <NavigationContainer>
                  <StatusBar style="auto" />
                  <OfflineNotice />
                  <AuthNavigator onLogin={handleLogin} />
                </NavigationContainer>
              )}
            </ToastProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  )
}
