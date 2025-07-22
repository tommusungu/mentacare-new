"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Image,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { ArrowLeft, Search, Filter, X } from "lucide-react-native"
import { db } from "../config/firebase"
import { collection, query, getDocs, where, limit } from "firebase/firestore"
import { useTheme } from "../context/ThemeContext"
import { TouchableRipple } from "react-native-paper"

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const ArticleListScreen = () => {
  const { isDark } = useTheme()
  const navigation = useNavigation()

  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categories, setCategories] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Fetch articles and categories on initial load
  useEffect(() => {
    fetchArticles()
  }, [])

  // Fetch articles when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchArticlesByCategory(selectedCategory)
    } else if (selectedCategory === null && !isSearching) {
      fetchArticles()
    }
  }, [selectedCategory])

  const fetchArticles = async () => {
    try {
      setLoading(true)

      // Simple query without complex ordering or filtering
      const articlesRef = collection(db, "articles")
      const articlesQuery = query(articlesRef, limit(20))
      const articlesSnapshot = await getDocs(articlesQuery)

      const articlesData = []
      const uniqueCategories = new Set()

      articlesSnapshot.forEach((doc) => {
        const data = doc.data()
        articlesData.push({ id: doc.id, ...data })

        // Collect categories
        if (data.category) uniqueCategories.add(data.category)
      })


      const shuffledArticles = shuffleArray(articlesData)
        
      setArticles(shuffledArticles)


      setCategories(Array.from(uniqueCategories))
    } catch (error) {
      console.error("Error fetching articles:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchArticlesByCategory = async (category) => {
    try {
      setLoading(true)

      // Query with category filter
      const articlesRef = collection(db, "articles")
      const articlesQuery = query(articlesRef, where("category", "==", category), limit(20))

      const articlesSnapshot = await getDocs(articlesQuery)
      const articlesData = []

      articlesSnapshot.forEach((doc) => {
        articlesData.push({ id: doc.id, ...doc.data() })
      })

      setArticles(articlesData)
    } catch (error) {
      console.error("Error fetching articles by category:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle search - client-side filtering to avoid Firestore issues
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setIsSearching(false)
      setSearchResults([])
      return
    }

    setIsSearching(true)

    // Client-side filtering instead of complex Firestore queries
    const filteredResults = articles.filter((article) => {
      const title = article.title?.toLowerCase() || ""
      const excerpt = article.excerpt?.toLowerCase() || ""
      const content = article.content?.toLowerCase() || ""
      const searchLower = searchQuery.toLowerCase()

      return title.includes(searchLower) || excerpt.includes(searchLower) || content.includes(searchLower)
    })

    setSearchResults(filteredResults)
  }

  // Filter by category
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category)
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
    setSearchResults([])
  }

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? "#121212" : "#FFFFFF" }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200 dark:border-gray-400">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ArrowLeft size={24} color={isDark ? "#FFFFFF" : "#000000"} />
        </TouchableOpacity>
        <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>Wellness Articles</Text>
      </View>

      {/* Search bar */}
      <View className="p-4">
        <View className="flex-row items-center">
          <View
            className={`flex-1 flex-row items-center px-3 py-2 rounded-lg ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
          >
            <Search size={20} color={isDark ? "#AAAAAA" : "#666666"} />
            <TextInput
              className={`flex-1 ml-2 ${isDark ? "text-white" : "text-black"}`}
              placeholder="Search articles..."
              placeholderTextColor={isDark ? "#AAAAAA" : "#999999"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={clearSearch}>
                <X size={20} color={isDark ? "#AAAAAA" : "#666666"} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            className={`ml-2 p-2 rounded-lg ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}
            onPress={handleSearch}
          >
            <Filter size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              className={`mr-2 px-3 py-1 rounded-full ${
                selectedCategory === category ? "bg-[#ea580c]" : isDark ? "bg-[#2C2C2C]" : "bg-[#F5F5F5]"
              }`}
              onPress={() => handleCategoryFilter(category)}
            >
              <Text
                className={`${
                  selectedCategory === category ? "text-white" : isDark ? "text-white/70" : "text-black/70"
                }`}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Article list */}
      <View className="flex-1 px-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
        ) : isSearching ? (
          searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={({ item }) => (
                <ArticleCard
                  article={item}
                  isDark={isDark}
                  onPress={() => navigation.navigate("ArticleScreen", { articleId: item.id })}
                />
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10 }}
            />
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className={`text-center ${isDark ? "text-white/70" : "text-black/70"}`}>
                No articles found matching "{searchQuery}"
              </Text>
            </View>
          )
        ) : (
          <FlatList
            data={articles}
            renderItem={({ item }) => (
              <ArticleCard
                article={item}
                isDark={isDark}
                onPress={() => navigation.navigate("ArticleScreen", { articleId: item.id })}
              />
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10 }}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-20">
                <Text className={`text-center ${isDark ? "text-white/70" : "text-black/70"}`}>
                  No articles available
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  )
}

// Article card component for search results
const ArticleCard = ({ article, isDark, onPress }) => {
  return (
    <TouchableRipple
      className={`mb-4  overflow-hidden ${isDark ? "bg-[#121212] border-b border-[#303030]" : "bg-white"}`}
      style={{ elevation: 1 }}
      onPress={onPress}
      rippleColor={'#505050'}
    >
      <View>
      {article.coverImage && <Image source={{ uri: article.coverImage }} className="w-full rounded-xl h-44" resizeMode="cover" />}
      <View className="p-3">
        <View className="flex-row justify-between items-center mb-1">
          <Text
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              isDark ? "bg-[#2C2C2C] text-white/70" : "bg-[#F5F5F5] text-black/70"
            }`}
          >
            {article.category || "Wellness"}
          </Text>
          <Text className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
            {article.readTime || "5 min"} read
          </Text>
        </View>

        <Text className={`text-lg font-bold mt-1 ${isDark ? "text-white" : "text-black"}`}>{article.title}</Text>

        <Text className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-black/70"}`} numberOfLines={2}>
          {article.excerpt}
        </Text>
      </View>
      </View>
    </TouchableRipple>
  )
}

export default ArticleListScreen
