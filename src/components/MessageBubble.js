"use client"
import { View, Text, StyleSheet } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { format } from "date-fns"
import { Check, CheckCheck } from "lucide-react-native"

const MessageBubble = ({
  message,
  isMyMessage,
  showAvatar,
  showName,
  showTime,
  previousMessageSameSender,
  nextMessageSameSender,
}) => {
  const { theme } = useTheme()

  const formatTime = (timestamp) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    return format(date, "h:mm a")
  }

  // Determine if message is read
  const isRead = message.read_by && message.read_by.length > 0

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Determine bubble style based on position in message group
  const getBubbleStyle = () => {
    const baseStyle = isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
    const colorStyle = {
      backgroundColor: isMyMessage ? (theme.dark ? "#0A84FF" : "#DCF8C6") : theme.dark ? "#333333" : "#ECECEC",
    }

    let borderRadiusStyle = {}

    if (previousMessageSameSender && nextMessageSameSender) {
      // Middle message in a group
      borderRadiusStyle = isMyMessage
        ? { borderTopRightRadius: 5, borderBottomRightRadius: 5 }
        : { borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }
    } else if (previousMessageSameSender) {
      // Last message in a group
      borderRadiusStyle = isMyMessage ? { borderTopRightRadius: 5 } : { borderTopLeftRadius: 5 }
    } else if (nextMessageSameSender) {
      // First message in a group
      borderRadiusStyle = isMyMessage ? { borderBottomRightRadius: 5 } : { borderBottomLeftRadius: 5 }
    }

    return [baseStyle, colorStyle, borderRadiusStyle]
  }

  return (
    <View
      style={[
        styles.container,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        !nextMessageSameSender && { marginBottom: 8 },
      ]}
    >
      {showAvatar && !isMyMessage && (
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.dark ? "#666" : "#ccc" }]}>
            <Text style={styles.avatarText}>{getInitials(message.user?.name || "User")}</Text>
          </View>
        </View>
      )}

      {!showAvatar && !isMyMessage && <View style={styles.avatarPlaceholder} />}

      <View style={styles.bubbleContainer}>
        {showName && !isMyMessage && (
          <Text style={[styles.senderName, { color: theme.dark ? "#999" : "#666" }]}>
            {message.user?.name || "User"}
          </Text>
        )}

        <View style={getBubbleStyle()}>
          <Text
            style={[
              styles.messageText,
              { color: isMyMessage ? (theme.dark ? "#fff" : "#000") : theme.dark ? "#fff" : "#000" },
            ]}
          >
            {message.text}
          </Text>
        </View>

        {showTime && (
          <View style={[styles.timeContainer, isMyMessage ? styles.myTimeContainer : styles.theirTimeContainer]}>
            <Text style={[styles.timeText, { color: theme.dark ? "#999" : "#8c8c8c" }]}>
              {formatTime(message.created_at)}
            </Text>

            {isMyMessage && (
              <>
              {isRead ? (
  <CheckCheck
    size={14}
    color="#34B7F1"
    style={styles.readIcon}
  />
) : (
  <Check
    size={14}
    color={theme.dark ? "#999" : "#8c8c8c"}
    style={styles.readIcon}
  />
)}
              </>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 1,
    paddingHorizontal: 10,
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  avatarPlaceholder: {
    width: 34,
    marginRight: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  bubbleContainer: {
    maxWidth: "75%",
  },
  myMessageBubble: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 40,
  },
  theirMessageBubble: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  messageText: {
    fontSize: 16,
  },
  senderName: {
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  myTimeContainer: {
    justifyContent: "flex-end",
  },
  theirTimeContainer: {
    justifyContent: "flex-start",
  },
  timeText: {
    fontSize: 11,
    marginHorizontal: 4,
  },
  readIcon: {
    marginLeft: 2,
  },
})

export default MessageBubble
