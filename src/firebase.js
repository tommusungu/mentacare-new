import { initializeApp } from "firebase/app"
import { initializeAuth, getReactNativePersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Your web app's Firebase configuration
const firebaseConfig = {
  // apiKey: "YOUR_FIREBASE_API_KEY",
  // authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  // projectId: "YOUR_FIREBASE_PROJECT_ID",
  // storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  // messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  // appId: "YOUR_FIREBASE_APP_ID",

  apiKey: "AIzaSyBQdlS8bHupI5yxl-pg_cQ7kOjIHiSFW4k",
  authDomain: "mentacare-kenya.firebaseapp.com",
  projectId: "mentacare-kenya",
  storageBucket: "mentacare-kenya.firebasestorage.app",
  messagingSenderId: "970317520543",
  appId: "1:970317520543:web:90bff42aa4c3f2af250caa",
  measurementId: "G-6Q9G76BELG"
}

let app
let auth

export const initializeFirebase = () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig)
      // Initialize Auth with AsyncStorage persistence
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      })
      console.log("Firebase initialized successfully")
    }
    return app
  } catch (error) {
    console.error("Error initializing Firebase:", error)
    // Return null or throw error based on your error handling strategy
    return null
  }
}

// Initialize Firebase on import
const firebaseApp = initializeFirebase()

// Export initialized instances
export { auth }
export const db = firebaseApp ? getFirestore(firebaseApp) : null
export const storage = firebaseApp ? getStorage(firebaseApp) : null

