import { View, Text } from "react-native"

export function Avatar({ initials, size = 40, color = "#005FFF", className = "" }) {
  return (
    <View
      className={`rounded-full justify-center items-center ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
    >
      <Text
        className="text-white font-bold"
        style={{
          fontSize: size * 0.4,
        }}
      >
        {initials}
      </Text>
    </View>
  )
}
