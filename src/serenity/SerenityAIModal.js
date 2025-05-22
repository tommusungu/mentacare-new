import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import React from 'react'
import {X} from "lucide-react-native"
const SerenityAIModal = ({aiModalVisible,setActiveTab,activeTab,renderInfoTab,renderMessagesTab,renderAITab,modalHeight, closeSerenityAI,isDark,modalAnimation}) => {
  return (
      <Modal visible={aiModalVisible} transparent={true} animationType="none" onRequestClose={closeSerenityAI}>
        <View className="flex-1 justify-end bg-black/50 relative">
          <TouchableOpacity
            className="absolute top-2 right-2 z-20 bg-red-600 p-2 rounded-full"
            onPress={closeSerenityAI}
          >
            <X size={24} color={isDark ? "#FFFFFF" : "#FFFFFF"} />
          </TouchableOpacity>
          <Animated.View
            className={`rounded-t-3xl ${isDark ? "bg-[#121212]" : "bg-white"}`}
            style={{
              transform: [
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [modalHeight, 0],
                  }),
                },
              ],
              height: modalHeight,
            }}
          >
            <View>
              <View className="flex-1 justify-center items-center p-4 ">
                <TouchableOpacity
                  onPress={closeSerenityAI}
                  className={` rounded-full w-16 h-2 ${isDark ? "bg-[#bbb]" : "bg-gray-200"}`}
                />
              </View>
            </View>

            <View className="flex-1">
              <View className="flex-row border-b border-gray-200 dark:border-gray-800">
                {["AI", "Messages", "Info"].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    className={`flex-1 py-5 items-center ${activeTab === tab ? "border-b-2 border-[#ea580c]" : ""}`}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text
                      className={`font-medium ${
                        activeTab === tab ? "text-[#ea580c]" : isDark ? "text-white/70" : "text-black/70"
                      }`}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                {activeTab === "AI" && renderAITab()}
                {activeTab === "Messages" && renderMessagesTab()}
                {activeTab === "Info" && renderInfoTab()}
              </KeyboardAvoidingView>
            </View>
          </Animated.View>
        </View>
      </Modal>
  )
}

export default SerenityAIModal