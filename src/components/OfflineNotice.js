"use client"
import { View, Text, StyleSheet, Dimensions } from "react-native"
import { useNetInfo } from "@react-native-community/netinfo"
import { useTheme } from "../context/ThemeContext"
import { WifiOff } from "lucide-react-native"

const { width } = Dimensions.get("window")

export default function OfflineNotice() {
  const netInfo = useNetInfo()
  const { isDark } = useTheme()

  // Don't render anything when we're online or when connectivity status is unknown
  if (netInfo.isConnected || netInfo.isConnected === null) {
    return null
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#FF3B30" : "#FF3B30" }]}>
      <WifiOff color="#FFFFFF" size={16} />
      <Text style={styles.text}>No Internet Connection</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    width: width,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  text: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
})
