"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Alert } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { useNavigation } from "@react-navigation/native"
import { useDispatch, useSelector } from "react-redux"
import { fetchUserAppointments } from "../redux/slices/appointmentSlice"
import { fetchUserNotifications } from "../redux/slices/notificationSlice"
import { Calendar, Clock, Video, MessageCircle, Bell, Plus } from "lucide-react-native"
import { db } from "../config/firebase"
import { collection, query, where, limit, getDocs, serverTimestamp, addDoc } from "firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import HomeTopBar from "../components/HomeTopBar"
import { StatusBar } from "react-native"
import HomeArticlesTwo from "../components/HomeArticlesTwo"
import HomeMoodSuggestions from "../components/HomeMoodSuggestions"
import SerenityAIModal from "../serenity/SerenityAIModal"
import AIChat from "../serenity/AIChat"
import AIMessages from "../serenity/AIMessages"
import YourStats from "../components/YourStats"
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

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

  // Separate loading states for better UX
  const [initialLoading, setInitialLoading] = useState(true)
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [professionalsLoading, setProfessionalsLoading] = useState(false)

  const [upcomingAppointment, setUpcomingAppointment] = useState(null)
  const [canJoin, setCanJoin] = useState(false);


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
  const modalAnimation = useRef(new Animated.Value(0)).current
  const flatListRef = useRef(null)

  // Memoized selectors to prevent unnecessary re-renders
  const appointments = useSelector((state) => state.appointments.appointments)
  const notifications = useSelector((state) => state.notifications.notifications)
  const unreadNotifications = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  // Memoized upcoming appointment calculation
  const memoizedUpcomingAppointment = useMemo(() => {
    const now = new Date()
    return appointments
      .filter((app) => new Date(app.scheduledFor) > now && app.status !== "cancelled")
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))[0]
  }, [appointments])

  // Memoized stats calculation
  const memoizedStats = useMemo(() => {
    const now = new Date()
    const upcomingAppointmentsCount = appointments.filter(
      (app) => new Date(app.scheduledFor) > now && app.status !== "cancelled",
    ).length

    return {
      totalSessions: appointments.filter((app) => app.status === "completed").length,
      upcomingSessions: upcomingAppointmentsCount,
      unreadMessages: unreadNotifications,
    }
  }, [appointments, unreadNotifications])

  // Optimized chat function with useCallback
  const startChat = useCallback(
    async (user) => {
      try {
        const existingChannelQuery = query(
          collection(db, "channels"),
          where("type", "==", "direct"),
          where("members", "array-contains", userId),
        )

        const snapshot = await getDocs(existingChannelQuery)
        const existingChannel = snapshot.docs.find((doc) => {
          const data = doc.data()
          return data.members.includes(user.id) && data.members.length === 2
        })

        if (existingChannel) {
          navigation.navigate("Chat", {
            screen: "Channel",
            params: {
              channelId: existingChannel.id,
              channelName: user.displayName || user.name || user.id,
            },
          })
          return
        }

        const channelData = {
          name: user.displayName || user.name || user.id,
          type: "direct",
          members: [userId, user.id],
          createdBy: userId,
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
        }

        const channelRef = await addDoc(collection(db, "channels"), channelData)
        navigation.navigate("Channel", {
          channelId: channelRef.id,
          channelName: user.displayName || user.name || user.id,
        })
      } catch (error) {
        console.error("Error starting chat:", error)
      }
    },
    [userId, navigation],
  )

  // Initialize userId
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId")
        if (id) {
          setUserId(id)
        } else if (userData?.uid) {
          setUserId(userData.uid)
        }
      } catch (error) {
        console.error("Error getting userId:", error)
      }
    }
    getUserId()
  }, [userData])

  //check whether you can join call
