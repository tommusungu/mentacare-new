// src/components/JoinCallButton.js
import React from "react"
import { View, Button } from "react-native"
import { useNavigation } from "@react-navigation/native"

const JoinCallButton = () => {
  const navigation = useNavigation()

  const handleJoinCall = () => {
    navigation.navigate("VideoCall", {
      callId: "test-call", // dummy call ID
      callType: "default", // you can change to 'team' or 'livestream' if needed
    })
  }

  return (
    <View style={{ margin: 20 }}>
      <Button title="Join Call" onPress={handleJoinCall} />
    </View>
  )
}

export default JoinCallButton
