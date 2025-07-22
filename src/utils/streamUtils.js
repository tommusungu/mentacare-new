// Utility functions for Stream Video
export const createStreamUser = (userId, userName, userData) => {
  if (!userId) {
    console.warn("No userId provided for Stream user")
    return null
  }

  return {
    id: userId,
    name: userName || userData?.name || userData?.displayName || "User",
    image: userData?.profileImage || userData?.avatar || userData?.photoURL,
    // Add any custom data you want to include
    custom: {
      role: userData?.role,
      email: userData?.email,
    },
  }
}

export const validateStreamConfig = (apiKey, user, token) => {
  const errors = []

  if (!apiKey) {
    errors.push("Stream API key is missing")
  }

  if (!user || !user.id) {
    errors.push("Valid user object with id is required")
  }

  if (!token) {
    errors.push("User token is required")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
