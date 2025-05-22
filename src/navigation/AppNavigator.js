"use client"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useTheme } from "../context/ThemeContext"
import { useChat } from "../context/ChatContext"
import { useNotifications } from "../context/NotificationContext"
import { MessageCircle, Calendar, User, Bell, Home, HomeIcon } from "lucide-react-native"

// Screens - Main Tabs
import HomeScreen from "../screens/HomeScreen"
import ChatNavigator from "./ChatNavigator"
import AppointmentsNavigator from "./AppointmentsNavigator"
import ProfileNavigator from "./ProfileNavigator"
import NotificationsScreen from "../screens/NotificationsScreen"

// Screens - Common
import VideoCallScreen from "../screens/VideoCallScreen"
import SessionDetailsScreen from "../screens/SessionDetailsScreen"
import SessionNotesScreen from "../screens/SessionNotesScreen"
import UserProfileScreen from "../screens/UserProfileScreen"
import SettingsScreen from "../screens/SettingsScreen"
// AI Assistant
import SerenityAIScreen from "../screens/SerenityAIScreen"

// Add these imports if they don't exist
import ArticleListScreen from "../articles/ArticleListScreen"
import ArticleScreen from "../articles/ArticleScreen"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const MainTabs = ({ userId, userRole, userData, onLogout }) => {
  const { isDark } = useTheme()
  const { unreadCount } = useChat()
  const { hasUnread } = useNotifications()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isDark ? "#121212" : "#FFFFFF",
          borderTopColor: isDark ? "#2C2C2C" : "#E0E0E0",
          height: 67,
          paddingBottom: 15,
          // borderTopColor: theme === 'dark' ? '#606060' : '#eeeeee',
          // backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        },
        tabBarActiveTintColor: "#ea580c",
        tabBarInactiveTintColor: isDark ? "#f3f4f6" : "#4b5563",
        headerShown: false,
        
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} />,
        }}
      >
        {() => <HomeScreen userRole={userRole} userData={userData} />}
      </Tab.Screen>

      <Tab.Screen
        name="Chat"
        options={{
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      >
        {() => <ChatNavigator userId={userId} userRole={userRole} />}
      </Tab.Screen>

      <Tab.Screen
        name="Appointments"
        options={{
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      >
        {() => <AppointmentsNavigator userId={userId} userRole={userRole} />}
      </Tab.Screen>

      {/* <Tab.Screen
        name="Notifications"
        options={{
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          tabBarBadge: hasUnread ? "•" : undefined,
        }}
      >
        {() => <NotificationsScreen userId={userId} />}
      </Tab.Screen> */}

      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      >
        {() => <ProfileNavigator userId={userId} userRole={userRole} userData={userData} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

export default function AppNavigator({ userId, userRole, userData, onLogout }) {
  const { isDark } = useTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? "#121212" : "#FFFFFF",
        },
        headerTintColor: isDark ? "#FFFFFF" : "#000000",
        contentStyle: {
          backgroundColor: isDark ? "#121212" : "#FFFFFF",
        },
      }}
    >
      <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
        {() => <MainTabs userId={userId} userRole={userRole} userData={userData} onLogout={onLogout} />}
      </Stack.Screen>

      <Stack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={{
          title: "Session",
          headerShown: false, // Hide header during calls
        }}
      />

      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications Details" }} />

      <Stack.Screen name="SessionDetails" component={SessionDetailsScreen} options={{ title: "Session Details" }} />

      <Stack.Screen name="SessionNotes" component={SessionNotesScreen} options={{ title: "Session Notes" }} />

      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={({ route }) => ({ title: route.params?.userName || "Profile" })}
      />

      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    
      {/* AI Assistant */}
      <Stack.Screen
        name="SerenityAI"
        component={SerenityAIScreen}
        options={{ title: "Serenity AI", presentation: "modal" }}
      />

      {/* Add these to your Stack.Screen components inside the Navigator */}
      <Stack.Screen name="ArticleScreen" component={ArticleScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ArticleListScreen" component={ArticleListScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

