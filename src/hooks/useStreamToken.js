"use client"

import { useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const API_URL = 'https://task-fusion-server.onrender.com' // Change this to your backend IP

const useStreamToken = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStreamToken = async (userId) => {
    console.log("🔄 Starting fetchStreamToken for user:", userId)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/getToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }

      const data = await response.json()
      const streamToken = data.videoToken

      if (streamToken) {
        // console.log("✅ Stream token received:", streamToken)

         AsyncStorage.setItem("streamToken", streamToken)
        console.log("💾 Stream token saved in AsyncStorage")

        return streamToken
      } else {
        throw new Error("Stream token is missing in server response.")
      }
    } catch (err) {
      console.error("❌ Error fetching Stream token:", err.message)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
      console.log("🔚 Finished fetchStreamToken execution")
    }
  }

  const refreshStreamToken = async (userId) => {
    // Force refresh by removing cached token first
    await AsyncStorage.removeItem("streamToken")
    return await fetchStreamToken(userId)
  }

  const getCachedStreamToken = async () => {
    try {
      const cachedToken = await AsyncStorage.getItem("streamToken")
      return cachedToken
    } catch (error) {
      console.error("Error getting cached stream token:", error)
      return null
    }
  }

  return {
    fetchStreamToken,
    refreshStreamToken,
    getCachedStreamToken,
    loading,
    error,
  }
}

export default useStreamToken
