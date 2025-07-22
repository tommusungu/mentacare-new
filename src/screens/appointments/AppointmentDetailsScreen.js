"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useDispatch, useSelector } from "react-redux"
import { updateAppointmentStatus, cancelAppointment } from "../../redux/slices/appointmentSlice"
import { createNotification } from "../../redux/slices/notificationSlice"
import { db } from "../../config/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useToast } from "react-native-toast-notifications"
import { Calendar, Clock, User, Video, Phone, MessageCircle, CheckCircle, XCircle, X, FileText } from "lucide-react-native"
import { acceptAppointmentEmail } from "../../utils/api"

export default function AppointmentDetailsScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const dispatch = useDispatch()
  const toast = useToast()

  const [canJoinTime, setCanJoinTime] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [soapNotes, setSoapNotes] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });

  const { appointmentId } = route.params
  const [appointment, setAppointment] = useState(null)
  // console.log("appointment", appointment)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const currentUser = useSelector((state) => state.user.currentUser)
  const userRole = currentUser?.role

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        console.log(`Fetching appointment details for ID: ${appointmentId}`)
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId))
        if (appointmentDoc.exists()) {
          const appointmentData = { id: appointmentDoc.id, ...appointmentDoc.data() }
          console.log(`Appointment found: ${JSON.stringify(appointmentData)}`)
          setAppointment(appointmentData)
        } else {
          console.log(`Appointment not found for ID: ${appointmentId}`)
          toast.show("Appointment not found", {
            type: "danger",
            placement: "top",
            duration: 3000,
          })
        }
      } catch (error) {
        console.error("Error fetching appointment details:", error)
        toast.show("Failed to load appointment details", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAppointmentDetails()
  }, [appointmentId])

  useEffect(() => {
  const checkJoinEligibility = () => {
    const now = new Date();
    const scheduled = new Date(appointment?.scheduledFor);
    const diffInMs = scheduled.getTime() - now.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);

    // User can join within 10 minutes before and 10 minutes after
    setCanJoinTime(diffInMinutes <= 10 && diffInMinutes >= -30);
  };

  checkJoinEligibility(); // run once on mount
  const interval = setInterval(checkJoinEligibility, 30000); // update every 30s

  return () => clearInterval(interval); // cleanup
}, [appointment?.scheduledFor]);


  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
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

  const handleCancelAppointment = () => {
    Alert.alert("Cancel Appointment", "Are you sure you want to cancel this appointment?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes, Cancel",
        onPress: async () => {
          setCancelling(true)
          try {
            await dispatch(
              cancelAppointment({
                appointmentId: appointment.id,
                cancellationReason: `Cancelled by ${userRole === "professional" ? "professional" : "patient"}`,
              }),
            )

            // Create notifications
            dispatch(
              createNotification({
                userId: appointment.professionalId,
                title: "Appointment Cancelled",
                body: `Your appointment with ${appointment.patientName} has been cancelled`,
                type: "appointment",
                data: { appointmentId: appointment.id },
              }),
            )

            dispatch(
              createNotification({
                userId: appointment.patientId,
                title: "Appointment Cancelled",
                body: `Your appointment with ${appointment.professionalName} has been cancelled`,
                type: "appointment",
                data: { appointmentId: appointment.id },
              }),
            )

            toast.show("Appointment cancelled successfully", {
              type: "success",
              placement: "top",
              duration: 3000,
            })

            // Update local state
            setAppointment({
              ...appointment,
              status: "cancelled",
              cancellationReason: `Cancelled by ${userRole === "professional" ? "professional" : "patient"}`,
              cancelledAt: new Date().toISOString(),
            })
          } catch (error) {
            console.error("Error cancelling appointment:", error)
            toast.show("Failed to cancel appointment", {
              type: "danger",
              placement: "top",
              duration: 3000,
            })
          } finally {
            setCancelling(false)
          }
        },
        style: "destructive",
      },
    ])
  }

  const handleConfirmAppointment = async () => {
    if (userRole !== "professional") return

    setConfirming(true)
    try {
      await dispatch(
        updateAppointmentStatus({
          appointmentId: appointment.id,
          status: "confirmed",
        }),
      )

      // Create notifications
      dispatch(
        createNotification({
          userId: appointment.patientId,
          title: "Appointment Confirmed",
          body: `Your appointment with ${appointment.professionalName} has been confirmed`,
          type: "appointment",
          data: { appointmentId: appointment.id },
        }),
      )
       acceptAppointmentEmail({
                  appointmentId: appointment.id,
                  professionalName: appointment.professionalName,
                  patientName: appointment.patientName,
                  scheduledFor: appointment?.scheduledFor,
                  reason: appointment?.reason,
                  notes: appointment?.notes,
                  // patientEmail: currentUser.email,
                  patientEmail: appointment.patientEmail,
                  professionalEmail: appointment.professionalEmail, // you should have this from professional profile
                });
      toast.show("Appointment confirmed successfully", {
        type: "success",
        placement: "top",
        duration: 3000,
      })

      // Update local state
      setAppointment({
        ...appointment,
        status: "confirmed",
      })
    } catch (error) {
      console.error("Error confirming appointment:", error)
      toast.show("Failed to confirm appointment", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    } finally {
      setConfirming(false)
    }
  }

  const handleDeclineAppointment = async () => {
    if (userRole !== "professional") return

    Alert.alert("Decline Appointment", "Are you sure you want to decline this appointment?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes, Decline",
        onPress: async () => {
          setCancelling(true)
          try {
            await dispatch(
              cancelAppointment({
                appointmentId: appointment.id,
                cancellationReason: "Declined by professional",
              }),
            )

            // Create notifications
            dispatch(
              createNotification({
                userId: appointment.patientId,
                title: "Appointment Declined",
                body: `Your appointment with ${appointment.professionalName} has been declined`,
                type: "appointment",
                data: { appointmentId: appointment.id },
              }),
            )

            toast.show("Appointment declined successfully", {
              type: "success",
              placement: "top",
              duration: 3000,
            })

            // Update local state
            setAppointment({
              ...appointment,
              status: "cancelled",
              cancellationReason: "Declined by professional",
              cancelledAt: new Date().toISOString(),
            })
          } catch (error) {
            console.error("Error declining appointment:", error)
            toast.show("Failed to decline appointment", {
              type: "danger",
              placement: "top",
              duration: 3000,
            })
          } finally {
            setCancelling(false)
          }
        },
        style: "destructive",
      },
    ])
  }

  const handleCompleteAppointment = () => {
    if (userRole !== "professional") return
    // Show SOAP notes modal instead of directly completing
    setShowNotesModal(true);
  }

  const handleSaveNotesAndComplete = async () => {
    // Validate that at least some notes are provided
    if (!soapNotes.subjective.trim() && !soapNotes.objective.trim() && 
        !soapNotes.assessment.trim() && !soapNotes.plan.trim()) {
      toast.show("Please provide at least one section of SOAP notes", {
        type: "warning",
        placement: "top",
        duration: 3000,
      });
      return;
    }

    setConfirming(true);
    try {
      const notesData = {
        soapNotes: {
          subjective: soapNotes.subjective.trim(),
          objective: soapNotes.objective.trim(),
          assessment: soapNotes.assessment.trim(),
          plan: soapNotes.plan.trim(),
          completedAt: new Date().toISOString(),
          completedBy: currentUser.uid
        }
      };

      await dispatch(
        updateAppointmentStatus({
          appointmentId: appointment.id,
          status: "completed",
          notes: notesData,
        }),
      );

      // Create notifications
      dispatch(
        createNotification({
          userId: appointment.patientId,
          title: "Appointment Completed",
          body: `Your appointment with ${appointment.professionalName} has been marked as completed`,
          type: "appointment",
          data: { appointmentId: appointment.id },
        }),
      );

      toast.show("Appointment completed with session notes", {
        type: "success",
        placement: "top",
        duration: 3000,
      });

      // Update local state
      setAppointment({
        ...appointment,
        status: "completed",
        notes: notesData,
      });

      // Reset and close modal
      setSoapNotes({ subjective: "", objective: "", assessment: "", plan: "" });
      setShowNotesModal(false);
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast.show("Failed to complete appointment", {
        type: "danger",
        placement: "top",
        duration: 3000,
      });
    } finally {
      setConfirming(false);
    }
  };

  const renderSOAPNotesModal = () => (
    <Modal
      visible={showNotesModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowNotesModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-end items-center ">
        <View className={`w-full h-3/4 max-w-lg rounded-t-[28px] p-6 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
              Session Notes (SOAP)
            </Text>
            <TouchableOpacity
              onPress={() => setShowNotesModal(false)}
              className="p-1"
            >
              <X size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
          </View>

          <ScrollView className="max-h-3/4" showsVerticalScrollIndicator={false}>
            {/* Subjective */}
            <View className="mb-4">
              <Text className={`text-base font-semibold mb-2 ${isDark ? "text-white" : "text-black"}`}>
                Subjective
              </Text>
              <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                Patient's description of symptoms, concerns, and feelings
              </Text>
              <TextInput
                value={soapNotes.subjective}
                onChangeText={(text) => setSoapNotes({...soapNotes, subjective: text})}
                placeholder="Enter subjective observations..."
                placeholderTextColor={isDark ? "#666" : "#999"}
                multiline
                numberOfLines={3}
                className={`border rounded-lg p-3 text-base ${
                  isDark 
                    ? "bg-[#2A2A2A] border-[#1E1E1E] text-white" 
                    : "bg-gray-50 border-gray-300 text-black"
                }`}
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Objective */}
            <View className="mb-4">
              <Text className={`text-base font-semibold mb-2 ${isDark ? "text-white" : "text-black"}`}>
                Objective
              </Text>
              <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                Observable signs, measurements, and clinical findings
              </Text>
              <TextInput
                value={soapNotes.objective}
                onChangeText={(text) => setSoapNotes({...soapNotes, objective: text})}
                placeholder="Enter objective findings..."
                placeholderTextColor={isDark ? "#666" : "#999"}
                multiline
                numberOfLines={3}
                className={`border rounded-lg p-3 text-base ${
                  isDark 
                    ? "bg-[#2A2A2A] border-[#1E1E1E] text-white" 
                    : "bg-gray-50 border-gray-300 text-black"
                }`}
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Assessment */}
            <View className="mb-4">
              <Text className={`text-base font-semibold mb-2 ${isDark ? "text-white" : "text-black"}`}>
                Assessment
              </Text>
              <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                Professional diagnosis, analysis, and clinical impression
              </Text>
              <TextInput
                value={soapNotes.assessment}
                onChangeText={(text) => setSoapNotes({...soapNotes, assessment: text})}
                placeholder="Enter assessment and diagnosis..."
                placeholderTextColor={isDark ? "#666" : "#999"}
                multiline
                numberOfLines={3}
                className={`border rounded-lg p-3 text-base ${
                  isDark 
                    ? "bg-[#2A2A2A] border-[#1E1E1E] text-white" 
                    : "bg-gray-50 border-gray-300 text-black"
                }`}
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Plan */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-2 ${isDark ? "text-white" : "text-black"}`}>
                Plan/Intervention
              </Text>
              <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                Treatment plan, interventions, and next steps
              </Text>
              <TextInput
                value={soapNotes.plan}
                onChangeText={(text) => setSoapNotes({...soapNotes, plan: text})}
                placeholder="Enter treatment plan and interventions..."
                placeholderTextColor={isDark ? "#666" : "#999"}
                multiline
                numberOfLines={3}
                className={`border rounded-lg p-3 text-base ${
                  isDark 
                    ? "bg-[#2A2A2A] border-[#1E1E1E] text-white" 
                    : "bg-gray-50 border-gray-300 text-black"
                }`}
                style={{ textAlignVertical: 'top' }}
              />
            </View>
          </ScrollView>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowNotesModal(false)}
              className="flex-1 h-12 rounded-lg justify-center items-center bg-gray-500"
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSaveNotesAndComplete}
              disabled={confirming}
              className="flex-1 h-12 rounded-lg justify-center items-center bg-[#34C759]"
            >
              {confirming ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View className="flex-row items-center">
                  <FileText size={16} color="#FFFFFF" />
                  <Text className="text-white font-semibold ml-2">Save & Complete</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FF9500" // Orange
      case "confirmed":
        return "#34C759" // Green
      case "completed":
        return "#007AFF" // Blue
      case "cancelled":
        return "#FF3B30" // Red
      case "in-progress":
        return "#5856D6" // Purple
      default:
        return "#8E8E93" // Gray
    }
  }

  const renderAppointmentDetails = () => {
    if (!appointment) return null

    return (
      <View className="flex-1 bg-white">
        <ScrollView className="flex-1 p-4">
          <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">
                {userRole === "professional" ? appointment.patientName : appointment.professionalName}
              </Text>
              <View
                className={`px-3 py-1 rounded-full ${
                  appointment.status === "confirmed"
                    ? "bg-green-100"
                    : appointment.status === "cancelled"
                    ? "bg-red-100"
                    : "bg-yellow-100"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    appointment.status === "confirmed"
                      ? "text-green-800"
                      : appointment.status === "cancelled"
                      ? "text-red-800"
                      : "text-yellow-800"
                  }`}
                >
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-500 mb-1">Date & Time</Text>
              <Text className="text-base text-gray-900">
                {formatDate(appointment.scheduledFor)} at {formatTime(appointment.scheduledFor)}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-500 mb-1">Session Type</Text>
              <Text className="text-base text-gray-900">{appointment.sessionType}</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-500 mb-1">Reason for Session</Text>
              <Text className="text-base text-gray-900">{appointment.reason}</Text>
            </View>

            {userRole === "professional" && (
              <>
                <View className="mb-4">
                  <Text className="text-sm text-gray-500 mb-1">Patient Contact</Text>
                  <Text className="text-base text-gray-900">{appointment.patientPhone}</Text>
                  <Text className="text-base text-gray-900">{appointment.patientEmail}</Text>
                </View>

                <View className="mb-4">
                  <Text className="text-sm text-gray-500 mb-1">Patient Notes</Text>
                  <Text className="text-base text-gray-900">
                    {appointment.patientNotes || "No additional notes provided"}
                  </Text>
                </View>
              </>
            )}

            {appointment.status === "cancelled" && (
              <View className="mb-4">
                <Text className="text-sm text-gray-500 mb-1">Cancellation Reason</Text>
                <Text className="text-base text-gray-900">{appointment.cancellationReason}</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Cancelled on {formatDate(appointment.cancelledAt)}
                </Text>
              </View>
            )}
          </View>

          {appointment.status === "confirmed" && (
            <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">Session Actions</Text>
              
              <TouchableOpacity
                className="h-12 rounded-lg justify-center items-center bg-blue-500 mb-4"
                onPress={() => {
                  // Handle video call
                }}
              >
                <View className="flex-row items-center">
                  <Video size={20} color="#FFFFFF" />
                  <Text className="text-white text-base font-bold ml-2">Start Video Call</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="h-12 rounded-lg justify-center items-center bg-green-500"
                onPress={() => {
                  // Handle messaging
                }}
              >
                <View className="flex-row items-center">
                  <MessageCircle size={20} color="#FFFFFF" />
                  <Text className="text-white text-base font-bold ml-2">Send Message</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {userRole === "professional" && appointment.status === "confirmed" && (
            <View className="bg-white rounded-lg shadow-sm p-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">Professional Actions</Text>
              
              <TouchableOpacity
                className="h-12 rounded-lg justify-center items-center bg-[#34C759] mb-4"
                onPress={handleCompleteAppointment}
                disabled={confirming}
              >
                {confirming ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View className="flex-row items-center">
                    <CheckCircle size={20} color="#FFFFFF" />
                    <Text className="text-white text-base font-bold ml-2">Complete Appointment</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="h-12 rounded-lg justify-center items-center bg-[#FF3B30]"
                onPress={handleDeclineAppointment}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View className="flex-row items-center">
                    <XCircle size={20} color="#FFFFFF" />
                    <Text className="text-white text-base font-bold ml-2">Decline Appointment</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    )
  }

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>Loading appointment details...</Text>
      </View>
    )
  }

  if (!appointment) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <Text className={`text-lg ${isDark ? "text-white" : "text-black"}`}>Appointment not found</Text>
        <TouchableOpacity className="mt-4 p-3 bg-[#ea580c] rounded-lg" onPress={() => navigation.goBack()}>
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

const scheduledTime = new Date(appointment.scheduledFor);
const now = new Date();
const isPast = now.getTime() > scheduledTime.getTime() + 30 * 60 * 1000;
  const canCancel = appointment.status !== "cancelled" && appointment.status !== "completed" && !isPast
  const canConfirm = userRole === "professional" && appointment.status === "pending" && !isPast
  const canJoin = appointment.status === "confirmed" || appointment.status === "in-progress"

  return (
    <>
      <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <View className="p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>Appointment Details</Text>
            <View
              className={`px-3 py-1 rounded-full`}
              style={{ backgroundColor: getStatusColor(appointment.status) + "30" }}
            >
              <Text style={{ color: getStatusColor(appointment.status), fontWeight: "500" }}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </Text>
            </View>
          </View>

          <View className={`p-4 rounded-xl mb-6 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
            <View className="flex-row items-center mb-4">
              <Calendar size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>
                {formatDate(appointment.scheduledFor)}
              </Text>
            </View>

            <View className="flex-row items-center mb-4">
              <Clock size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>
                {formatTime(appointment.scheduledFor)}
              </Text>
            </View>

            <View className="flex-row items-center mb-4">
              <User size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>
                Patient: {appointment.patientName}
              </Text>
            </View>

            <View className="flex-row items-center">
              <User size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`ml-2 text-base ${isDark ? "text-white" : "text-black"}`}>
                Professional: {appointment.professionalName}
              </Text>
            </View>
          </View>

          {appointment.reason && (
            <View className="mb-6">
              <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
                Reason for Appointment
              </Text>
              <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
                <Text className={`${isDark ? "text-white" : "text-black"}`}>{appointment.reason}</Text>
              </View>
            </View>
          )}

          {appointment.notes && appointment.notes.soapNotes && (
            <View className="mb-6">
              <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>SOAP Notes</Text>
              <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
                {appointment.notes.soapNotes.subjective && (
                  <View className="mb-3">
                    <Text className={`font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>Subjective:</Text>
                    <Text className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {appointment.notes.soapNotes.objective}
                    </Text>
                  </View>
                )}
                
                {appointment.notes.soapNotes.assessment && (
                  <View className="mb-3">
                    <Text className={`font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>Assessment:</Text>
                    <Text className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {appointment.notes.soapNotes.assessment}
                    </Text>
                  </View>
                )}
                
                {appointment.notes.soapNotes.plan && (
                  <View className="mb-3">
                    <Text className={`font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>Plan/Intervention:</Text>
                    <Text className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {appointment.notes.soapNotes.plan}
                    </Text>
                  </View>
                )}
                
                {appointment.notes.soapNotes.completedAt && (
                  <Text className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Completed on {formatDate(appointment.notes.soapNotes.completedAt)} at {formatTime(appointment.notes.soapNotes.completedAt)}
                  </Text>
                )}
              </View>
            </View>
          )}

          {appointment.notes && appointment.notes.sessionNotes && (
            <View className="mb-6">
              <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Session Notes</Text>
              <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
                <Text className={`${isDark ? "text-white" : "text-black"}`}>{appointment.notes.sessionNotes}</Text>

                {appointment.notes.followUpNeeded && (
                  <View className="mt-4 pt-4 border-t border-gray-700">
                    <Text className={`font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Follow-up Notes:</Text>
                    <Text className={`${isDark ? "text-white" : "text-black"}`}>
                      {appointment.notes.followUpNotes || "Follow-up needed, but no specific notes provided."}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View className="mt-4">
            {canJoin && !isPast && (
              <>
             
                <TouchableOpacity
    className={`h-12 rounded-lg justify-center items-center  ${
      canJoinTime ? 'bg-[#ea580c]' : 'bg-gray-400'
    }`}
    onPress={() => {
      if (!canJoinTime) {
        Alert.alert(
          "Error joining session",
          "You can only join within 10 minutes of the scheduled appointment."
        );
        return;
      }

      navigation.navigate("Call", {
        callId: `${appointment.patientId}_${appointment.professionalId}`,
        callType: "default",
      });
    }}
  >

   <View className="flex-row items-center">
                    <Video size={20} color="#FFFFFF" />
                    <Text className="text-white text-sm font-bold ml-2">Join Session</Text>
                  </View>
  </TouchableOpacity>

              
              </>
            )}
                        <View className="flex-row justify-center items-center gap-3 mt-4">
  <>

            {canConfirm && (
              <TouchableOpacity
                className="h-12 flex-1 rounded-lg justify-center items-center bg-[#34C759] "
                onPress={handleConfirmAppointment}
                disabled={confirming}
              >
                {confirming ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View className="flex-row items-center">
                    <CheckCircle size={20} color="#FFFFFF" />
                    <Text className="text-white text-sm font-bold ml-2">Accept Appointment</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            </>
        <>
            {canCancel && (
              <TouchableOpacity
                className="h-12 flex-1 rounded-lg justify-center items-center bg-[#FF3B30]"
                onPress={handleCancelAppointment}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View className="flex-row items-center">
                    <XCircle size={20} color="#FFFFFF" />
                    <Text className="text-white text-sm font-bold ml-2">Cancel Appointment</Text>
                  </View>
                )}
              </TouchableOpacity>
             
            )}
            </>
   </View>
            {userRole === "professional" && appointment.status === "confirmed" && (
              <View className="flex-row justify-center items-center gap-3 mt-4">
                <TouchableOpacity
                  className="h-12 flex-1 rounded-lg justify-center items-center bg-[#34C759]"
                  onPress={handleCompleteAppointment}
                  disabled={confirming}
                >
                  {confirming ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View className="flex-row items-center">
                      <CheckCircle size={20} color="#FFFFFF" />
                      <Text className="text-white text-sm font-bold ml-2">Complete Appointment</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="h-12 flex-1 rounded-lg justify-center items-center bg-[#FF3B30]"
                  onPress={handleDeclineAppointment}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View className="flex-row items-center">
                      <XCircle size={20} color="#FFFFFF" />
                      <Text className="text-white text-sm font-bold ml-2">Decline Appointment</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* SOAP Notes Modal */}
      {renderSOAPNotesModal()}
    </>
  )
}