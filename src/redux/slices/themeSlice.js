import { createSlice } from "@reduxjs/toolkit"
import AsyncStorage from "@react-native-async-storage/async-storage"

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    mode: "system", // 'light', 'dark', or 'system'
  },
  reducers: {
    setThemeMode: (state, action) => {
      state.mode = action.payload
      // Save to AsyncStorage
      AsyncStorage.setItem("themeMode", action.payload)
    },
  },
})

export const { setThemeMode } = themeSlice.actions
export default themeSlice.reducer

