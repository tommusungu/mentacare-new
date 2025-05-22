"use client"
import { View, Text, StyleSheet } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { Button } from "react-native-elements"
import { Feather } from "@expo/vector-icons"

const OfflineScreen = ({ onRetry }) => {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.dark ? theme.colors.background : "#F2F2F7" }]}>
      <Feather name="wifi-off" size={80} color={theme.dark ? "#FF453A" : "#FF3B30"} />
      <Text style={[styles.title, { color: theme.dark ? theme.colors.text : "#000" }]}>You're offline</Text>
      <Text style={[styles.subtitle, { color: theme.dark ? theme.colors.text : "#666" }]}>
        Please check your internet connection and try again
      </Text>
      <Button
        title="Try Again"
        onPress={onRetry}
        buttonStyle={[styles.button, { backgroundColor: theme.dark ? "#FF453A" : "#FF3B30" }]}
        titleStyle={styles.buttonText}
        containerStyle={styles.buttonContainer}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    width: "80%",
  },
})

export default OfflineScreen
