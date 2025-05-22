"use client"

import { useRef, useState } from "react"
import { View, Text, Image, TouchableOpacity, FlatList, Dimensions } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { SafeAreaView } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")

const onboardingData = [
  {
    id: "1",
    title: "Welcome to Mentacare",
    description: "Your journey to better mental health starts here",
    image: "https://placeholder.svg?height=300&width=300",
  },
  {
    id: "2",
    title: "Connect with Professionals",
    description: "Find and connect with qualified mental health professionals",
    image: "https://placeholder.svg?height=300&width=300",
  },
  {
    id: "3",
    title: "Schedule Sessions",
    description: "Book appointments and attend video sessions from anywhere",
    image: "https://placeholder.svg?height=300&width=300",
  },
  {
    id: "4",
    title: "Track Your Progress",
    description: "Monitor your mental health journey and see improvements over time",
    image: "https://placeholder.svg?height=300&width=300",
  },
]

export default function OnboardingScreen({ navigation }) {
  const { isDark } = useTheme()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef(null)

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      })
    } else {
      navigation.navigate("Login")
    }
  }

  const handleSkip = () => {
    navigation.navigate("Login")
  }

  const renderItem = ({ item }) => (
    <View className="w-full items-center px-6">
      <Image source={{ uri: item.image }} className="w-[300px] h-[300px]" resizeMode="contain" />
      <Text className={`text-2xl font-bold mt-8 mb-4 text-center ${isDark ? "text-white" : "text-black"}`}>
        {item.title}
      </Text>
      <Text className={`text-base text-center ${isDark ? "text-white/80" : "text-black/80"}`}>{item.description}</Text>
    </View>
  )

  const renderDots = () => {
    return (
      <View className="flex-row justify-center mt-8">
        {onboardingData.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index === currentIndex ? "bg-[#ea580c] w-4" : isDark ? "bg-[#FFFFFF40]" : "bg-[#00000040]"
            }`}
          />
        ))}
      </View>
    )
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="flex-row justify-end p-4">
        <TouchableOpacity onPress={handleSkip}>
          <Text className="text-[#ea580c] text-base font-medium">Skip</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center">
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width)
            setCurrentIndex(index)
          }}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          style={{ width }}
        />

        {renderDots()}
      </View>

      <View className="p-6">
        <TouchableOpacity className="h-12 rounded-lg justify-center items-center bg-[#ea580c]" onPress={handleNext}>
          <Text className="text-white text-base font-bold">
            {currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

