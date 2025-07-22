"use client"

import { useEffect, useState } from "react"
import { View, Text } from "react-native"
import { useStreamVideoClient } from "@stream-io/video-react-native-sdk"

export default function StreamConnectionStatus({ isDark = false }) {
  const client = useStreamVideoClient()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!client) return

    const checkConnection = () => {
      setIsConnected(client.isConnected)
    }

    // Check initial state
    checkConnection()

    // Listen for connection changes
    const unsubscribe = client.on("connection.changed", checkConnection)

    return () => {
      unsubscribe()
    }
  }, [client])

  if (!client) return null

  return (
    <View className={`px-2 py-1 rounded ${isConnected ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
      <Text className={`text-xs ${isConnected ? "text-green-500" : "text-yellow-500"}`}>
        {isConnected ? "Video Ready" : "Connecting..."}
      </Text>
    </View>
  )
}
