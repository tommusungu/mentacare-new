import { View, Text } from "react-native"
import { Users } from "lucide-react-native"

const CallStatusBar = ({ participantName, callDuration, isConnected, participantCount = 0 }) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <View className="px-6 py-4 bg-gray-800">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white text-lg font-semibold" numberOfLines={1}>
            {participantName}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-sm">{formatDuration(callDuration)}</Text>
            {participantCount > 1 && (
              <>
                <Text className="text-gray-400 text-sm mx-2">•</Text>
                <Users size={14} color="#9CA3AF" />
                <Text className="text-gray-400 text-sm ml-1">{participantCount}</Text>
              </>
            )}
          </View>
        </View>
        <View className="flex-row items-center">
          <View className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          <Text className={`text-sm ${isConnected ? "text-green-500" : "text-red-500"}`}>
            {isConnected ? "Connected" : "Connecting..."}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default CallStatusBar
