import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { db, runTransaction } from "../../config/firebase"
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, orderBy, setDoc } from "firebase/firestore"

export const createAppointment = createAsyncThunk(
  "appointments/createAppointment",
  async (appointmentData, { rejectWithValue }) => {
    try {
      console.log("Creating appointment with data:", appointmentData)
      
      // First check if the time slot is available
      const appointmentsRef = collection(db, "appointments")
      const q = query(
        appointmentsRef,
        where("professionalId", "==", appointmentData.professionalId),
        where("scheduledFor", "==", appointmentData.scheduledFor),
        where("status", "in", ["pending", "confirmed"])
      )
      
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        throw new Error("Time slot is no longer available")
      }
      
      // Create a new document with a generated ID
      const newAppointmentRef = doc(collection(db, "appointments"))
      const newAppointment = {
        ...appointmentData,
        createdAt: new Date().toISOString(),
        status: "pending",
        id: newAppointmentRef.id
      }
      
      // Use setDoc instead of transaction for simplicity
      await setDoc(newAppointmentRef, newAppointment)
      
      console.log("Appointment created successfully:", newAppointment)
      return newAppointment
    } catch (error) {
      console.error("Error creating appointment:", error)
      return rejectWithValue(error.message)
    }
  }
)

export const fetchUserAppointments = createAsyncThunk(
  "appointments/fetchUserAppointments",
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      console.log(`Fetching appointments for user: ${userId}, role: ${role}`)
      
      // Query based on user role
      const fieldToQuery = role === "professional" ? "professionalId" : "patientId"
      console.log(`Using field to query: ${fieldToQuery}`)

      const q = query(
        collection(db, "appointments"),
        where(fieldToQuery, "==", userId),
        orderBy("scheduledFor", "desc"),
      )

      const querySnapshot = await getDocs(q)
      const appointments = []

      querySnapshot.forEach((doc) => {
        appointments.push({ id: doc.id, ...doc.data() })
      })

      console.log(`Found ${appointments.length} appointments for user: ${userId}`)
      return appointments
    } catch (error) {
      console.error("Error fetching appointments:", error)
      return rejectWithValue(error.message)
    }
  },
)

