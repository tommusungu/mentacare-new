import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';
import { Image } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Bell } from 'lucide-react-native';

const HomeTopBar = ({userData, isDark, unreadNotifications = 0}) => {
    const navigation = useNavigation();
    const user = userData;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning!";
        if (hour < 18) return "Good Afternoon!";
        return "Good Evening!";
    };

    return (
        <View className={`${isDark ? '#121212' : '#FFFFFF'} py-2 pt-8`}>
            <View className=" flex-row w-full justify-between items-center">
                <View className="flex-row items-center ">
                    <Image
                        source={{ uri: user?.photoURL || 'https://lh3.googleusercontent.com/a/ACg8ocLdNgEU7XrBIQp8mwgtO75axXXKZ9ztOXJ-H-9CzJv9LYEEkzRj=s96-c' }}
                        className="w-12 h-12 rounded-full"
                    />
                    <View className="ml-3 h-12">
                        <Text className="text-orange-600 text-xl">{user?.name || 'User'}</Text>
                        <Text className={` font-semibold text-xs mb-4 mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>{getGreeting()}</Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-2">
                <TouchableOpacity className="p-2 relative" onPress={() => navigation.navigate("Notifications")}>
        <Bell size={24} color={isDark ? "#FFFFFF" : "#000000"} />
        {unreadNotifications > 0 && (
          <View className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
            <Text className="text-white text-xs font-bold">{unreadNotifications}</Text>
          </View>
        )}
      </TouchableOpacity>
                   
                </View>
            </View>
            
        </View>
    );
};

export default HomeTopBar;
