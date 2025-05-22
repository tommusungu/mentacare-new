"use client"
import { View, Text, StyleSheet } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { format, isToday, isYesterday } from "date-fns"

const DateSeparator = ({ date }) => {
  const { theme } = useTheme()

  const formatDate = (date) => {
    if (!date) return ""

    const messageDate = new Date(date)

    if (isToday(messageDate)) {
      return "Today"
    } else if (isYesterday(messageDate)) {
      return "Yesterday"
    } else {
      return format(messageDate, "MMMM d, yyyy")
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: theme.dark ? "#444" : "#e0e0e0" }]} />
      <View style={[styles.dateContainer, { backgroundColor: theme.dark ? "#222" : "#f5f5f5" }]}>
        <Text style={[styles.dateText, { color: theme.dark ? "#aaa" : "#888" }]}>{formatDate(date)}</Text>
      </View>
      <View style={[styles.line, { backgroundColor: theme.dark ? "#444" : "#e0e0e0" }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dateContainer: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
  },
})

export default DateSeparator
