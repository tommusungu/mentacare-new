import { View, TouchableOpacity, Text } from "react-native"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Phone,
  MessageCircle,
  Users,
  MoreHorizontal,
} from "lucide-react-native"

const CallControlButton = ({
  icon: Icon,
  label,
  isActive,
  onPress,
  variant = "default",
  size = "medium",
  disabled = false,
}) => {
  const getButtonStyle = () => {
    if (disabled) {
      return { backgroundColor: "#374151", opacity: 0.5 }
    }
    if (variant === "danger") {
      return { backgroundColor: "#EF4444" }
    }
    if (variant === "primary") {
      return { backgroundColor: "#ea580c" }
    }
    if (isActive) {
      return { backgroundColor: "#ea580c" }
    }
    return { backgroundColor: "#4B5563" }
  }

  const getButtonSize = () => {
    if (size === "large") {
      return "w-14 h-14"
    }
    if (size === "small") {
      return "w-12 h-12"
    }
    return "w-14 h-14"
  }

  const getIconSize = () => {
    if (size === "large") {
      return 20
    }
    if (size === "small") {
      return 20
    }
    return 20
  }

  return (
    <TouchableOpacity className="items-center mx-2" onPress={onPress} disabled={disabled}>
      <View className={`${getButtonSize()} rounded-full justify-center items-center`} style={getButtonStyle()}>
        <Icon size={getIconSize()} color="white" />
      </View>
      {label && <Text className="text-white text-xs mt-1">{label}</Text>}
    </TouchableOpacity>
  )
}

export const PrimaryCallControls = ({
  isMuted,
  isVideoOff,
  isSpeakerOn,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  onEndCall,
  hasPermissions = { camera: true, microphone: true },
}) => {
  return (
    <View className="flex-row justify-between px-4 items-center">
      <CallControlButton
        icon={isMuted ? MicOff : Mic}
        isActive={isMuted}
        onPress={onToggleMute}
        disabled={!hasPermissions.microphone}
      />
      <CallControlButton
        icon={isVideoOff ? VideoOff : Video}
        isActive={isVideoOff}
        onPress={onToggleVideo}
        disabled={!hasPermissions.camera}
      />
      <CallControlButton icon={isSpeakerOn ? Volume2 : VolumeX} isActive={isSpeakerOn} onPress={onToggleSpeaker} />
      <CallControlButton icon={Phone} variant="danger" size="large" onPress={onEndCall} />
    </View>
  )
}

export const SecondaryCallControls = ({ onOpenChat, onShowParticipants, onShowMore }) => {
  return (
    <View className="flex-row justify-center items-center mt-4">
      <CallControlButton icon={MessageCircle} size="small" onPress={onOpenChat} />
      <CallControlButton icon={Users} size="small" onPress={onShowParticipants} />
      <CallControlButton icon={MoreHorizontal} size="small" onPress={onShowMore} />
    </View>
  )
}

export default CallControlButton
