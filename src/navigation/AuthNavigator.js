"use client"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useTheme } from "../context/ThemeContext"

// Screens
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"
import RoleSelectionScreen from "../screens/auth/RoleSelectionScreen"
import PatientProfileSetupScreen from "../screens/auth/PatientProfileSetupScreen"
import ProfessionalProfileSetupScreen from "../screens/auth/ProfessionalProfileSetupScreen"
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen"
import OnboardingScreen from "../screens/auth/OnboardingScreen"

const Stack = createNativeStackNavigator()

export default function AuthNavigator({ onLogin }) {
  const { isDark } = useTheme()

  return (
    <Stack.Navigator
      initialRouteName="Login"
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
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" options={{ title: "Sign In" }}>
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="Register" options={{ title: "Create Account" }}>
        {(props) => <RegisterScreen {...props} />}
      </Stack.Screen>
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ title: "Select Your Role" }} />
      <Stack.Screen name="PatientProfileSetup" options={{ title: "Complete Your Profile" }}>
        {(props) => <PatientProfileSetupScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="ProfessionalProfileSetup" options={{ title: "Professional Profile" }}>
        {(props) => <ProfessionalProfileSetupScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Reset Password" }} />
    </Stack.Navigator>
  )
}

