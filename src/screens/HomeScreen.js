"use client"

import { useEffect, useState, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useTheme } from "../context/ThemeContext"
import { useNavigation } from "@react-navigation/native"
import { useDispatch, useSelector } from "react-redux"
import { fetchUserAppointments } from "../redux/slices/appointmentSlice"
import { fetchUserNotifications } from "../redux/slices/notificationSlice"
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  Bell,
  Plus,
  Send,
  X,
  Heart,
  Sparkles,
  Brain,
  Moon,
  Sun,
} from "lucide-react-native"
import { db } from "../config/firebase"
import { collection, query, where, limit, getDocs } from "firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import HomeTopBar from "../components/HomeTopBar"
import { StatusBar } from "react-native"
import HomeArticlesTwo from "../components/HomeArticlesTwo"
import HomeMoodSuggestions from "../components/HomeMoodSuggestions"
import SerenityAIModal from "../serenity/SerenityAIModal"
import AIChat from "../serenity/AIChat"
import AIMessages from "../serenity/AIMessages"

// Sample AI chat messages
const INITIAL_MESSAGES = [
  {
    id: 1,
    text: "Hello! I'm Serenity AI, your mental wellness assistant. How can I help you today?",
    sender: "ai",
    timestamp: new Date(),
  },
]

