"use client"

import { createContext, useState, useContext, useEffect } from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSelector, useDispatch } from "react-redux"
import { setThemeMode } from "../redux/slices/themeSlice"

// Define theme colors
export const lightTheme = {
  background: "#FFFFFF",
  text: "#000000",
  primary: "#ea580c",
  secondary: "#E0E0E0",
  accent: "#FF3B30",
  card: "#F5F5F5",
  border: "#E0E0E0",
  notification: "#FF3B30",
  chatBubbleUser: "#ea580c",
  chatBubbleOther: "#F2F2F2",
  chatTextUser: "#FFFFFF",
  chatTextOther: "#000000",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  info: "#007AFF",
  muted: "#8E8E93",
  highlight: "#E9F5FF",
}

export const darkTheme = {
  background: "#121212",
  text: "#FFFFFF",
  primary: "#ea580c",
  secondary: "#2C2C2C",
  accent: "#FF453A",
  card: "#1E1E1E",
  border: "#2C2C2C",
  notification: "#FF453A",
  chatBubbleUser: "#0A84FF",
  chatBubbleOther: "#2C2C2C",
  chatTextUser: "#FFFFFF",
  chatTextOther: "#FFFFFF",
  success: "#30D158",
  warning: "#FF9F0A",
  error: "#FF453A",
  info: "#0A84FF",
  muted: "#8E8E93",
  highlight: "#1A3A5F",
}

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme()
  const themeMode = useSelector((state) => state.theme.mode)
  const dispatch = useDispatch()
  const [theme, setTheme] = useState(deviceTheme === "dark" ? darkTheme : lightTheme)
  const [isDark, setIsDark] = useState(deviceTheme === "dark")

  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem("themeMode")
        if (savedThemeMode) {
          dispatch(setThemeMode(savedThemeMode))
        }
      } catch (error) {
        console.log("Error loading theme preference:", error)
      }
    }

    loadThemePreference()
  }, [dispatch])

  // Update theme when theme mode changes
  useEffect(() => {
    if (themeMode === "light") {
      setTheme(lightTheme)
      setIsDark(false)
    } else if (themeMode === "dark") {
      setTheme(darkTheme)
      setIsDark(true)
    } else {
      // System default
      setTheme(deviceTheme === "dark" ? darkTheme : lightTheme)
      setIsDark(deviceTheme === "dark")
    }
  }, [themeMode, deviceTheme])

  const toggleTheme = (mode) => {
    dispatch(setThemeMode(mode))
  }

  return <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, isDark }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

