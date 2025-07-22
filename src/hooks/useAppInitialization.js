"use client"

import { useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { StreamVideoClient } from "@stream-io/video-react-native-sdk"

const STORAGE_KEYS = {
  USER_ID: "userId",
  USER_NAME: "userName",
  USER_ROLE: "userRole",
  USER_DATA: "userData",
  STREAM_TOKEN: "streamToken",
}

export const useAppInitialization = (apiKey, fetchStreamToken) => {
  const [isInitializing, setIsInitializing] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userState, setUserState] = useState({
    userId: "",
    userName: "",
    userRole: null,
    userData: null,
    streamToken: "",
    videoClient: null,
  })

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

  const initializeStreamClient = useCallback(
    async (user, token) => {
      try {
        const client = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user,
          token,
        })

        return client
      } catch (error) {
        console.error("Error initializing Stream client:", error)
        return null
      }
    },
    [apiKey],
  )

  const initialize = useCallback(async () => {
    try {
      const storedData = await getStoredUserData()

      if (!storedData?.userId) {
        setIsInitializing(false)
        return
      }

      // Set user data immediately
      setUserState((prev) => ({
        ...prev,
        userId: storedData.userId,
        userName: storedData.userName,
        userRole: storedData.userRole,
        userData: storedData.userData,
      }))

      setIsAuthenticated(true)
      setIsInitializing(false)

      // Initialize Stream in background
      let tokenToUse = storedData.streamToken

      if (!tokenToUse) {
        tokenToUse = await fetchStreamToken(storedData.userId)
        if (tokenToUse) {
          await AsyncStorage.setItem(STORAGE_KEYS.STREAM_TOKEN, tokenToUse)
        }
      }

      if (tokenToUse) {
        const user = {
          id: storedData.userId,
          name: storedData.userName || "User",
          image: storedData.userData?.profileImage,
          custom: {
            role: storedData.userRole,
            email: storedData.userData?.email,
          },
        }

        const client = await initializeStreamClient(user, tokenToUse)

        setUserState((prev) => ({
          ...prev,
          streamToken: tokenToUse,
          videoClient: client,
        }))
      }
    } catch (error) {
      console.error("Error during initialization:", error)
      setIsInitializing(false)
    }
  }, [getStoredUserData, fetchStreamToken, initializeStreamClient])

  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    isInitializing,
    isAuthenticated,
    userState,
    setUserState,
    setIsAuthenticated,
    STORAGE_KEYS,
  }
}
