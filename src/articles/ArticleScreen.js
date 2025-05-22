"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share, // Import Share
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { ArrowLeft, Star, Clock, Calendar, Share2, ThumbsUp, MessageCircle, Bookmark, Send } from "lucide-react-native"
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { StatusBar } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { db } from "../config/firebase"

const ArticleScreen = ({ route }) => {
  const { articleId } = route.params
  const { isDark } = useTheme()
  const navigation = useNavigation()

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [reviewText, setReviewText] = useState("")
  const [rating, setRating] = useState(0)
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState("")
  const [userAvatar, setUserAvatar] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  // Format date to readable string
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Load the article and reviews
  useEffect(() => {
    const getUserData = async () => {
      const id = await AsyncStorage.getItem("userId")
      setUserId(id)

      if (id) {
        const userDoc = await getDoc(doc(db, "users", id))
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || "Anonymous User")
          setUserAvatar(userDoc.data().avatar || "")
        }
      }
    }

    const fetchArticle = async () => {
      try {
        const articleDoc = await getDoc(doc(db, "articles", articleId))

        if (articleDoc.exists()) {
          setArticle({ id: articleDoc.id, ...articleDoc.data() })

          // Update view count
          await updateDoc(doc(db, "articles", articleId), {
            viewCount: increment(1),
          })
        } else {
          Alert.alert("Error", "Article not found")
          navigation.goBack()
        }
      } catch (error) {
        console.error("Error fetching article:", error)
        Alert.alert("Error", "Failed to load article")
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
    fetchArticle()
    fetchReviews()
  }, [articleId])

  // Calculate average rating
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  // Handle submitting a review
  const handleSubmitReview = async () => {
    if (!userId) {
      Alert.alert("Sign In Required", "Please sign in to leave a review")
      return
    }

    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a rating before submitting")
      return
    }

    setSubmittingReview(true)

    try {
      const reviewData = {
        articleId,
        userId,
        userName,
        userAvatar,
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
      setSubmittingReview(false)
    }
  }

  // Share the article
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this article: ${article.title} - ${article.excerpt}`,
        url: `yourapp://article/${articleId}`,
      })
    } catch (error) {
      console.error("Error sharing article:", error)
    }
  }

  // Render loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: isDark ? "#121212" : "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    )
  }

  // Render article content
  const renderContent = () => {
    if (!article.content) return null

    const content = Array.isArray(article.content) ? article.content : [article.content]

    return content.map((section, index) => {
      if (typeof section === "string") {
        // Render text paragraph
        return (
          <Text key={index} className={`text-base leading-6 mb-4 ${isDark ? "text-white/90" : "text-black/90"}`}>
            {section}
          </Text>
        )
      } else if (section.type === "image") {
        // Render image with caption
        return (
          <View key={index} className="mb-6">
            <Image source={{ uri: section.url }} className="w-full h-56 rounded-lg mb-2" resizeMode="cover" />
            {section.caption && (
              <Text className={`text-sm italic text-center ${isDark ? "text-white/60" : "text-black/60"}`}>
                {section.caption}
              </Text>
            )}
          </View>
        )
      } else if (section.type === "heading") {
        // Render subheading
        return (
          <Text key={index} className={`text-xl font-bold mt-6 mb-3 ${isDark ? "text-white" : "text-black"}`}>
            {section.text}
          </Text>
        )
      } else if (section.type === "list") {
        // Render bulleted list
        return (
          <View key={index} className="mb-4 ml-4">
            {section.items.map((item, i) => (
              <View key={i} className="flex-row mb-2">
                <Text className={`${isDark ? "text-white" : "text-black"} mr-2`}>•</Text>
                <Text className={`flex-1 text-base ${isDark ? "text-white/90" : "text-black/90"}`}>{item}</Text>
              </View>
            ))}
          </View>
        )
      }

      return null
    })
  }

  // Render star rating input
  const renderRatingInput = () => {
    return (
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
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
      style={{ backgroundColor: isDark ? "#121212" : "#FFFFFF" }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView className="flex-1">
        {/* Header Image */}
        <View className="relative">
          <Image
            source={{ uri: article.coverImage || "https://via.placeholder.com/400x200?text=Article+Image" }}
            className="w-full h-56"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/20" />

          {/* Back button */}
          <TouchableOpacity
            className="absolute top-12 left-4 p-2 rounded-full bg-black/20"
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View className="p-4">
          {/* Category and metadata */}
          <View className="flex-row justify-between items-center mb-2">
            <Text
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                isDark ? "bg-[#2C2C2C] text-white/70" : "bg-[#F5F5F5] text-black/70"
              }`}
            >
              {article.category}
            </Text>

            <View className="flex-row items-center">
              <Clock size={14} color={isDark ? "#AAAAAA" : "#666666"} />
              <Text className={`text-xs ml-1 ${isDark ? "text-white/50" : "text-black/50"}`}>
                {article.readTime || "5 min"} read
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className={`text-2xl font-bold mt-2 ${isDark ? "text-white" : "text-black"}`}>{article.title}</Text>

          {/* Author and date */}
          <View className="flex-row items-center mt-3 mb-4">
            <View className="w-8 h-8 rounded-full bg-[#ea580c] justify-center items-center mr-2">
              <Text className="text-white text-xs font-bold">
                {article.authorName ? article.authorName[0].toUpperCase() : "A"}
              </Text>
            </View>
            <View>
              <Text className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                {article.authorName || "Anonymous"}
              </Text>
              <View className="flex-row items-center">
                <Calendar size={12} color={isDark ? "#AAAAAA" : "#666666"} />
                <Text className={`text-xs ml-1 ${isDark ? "text-white/50" : "text-black/50"}`}>
                  {formatDate(article.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Rating summary */}
          <View className="flex-row items-center mb-4 bg-[#ea580c]/5 p-3 rounded-lg">
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  color="#f59e0b"
                  fill={star <= Math.floor(averageRating) ? "#f59e0b" : "none"}
                />
              ))}
            </View>
            <Text className={`ml-2 font-medium ${isDark ? "text-white" : "text-black"}`}>
              {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </Text>
          </View>

          {/* Action buttons */}
          <View className="flex-row justify-around mb-6 pt-2 pb-4 border-t border-b border-gray-200 dark:border-gray-800">
            <TouchableOpacity className="items-center" onPress={() => console.log("Like article")}>
              <ThumbsUp size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`text-xs mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>Like</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center" onPress={handleShare}>
              <Share2 size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`text-xs mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center" onPress={() => console.log("Save article")}>
              <Bookmark size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`text-xs mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center"
              onPress={() => {
                // Scroll to reviews section
                // Implementation depends on your ScrollView ref setup
              }}
            >
              <MessageCircle size={20} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text className={`text-xs mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>Reviews</Text>
            </TouchableOpacity>
          </View>

          {/* Article excerpt/intro */}
          <Text className={`text-base italic mb-4 ${isDark ? "text-white/80" : "text-black/80"}`}>
            {article.excerpt}
          </Text>

          {/* Article content */}
          {renderContent()}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <View className="flex-row flex-wrap mt-4 mb-6">
              {article.tags.map((tag, index) => (
                <Text
                  key={index}
                  className={`text-xs px-3 py-1 mr-2 mb-2 rounded-full ${
                    isDark ? "bg-[#2C2C2C] text-white/70" : "bg-[#F5F5F5] text-black/70"
                  }`}
                >
                  #{tag}
                </Text>
              ))}
            </View>
          )}

          {/* Reviews section */}
          <View className="mt-8 mb-6">
            <Text className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Reviews & Feedback</Text>

            {/* Add review form */}
            <View className={`p-4 rounded-lg mb-6 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
              <Text className={`font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Leave your review</Text>

              {renderRatingInput()}

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
                  submittingReview ? "bg-[#ea580c]/70" : "bg-[#ea580c]"
                }`}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
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
                <View
                  key={review.id}
                  className={`p-4 rounded-lg mb-3 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
                  style={{ elevation: 1 }}
                >
                  <View className="flex-row items-center mb-2">
                    <View className="w-10 h-10 rounded-full bg-[#ea580c] justify-center items-center mr-2">
                      <Text className="text-white font-bold">
                        {review.userName ? review.userName[0].toUpperCase() : "U"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{review.userName}</Text>
                      <View className="flex-row items-center">
                        <View className="flex-row">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              color="#f59e0b"
                              fill={star <= review.rating ? "#f59e0b" : "none"}
                            />
                          ))}
                        </View>
                        <Text className={`text-xs ml-2 ${isDark ? "text-white/50" : "text-black/50"}`}>
                          {review.createdAt && formatDate(review.createdAt)}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ArticleScreen
