"use client"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useTheme } from "../context/ThemeContext"

// Screens
import ProfileScreen from "../screens/profile/ProfileScreen"
import EditProfileScreen from "../screens/profile/EditProfileScreen"
import SettingsScreen from "../screens/profile/SettingsScreen"
import ThemeSettingsScreen from "../screens/profile/ThemeSettingsScreen"
import NotificationSettingsScreen from "../screens/profile/NotificationSettingsScreen"
import PrivacySettingsScreen from "../screens/profile/PrivacySettingsScreen"
import HelpSupportScreen from "../screens/profile/HelpSupportScreen"
import AboutScreen from "../screens/profile/AboutScreen"

// Professional-specific screens
import AvailabilitySettingsScreen from "../screens/profile/AvailabilitySettingsScreen"
import ProfessionalStatsScreen from "../screens/profile/ProfessionalStatsScreen"

const Stack = createNativeStackNavigator()

export default function ProfileNavigator({ userId, userRole, userData, onLogout }) {
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
      <Stack.Screen name="ProfileMain" options={{ title: "My Profile" }}>
        {(props) => <ProfileScreen {...props} userId={userId} userRole={userRole} userData={userData} />}
      </Stack.Screen>

      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />

      <Stack.Screen name="Settings" options={{ title: "Settings" }}>
        {(props) => <SettingsScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>

      <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} options={{ title: "Theme Settings" }} />

      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: "Notifications" }}
      />

      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: "Privacy" }} />

      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ title: "Help & Support" }} />

      <Stack.Screen name="About" component={AboutScreen} options={{ title: "About" }} />

      {/* Professional-specific screens */}
      {userRole === "professional" && (
        <>
          <Stack.Screen
          userData={userData}
            name="AvailabilitySettings"
            component={AvailabilitySettingsScreen}
            options={{ title: "Manage Availability" }}
          />

          <Stack.Screen
          userData={userData}
            name="ProfessionalStats"
            component={ProfessionalStatsScreen}
            options={{ title: "My Statistics" }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}

