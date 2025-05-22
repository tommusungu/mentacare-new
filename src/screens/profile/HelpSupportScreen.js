"use client"
import { View, Text, TouchableOpacity, ScrollView, Linking } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useToast } from "react-native-toast-notifications"
import {
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  FileText,
  ExternalLink,
  ChevronRight,
  Shield,
} from "lucide-react-native"

export default function HelpSupportScreen() {
  const { isDark } = useTheme()
  const toast = useToast()

  const handleContactSupport = (method) => {
    switch (method) {
      case "email":
        Linking.openURL("mailto:support@mentacare.co.ke")
        break
      case "chat":
        toast.show("Live chat support is not available at the meoment, try cmaking a call instead.", {
          type: "info",
          placement: "top",
          duration: 3000,
        })
        break
      case "phone":
        Linking.openURL("tel:+254797666832")
        break
      default:
        break
    }
  }

  const renderSupportOption = (icon, title, description, action) => (
    <TouchableOpacity
      className={`flex-row items-center p-4 mb-3 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
      onPress={action}
    >
      <View
        className={`w-12 h-12 rounded-full justify-center items-center mr-3 ${isDark ? "bg-[#2C2C2C]" : "bg-white"}`}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>{title}</Text>
        <Text className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>{description}</Text>
      </View>
      <ChevronRight size={20} color={isDark ? "#FFFFFF80" : "#00000080"} />
    </TouchableOpacity>
  )

  const renderFaqItem = (question, answer) => (
    <View className={`mb-4 p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
      <Text className={`text-base font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>{question}</Text>
      <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>{answer}</Text>
    </View>
  )

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Help & Support</Text>

        <View className="mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-black"}`}>Contact Support</Text>

          {renderSupportOption(
            <Mail size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Email Support",
            "Get help via email within 24 hours",
            () => handleContactSupport("email"),
          )}

          {renderSupportOption(
            <MessageCircle size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Live Chat",
            "Chat with our support team in real-time",
            () => handleContactSupport("chat"),
          )}

          {renderSupportOption(
            <Phone size={24} color={isDark ? "#FFFFFF" : "#000000"} />,
            "Phone Support",
            "Call our support line (Mon-Fri, 9am-5pm)",
            () => handleContactSupport("phone"),
          )}
        </View>

        <View className="mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-black"}`}>
            Frequently Asked Questions
          </Text>

          {renderFaqItem(
            "How do I book an appointment?",
            'To book an appointment, go to the Appointments tab and tap on "Book a Session". You can then select a professional, choose a date and time, and confirm your appointment.',
          )}

          {renderFaqItem(
            "How do I join a video session?",
            "When it's time for your session, you'll receive a notification. You can join by opening the appointment details and tapping on \"Join Video Session\".",
          )}

          {renderFaqItem(
            "How do I update my profile information?",
            'Go to the Profile tab and tap on "Edit Profile". You can update your personal information, preferences, and other details there.',
          )}

          {renderFaqItem(
            "Is my data secure?",
            "Yes, we take your privacy and security seriously. All data is encrypted and stored securely. You can review our privacy policy for more details.",
          )}

          <TouchableOpacity
            className={`flex-row items-center justify-center mt-2 p-3 rounded-lg ${isDark ? "bg-[#2C2C2C]" : "bg-[#E0E0E0]"}`}
            onPress={() => {
              // Navigate to full FAQ page or open web FAQ
              Linking.openURL("https://mentacare.co.ke/faqs")
            }}
          >
            <Text className={`mr-2 ${isDark ? "text-white" : "text-black"}`}>View All FAQs</Text>
            <ExternalLink size={16} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-black"}`}>Resources</Text>

          <TouchableOpacity
            className={`flex-row items-center p-4 mb-3 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
            onPress={() => Linking.openURL("https://mentacare.co.ke/terms-of-use-of-use")}
          >
            <FileText size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-3 flex-1 ${isDark ? "text-white" : "text-black"}`}>User Guide</Text>
            <ExternalLink size={16} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center p-4 mb-3 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
            onPress={() => Linking.openURL("https://mentacare.co.ke/privacy-policy")}
          >
            <Shield size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-3 flex-1 ${isDark ? "text-white" : "text-black"}`}>Privacy Policy</Text>
            <ExternalLink size={16} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
            onPress={() => Linking.openURL("https://mentacare.co.ke/terms-of-use")}
          >
            <FileText size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-3 flex-1 ${isDark ? "text-white" : "text-black"}`}>Terms of Service</Text>
            <ExternalLink size={16} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
        </View>

        <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
          <View className="flex-row items-center">
            <HelpCircle size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`ml-3 text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
              Need immediate help?
            </Text>
          </View>
          <Text className={`mt-2 text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
            If you're experiencing a mental health emergency, please call the National Mental Health Helpline at 988 or
            text HOME to 741741 to reach the Crisis Text Line.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

