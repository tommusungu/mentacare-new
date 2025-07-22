import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sparkles, Sun, Moon, Coffee, Heart, Brain, Activity, Clock } from 'lucide-react-native';

const HomeMoodSuggestions = ({isDark}) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const moods = [
    { emoji: "😊", name: "Happy", value: "happy", color: "#10b981" },
    { emoji: "😐", name: "Neutral", value: "neutral", color: "#6b7280" },
    { emoji: "😔", name: "Sad", value: "sad", color: "#06b6d4" },
    { emoji: "😡", name: "Angry", value: "angry", color: "#ef4444" },
    { emoji: "😰", name: "Anxious", value: "anxious", color: "#f97316" }
  ];

  const getTimeOfDay = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return 'late-night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  };

  const getWeather = () => {
    // Simulate weather - in real app this would come from weather API
    const weathers = ['sunny', 'cloudy', 'rainy', 'snowy'];
    return weathers[Math.floor(Math.random() * weathers.length)];
  };

  const getDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[currentTime.getDay()];
  };

  const getPersonalizedSuggestion = () => {
    const timeOfDay = getTimeOfDay();
    const selectedMoodData = moods.find(m => m.value === selectedMood);
    const dayOfWeek = getDayOfWeek();
    const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
    const weather = getWeather();
    
    if (!selectedMood) {
      const welcomeMessages = {
        morning: `Good morning! It's ${dayOfWeek} - how are you starting your day?`,
        afternoon: `Good afternoon! How has your ${dayOfWeek} been treating you so far?`,
        evening: `Good evening! Time to check in - how are you feeling this ${dayOfWeek}?`,
        night: `Good night! Before you rest, how would you describe your mood today?`,
        'late-night': `It's quite late! Take a moment to reflect on how you're feeling right now.`
      };
      
      return {
        title: "Daily Check-in",
        content: welcomeMessages[timeOfDay],
        icon: "Clock",
        color: "#6b7280"
      };
    }

    const suggestions = {
      happy: {
        morning: isWeekend 
          ? "Great weekend vibes! Perfect time for that hobby or activity you love." 
          : "Fantastic energy to start your workday! Tackle your biggest challenge first.",
        afternoon: weather === 'sunny' 
          ? "Your mood matches the sunshine! Consider taking a walk or eating lunch outside." 
          : "Keep that positivity flowing! Share your good mood with colleagues or friends.",
        evening: "What a wonderful day! Capture this feeling by writing down 3 things that went well today.",
        night: "End this positive day with gratitude. Maybe call someone you care about?",
        'late-night': "Even late at night you're feeling good! Channel this into planning something exciting for tomorrow."
      },
      neutral: {
        morning: isWeekend 
          ? "A calm weekend morning - perfect for gentle activities like reading or light exercise." 
          : "Steady start to your workday. Set small, achievable goals to build momentum.",
        afternoon: "Feeling balanced is actually great! Use this stability to tackle routine tasks efficiently.",
        evening: "A peaceful evening ahead. This is ideal for reflection or learning something new.",
        night: "Neutral can be restful. Consider some light stretching or meditation before bed.",
        'late-night': "Sometimes neutral is exactly what we need. Practice some deep breathing and rest well."
      },
      sad: {
        morning: isWeekend 
          ? "Weekends can feel lonely. Reach out to someone or engage in gentle self-care activities."
          : "Difficult start, but you showed up. Be extra kind to yourself today and take breaks.",
        afternoon: weather === 'rainy' 
          ? "Rainy weather can amplify sadness. Make your space cozy with warm lighting or tea."
          : "Mid-day sadness is tough. Step outside for fresh air or call someone who cares about you.",
        evening: "Evenings can feel heavy when sad. Create comfort with soft music, warm drinks, or a bath.",
        night: "Sadness at night feels deeper. Remember: tomorrow brings new possibilities. You're not alone.",
        'late-night': "Late-night sadness is common but hard. Consider reaching out or writing in a journal."
      },
      angry: {
        morning: isWeekend 
          ? "Weekend anger hits different. Try physical activity or tackle a project that needs your energy."
          : "Channel this intensity wisely at work. Take breaks and avoid big decisions when heated.",
        afternoon: "Mid-day anger can derail everything. Take 10 deep breaths and identify what triggered this.",
        evening: "Release this tension before it follows you home. Exercise, vent to someone, or write it out.",
        night: "Don't sleep angry - it affects rest quality. Try progressive muscle relaxation or gentle yoga.",
        'late-night': "Late-night anger amplifies everything. Write down what's bothering you and address it tomorrow."
      },
      anxious: {
        morning: isWeekend 
          ? "Weekend anxiety about the week ahead? Make a gentle plan and focus on just today."
          : "Work anxiety is real. Try the 5-4-3-2-1 grounding technique: 5 things you see, 4 you touch, etc.",
        afternoon: "Midday anxiety spike? Step away from your desk, do breathing exercises, or take a short walk.",
        evening: weather === 'stormy' 
          ? "Storms can increase anxiety. Create a calm space with soft lighting and soothing sounds."
          : "Evening anxiety about tomorrow? Write a simple plan and remind yourself you're prepared.",
        night: "Nighttime anxiety is tough. Try guided meditation apps or calming tea. Limit screen time.",
        'late-night': "3am anxiety thoughts aren't realistic. Keep a notepad nearby - write worries down for tomorrow."
      }
    };

    const moodSuggestions = suggestions[selectedMood] || suggestions.neutral;
    const suggestion = moodSuggestions[timeOfDay] || moodSuggestions.morning;

    return {
      title: `${selectedMoodData.name} ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}`,
      content: suggestion,
      icon: selectedMoodData.emoji,
      color: selectedMoodData.color
    };
  };

  const getTimeIcon = () => {
    const timeOfDay = getTimeOfDay();
    if (timeOfDay === 'morning') return <Sun size={16} color="#f59e0b" />;
    if (timeOfDay === 'night' || timeOfDay === 'late-night') return <Moon size={16} color="#6366f1" />;
    return <Clock size={16} color="#6b7280" />;
  };

  const suggestion = getPersonalizedSuggestion();

  return (
      <View className={`p-4 mt-2 rounded-xl ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`} style={{ elevation: 2 }}>
        {/* Header with time context */}
       

        {/* Question */}
        <View>
          <Text className={`text-base ${isDark ? "text-white/70" : "text-black/70"}`}>
            How are you feeling right now?
          </Text>
          <View className="flex-row items-center mt-1 mb-4 ">
              {getTimeIcon()}
              <Text className={`text-sm ml-1 ${isDark ? "text-white/70" : "text-black/70"}`}>
                {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {getDayOfWeek()}
              </Text>
            </View>
        </View>

        {/* Mood Selection */}
        <View className="flex-row justify-between mb-4">
          {moods.map((mood, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedMood(selectedMood === mood.value ? null : mood.value)}
              className={`w-14 h-14 rounded-full justify-center items-center ${
                isDark ? "bg-[#2C2C2C]" : "bg-[#F5F5F5]"
              }`}
              style={[
                { elevation: 1 },
                selectedMood === mood.value && {
                  borderWidth: 2,
                  borderColor: mood.color,
                  elevation: 3
                }
              ]}
            >
              <Text className="text-2xl">{mood.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected mood indicator */}
        {selectedMood && (
          <View className="mb-4 items-center">
            <View 
              className={`px-3 py-1 rounded-full ${isDark ? "bg-[#2C2C2C]" : "bg-[#F5F5F5]"}`}
              style={{ elevation: 1 }}
            >
              <Text style={{ color: moods.find(m => m.value === selectedMood)?.color, fontSize: 12 }}>
                Feeling {moods.find(m => m.value === selectedMood)?.name}
              </Text>
            </View>
          </View>
        )}

        {/* AI-Powered Suggestion */}
        <View 
          className="p-3 rounded-lg border"
          style={{ 
            backgroundColor: `${suggestion.color}10`, 
            borderColor: `${suggestion.color}20`,
          }}
        >
          <View className="flex-row items-center mb-2">
            <View className="flex-row items-center flex-1">
              {typeof suggestion.icon === 'string' ? (
                <Sparkles size={16} color={suggestion.color} style={{ marginRight: 8 }} />
              ) : (
                <Text style={{ fontSize: 16, marginRight: 8 }}>{suggestion.icon}</Text>
              )}
              <Text 
                className="font-medium text-sm flex-1"
                style={{ color: suggestion.color }}
                numberOfLines={1}
              >
                {suggestion.title}
              </Text>
            </View>
            <Activity size={14} color={suggestion.color} />
          </View>
          <Text 
            className={`text-sm leading-5 ${isDark ? "text-white/90" : "text-black/90"}`}
            style={{ lineHeight: 20 }}
          >
            {suggestion.content}
          </Text>
        </View>

        {/* Additional context info */}
        <View className="mt-3 items-center">
          <View className={`px-3 py-1 rounded-full ${isDark ? "bg-[#2C2C2C]/50" : "bg-[#F5F5F5]"}`}>
            <Text className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
              Personalized for {getTimeOfDay()} • {getDayOfWeek()}
            </Text>
          </View>
        </View>
      </View>
  );
};

export default HomeMoodSuggestions;