import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const CLOUDINARY_CLOUD_NAME = 'da0oyre6d';
const CLOUDINARY_UPLOAD_PRESET = 'da0oyre6d';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

const CloudinaryImageUploader = () => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const pickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'You need to allow media access to use this feature.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
      uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (selectedImage) => {
    setUploading(true);
    setUploadedUrl(null);

    try {
      const base64Img = `data:image/jpg;base64,${selectedImage.base64}`;

      const formData = new FormData();
      formData.append('file', base64Img);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.secure_url) {
        setUploadedUrl(data.secure_url);
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Pick Image and Upload" onPress={pickImage} disabled={uploading} />
      {uploading && <ActivityIndicator style={{ marginTop: 10 }} />}
      {image && (
        <Image
          source={{ uri: image.uri }}
          style={{ width: 200, height: 200, marginTop: 20, borderRadius: 10 }}
        />
      )}
      {uploadedUrl && (
        <View style={{ marginTop: 20 }}>
          <Text>✅ Uploaded to:</Text>
          <Text selectable style={{ color: 'blue' }}>
            {uploadedUrl}
          </Text>
        </View>
      )}
    </View>
  );
};

export default CloudinaryImageUploader;
