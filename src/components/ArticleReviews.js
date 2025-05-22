"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import { Star, Send } from "lucide-react-native"
import { db } from "../config/firebase"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
  getDoc,
} from "firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"

const ArticleReviews = ({ articleId, isDark }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reviewText, setReviewText] = useState("")
  const [rating, setRating] = useState(0)
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const getUserData = async () => {
      const id = await AsyncStorage.getItem("userId")
      setUserId(id)

      if (id) {
        const userDoc = await getDoc(doc(db, "users", id))
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || "Anonymous User")
        }
      }
    }

    const fetchReviews = async () => {
      try {
        const reviewsQuery = query(
          collection(db, "articleReviews"),
          where("articleId", "==", articleId),
          orderBy("createdAt", "desc"),
        )

        const reviewsSnapshot = await getDocs(reviewsQuery)
        const reviewsData = []

        reviewsSnapshot.forEach((doc) => {
          reviewsData.push({ id: doc.id, ...doc.data() })
        })

        setReviews(reviewsData)
      } catch (error) {
        console.error("Error fetching reviews:", error)
      } finally {
        setLoading(false)
      }
    }

    getUserData()
    fetchReviews()
  }, [articleId])

  const handleSubmitReview = async () => {
    if (!userId) {
      Alert.alert("Sign In Required", "Please sign in to leave a review")
      return
    }

    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a rating before submitting")
      return
    }

    setSubmitting(true)

    try {
      const reviewData = {
        articleId,
        userId,
        userName,
        rating,
        text: reviewText,
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, "articleReviews"), reviewData)

      // Update article rating in the articles collection
      const newTotalRating = reviews.reduce((sum, review) => sum + review.rating, 0) + rating
      const newAverageRating = newTotalRating / (reviews.length + 1)

      await updateDoc(doc(db, "articles", articleId), {
        ratingCount: increment(1),
        ratingSum: increment(rating),
        avgRating: newAverageRating,
      })

      // Add the new review to the state
      setReviews([
        {
          id: Date.now().toString(), // Temporary ID until refresh
          ...reviewData,
          createdAt: new Date(), // Local timestamp until refresh
        },
        ...reviews,
      ])

      setReviewText("")
      setRating(0)

      Alert.alert("Success", "Your review has been submitted")
    } catch (error) {
      console.error("Error submitting review:", error)
      Alert.alert("Error", "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ""

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  // Calculate average rating
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  if (loading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#ea580c" />
      </View>
    )
  }

  return (
    <View>
      {/* Rating summary */}
      <View className="flex-row items-center mb-4">
        <View className="flex-row">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={16} color="#f59e0b" fill={star <= Math.floor(averageRating) ? "#f59e0b" : "none"} />
          ))}
        </View>
        <Text className={`ml-2 font-medium ${isDark ? "text-white" : "text-black"}`}>
          {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
        </Text>
      </View>

      {/* Add review form */}
      <View className={`p-4 rounded-lg mb-4 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
        <Text className={`font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Leave your review</Text>

        <View className="flex-row mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} className="mr-2">
              <Star
                size={24}
                color={star <= rating ? "#f59e0b" : isDark ? "#3f3f46" : "#d4d4d8"}
                fill={star <= rating ? "#f59e0b" : "none"}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          className={`p-3 rounded-lg ${isDark ? "bg-[#2C2C2C] text-white" : "bg-white text-black"} mb-3`}
          placeholder="Share your thoughts about this article..."
          placeholderTextColor={isDark ? "#AAAAAA" : "#999999"}
          value={reviewText}
          onChangeText={setReviewText}
          multiline={true}
          numberOfLines={3}
        />

        <TouchableOpacity
          className={`flex-row justify-center items-center py-3 rounded-lg ${
            submitting ? "bg-[#ea580c]/70" : "bg-[#ea580c]"
          }`}
          onPress={handleSubmitReview}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Send size={16} color="#FFFFFF" />
              <Text className="text-white font-medium ml-2">Submit Review</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Reviews list */}
      {reviews.length > 0 ? (
        reviews.map((review) => (
          <View key={review.id} className={`p-4 rounded-lg mb-3 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}>
            <View className="flex-row items-center mb-2">
              <View className="w-10 h-10 rounded-full bg-[#ea580c] justify-center items-center mr-2">
                <Text className="text-white font-bold">{review.userName ? review.userName[0].toUpperCase() : "U"}</Text>
              </View>
              <View className="flex-1">
                <Text className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{review.userName}</Text>
                <View className="flex-row items-center">
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={12} color="#f59e0b" fill={star <= review.rating ? "#f59e0b" : "none"} />
                    ))}
                  </View>
                  <Text className={`text-xs ml-2 ${isDark ? "text-white/50" : "text-black/50"}`}>
                    {formatDate(review.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            <Text className={`${isDark ? "text-white/80" : "text-black/80"}`}>{review.text}</Text>
          </View>
        ))
      ) : (
        <Text className={`text-center py-4 ${isDark ? "text-white/50" : "text-black/50"}`}>
          Be the first to review this article!
        </Text>
      )}
    </View>
  )
}

export default ArticleReviews
