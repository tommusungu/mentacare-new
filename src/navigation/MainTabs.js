import React, { useState } from 'react';
import { View, Text, Animated, Platform, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeIcon, MessageCircle, Calendar, User, Bot, X } from 'lucide-react-native';
import { useTheme } from "../context/ThemeContext"
import { useChat } from "../context/ChatContext"

// Screens - Main Tabs
import HomeScreen from "../screens/HomeScreen"
import ChatNavigator from "./ChatNavigator"
import AppointmentsNavigator from "./AppointmentsNavigator"
import ProfileNavigator from "./ProfileNavigator"

const Tab = createBottomTabNavigator();

// AI Modal Component
const AIModal = ({ visible, onClose, isDark }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={[
              styles.modalTitle,
              { color: isDark ? '#ffffff' : '#000000' }
            ]}>
              AI Assistant
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={[
              styles.modalText,
              { color: isDark ? '#cccccc' : '#666666' }
            ]}>
              How can I help you today?
            </Text>
            
            {/* Add your AI chat interface here */}
            <View style={styles.aiPlaceholder}>
              <Bot size={48} color="#ea580c" />
              <Text style={[
                styles.placeholderText,
                { color: isDark ? '#cccccc' : '#666666' }
              ]}>
                AI Chat Interface Coming Soon
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Floating AI Button Component
const FloatingAIButton = ({ onPress, isDark }) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };
  
  return (
    <Animated.View
      style={[
        styles.floatingButton,
        {
          transform: [{ scale: scaleValue }],
          backgroundColor: '#ea580c',
          ...Platform.select({
            ios: {
              shadowColor: '#ea580c',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          })
        }
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.buttonTouchable}
        activeOpacity={0.8}
      >
        <Bot size={28} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation, isDark }) => {
  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        borderTopColor: isDark ? '#333333' : '#e5e5e5',
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
          },
          android: {
            elevation: 8,
          },
        })
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        
        const getTabLabel = (routeName) => {
          switch(routeName) {
            case 'Home': return 'Home';
            case 'Chat': return 'Chat';
            case 'Appointments': return 'Appointments';
            case 'Profile': return 'Profile';
            default: return routeName;
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={[
              styles.tabIconContainer,
              isFocused && {
                backgroundColor: isDark ? 'rgba(234,88,12,0.2)' : 'rgba(234,88,12,0.1)',
              }
            ]}>
              {options.tabBarIcon?.({ 
                color: isFocused ? '#ea580c' : (isDark ? '#9ca3af' : '#6b7280'),
                size: 22,
                focused: isFocused
              })}
              
              {/* Badge for unread messages */}
              {options.tabBarBadge && (
                <View style={[
                  styles.badge,
                  { borderColor: isDark ? '#1a1a1a' : '#ffffff' }
                ]}>
                  <Text style={styles.badgeText}>
                    {typeof options.tabBarBadge === 'number' ? options.tabBarBadge : ''}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Tab Label */}
            <Text style={[
              styles.tabLabel,
              {
                color: isFocused ? '#ea580c' : (isDark ? '#9ca3af' : '#6b7280'),
                fontWeight: isFocused ? '600' : '400',
              }
            ]}>
              {getTabLabel(route.name)}
            </Text>
            
            {/* Active indicator dot */}
            {isFocused && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainTabs = ({ userId, userRole, userData, onLogout }) => {
  const { isDark } = useTheme();
  const { unreadCount } = useChat();
  const [isAIModalVisible, setIsAIModalVisible] = useState(false);
  
  return (
    <View style={{ flex: 1 }}>
       <Tab.Navigator
            screenOptions={{
              tabBarStyle: {
                backgroundColor: isDark ? "#121212" : "#FFFFFF",
                borderTopColor: isDark ? "#2C2C2C" : "#E0E0E0",
                height: 67,
                paddingBottom: 15,
                // borderTopColor: theme === 'dark' ? '#606060' : '#eeeeee',
                // backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
              },
              tabBarActiveTintColor: "#ea580c",
              tabBarInactiveTintColor: isDark ? "#f3f4f6" : "#4b5563",
              headerShown: false,
              
            }}
          >
            <Tab.Screen
              name="Home"
              options={{
                tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} />,
              }}
            >
              {() => <HomeScreen userRole={userRole} userData={userData} />}
            </Tab.Screen>
      
            <Tab.Screen
              name="Chat"
              options={{
                tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
                tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
              }}
            >
              {() => <ChatNavigator userId={userId} userRole={userRole} />}
            </Tab.Screen>
      
            <Tab.Screen
        name="Appointments"
        options={{
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault()
            navigation.navigate("Appointments", {
              screen: "AppointmentsList", // Reset to the root of the stack
            })
          },
        })}
      >
        {() => <AppointmentsNavigator userId={userId} userRole={userRole} />}
      </Tab.Screen>
      
      
            {/* <Tab.Screen
              name="Notifications"
              options={{
                tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
                tabBarBadge: hasUnread ? "•" : undefined,
              }}
            >
              {() => <NotificationsScreen userId={userId} />}
            </Tab.Screen> */}
      
            <Tab.Screen
              name="Profile"
              options={{
                tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
              }}
      
               listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault()
            navigation.navigate("Profile", {
              screen: "ProfileMain", // Reset to the root of the stack
            })
          },
        })}
              
            >
              {() => <ProfileNavigator userId={userId} userRole={userRole} userData={userData} onLogout={onLogout} />}
            </Tab.Screen>
          </Tab.Navigator>
      
      {/* Floating AI Button */}
      <FloatingAIButton 
        onPress={() => setIsAIModalVisible(true)}
        isDark={isDark}
      />
      
      {/* AI Modal */}
      <AIModal 
        visible={isAIModalVisible}
        onClose={() => setIsAIModalVisible(false)}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Tab Bar Styles
  tabBar: {
    flexDirection: 'row',
    height: 85,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    padding: 6,
    borderRadius: 10,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ea580c',
    marginTop: 2,
  },
  
  // Floating Button Styles
  floatingButton: {
    position: 'absolute',
    bottom: 50, // Halfway inside/outside the tab bar
    alignSelf: 'center', // Center horizontally
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  buttonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  aiPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default MainTabs;