useEffect(() => {
  const checkJoinEligibility = () => {
    const now = new Date();
    const scheduled = new Date(upcomingAppointment?.scheduledFor);
    const diffInMs = scheduled.getTime() - now.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);

    // User can join within 10 minutes before and 10 minutes after
    setCanJoin(diffInMinutes <= 10 && diffInMinutes >= -30);
  };

  checkJoinEligibility(); // run once on mount
  const interval = setInterval(checkJoinEligibility, 30000); // update every 30s

  return () => clearInterval(interval); // cleanup
}, [upcomingAppointment?.scheduledFor]);

  // Optimized data loading with parallel requests and error handling
  useEffect(() => {
    if (!userId) return

    const loadInitialData = async () => {
      setInitialLoading(true)

      try {
        // Load critical data first (appointments and notifications in parallel)
        const criticalDataPromises = [
          dispatch(fetchUserAppointments({ userId, role: userRole })),
          dispatch(fetchUserNotifications(userId)),
        ]

        await Promise.allSettled(criticalDataPromises)

        // Load non-critical data after critical data is loaded
        if (userRole === "patient") {
          loadProfessionals()
        }
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        setInitialLoading(false)
      }
    }

    loadInitialData()
  }, [dispatch, userId, userRole])

  // Separate function for loading professionals (non-blocking)
  const loadProfessionals = useCallback(async () => {
    if (userRole !== "patient") return

    setProfessionalsLoading(true)
    try {
      const professionalsQuery = query(
        collection(db, "users"), where("role", "==", "professional"), 
         where("isProfileComplete", "==", true),
          where("isVerified", "==", true),
        limit(5)
      
      )

      const professionalsSnapshot = await getDocs(professionalsQuery)
      const professionalsData = professionalsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      const shuffledProfessionals = shuffleArray(professionalsData)
        
        setProfessionals(shuffledProfessionals)

    } catch (error) {
      console.error("Error loading professionals:", error)
    } finally {
      setProfessionalsLoading(false)
    }
  }, [userRole])

  // Update derived state when dependencies change
  useEffect(() => {
    setUpcomingAppointment(memoizedUpcomingAppointment)
  }, [memoizedUpcomingAppointment])

  useEffect(() => {
    setStats(memoizedStats)
  }, [memoizedStats])

  // Memoized date formatting functions
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }, [])

  const formatTime = useCallback((dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [])

  // AI Modal functions
  const openSerenityAI = useCallback(() => {
    setAiModalVisible(true)
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [modalAnimation])

  const closeSerenityAI = useCallback(() => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setAiModalVisible(false)
    })
  }, [modalAnimation])

  const handleSendMessage = useCallback(() => {
    if (inputText.trim() === "") return

    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText("")

    // Simulate AI response
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
        id: Date.now(),
        text: randomResponse,
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 1000)
  }, [inputText, messages.length])

  // Memoized render functions to prevent unnecessary re-renders
  const renderPatientHome = useMemo(
    () => (
      <>
        <View className="mb-4">
          <HomeMoodSuggestions isDark={isDark} />
        </View>

        {upcomingAppointment && (
          <View className="mb-4">
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
  className={`py-2 px-4 rounded-lg mr-2 flex-row items-center ${
    canJoin ? 'bg-[#ea580c]' : 'bg-gray-400'
  }`}
  onPress={() => {
    if (!canJoin) {
      Alert.alert(
        "Error joining session",
        "You can only join within 10 minutes of the scheduled appointment."
      );
      return;
    }

    navigation.navigate("Call", {
      callId: `${upcomingAppointment.patientId}_${upcomingAppointment.professionalId}`,
      callType: "default",
    });
  }}
>
  <Video size={16} color="#FFFFFF" />
  <Text className="text-white ml-1">Join</Text>
</TouchableOpacity>

                <TouchableOpacity
                  className={`py-2 px-4 rounded-lg flex-row items-center ${isDark ? "bg-[#2C2C2C]" : "bg-[#F5F5F5]"}`}
                  onPress={() => {
                    startChat({
                      id: upcomingAppointment.professionalId,
                      name: upcomingAppointment.professionalName,
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

        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className={`text-lg py-2 font-bold ${isDark ? "text-white" : "text-black"}`}>
              Find a Professional
            </Text>
            <TouchableOpacity 
            onPress={() => navigation.navigate("Appointments", { screen: "ProfessionalsList" })}>
              <Text className="text-[#ea580c]">View All</Text>
            </TouchableOpacity>
          </View>

          {professionalsLoading ? (
            <View className="h-32 justify-center items-center">
              <ActivityIndicator size="small" color="#ea580c" />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
              {professionals.length > 0 ? (
                professionals.map((professional) => (
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

                    {/* <Text className={`text-xs mb-2 ${isDark ? "text-white/70" : "text-black/70"}`}>
                      {professional.specialization || "General Mental Health"}
                    </Text> */}

                    <TouchableOpacity
                      className="bg-[#ea580c] py-2 rounded-lg items-center"
                      // onPress={() => navigation.navigate("BookAppointment", { professionalId: professional.id })}
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
                      <Text className="text-white">Book Session</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              ) : (
                <View
                  className={`p-4 rounded-xl w-full ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
                  style={{ elevation: 2 }}
                >
                  <Text className={`text-center ${isDark ? "text-white" : "text-black"}`}>
                    No professionals available at the moment
                  </Text>
                  <TouchableOpacity
                    className="bg-[#ea580c] py-2 rounded-lg items-center mt-3"
                    onPress={() => navigation.navigate("Appointments", { screen: "ProfessionalsList" })}
                  >
                    <Text className="text-white">Browse All Professionals</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* <View className="mb-4">
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
        </View> */}
        <View className="mb-4">
          <YourStats isDark={isDark}/>
        </View>


        <View className="mb-2">
          <View className="flex-row justify-between items-center mb-2">
            <Text className={`text-lg py-2 font-bold ${isDark ? "text-white" : "text-black"}`}>Wellness Articles</Text>
            <TouchableOpacity onPress={() => navigation.navigate("ArticleListScreen")}>
              <Text className="text-[#ea580c]">View All</Text>
            </TouchableOpacity>
          </View>

          <HomeArticlesTwo isDark={isDark} />
        </View>
      </>
    ),
    [
      isDark,
      upcomingAppointment,
      professionals,
      professionalsLoading,
      unreadNotifications,
      formatDate,
      formatTime,
      navigation,
      startChat,
    ],
  )

  const renderProfessionalHome = useMemo(
    () => (
      <>
        <View className="mb-4">
          {upcomingAppointment ? (
            <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
              My Appointments
            </Text>
          ) : (
            <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
              Manage your schedule for appointments
            </Text>
          )}

          <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`} style={{ elevation: 2 }}>
            <View className="flex-1 mb-2">
              <View className="mb-2">
                <Text className={`text-base mb-2 ${isDark ? "text-white/70" : "text-black/70"}`}>
                  Set your schedule to manage when you're available for appointments.
                </Text>
                <Text className={`text-base ${isDark ? "text-white/70" : "text-black/70"}`}>
                  Patients will only be able to book during the time slots you define. You can set multiple slots per
                  day and adjust them anytime to fit your schedule.
                </Text>
              </View>
              <TouchableOpacity
                className="mt-2 flex-1 bg-[#ea580c] p-3 rounded-lg flex-row items-center justify-center gap-2"
                onPress={() => navigation.navigate("Profile", { screen: "AvailabilitySettings" })}
              >
                <Calendar size={16} color="#FFFFFF" />
                <Text className="text-white">Manage Availability</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className={`p-4 mt-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`} style={{ elevation: 2 }}>
            <View className="flex-row justify-between items-center">
              <View>
                <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Today's Schedule
                </Text>
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
                onPress={() => navigation.navigate("Appointments", { screen: "AppointmentsList" })}
              >
                <Text className="text-white">View All</Text>
              </TouchableOpacity>
            </View>

            {upcomingAppointment ? (
              <TouchableOpacity
                className={`mt-4 p-3 rounded-lg ${isDark ? "bg-[#2C2C2C]" : "bg-[#F5F5F5]"}`}
                onPress={() =>
                  navigation.navigate("Appointments", {
                    screen: "AppointmentDetails",
                    params: { appointmentId: upcomingAppointment.id },
                  })
                }
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

        <View className="mb-4">
          <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Quick Actions</Text>

          <View className="flex-row justify-between">
            <TouchableOpacity
              className={`p-4 rounded-xl flex-1 mr-2 items-center ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
              style={{ elevation: 2 }}
              onPress={() => navigation.navigate("Appointments", { screen: "AppointmentsList" })}
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
          </View>
        </View>

        {/* <View className="mb-4">
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
        </View> */}
        <View className="mb-8">
        <YourStats isDark={isDark}/>
        </View>
      </>
    ),
    [isDark, upcomingAppointment, unreadNotifications, formatDate, formatTime, navigation],
  )

  // AI Modal Content
  const renderAITab = useCallback(
    () => (
      <View className="flex-1">
        <AIChat
          inputText={inputText}
          setInputText={setInputText}
          handleSendMessage={handleSendMessage}
          messages={messages}
          isDark={isDark}
          flatListRef={flatListRef}
        />
      </View>
    ),
    [inputText, handleSendMessage, messages, isDark],
  )

  const renderMessagesTab = useCallback(
    () => (
      <View className="flex-1">
        <AIMessages setActiveTab={setActiveTab} isDark={isDark} />
      </View>
    ),
    [setActiveTab, isDark],
  )

  const renderInfoTab = useCallback(
    () => (
      <ScrollView className="flex-1 p-4">
        <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>About Serenity AI</Text>

        <Text className={`mb-4 ${isDark ? "text-white/80" : "text-black/80"}`}>
          Serenity AI is your personal mental wellness assistant designed to provide support, guidance, and resources
          for your emotional wellbeing.
        </Text>

        <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>How It Works</Text>

        <Text className={`mb-4 ${isDark ? "text-white/80" : "text-black/80"}`}>
          Serenity AI uses advanced natural language processing to understand your concerns and provide personalized
          support. You can chat about your feelings, ask for coping strategies, or get guidance on mental wellness
          topics.
        </Text>

        <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
          Important Disclaimer
        </Text>

        <View className={`p-4 rounded-lg mb-4 bg-[#f87171]/10 border border-[#f87171]/20`}>
          <Text className={`font-medium mb-1 text-[#f87171]`}>Not a Replacement for Professional Help</Text>
          <Text className={`${isDark ? "text-white/80" : "text-black/80"}`}>
            Serenity AI is not a substitute for professional mental health treatment. If you're experiencing a crisis or
            need immediate help, please contact a healthcare provider, call emergency services, or use a crisis
            helpline.
          </Text>
        </View>

        <Text className={`text-lg py-2 font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
          Privacy Information
        </Text>

        <Text className={`mb-4 ${isDark ? "text-white/80" : "text-black/80"}`}>
          Your conversations with Serenity AI are private and encrypted. We prioritize your data security and
          confidentiality. You can delete your conversation history at any time.
        </Text>

        <TouchableOpacity className="bg-[#ea580c] py-3 rounded-lg items-center mb-4" onPress={() => setActiveTab("AI")}>
          <Text className="text-white font-medium">Start Using Serenity AI</Text>
        </TouchableOpacity>
      </ScrollView>
    ),
    [isDark, setActiveTab],
  )

  // Show skeleton loading for initial load
  if (initialLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: isDark ? "#121212" : "#FFFFFF" }}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={isDark ? "#121212" : "#FFFFFF"}
        />

        <View className="pt-4">
          <HomeTopBar userData={userData} isDark={isDark} unreadNotifications={0} />
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? "#121212" : "#FFFFFF" }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#121212" : "#FFFFFF"}
      />

      <View className="pt-4">
        <HomeTopBar userData={userData} isDark={isDark} unreadNotifications={unreadNotifications} />
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {userRole === "patient" ? renderPatientHome : renderProfessionalHome}
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
      <SerenityAIModal
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        renderInfoTab={renderInfoTab}
        renderMessagesTab={renderMessagesTab}
        renderAITab={renderAITab}
        modalHeight={modalHeight}
        isDark={isDark}
        modalAnimation={modalAnimation}
        aiModalVisible={aiModalVisible}
        closeSerenityAI={closeSerenityAI}
      />
    </View>
  )
}
