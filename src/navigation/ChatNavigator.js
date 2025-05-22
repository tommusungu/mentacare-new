"use client"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useTheme } from "../context/ThemeContext"

// Screens
import ChannelListScreen from "../screens/chat/ChannelListScreen"
import ChannelScreen from "../screens/chat/ChannelScreen"
import CreateChannelScreen from "../screens/chat/CreateChannelScreen"
import ContactsScreen from "../screens/chat/ContactsScreen"

const Stack = createNativeStackNavigator()

export default function ChatNavigator({ userId, userRole }) {
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
      <Stack.Screen name="ChannelList" options={{ title: "Conversations" }}>
        {(props) => <ChannelListScreen {...props} userId={userId} userRole={userRole} />}
      </Stack.Screen>

      <Stack.Screen
        name="Channel"
        component={ChannelScreen}
        options={({ route }) => ({
          title: route.params?.channelName || "Chat",
          headerShown: false, // We'll handle the header in the component
        })}
      />

      <Stack.Screen name="CreateChannel" component={CreateChannelScreen} options={{ title: "New Conversation" }} />

      <Stack.Screen name="Contacts" component={ContactsScreen} options={{ title: "Contacts" }} />
    </Stack.Navigator>
  )
}