export default function HomeScreen({ userRole, userData }) {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const windowHeight = Dimensions.get("window").height
  const modalHeight = windowHeight * 0.8

  const [loading, setLoading] = useState(true)
  const [upcomingAppointment, setUpcomingAppointment] = useState(null)
  const [professionals, setProfessionals] = useState([])
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    unreadMessages: 0,
  })
  const [userId, setUserId] = useState(null)
  const [aiModalVisible, setAiModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("AI")
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [inputText, setInputText] = useState("")
  const [dailyTip, setDailyTip] = useState("")
  const [weatherMood, setWeatherMood] = useState("sunny")
  const modalAnimation = useRef(new Animated.Value(0)).current
  const flatListRef = useRef(null)

  const appointments = useSelector((state) => state.appointments.appointments)
  const notifications = useSelector((state) => state.notifications.notifications)
  const unreadNotifications = notifications.filter((n) => !n.read).length

  // Daily wellness tips
  const WELLNESS_TIPS = [
    "Take a 5-minute break to practice deep breathing.",
    "Drink a glass of water to stay hydrated.",
    "Stretch your body to release tension.",
    "Write down three things you're grateful for today.",
    "Take a short walk outside to refresh your mind.",
    "Reach out to a friend or family member you care about.",
    "Practice mindfulness by focusing on your present moment.",
    "Listen to a song that boosts your mood.",
    "Try a quick meditation session to center yourself.",
    "Set a small, achievable goal for today.",
  ]

  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem("userId")
      setUserId(id)
    }
    getUserId()

    // Set random daily tip
    const randomTip = WELLNESS_TIPS[Math.floor(Math.random() * WELLNESS_TIPS.length)]
    setDailyTip(randomTip)

    // Simulate weather-based mood suggestion
    const moods = ["sunny", "cloudy", "rainy"]
    setWeatherMood(moods[Math.floor(Math.random() * moods.length)])
  }, [])

  useEffect(() => {
    if (!userId && userData?.uid) {
      setUserId(userData.uid)
    }

    if (!userId) return

    const loadData = async () => {
      setLoading(true)
      try {
        // Log the userId and userRole for debugging
        console.log(`Loading appointments for user: ${userId}, role: ${userRole}`)
        
        // Fetch appointments
        await dispatch(
          fetchUserAppointments({
            userId: userId,
            role: userRole,
          }),
        )

        // Fetch notifications
        await dispatch(fetchUserNotifications(userId))

        // Fetch professionals if user is a patient
        if (userRole === "professional") {
          const professionalsQuery = query(collection(db, "users"), where("role", "==", "professional"), limit(5))

          const professionalsSnapshot = await getDocs(professionalsQuery)
          const professionalsData = []

          professionalsSnapshot.forEach((doc) => {
            professionalsData.push({ id: doc.id, ...doc.data() })
          })

          setProfessionals(professionalsData)
        }

        // Calculate stats
        const now = new Date()
        const upcomingAppointmentsCount = appointments.filter(
          (app) => new Date(app.scheduledFor) > now && app.status !== "cancelled",
        ).length

        setStats({
          totalSessions: appointments.filter((app) => app.status === "completed").length,
          upcomingSessions: upcomingAppointmentsCount,
          unreadMessages: 0, // This would come from chat API
        })
      } catch (error) {
        console.error("Error loading home data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dispatch, userId, userRole, userData])

  useEffect(() => {
    // Find the next upcoming appointment
    const now = new Date()
    const upcoming = appointments
      .filter((app) => new Date(app.scheduledFor) > now && app.status !== "cancelled")
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))[0]

    setUpcomingAppointment(upcoming)
  }, [appointments])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const openSerenityAI = () => {
    setAiModalVisible(true)
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const closeSerenityAI = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setAiModalVisible(false)
    })
  }

  const handleSendMessage = () => {
    if (inputText.trim() === "") return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInputText("")

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponses = [
        "I understand how you're feeling. Would you like to talk more about that?",
        "That's interesting. Can you tell me more about your experience?",
        "I'm here to support you. Have you tried any coping strategies for this?",
        "Thank you for sharing. How long have you been feeling this way?",
        "I appreciate your openness. Let's explore some ways to help you with this.",
      ]

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]

      const aiMessage = {
        id: messages.length + 2,
        text: randomResponse,
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      // Scroll to bottom of chat
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true })
      }
    }, 1000)
  }

  

  const renderPatientHome = () => (
    <>
      <View className="mb-6">
        <HomeTopBar userData={userData} isDark={isDark} />

        <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`} style={{ elevation: 2 }}>
          <View>
            <Text className={`text-base mb-4 ${isDark ? "text-white/70" : "text-black/70"}`}>
              How are you feeling today?
            </Text>
          </View>
          <View className="flex-row justify-between mb-4">
            {["😊", "😐", "😔", "😡", "😰"].map((emoji, index) => (
              <TouchableOpacity
                key={index}
                className={`w-14 h-14 rounded-full justify-center items-center ${
                  isDark ? "bg-[#2C2C2C]" : "bg-[#F5F5F5]"
                }`}
                style={{ elevation: 1 }}
              >
                <Text className="text-2xl">{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-[#ea580c]/10 p-3 rounded-lg border border-[#ea580c]/20">
            <View className="flex-row items-center">
              <Sparkles size={16} color="#ea580c" />
              <Text className="text-[#ea580c] font-medium ml-1">Daily Wellness Tip</Text>
            </View>
            <Text className={`mt-1 ${isDark ? "text-white/90" : "text-black/90"}`}>{dailyTip}</Text>
          </View>
        </View>
      </View>

           <HomeMoodSuggestions isDark={isDark}/>


      {upcomingAppointment && (
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className={`text-lg py-2 font-bold ${isDark ? "text-white" : "text-black"}`}>Upcoming Session</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Appointments")}>
              <Text className="text-[#ea580c]">View All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
            style={{ elevation: 2 }}
            onPress={() => navigation.navigate("AppointmentDetails", { appointmentId: upcomingAppointment.id })}
          >
            <Text className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>
              Session with {upcomingAppointment.professionalName}
            </Text>

            <View className="flex-row items-center mb-2">
              <Calendar size={16} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>
                {formatDate(upcomingAppointment.scheduledFor)}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Clock size={16} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 ${isDark ? "text-white" : "text-black"}`}>
                {formatTime(upcomingAppointment.scheduledFor)}
              </Text>
            </View>

            <View className="flex-row mt-4">
              <TouchableOpacity
                className="bg-[#ea580c] py-2 px-4 rounded-lg mr-2 flex-row items-center"
                onPress={() => {
                  navigation.navigate("VideoCall", {
                    appointmentId: upcomingAppointment.id,
                    channelId: `appointment-${upcomingAppointment.id}`,
                    callType: "video",
                    participants: [upcomingAppointment.patientId, upcomingAppointment.professionalId],
                    professionalId: upcomingAppointment.professionalId,
                    patientId: upcomingAppointment.patientId,
                    appointmentData: upcomingAppointment,
                  })
                }}
              >
                <Video size={16} color="#FFFFFF" />
                <Text className="text-white ml-1">Join</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`py-2 px-4 rounded-lg flex-row items-center ${isDark ? "bg-[#2C2C2C]" : "bg-[#F5F5F5]"}`}
                onPress={() => {
                  navigation.navigate("Chat", {
                    screen: "Channel",
                    params: {
                      channelId: `appointment-chat-${upcomingAppointment.id}`,
                      channelName: upcomingAppointment.professionalName,
                    },
                  })
                }}
              >
                <MessageCircle size={16} color={isDark ? "#FFFFFF" : "#000000"} />
                <Text className={`ml-1 ${isDark ? "text-white" : "text-black"}`}>Message</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-2">
          <Text className={`text-lg py-2 font-bold ${isDark ? "text-white" : "text-black"}`}>Find a Professional</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Appointments", {
                screen: "ProfessionalsList",
              })
            }
          >
            <Text className="text-[#ea580c]">View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
          {professionals.length > 0 ? (
            professionals.map((professional, index) => (
              <TouchableOpacity
                key={professional.id}
                className={`mr-4 p-4 rounded-xl w-[200px] ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
                style={{ elevation: 2 }}
                onPress={() =>
                  navigation.navigate("Appointments", {
                    screen: "ProfessionalDetails",
                    params: {
                      professionalId: professional.id,
                      professionalName: professional.name,
                    },
                  })
                }
              >
                <View className="items-center mb-2">
                  <View className="w-16 h-16 rounded-full bg-[#ea580c] justify-center items-center">
                    <Text className="text-white text-xl font-bold">
                      {professional.name ? professional.name[0].toUpperCase() : "?"}
                    </Text>
                  </View>
                  <Text className={`text-base font-medium mt-2 ${isDark ? "text-white" : "text-black"}`}>
                    {professional.name}
                  </Text>
                  <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                    {professional.title || "Therapist"}
                  </Text>
                </View>

                <Text className={`text-xs mb-2 ${isDark ? "text-white/70" : "text-black/70"}`}>
                  {professional.specialization || "General Mental Health"}
                </Text>

                <TouchableOpacity
                  className="bg-[#ea580c] py-2 rounded-lg items-center"
                  onPress={() => navigation.navigate("BookAppointment", { professionalId: professional.id })}
                >
                  <Text className="text-white">Book Session</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View className={`p-4 rounded-xl w-full ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`} style={{ elevation: 2 }}>
              <Text className={`text-center ${isDark ? "text-white" : "text-black"}`}>
                No professionals available at the moment
              </Text>
              <TouchableOpacity
                className="bg-[#ea580c] py-2 rounded-lg items-center mt-3"
                onPress={() =>
                  navigation.navigate("Appointments", {
                    screen: "ProfessionalsList",
                  })
                }
              >
                <Text className="text-white">Browse All Professionals</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      <View className="mb-6">
        <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Your Stats</Text>

        <View className="flex-row justify-between">
          <View
            className={`p-4 rounded-xl flex-1 mr-2 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
            style={{ elevation: 2 }}
          >
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Total Sessions</Text>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>{stats.totalSessions}</Text>
          </View>

          <View
            className={`p-4 rounded-xl flex-1 mx-2 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
            style={{ elevation: 2 }}
          >
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Upcoming</Text>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
              {stats.upcomingSessions}
            </Text>
          </View>

          <View
            className={`p-4 rounded-xl flex-1 ml-2 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
            style={{ elevation: 2 }}
          >
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Unread</Text>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>{unreadNotifications}</Text>
          </View>
        </View>
      </View>

      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-2">
          <Text className={`text-lg py-2 font-bold ${isDark ? "text-white" : "text-black"}`}>Wellness Articles</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ArticleListScreen")}>
            <Text className="text-[#ea580c]">View All</Text>
          </TouchableOpacity>
        </View>

        <HomeArticlesTwo isDark={isDark} />
      </View>
    </>
  )

  const renderProfessionalHome = () => (
    <>
      <View className="mb-6">
      <HomeTopBar userData={userData} isDark={isDark} unreadNotifications={unreadNotifications}/>

        <View className={`p-4 mt-6 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`} style={{ elevation: 2 }}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Today's Schedule</Text>
              <Text className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>

            <TouchableOpacity
              className="bg-[#ea580c] py-2 px-4 rounded-lg"
              onPress={() => navigation.navigate("Appointments")}
            >
              <Text className="text-white">View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingAppointment ? (
            <TouchableOpacity
              className={`mt-4 p-3 rounded-lg ${isDark ? "bg-[#2C2C2C]" : "bg-[#F5F5F5]"}`}
              onPress={() => navigation.navigate("AppointmentDetails", { appointmentId: upcomingAppointment.id })}
            >
              <Text className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>
                Next Appointment
              </Text>
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                With {upcomingAppointment.patientName}
              </Text>
              <Text className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                {formatDate(upcomingAppointment.scheduledFor)} - {formatTime(upcomingAppointment.scheduledFor)}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className={`mt-4 text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
              No upcoming appointments today.
            </Text>
          )}
        </View>
      </View>

      <View className="mb-6">
        <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Quick Actions</Text>

        <View className="flex-row justify-between">
          <TouchableOpacity
            className={`p-4 rounded-xl flex-1 mr-2 items-center ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
            style={{ elevation: 2 }}
            onPress={() => navigation.navigate("Appointments")}
          >
            <Calendar size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`mt-2 text-sm ${isDark ? "text-white" : "text-black"}`}>View Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-xl flex-1 mx-2 items-center ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
            style={{ elevation: 2 }}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Bell size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`mt-2 text-sm ${isDark ? "text-white" : "text-black"}`}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-xl flex-1 ml-2 items-center ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
            style={{ elevation: 2 }}
            onPress={() => navigation.navigate("PatientsList")}
          >
            <MessageCircle size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            <Text className={`mt-2 text-sm ${isDark ? "text-white" : "text-black"}`}>View Patients</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-6">
        <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Your Stats</Text>

        <View className="flex-row justify-between">
          <View
            className={`p-4 rounded-xl flex-1 mr-2 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
            style={{ elevation: 2 }}
          >
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Total Sessions</Text>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>{stats.totalSessions}</Text>
          </View>

          <View
            className={`p-4 rounded-xl flex-1 mx-2 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
            style={{ elevation: 2 }}
          >
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Upcoming</Text>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
              {stats.upcomingSessions}
            </Text>
          </View>

          <View
            className={`p-4 rounded-xl flex-1 ml-2 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
            style={{ elevation: 2 }}
          >
            <Text className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Unread</Text>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>{unreadNotifications}</Text>
          </View>
        </View>
      </View>

    
      
    </>
  )

  // AI Modal Content
  const renderAITab = () => (
    <View className="flex-1">
      <AIChat 
      inputText={inputText} 
      setInputText={setInputText} 
      handleSendMessage={handleSendMessage} 
      messages={messages}
      isDark={isDark}
      flatListRef={flatListRef}/>
    </View>
  )

  const renderMessagesTab = () => (
    <View className="flex-1">
      <AIMessages 
      setActiveTab={setActiveTab}
      isDark={isDark}
      />
    </View>
  )

  const renderInfoTab = () => (
    <ScrollView className="flex-1 p-4">
      <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>About Serenity AI</Text>

      <Text className={`mb-4 ${isDark ? "text-white/80" : "text-black/80"}`}>
        Serenity AI is your personal mental wellness assistant designed to provide support, guidance, and resources for
        your emotional wellbeing.
      </Text>

      <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>How It Works</Text>

      <Text className={`mb-4 ${isDark ? "text-white/80" : "text-black/80"}`}>
        Serenity AI uses advanced natural language processing to understand your concerns and provide personalized
        support. You can chat about your feelings, ask for coping strategies, or get guidance on mental wellness topics.
      </Text>

      <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Important Disclaimer</Text>

      <View className={`p-4 rounded-lg mb-4 bg-[#f87171]/10 border border-[#f87171]/20`}>
        <Text className={`font-medium mb-1 text-[#f87171]`}>Not a Replacement for Professional Help</Text>
        <Text className={`${isDark ? "text-white/80" : "text-black/80"}`}>
          Serenity AI is not a substitute for professional mental health treatment. If you're experiencing a crisis or
          need immediate help, please contact a healthcare provider, call emergency services, or use a crisis helpline.
        </Text>
      </View>

      <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Privacy Information</Text>

      <Text className={`mb-4 ${isDark ? "text-white/80" : "text-black/80"}`}>
        Your conversations with Serenity AI are private and encrypted. We prioritize your data security and
        confidentiality. You can delete your conversation history at any time.
      </Text>

      <TouchableOpacity className="bg-[#ea580c] py-3 rounded-lg items-center mb-4" onPress={() => setActiveTab("AI")}>
        <Text className="text-white font-medium">Start Using Serenity AI</Text>
      </TouchableOpacity>
    </ScrollView>
  )

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? "#121212" : "#FFFFFF" }}>
      <StatusBar
        barStyle={`${isDark ? "light-content" : "dark-content"}`}
        backgroundColor={`${isDark ? "#121212" : "#FFFFFF"}`}
      />
      <ScrollView className="flex-1 p-4">
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
        ) : userRole === "patient" ? (
          renderPatientHome()
        ) : (
          renderProfessionalHome()
        )}
      </ScrollView>

      {/* Floating AI Assistant Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#ea580c] justify-center items-center shadow-lg"
        onPress={openSerenityAI}
        style={{ elevation: 5 }}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Serenity AI Modal */}
      <SerenityAIModal activeTab={activeTab} setActiveTab={setActiveTab} renderInfoTab={renderInfoTab} renderMessagesTab={renderMessagesTab} renderAITab={renderAITab} modalHeight={modalHeight} isDark={isDark} modalAnimation={modalAnimation} aiModalVisible={aiModalVisible} closeSerenityAI={closeSerenityAI}/>
      
    </View>
  )
}
