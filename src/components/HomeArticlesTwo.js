"use client"

import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { ChevronRight } from "lucide-react-native"
import { db } from "../config/firebase"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { TouchableRipple } from "react-native-paper"

const screenWidth = Dimensions.get("window").width

const HomeArticlesTwo = ({ isDark, showAll = false }) => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const navigation = useNavigation()

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true)
      try {
        const articlesQuery = showAll
          ? query(collection(db, "articles"), orderBy("createdAt", "desc"))
          : query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(3))

        const articlesSnapshot = await getDocs(articlesQuery)
        const articlesData = []

        articlesSnapshot.forEach((doc) => {
          articlesData.push({ id: doc.id, ...doc.data() })
        })

        setArticles(articlesData)
      } catch (error) {
        console.error("Error fetching articles:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [showAll])

  const handleArticlePress = (article) => {
    navigation.navigate("ArticleScreen", { articleId: article.id })
  }

  const renderArticleItem = ({ item }) => (
    <TouchableRipple
      className={`mr-4 mb-2 overflow-hidden rounded-xl ${isDark ? "" : "bg-white"}`}
      onPress={() => handleArticlePress(item)}
      rippleColor={"#808080"}
      style={{ width: showAll ? screenWidth * 0.9 : screenWidth * 0.8 }}
    >
      <View>
        <Image
          source={{ uri: item.coverImage || "https://via.placeholder.com/400x200?text=Article+Image" }}
          className="w-full h-44 rounded-lg"
          resizeMode="cover"
        />
        <View className="p-3">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                isDark ? "bg-[#2C2C2C] text-white/70" : "bg-[#F5F5F5] text-black/70"
              }`}
            >
              {item.category}
            </Text>
            <Text className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
              {item.readTime || "5 min"} read
            </Text>
          </View>
          <Text className={`text-lg font-bold mt-1 ${isDark ? "text-white" : "text-black"}`}>{item.title}</Text>
          <Text className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-black/70"}`} numberOfLines={2}>
            {item.excerpt}
          </Text>
          <TouchableOpacity className="flex-row items-center mt-2" onPress={() => handleArticlePress(item)}>
            <Text className="text-[#ea580c] font-medium mr-1">Read more</Text>
            <ChevronRight size={16} color="#ea580c" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableRipple>
  )

  if (loading) {
    return (
      <View className="w-full py-8 justify-center items-center">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    )
  }

  if (articles.length === 0) {
    return (
      <View className={`p-4 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}>
        <Text className={`text-center ${isDark ? "text-white" : "text-black"}`}>
          No articles available at the moment
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={articles}
      renderItem={renderArticleItem}
      keyExtractor={(item) => item.id}
      horizontal
      scrollEnabled={true}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingRight: showAll ? 20 : 0,
        paddingBottom: 10,
      }}
    />
  )
}

export default HomeArticlesTwo
