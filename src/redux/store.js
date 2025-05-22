import { configureStore } from "@reduxjs/toolkit"
import userReducer from "./slices/userSlice"
import appointmentReducer from "./slices/appointmentSlice"
import notificationReducer from "./slices/notificationSlice"
import themeReducer from "./slices/themeSlice"

export const store = configureStore({
  reducer: {
    user: userReducer,
    appointments: appointmentReducer,
    notifications: notificationReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

