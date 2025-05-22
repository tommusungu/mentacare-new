import AsyncStorage from "@react-native-async-storage/async-storage";

  export const fetchChatToken = async (userId) => {
    try {
      const response = await fetch('https://task-fusion-server.onrender.com/getToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
  
      const data = await response.json();
      const { chatToken } = data;
  
      if (chatToken) {
        console.log('Chat token fetched:', chatToken);
        return chatToken;
      } else {
        console.error('Chat token is missing from the response.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching chat token:', error);
      return null;
    }
  };