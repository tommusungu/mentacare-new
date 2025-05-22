import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { auth, db } from "../../config/firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from "firebase/auth"

export const registerUser = createAsyncThunk(
  "user/register",
  async ({ email, password, name, role, profileData }, { rejectWithValue }) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile
      await updateProfile(user, { displayName: name })

      // Create user document in Firestore
      const userData = {
        uid: user.uid,
        email: user.email,
        name: name,
        role: role,
        createdAt: new Date().toISOString(),
        ...profileData,
      }

      await setDoc(doc(db, "users", user.uid), userData)

      return userData
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const loginUser = createAsyncThunk("user/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid))

    if (userDoc.exists()) {
      return userDoc.data()
    } else {
      return rejectWithValue("User data not found")
    }
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async ({ userId, profileData }, { rejectWithValue }) => {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, profileData)

      // Get updated user data
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        return userDoc.data()
      } else {
        return rejectWithValue("User data not found")
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const logoutUser = createAsyncThunk("user/logout", async (_, { rejectWithValue }) => {
  try {
    await signOut(auth)
    return null
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const userSlice = createSlice({
  name: "user",
  initialState: {
    currentUser: null,
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload
    },
    clearUser: (state) => {
      state.currentUser = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.currentUser = action.payload
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.currentUser = action.payload
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.currentUser = action.payload
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.currentUser = null
      })
  },
})

export const { setUser, clearUser } = userSlice.actions
export default userSlice.reducer

