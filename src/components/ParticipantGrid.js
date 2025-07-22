import { View, Text, ScrollView } from "react-native"
import { ParticipantView } from "@stream-io/video-react-native-sdk"
import { MicOff, VideoOff, User } from "lucide-react-native"

const ParticipantCard = ({
  participant,
  isLocal = false,
  showVideoOffOverlay = false,
  hasPermissions = { camera: true, microphone: true },
}) => {
  const shouldShowVideoOff =
    participant.videoEnabled === false || showVideoOffOverlay || (isLocal && !hasPermissions.camera)

  return (
    <View
      className={`relative ${isLocal ? "border-2 rounded-xl overflow-hidden" : "rounded-xl overflow-hidden"}`}
      style={isLocal ? { borderColor: "#ea580c" } : {}}
    >
      {!shouldShowVideoOff ? (
        <ParticipantView participant={participant} style={{ aspectRatio: 1 / 2 }} />
      ) : (
        <View className="bg-gray-800 justify-center items-center" style={{ aspectRatio: 1 / 2 }}>
          <View className="w-16 h-16 bg-gray-700 rounded-full justify-center items-center mb-2">
            <User size={24} color="#9CA3AF" />
          </View>
          <Text className="text-white text-sm">{participant.name || "User"}</Text>
          {isLocal && !hasPermissions.camera && (
            <Text className="text-gray-400 text-xs mt-1">No camera permission</Text>
          )}
        </View>
      )}

      {/* Participant info overlay */}
      <View className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-sm font-medium">
            {participant.name || participant.userId} {isLocal && "(You)"}
          </Text>
          <View className="flex-row items-center">
            {(participant.audioEnabled === false || (isLocal && !hasPermissions.microphone)) && (
              <MicOff size={16} color="#EF4444" />
            )}
            {shouldShowVideoOff && <VideoOff size={16} color="#EF4444" style={{ marginLeft: 4 }} />}
          </View>
        </View>
      </View>
    </View>
  )
}

export const SingleParticipantView = ({
  participant,
  localParticipant,
  isVideoOff = false,
  hasPermissions = { camera: true, microphone: true },
}) => {
  return (
    <View className="flex-1 relative">
      {/* Main participant view */}
      <ParticipantCard participant={participant} hasPermissions={hasPermissions} />

      {/* Local participant picture-in-picture */}
      {localParticipant && (
        <View className="absolute top-4 right-4 w-32 h-40">
          <ParticipantCard
            participant={localParticipant}
            isLocal
            showVideoOffOverlay={isVideoOff}
            hasPermissions={hasPermissions}
          />
        </View>
      )}
    </View>
  )
}

export const MultiParticipantGrid = ({ participants, hasPermissions = { camera: true, microphone: true } }) => {
  const getGridClassName = (count) => {
    if (count <= 2) return "flex-row"
    if (count <= 4) return "flex-row flex-wrap"
    return "flex-row flex-wrap"
  }

  const getParticipantClassName = (count) => {
    if (count === 1) return "w-full"
    if (count === 2) return "w-1/2"
    if (count <= 4) return "w-1/2"
    return "w-1/3"
  }

  return (
    <ScrollView contentContainerStyle={{ flex: 1, padding: 8 }}>
      <View className={`${getGridClassName(participants.length)} flex-1`}>
        {participants.map((participant, index) => (
          <View key={participant.userId} className={`${getParticipantClassName(participants.length)} p-1`}>
            <ParticipantCard participant={participant} hasPermissions={hasPermissions} />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default ParticipantCard
