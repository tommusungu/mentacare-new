"use client"
import { View, Text, TouchableOpacity, ScrollView, Image, Linking } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { Heart, ExternalLink, Github, Twitter,X, Instagram, Mail, Globe } from "lucide-react-native"
import logoLight from '../../../assets/logos/logo-light.png' 
import logoDark from '../../../assets/logos/logo-dark.png'

export default function AboutScreen() {
  const { isDark } = useTheme()

  const appVersion = "1.0.0"
  const buildNumber = "100"

  const handleLinkPress = (url) => {
    Linking.openURL(url)
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <View className="items-center mb-6">
          <Image
            source={isDark ? logoDark : logoLight}
            className="w-auto h-[100px] rounded-xl mb-4"
            resizeMode="contain"
          />

          <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>Mentacare</Text>

          <Text className={`text-base mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>
            Version {appVersion} (Build {buildNumber})
          </Text>

          <View className="flex-row items-center mt-2">
            <Heart size={16} color="#FF3B30" fill="#FF3B30" />
            <Text className={`ml-1 text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
              Made with love for mental health
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-black"}`}>About the App</Text>

          <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>
              Mentacare is a platform designed to make mental health care more accessible. Our mission is to
              connect patients with qualified mental health professionals through secure video sessions, messaging, and
              resource sharing.

            </Text>

            <Text className={`text-base mt-3 ${isDark ? "text-white" : "text-black"}`}>
              We believe that everyone deserves access to quality mental health support, and we're committed to breaking
              down barriers to care.
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-black"}`}>Features</Text>

          <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <View className="mb-2">
              <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                • Secure Video Sessions
              </Text>
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                Connect with professionals through encrypted video calls
              </Text>
            </View>

            <View className="mb-2">
              <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>• Messaging</Text>
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                Communicate securely between sessions
              </Text>
            </View>

            <View className="mb-2">
              <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                • Appointment Management
              </Text>
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                Schedule, reschedule, and manage your sessions
              </Text>
            </View>

            <View>
              <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                • Progress Tracking
              </Text>
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                Monitor your mental health journey
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-black"}`}>Connect With Us</Text>

          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity
              className={`flex-row items-center p-3 mb-3 rounded-lg ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"} w-[48%]`}
              onPress={() => handleLinkPress("https://mentacare.co.ke")}
            >
              <Globe size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>Website</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center p-3 mb-3 rounded-lg ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"} w-[48%]`}
              onPress={() => handleLinkPress("mailto:info@mentacare.co.ke")}
            >
              <Mail size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center p-3 mb-3 rounded-lg ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"} w-[48%]`}
              onPress={() => handleLinkPress("https://twitter.com/mentacare")}
            >
              <Twitter size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center p-3 mb-3 rounded-lg ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"} w-[48%]`}
              onPress={() => handleLinkPress("https://instagram.com/mentacare")}
            >
              <Instagram size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>Instagram</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-black"}`}>Legal</Text>

          <TouchableOpacity
            className={`flex-row items-center p-4 mb-3 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
            onPress={() => handleLinkPress("https://mentacare.co.ke/privacy-policy")}
          >
            <Text className={`flex-1 ${isDark ? "text-white" : "text-black"}`}>Privacy Policy</Text>
            <ExternalLink size={16} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center p-4 mb-3 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
            onPress={() => handleLinkPress("https://mentacare.co.ke/terms-of-use")}
          >
            <Text className={`flex-1 ${isDark ? "text-white" : "text-black"}`}>Terms of Service</Text>
            <ExternalLink size={16} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
            onPress={() => handleLinkPress("https://mentacare.co.ke/licenses")}
          >
            <Text className={`flex-1 ${isDark ? "text-white" : "text-black"}`}>Open Source Licenses</Text>
            <ExternalLink size={16} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
        </View>

        <Text className={`text-center text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
          © {new Date().getFullYear()} Mentacare. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  )
}

