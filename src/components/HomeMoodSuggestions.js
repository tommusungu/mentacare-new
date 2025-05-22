import { View, Text } from 'react-native'
import React from 'react'
import { Sun, Brain, Moon, Heart } from 'lucide-react-native'

const renderMoodSuggestion = ({isDark}) => {
  const hour = new Date().getHours()

  let icon, suggestions, color

  if (hour >= 5 && hour < 8) {
    icon = <Sun size={24} color="#f59e0b" />
    suggestions = [
      "Early riser! Try a short walk or some morning journaling 🌅",
      "Greet the sunrise with gratitude — jot down 3 things you’re thankful for ☀️",
      "Stretch it out and breathe deeply — it’s a new day! 🌻"
    ]
    color = "#f59e0b"
  } else if (hour >= 8 && hour < 12) {
    icon = <Brain size={24} color="#3b82f6" />
    suggestions = [
      "You're in the zone! Perfect time to tackle meaningful tasks 🧠",
      "Channel your focus into a small goal — you'll feel accomplished 💪",
      "Take on something you've been putting off — you’ve got this 💼"
    ]
    color = "#3b82f6"
  } else if (hour >= 12 && hour < 14) {
    icon = <Heart size={24} color="#10b981" />
    suggestions = [
      "Midday pause: enjoy your lunch mindfully and take a deep breath 🍽️",
      "Go tech-free for 10 minutes and reconnect with yourself 🌿",
      "Smile — you're halfway through the day. A positive reset helps 💚"
    ]
    color = "#10b981"
  } else if (hour >= 14 && hour < 17) {
    icon = <Sun size={24} color="#8b5cf6" />
    suggestions = [
      "Feeling sluggish? Try light stretching or a creativity boost ✍️",
      "Power dip? A quick breathing exercise can re-energize you 💨",
      "Work on a fun, low-pressure task — keep the energy gentle 💜"
    ]
    color = "#8b5cf6"
  } else if (hour >= 17 && hour < 20) {
    icon = <Sun size={24} color="#f97316" />
    suggestions = [
      "Golden hour! Reflect on the day or connect with a loved one 🌇",
      "Step outside and soak in the colors of the sky 🌆",
      "Unplug for a bit — do something that feeds your soul ✨"
    ]
    color = "#f97316"
  } else if (hour >= 20 && hour < 23) {
    icon = <Moon size={24} color="#6366f1" />
    suggestions = [
      "Evening calm: journal, read, or listen to soothing music 🎵",
      "Wind down with some gentle stretching or a warm drink ☕",
      "Reflect on one good thing from today and smile 💤"
    ]
    color = "#6366f1"
  } else {
    icon = <Moon size={24} color="#334155" />
    suggestions = [
      "Late night? Time to unwind and rest your mind 😴",
      "Quiet your thoughts with deep breaths — you're safe and loved 🌌",
      "Let go of today’s weight. Tomorrow is a fresh start 🕯️"
    ]
    color = "#334155"
  }

  // Randomly select one suggestion
  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]

  return (
    <View className="p-4 rounded-xl mb-6 border" style={{ backgroundColor: `${color}10`, borderColor: `${color}10` }}>
      <View className="flex-row items-center">
        {icon}
        <Text className="ml-2 font-medium text-base" style={{ color }}>
          Today's Mood Suggestion
        </Text>
      </View>
      <Text className={`mt-2 ${isDark ? "text-white/80" : "text-black/80"}`} >
        {randomSuggestion}
      </Text>
    </View>
  )
}

const HomeMoodSuggestions = ({isDark}) => {
  return (
    <View className="">
      {renderMoodSuggestion({isDark})}
    </View>
  )
}

export default HomeMoodSuggestions
