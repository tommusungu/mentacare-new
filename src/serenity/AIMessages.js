import { View, Text, FlatList,TextInput,TouchableOpacity } from 'react-native'
import React from 'react'
import { Heart } from 'lucide-react-native'

const AIMessages = ({isDark,setActiveTab}) => {
  const color = "#10b981"

  return (
    <View className="flex-1 p-4">
      <Text className={`text-lg py-2 font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Recent Conversations</Text>

      <View className="">
      <View className="p-4 rounded-xl mb-6 border" style={{ backgroundColor: `${color}10`, borderColor: `${color}10` }}>
            <View className="flex-row items-center">
              <Heart size={24} color="#10b981" />
              <Text className="ml-2 font-medium text-base" style={{ color }}>
                Serenity AI
              </Text>
            </View>
            <Text className={`mt-2 ${isDark ? "text-white/80" : "text-black/80"}`} >
            The Serenity AI Feature is Coming Soon !

            </Text>
          </View>
      </View>

      {/* <View className={`p-4 rounded-lg mb-3 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
        <Text className={`font-medium ${isDark ? "text-white" : "text-black"}`}>Sleep Improvement</Text>
        <Text className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-black/70"}`} numberOfLines={1}>
          Tips for better sleep hygiene and relaxation...
        </Text>
        <Text className={`text-xs mt-2 ${isDark ? "text-white/50" : "text-black/50"}`}>3 days ago</Text>
      </View>

      <View className={`p-4 rounded-lg ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
        <Text className={`font-medium ${isDark ? "text-white" : "text-black"}`}>Stress Management</Text>
        <Text className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-black/70"}`} numberOfLines={1}>
          Strategies for managing work-related stress...
        </Text>
        <Text className={`text-xs mt-2 ${isDark ? "text-white/50" : "text-black/50"}`}>Last week</Text>
      </View> */}

      {/* <View className="flex-1 justify-center items-center mt-6">
        <TouchableOpacity className="bg-[#ea580c] py-2 px-4 rounded-lg" onPress={() => setActiveTab("AI")}>
          <Text className="text-white">Start New Conversation</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  )
}

export default AIMessages