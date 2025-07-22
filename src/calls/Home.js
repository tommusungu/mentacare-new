import { View, Text } from 'react-native'
import React from 'react'
import { Button } from 'react-native'
import { useNavigation } from 'expo-router'

const Home = () => {
    const navigation = useNavigation()
  return (
    <View className="flex-1 justify-center items-center bg-gray-100">
      <Text>Home</Text>

      <Button title="Make a call" 
      onPress={()=>navigation.navigate('callpage')}
      />
    </View>
  )
}

export default Home