"use client"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useTheme } from "../context/ThemeContext"

// Screens
import AppointmentsScreen from "../screens/appointments/AppointmentsScreen"
import AppointmentDetailsScreen from "../screens/appointments/AppointmentDetailsScreen"
import BookAppointmentScreen from "../screens/appointments/BookAppointmentScreen"
import ProfessionalsListScreen from "../screens/appointments/ProfessionalsListScreen"
import ProfessionalDetailsScreen from "../screens/appointments/ProfessionalDetailsScreen"
import AvailabilityScreen from "../screens/appointments/AvailabilityScreen"
import ConfirmAppointmentScreen from "../screens/appointments/ConfirmAppointmentScreen"

const Stack = createNativeStackNavigator()

export default function AppointmentsNavigator({ userId, userRole }) {
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
      <Stack.Screen name="AppointmentsList" options={{ title: "My Appointments" }}>
        {(props) => <AppointmentsScreen {...props} userId={userId} userRole={userRole} />}
      </Stack.Screen>

      <Stack.Screen
        name="AppointmentDetails"
        component={AppointmentDetailsScreen}
        options={{ title: "Appointment Details" }}
      />

      <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} options={{ title: "Book Appointment" }} />

      <Stack.Screen
        name="ProfessionalsList"
        component={ProfessionalsListScreen}
        options={{ title: "Find a Professional" }}
      />

      <Stack.Screen
        name="ProfessionalDetails"
        component={ProfessionalDetailsScreen}
        options={({ route }) => ({ title: route.params?.professionalName || "Professional" })}
      />

      <Stack.Screen name="Availability" component={AvailabilityScreen} options={{ title: "Available Time Slots" }} />

      <Stack.Screen
        name="ConfirmAppointment"
        component={ConfirmAppointmentScreen}
        options={{ title: "Confirm Appointment" }}
      />
    </Stack.Navigator>
  )
}

