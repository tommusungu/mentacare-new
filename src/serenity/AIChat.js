import { View, Text, FlatList,TextInput,TouchableOpacity } from 'react-native'
import React from 'react'
import {Heart, Send} from 'lucide-react-native'

const AIChat = ({inputText,setInputText,handleSendMessage,messages,isDark,flatListRef}) => {
  const color = "#10b981"
  return (
    <View className="flex-1">
      <View className="p-4  bg-[#ea580c]/10 mb-4">
        <Text className={`text-lg py-2 font-bold ${isDark ? "text-white" : "text-black"}`}>Welcome to Serenity AI</Text>
        <Text className={`mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>
          Your personal mental wellness assistant. How can I help you today?
        </Text>
      </View>

      <View className="p-4">
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

      {/* <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        className="flex-1 mb-2"
        renderItem={({ item }) => (
          <View
            className={`mb-2 max-w-[80%] p-3 rounded-xl ${
              item.sender === "user"
                ? `self-end ${isDark ? "bg-[#ea580c]" : "bg-[#ea580c]"}`
                : `self-start ${isDark ? "bg-[#2C2C2C]" : "bg-[#F5F5F5]"}`
            }`}
            style={{ alignSelf: item.sender === "user" ? "flex-end" : "flex-start" }}
          >
            <Text className={item.sender === "user" ? "text-white" : isDark ? "text-white" : "text-black"}>
              {item.text}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      /> */}

      {/* <View className="flex-row items-center p-2 border-t border-gray-200 dark:border-gray-800">
        <TextInput
          className={`flex-1 h-14 p-2 px-4 rounded-xl mr-2 ${isDark ? "bg-[#2C2C2C] text-white" : "bg-[#F5F5F5] text-black"}`}
          placeholder="Type your message..."
          placeholderTextColor={isDark ? "#AAAAAA" : "#777777"}
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity
          className="bg-[#ea580c] p-2 h-14 w-14 rounded-full justify-center items-center"
          onPress={handleSendMessage}
        >
          <Send size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View> */}
    </View>
  )
}

export default AIChat