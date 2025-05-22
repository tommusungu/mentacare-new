"use client"
import "./global.css"

import { useEffect, useState } from "react"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { NavigationContainer } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Provider } from "react-redux"
import { store } from "./src/redux/store"
import { ThemeProvider } from "./src/context/ThemeContext"
import { ChatProvider } from "./src/context/ChatContext"
import { CallProvider } from "./src/context/CallContext"
import { NotificationProvider } from "./src/context/NotificationContext"
import AppNavigator from "./src/navigation/AppNavigator"
import AuthNavigator from "./src/navigation/AuthNavigator"
import LoadingScreen from "./src/screens/LoadingScreen"
import { ToastProvider } from "react-native-toast-notifications"
import { initializeFirebase } from "./src/config/firebase"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import IncomingCallModal from "./src/components/IncomingCallModal"
import "react-native-get-random-values"
import { getChatClientInstance } from "./src/context/ChatContext"
import { getVideoClientInstance } from "./src/context/CallContext"
import OfflineNotice from "./src/components/OfflineNotice"

// Initialize Firebase
initializeFirebase()

export default function App() {
  const [isReady, setIsReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState("")
  const [userToken, setUserToken] = useState("")
  const [userRole, setUserRole] = useState(null) // 'professional' or 'patient'
  const [userData, setUserData] = useState(null)
  const [chatContextRef, setChatContextRef] = useState(null)
  const [callContextRef, setCallContextRef] = useState(null)

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Check if user is already logged in
        const token = await AsyncStorage.getItem("userToken")
        const id = await AsyncStorage.getItem("userId")
        const name = await AsyncStorage.getItem("userName")
        const role = await AsyncStorage.getItem("userRole")
        const userDataStr = await AsyncStorage.getItem("userData")

        if (token && id) {
          setUserId(id)
          setUserToken(token)
          setUserRole(role || "patient")
          setUserData(userDataStr ? JSON.parse(userDataStr) : null)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.log("Error during bootstrap:", error)
      } finally {
        setIsReady(true)
      }
    }

    bootstrapAsync()
  }, [])

  const handleLogin = async (userId, userName, token, role, userData) => {
    try {
      // Save credentials
      await AsyncStorage.setItem("userToken", token)
      await AsyncStorage.setItem("userId", userId)
      await AsyncStorage.setItem("userName", userName)
      await AsyncStorage.setItem("userRole", role)
      await AsyncStorage.setItem("userData", JSON.stringify(userData))

      setUserId(userId)
      setUserToken(token)
      setUserRole(role)
      setUserData(userData)
      setIsAuthenticated(true)
    } catch (error) {
      console.log("Login error:", error)
    }
  }

  const handleLogout = async () => {
    try {
      // Disconnect clients before logout
      // const chatClient = getChatClientInstance()
      // if (chatClient) {
      //   try {
      //     await chatClient.disconnectUser()
      //     console.log("Chat client disconnected successfully")
      //   } catch (error) {
      //     console.error("Error disconnecting chat client:", error)
      //   }
      // }

      // const videoClient = getVideoClientInstance()
      // if (videoClient) {
      //   try {
      //     await videoClient.disconnectUser()
      //     console.log("Video client disconnected successfully")
      //   } catch (error) {
      //     console.error("Error disconnecting video client:", error)
      //   }
      // }

      // Clear storage
      await AsyncStorage.removeItem("userToken")
      await AsyncStorage.removeItem("userId")
      await AsyncStorage.removeItem("userName")
      await AsyncStorage.removeItem("userRole")
      await AsyncStorage.removeItem("userData")

      setIsAuthenticated(false)
      setUserId("")
      setUserToken("")
      setUserRole(null)
      setUserData(null)
    } catch (error) {
      console.log("Logout error:", error)
    }
  }

  if (!isReady) {
    return <LoadingScreen />
  }

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ToastProvider>
              <StatusBar style="auto" />
              <OfflineNotice />
              {isAuthenticated ? (
                <NavigationContainer>
                  <ChatProvider>
                    <CallProvider>
                      <NotificationProvider>
                        <AppNavigator userId={userId} userRole={userRole} userData={userData} onLogout={handleLogout} />
                        <IncomingCallModal />
                      </NotificationProvider>
                    </CallProvider>
                  </ChatProvider>
                </NavigationContainer>
              ) : (
                <NavigationContainer>
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