export const updateAppointmentStatus = createAsyncThunk(
  "appointments/updateStatus",
  async ({ appointmentId, status, notes }, { rejectWithValue }) => {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId)

      const updateData = { status }
      if (notes) updateData.notes = notes

      await updateDoc(appointmentRef, updateData)

      // Get updated appointment
      const appointmentDoc = await getDoc(appointmentRef)
      return { id: appointmentDoc.id, ...appointmentDoc.data() }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const cancelAppointment = createAsyncThunk(
  "appointments/cancel",
  async ({ appointmentId, cancellationReason }, { rejectWithValue }) => {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId)

      await updateDoc(appointmentRef, {
        status: "cancelled",
        cancellationReason,
        cancelledAt: new Date().toISOString(),
      })

      // Get updated appointment
      const appointmentDoc = await getDoc(appointmentRef)
      return { id: appointmentDoc.id, ...appointmentDoc.data() }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const fetchProfessionalAvailability = createAsyncThunk(
  "appointments/fetchAvailability",
  async (professionalId, { rejectWithValue }) => {
    try {
      console.log(`Fetching availability for professional: ${professionalId}`)
      
      // Try to fetch from availability collection first
      const availabilityDoc = await getDoc(doc(db, "availability", professionalId))
      
      if (availabilityDoc.exists()) {
        console.log("Found availability in availability collection")
        const data = availabilityDoc.data()
        // Ensure the data has the correct structure
        return {
          monday: data.monday || [],
          tuesday: data.tuesday || [],
          wednesday: data.wednesday || [],
          thursday: data.thursday || [],
          friday: data.friday || [],
          saturday: data.saturday || [],
          sunday: data.sunday || [],
          lastUpdated: data.lastUpdated,
          professionalId: data.professionalId
        }
      }
      
      console.log("Availability not found in availability collection, checking user document")
      // Fallback to user document
      const userDoc = await getDoc(doc(db, "users", professionalId))
      if (userDoc.exists() && userDoc.data().availability) {
        console.log("Found availability in user document")
        const data = userDoc.data().availability
        // Ensure the data has the correct structure
        return {
          monday: data.monday || [],
          tuesday: data.tuesday || [],
          wednesday: data.wednesday || [],
          thursday: data.thursday || [],
          friday: data.friday || [],
          saturday: data.saturday || [],
          sunday: data.sunday || [],
          lastUpdated: userDoc.data().lastAvailabilityUpdate,
          professionalId
        }
      }
      
      console.log("No availability found, returning default empty availability")
      // Return default empty availability if neither exists
      return {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
        lastUpdated: new Date().toISOString(),
        professionalId
      }
    } catch (error) {
      console.error("Error fetching professional availability:", error)
      return rejectWithValue(error.message)
    }
  }
)

// Add new thunk for checking time slot availability
export const checkTimeSlotAvailability = createAsyncThunk(
  "appointments/checkTimeSlotAvailability",
  async ({ professionalId, scheduledFor }, { rejectWithValue }) => {
    try {
      console.log(`Checking availability for professional: ${professionalId}, scheduledFor: ${scheduledFor}`)
      
      // First check if the time slot is within professional's availability
      const availabilityDoc = await getDoc(doc(db, "availability", professionalId))
      let availability = null
      
      if (availabilityDoc.exists()) {
        console.log("Found availability in availability collection")
        availability = availabilityDoc.data()
      } else {
        console.log("Availability not found in availability collection, checking user document")
        // Fallback to user document
        const userDoc = await getDoc(doc(db, "users", professionalId))
        if (userDoc.exists() && userDoc.data().availability) {
          console.log("Found availability in user document")
          availability = userDoc.data().availability
        }
      }

      if (!availability) {
        console.log("No availability found for professional")
        return false
      }

      const appointmentDate = new Date(scheduledFor)
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      
      // Format time to match the format used in AvailabilitySettingsScreen (HH:mm)
      const hours = appointmentDate.getHours().toString().padStart(2, '0')
      const minutes = appointmentDate.getMinutes().toString().padStart(2, '0')
      const timeString = `${hours}:${minutes}`
      
      console.log(`Checking availability for day: ${dayOfWeek}, time: ${timeString}`)
      console.log(`Available times for ${dayOfWeek}:`, availability[dayOfWeek])

      // Check if the time slot is in the professional's availability
      if (!availability[dayOfWeek]?.includes(timeString)) {
        console.log(`Time slot ${timeString} is not in professional's availability for ${dayOfWeek}`)
        return false
      }

      console.log(`Time slot ${timeString} is in professional's availability for ${dayOfWeek}, checking existing appointments`)
      // Then check if there are any existing appointments for this time slot
      const existingAppointments = await getDocs(
        query(
          collection(db, "appointments"),
          where("professionalId", "==", professionalId),
          where("scheduledFor", "==", scheduledFor),
          where("status", "in", ["pending", "confirmed"])
        )
      )
      
      const isAvailable = existingAppointments.empty
      console.log(`Time slot ${timeString} is ${isAvailable ? 'available' : 'not available'} (existing appointments: ${existingAppointments.size})`)
      return isAvailable
    } catch (error) {
      console.error("Error checking time slot availability:", error)
      return rejectWithValue(error.message)
    }
  }
)

const appointmentSlice = createSlice({
  name: "appointments",
  initialState: {
    appointments: [],
    availability: null,
    loading: false,
    error: null,
    timeSlotAvailable: null,
    availabilityMap: {},
  },
  reducers: {
    clearAvailabilityMap: (state) => {
      state.availabilityMap = {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAppointment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading = false
        state.appointments.unshift(action.payload)
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchUserAppointments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserAppointments.fulfilled, (state, action) => {
        state.loading = false
        state.appointments = action.payload
      })
      .addCase(fetchUserAppointments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        const index = state.appointments.findIndex((appointment) => appointment.id === action.payload.id)
        if (index !== -1) {
          state.appointments[index] = action.payload
        }
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex((appointment) => appointment.id === action.payload.id)
        if (index !== -1) {
          state.appointments[index] = action.payload
        }
      })
      .addCase(fetchProfessionalAvailability.fulfilled, (state, action) => {
        state.availability = action.payload
      })
      .addCase(checkTimeSlotAvailability.fulfilled, (state, action) => {
        state.timeSlotAvailable = action.payload
        if (action.meta.arg) {
          const { scheduledFor } = action.meta.arg
          state.availabilityMap[scheduledFor] = action.payload
        }
      })
      .addCase(checkTimeSlotAvailability.rejected, (state, action) => {
        state.timeSlotAvailable = false
        state.error = action.payload
        if (action.meta.arg) {
          const { scheduledFor } = action.meta.arg
          state.availabilityMap[scheduledFor] = false
        }
      })
  },
})

export const { clearAvailabilityMap } = appointmentSlice.actions
export default appointmentSlice.reducer

