"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useDispatch } from "react-redux"
import { updateUserProfile } from "../../redux/slices/userSlice"
import { useToast } from "react-native-toast-notifications"
import { Trash2, Upload, FileText, Camera, CheckCircle } from "lucide-react-native"
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { sendWelcomeEmail } from "../../utils/api"

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'da0oyre6d'
const CLOUDINARY_UPLOAD_PRESET = 'da0oyre6d'
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`
const CLOUDINARY_UPLOAD_URL_DOC = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`

export default function ProfessionalProfileSetupScreen({ navigation, route, onLogin }) {
  const { userData } = route.params
  const { isDark } = useTheme()
  const dispatch = useDispatch()
  const toast = useToast()

  const [title, setTitle] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [experience, setExperience] = useState("")
  const [bio, setBio] = useState("")
  const [education, setEducation] = useState([{ degree: "", institution: "", year: "" }])
  const [certifications, setCertifications] = useState([{ 
    name: "", 
    issuer: "", 
    year: "",
    documentUrl: "",
    documentName: "",
    uploading: false
  }])
  const [idCard, setIdCard] = useState({
    frontUrl: "",
    backUrl: "",
    frontUploading: false,
    backUploading: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Fixed Cloudinary upload function for images
  const uploadImageToCloudinary = async (imageAsset) => {
    try {
      const base64Img = `data:image/jpg;base64,${imageAsset.base64}`
      
      const formData = new FormData()
      formData.append('file', base64Img)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (data.secure_url) {
        return {
          success: true,
          url: data.secure_url,
          publicId: data.public_id
        }
      } else {
        throw new Error(data.error?.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Cloudinary image upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Fixed Cloudinary upload function for documents
  const uploadDocumentToCloudinary = async (document) => {
    try {
      // For documents, we need to handle them differently
      // Create a proper file object for FormData
      const formData = new FormData()
      
      formData.append('file', {
        uri: document.uri,
        type: document.mimeType || 'application/pdf',
        name: document.name || 'document.pdf'
      })
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
      formData.append('resource_type', 'auto') // Let Cloudinary auto-detect

      const response = await fetch(CLOUDINARY_UPLOAD_URL_DOC, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const data = await response.json()
      
      if (data.secure_url) {
        return {
          success: true,
          url: data.secure_url,
          publicId: data.public_id
        }
      } else {
        throw new Error(data.error?.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Cloudinary document upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  const addEducation = () => {
    setEducation([...education, { degree: "", institution: "", year: "" }])
  }

  const removeEducation = (index) => {
    const newEducation = [...education]
    newEducation.splice(index, 1)
    setEducation(newEducation)
  }

  const updateEducation = (index, field, value) => {
    const newEducation = [...education]
    newEducation[index][field] = value
    setEducation(newEducation)
  }

  const addCertification = () => {
    setCertifications([...certifications, { 
      name: "", 
      issuer: "", 
      year: "",
      documentUrl: "",
      documentName: "",
      uploading: false
    }])
  }

  const removeCertification = (index) => {
    const newCertifications = [...certifications]
    newCertifications.splice(index, 1)
    setCertifications(newCertifications)
  }

  const updateCertification = (index, field, value) => {
    const newCertifications = [...certifications]
    newCertifications[index][field] = value
    setCertifications(newCertifications)
  }

  const uploadCertificationDocument = async (index) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false
      })

      if (result.canceled) return

      const document = result.assets[0]

      // Set uploading state
      const newCertifications = [...certifications]
      newCertifications[index].uploading = true
      setCertifications(newCertifications)

      const uploadResult = await uploadDocumentToCloudinary(document)
      
      if (uploadResult.success) {
        newCertifications[index].documentUrl = uploadResult.url
        newCertifications[index].documentName = document.name
        newCertifications[index].uploading = false
        setCertifications(newCertifications)
        
        toast.show("Certificate document uploaded successfully!", {
          type: "success",
          placement: "top",
          duration: 3000,
        })
      } else {
        throw new Error(uploadResult.error)
      }
    } catch (error) {
      const newCertifications = [...certifications]
      newCertifications[index].uploading = false
      setCertifications(newCertifications)
      
      toast.show("Failed to upload document: " + error.message, {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    }
  }

  const showImagePickerOptions = (type) => {
    Alert.alert(
      "Select Image",
      "Choose an option",
      [
        { text: "Camera", onPress: () => openCamera(type) },
        { text: "Gallery", onPress: () => openGallery(type) },
        { text: "Cancel", style: "cancel" }
      ]
    )
  }

  const openCamera = async (type) => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
        base64: true, // Add this to get base64 data
      })

      if (!result.canceled && result.assets[0]) {
        uploadIdCardImage(result.assets[0], type)
      }
    } catch (error) {
      toast.show("Error opening camera: " + error.message, {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    }
  }

  const openGallery = async (type) => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Media library permission is required to select photos')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
        base64: true, // Add this to get base64 data
      })

      if (!result.canceled && result.assets[0]) {
        uploadIdCardImage(result.assets[0], type)
      }
    } catch (error) {
      toast.show("Error opening gallery: " + error.message, {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    }
  }

  const uploadIdCardImage = async (imageAsset, type) => {
    try {
      // Set uploading state
      setIdCard(prev => ({
        ...prev,
        [`${type}Uploading`]: true
      }))

      const uploadResult = await uploadImageToCloudinary(imageAsset)
      
      if (uploadResult.success) {
        setIdCard(prev => ({
          ...prev,
          [`${type}Url`]: uploadResult.url,
          [`${type}Uploading`]: false
        }))
        
        toast.show(`ID card ${type} uploaded successfully!`, {
          type: "success",
          placement: "top",
          duration: 3000,
        })
      } else {
        throw new Error(uploadResult.error)
      }
    } catch (error) {
      setIdCard(prev => ({
        ...prev,
        [`${type}Uploading`]: false
      }))
      
      toast.show(`Failed to upload ID card ${type}: ${error.message}`, {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    }
  }

  const handleComplete = async () => {
    // Validation
    if (!title.trim()) {
      setError("Professional title is required")
      return
    }

    if (!specialization.trim()) {
      setError("Specialization is required")
      return
    }

    if (!experience.trim()) {
      setError("Years of experience is required")
      return
    }

    if (!bio.trim()) {
      setError("Bio is required")
      return
    }

    // Validate education
    for (const edu of education) {
      if (!edu.degree.trim() || !edu.institution.trim() || !edu.year.trim()) {
        setError("Please complete all education fields or remove empty entries")
        return
      }
    }

    // Validate certifications
    for (const cert of certifications) {
      if (!cert.name.trim() || !cert.issuer.trim() || !cert.year.trim()) {
        setError("Please complete all certification fields or remove empty entries")
        return
      }
      if (!cert.documentUrl) {
        setError("Please upload a document for all certifications")
        return
      }
    }

    // Validate ID card
    if (!idCard.frontUrl || !idCard.backUrl) {
      setError("Please upload both front and back of your ID card")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Update user profile in Firestore
      const profileData = {
        title,
        specialization,
        experience: Number.parseInt(experience),
        bio,
        education,
        certifications: certifications.map(cert => ({
          name: cert.name,
          issuer: cert.issuer,
          year: cert.year,
          documentUrl: cert.documentUrl,
          documentName: cert.documentName
        })),
        identificationCard: {
          frontUrl: idCard.frontUrl,
          backUrl: idCard.backUrl
        },
        isProfileComplete: true,
        isVerified: false, // Will need to be verified by admin
        availability: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
        updatedAt: new Date().toISOString(),
      }

      const resultAction = await dispatch(
        updateUserProfile({
          userId: userData.uid,
          profileData,
        }),
      )

      if (updateUserProfile.fulfilled.match(resultAction)) {
         sendWelcomeEmail({
          email: userData.email,
          name: userData.name,
          userType: "professional", // or "professional"
        });

        toast.show("Profile completed successfully!", {
          type: "success",
          placement: "top",
          duration: 3000,
        })

        // Call the login callback to set up Stream clients and complete the auth flow
        onLogin(userData.uid, userData.name, "professional", { ...userData, ...profileData })
      } else {
        setError(resultAction.payload || "Failed to update profile. Please try again.")
        toast.show("Profile update failed", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      }
    } catch (error) {
      setError("Failed to update profile. Please try again.")
      toast.show("Profile update error", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="px-6 py-8">
        <Text className={`text-2xl font-bold mb-6 text-center ${isDark ? "text-white" : "text-black"}`}>
          Professional Profile
        </Text>

        <Text className={`text-base mb-8 text-center ${isDark ? "text-white/80" : "text-black/80"}`}>
          Complete your profile to help patients find and connect with you
        </Text>

        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          placeholder="Professional Title (e.g., Psychologist, Therapist)"
          placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          placeholder="Specialization"
          placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
          value={specialization}
          onChangeText={setSpecialization}
        />

        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          placeholder="Years of Experience"
          placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
          value={experience}
          onChangeText={setExperience}
          keyboardType="numeric"
        />

        <TextInput
          className={`h-24 rounded-lg px-4 py-2 mb-6 text-base ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          placeholder="Professional Bio"
          placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
          value={bio}
          onChangeText={setBio}
          multiline
          textAlignVertical="top"
        />

        <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Education</Text>

        {education.map((edu, index) => (
          <View key={`edu-${index}`} className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                Education #{index + 1}
              </Text>
              {education.length > 1 && (
                <TouchableOpacity onPress={() => removeEducation(index)}>
                  <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              className={`h-12 rounded-lg px-4 mb-2 text-base ${
                isDark
                  ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                  : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
              }`}
              placeholder="Degree"
              placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
              value={edu.degree}
              onChangeText={(value) => updateEducation(index, "degree", value)}
            />

            <TextInput
              className={`h-12 rounded-lg px-4 mb-2 text-base ${
                isDark
                  ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                  : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
              }`}
              placeholder="Institution"
              placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
              value={edu.institution}
              onChangeText={(value) => updateEducation(index, "institution", value)}
            />

            <TextInput
              className={`h-12 rounded-lg px-4 text-base ${
                isDark
                  ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                  : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
              }`}
              placeholder="Year"
              placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
              value={edu.year}
              onChangeText={(value) => updateEducation(index, "year", value)}
              keyboardType="numeric"
            />
          </View>
        ))}

        <TouchableOpacity
          className="h-10 rounded-lg justify-center items-center border border-[#ea580c] mb-6"
          onPress={addEducation}
        >
          <Text className="text-[#ea580c] text-base">+ Add Education</Text>
        </TouchableOpacity>

        <Text className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Certifications</Text>

        {certifications.map((cert, index) => (
          <View key={`cert-${index}`} className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                Certification #{index + 1}
              </Text>
              {certifications.length > 1 && (
                <TouchableOpacity onPress={() => removeCertification(index)}>
                  <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              className={`h-12 rounded-lg px-4 mb-2 text-base ${
                isDark
                  ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                  : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
              }`}
              placeholder="Certification Name"
              placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
              value={cert.name}
              onChangeText={(value) => updateCertification(index, "name", value)}
            />

            <TextInput
              className={`h-12 rounded-lg px-4 mb-2 text-base ${
                isDark
                  ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                  : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
              }`}
              placeholder="Issuing Organization"
              placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
              value={cert.issuer}
              onChangeText={(value) => updateCertification(index, "issuer", value)}
            />

            <TextInput
              className={`h-12 rounded-lg px-4 mb-2 text-base ${
                isDark
                  ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
                  : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
              }`}
              placeholder="Year"
              placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
              value={cert.year}
              onChangeText={(value) => updateCertification(index, "year", value)}
              keyboardType="numeric"
            />

            {/* Certificate Document Upload */}
            <TouchableOpacity
              className={`h-12 rounded-lg px-4 mb-2 flex-row items-center justify-between ${
                isDark
                  ? "bg-[#1E1E1E] border border-[#2C2C2C]"
                  : "bg-[#F5F5F5] border border-[#E0E0E0]"
              }`}
              onPress={() => uploadCertificationDocument(index)}
              disabled={cert.uploading}
            >
              <Text className={`${isDark ? "text-white/60" : "text-black/60"}`}>
                {cert.documentName || "Upload Certificate Document"}
              </Text>
              {cert.uploading ? (
                <ActivityIndicator size="small" color="#ea580c" />
              ) : cert.documentUrl ? (
                <CheckCircle size={20} color="#10B981" />
              ) : (
                <Upload size={20} color="#ea580c" />
              )}
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          className="h-10 rounded-lg justify-center items-center border border-[#ea580c] mb-6"
          onPress={addCertification}
        >
          <Text className="text-[#ea580c] text-base">+ Add Certification</Text>
        </TouchableOpacity>

        {/* Identification Card Section */}
        <Text className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Identification Card</Text>
        <Text className={`text-xs mb-4 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          Upload clear photos of both sides of your professional ID card for verification
        </Text>

        <View className="mb-6">
          {/* ID Front */}
          <Text className={`text-base font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>
            ID Card Front
          </Text>
          <TouchableOpacity
            className={`h-32 rounded-lg mb-4 flex items-center justify-center ${
              isDark
                ? "bg-[#1E1E1E] border border-[#2C2C2C]"
                : "bg-[#F5F5F5] border border-[#E0E0E0]"
            }`}
            onPress={() => showImagePickerOptions('front')}
            disabled={idCard.frontUploading}
          >
            {idCard.frontUploading ? (
              <ActivityIndicator size="large" color="#ea580c" />
            ) : idCard.frontUrl ? (
              <View className="items-center">
                <Image source={{ uri: idCard.frontUrl }} className="w-20 h-12 rounded mb-2" />
                <Text className="text-[#10B981] text-sm">✓ Front Uploaded</Text>
              </View>
            ) : (
              <View className="items-center">
                <Camera size={40} color="#ea580c" />
                <Text className={`mt-2 ${isDark ? "text-white/60" : "text-black/60"}`}>
                  Upload ID Front
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ID Back */}
          <Text className={`text-base font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>
            ID Card Back
          </Text>
          <TouchableOpacity
            className={`h-32 rounded-lg mb-4 flex items-center justify-center ${
              isDark
                ? "bg-[#1E1E1E] border border-[#2C2C2C]"
                : "bg-[#F5F5F5] border border-[#E0E0E0]"
            }`}
            onPress={() => showImagePickerOptions('back')}
            disabled={idCard.backUploading}
          >
            {idCard.backUploading ? (
              <ActivityIndicator size="large" color="#ea580c" />
            ) : idCard.backUrl ? (
              <View className="items-center">
                <Image source={{ uri: idCard.backUrl }} className="w-20 h-12 rounded mb-2" />
                <Text className="text-[#10B981] text-sm">✓ Back Uploaded</Text>
              </View>
            ) : (
              <View className="items-center">
                <Camera size={40} color="#ea580c" />
                <Text className={`mt-2 ${isDark ? "text-white/60" : "text-black/60"}`}>
                  Upload ID Back
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {error ? <Text className="text-[#FF3B30] mb-4 text-center">{error}</Text> : null}

        <TouchableOpacity
          className="h-12 rounded-lg justify-center items-center bg-[#ea580c] mt-6"
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-bold">Complete Profile</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity className="mt-4" onPress={() => navigation.goBack()}>
          <Text className="text-[#ea580c] text-center">Go Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}