import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { db } from "../../config/firebase"
import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy } from "firebase/firestore"

export const fetchUserNotifications = createAsyncThunk(
  "notifications/fetchUserNotifications",
  async (userId, { rejectWithValue }) => {
    try {
      const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(q)
      const notifications = []

      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() })
      })

      return notifications
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, { read: true })
      return notificationId
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const createNotification = createAsyncThunk(
  "notifications/create",
  async (notificationData, { rejectWithValue }) => {
    try {
      const docRef = await addDoc(collection(db, "notifications"), {
        ...notificationData,
        read: false,
        createdAt: new Date().toISOString(),
      })

      return { id: docRef.id, ...notificationData, read: false }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearNotifications: (state) => {
      state.notifications = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.notifications = action.payload
      })
      .addCase(fetchUserNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex((notification) => notification.id === action.payload)
        if (index !== -1) {
          state.notifications[index].read = true
        }
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.notifications.unshift(action.payload)
      })
  },
})

export const { clearNotifications } = notificationSlice.actions
export default notificationSlice.reducer

