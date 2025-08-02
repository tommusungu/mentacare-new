"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation } from "@react-navigation/native"
import { useDispatch, useSelector } from "react-redux"
import { updateUserProfile } from "../../redux/slices/userSlice"
import { useToast } from "react-native-toast-notifications"
import { Check, X, Trash2, Upload, FileText, Camera, CheckCircle } from "lucide-react-native"
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'da0oyre6d'
const CLOUDINARY_UPLOAD_PRESET = 'da0oyre6d'
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`
const CLOUDINARY_UPLOAD_URL_DOC = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`

export default function EditProfileScreen() {
  const { isDark } = useTheme()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const toast = useToast()

  const currentUser = useSelector((state) => state.user.currentUser)
  const userRole = currentUser?.role

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    specialization: "",
    experience: "",
    bio: "",
    age: "",
    gender: "",
    emergencyContact: "",
    education: [],
    certifications: [],
  })

  // ID Card state for professionals
  const [idCard, setIdCard] = useState({
    frontUrl: "",
    backUrl: "",
    frontUploading: false,
    backUploading: false
  })

  useEffect(() => {
    if (currentUser) {
      // Initialize form with current user data
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        title: currentUser.title || "",
        specialization: currentUser.specialization || "",
        experience: currentUser.experience ? String(currentUser.experience) : "",
        bio: currentUser.bio || "",
        age: currentUser.age ? String(currentUser.age) : "",
        gender: currentUser.gender || "",
        emergencyContact: currentUser.emergencyContact || "",
        education: currentUser.education || [],
        certifications: currentUser.certifications?.map(cert => ({ 
          ...cert, 
          uploading: false,
          documentUrl: cert.documentUrl || "",
          documentName: cert.documentName || ""
        })) || [],
      })

      console.log("current user: ",currentUser)
      // Initialize ID card data for professionals
      if (userRole === "professional" && currentUser.identificationCard) {
        setIdCard({
          frontUrl: currentUser.identificationCard.frontUrl || "",
          backUrl: currentUser.identificationCard.backUrl || "",
          frontUploading: false,
          backUploading: false
        })
      }
    }
  }, [currentUser, userRole])

  // Cloudinary upload function for images
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

  // Cloudinary upload function for documents

  const uploadDocumentToCloudinary = async (document) => {
    try {
      const formData = new FormData()
      
      formData.append('file', {
        uri: document.uri,
        type: document.mimeType || 'application/pdf',
        name: document.name || 'document.pdf'
      })
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
      formData.append('resource_type', 'auto')

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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", year: "" }],
    }))
  }

  const updateEducation = (index, field, value) => {
    const newEducation = [...formData.education]
    newEducation[index][field] = value
    setFormData((prev) => ({
      ...prev,
      education: newEducation,
    }))
  }

  const removeEducation = (index) => {
    const newEducation = [...formData.education]
    newEducation.splice(index, 1)
    setFormData((prev) => ({
      ...prev,
      education: newEducation,
    }))
  }

  const addCertification = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { 
        name: "", 
        issuer: "", 
        year: "",
        documentUrl: "",
        documentName: "",
        uploading: false
      }],
    }))
  }

  const updateCertification = (index, field, value) => {
    const newCertifications = [...formData.certifications]
    newCertifications[index][field] = value
    setFormData((prev) => ({
      ...prev,
      certifications: newCertifications,
    }))
  }

  const removeCertification = (index) => {
    const newCertifications = [...formData.certifications]
    newCertifications.splice(index, 1)
    setFormData((prev) => ({
      ...prev,
      certifications: newCertifications,
    }))
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
      const newCertifications = [...formData.certifications]
      newCertifications[index].uploading = true
      setFormData(prev => ({
        ...prev,
        certifications: newCertifications
      }))

      const uploadResult = await uploadDocumentToCloudinary(document)
      
      if (uploadResult.success) {
        newCertifications[index].documentUrl = uploadResult.url
        newCertifications[index].documentName = document.name
        newCertifications[index].uploading = false
        setFormData(prev => ({
          ...prev,
          certifications: newCertifications
        }))
        
        toast.show("Certificate document uploaded successfully!", {
          type: "success",
          placement: "top",
          duration: 3000,
        })
      } else {
        throw new Error(uploadResult.error)
      }
    } catch (error) {
      const newCertifications = [...formData.certifications]
      newCertifications[index].uploading = false
      setFormData(prev => ({
        ...prev,
        certifications: newCertifications
      }))
      
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
        base64: true,
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
        base64: true,
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

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.show("Name is required", {
        type: "warning",
        placement: "top",
        duration: 3000,
      })
      return false
    }

    if (userRole === "professional") {
      if (!formData.title.trim()) {
        toast.show("Professional title is required", {
          type: "warning",
          placement: "top",
          duration: 3000,
        })
        return false
      }

      if (!formData.specialization.trim()) {
        toast.show("Specialization is required", {
          type: "warning",
          placement: "top",
          duration: 3000,
        })
        return false
      }

      // Validate education
      for (const edu of formData.education) {
        if (!edu.degree.trim() || !edu.institution.trim() || !edu.year.trim()) {
          toast.show("Please complete all education fields or remove empty entries", {
            type: "warning",
            placement: "top",
            duration: 3000,
          })
          return false
        }
      }

      // Validate certifications
      for (const cert of formData.certifications) {
        if (!cert.name.trim() || !cert.issuer.trim() || !cert.year.trim()) {
          toast.show("Please complete all certification fields or remove empty entries", {
            type: "warning",
            placement: "top",
            duration: 3000,
          })
          return false
        }
      }
    }

    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const profileData = {
        name: formData.name,
        updatedAt: new Date().toISOString(),
      }

      if (userRole === "professional") {
        profileData.title = formData.title
        profileData.specialization = formData.specialization
        profileData.experience = Number(formData.experience)
        profileData.bio = formData.bio
        profileData.education = formData.education
        profileData.certifications = formData.certifications.map(cert => ({
          name: cert.name,
          issuer: cert.issuer,
          year: cert.year,
          documentUrl: cert.documentUrl,
          documentName: cert.documentName
        }))
        
        // Include ID card data if updated
        if (idCard.frontUrl || idCard.backUrl) {
          profileData.identificationCard = {
            frontUrl: idCard.frontUrl,
            backUrl: idCard.backUrl
          }
        }
      } else {
        profileData.age = Number(formData.age)
        profileData.gender = formData.gender
        profileData.emergencyContact = formData.emergencyContact
      }

      const resultAction = await dispatch(
        updateUserProfile({
          userId: currentUser.uid,
          profileData,
        }),
      )

      if (updateUserProfile.fulfilled.match(resultAction)) {
        toast.show("Profile updated successfully", {
          type: "success",
          placement: "top",
          duration: 3000,
        })
        navigation.goBack()
      } else {
        toast.show("Failed to update profile", {
          type: "danger",
          placement: "top",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.show("An error occurred while updating profile", {
        type: "danger",
        placement: "top",
        duration: 3000,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    Alert.alert("Discard Changes", "Are you sure you want to discard your changes?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes, Discard",
        onPress: () => navigation.goBack(),
        style: "destructive",
      },
    ])
  }

  const renderPatientForm = () => (
    <>
      <View className="mb-6">
        <Text className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Personal Information</Text>

        <Text className={`text-sm mb-1 ${isDark ? "text-white/70" : "text-black/70"}`}>Name</Text>
        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          value={formData.name}
          onChangeText={(value) => handleInputChange("name", value)}
        />

        <Text className={`text-sm mb-1 ${isDark ? "text-white/70" : "text-black/70"}`}>Age</Text>
        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          value={formData.age}
          onChangeText={(value) => handleInputChange("age", value)}
          keyboardType="numeric"
        />

        <Text className={`text-sm mb-1 ${isDark ? "text-white/70" : "text-black/70"}`}>Gender</Text>
        <View className="flex-row flex-wrap mb-4">
          {["Male", "Female", "Prefer not to say"].map((option) => (
            <TouchableOpacity
              key={option}
              className={`mr-2 mb-2 px-4 py-2 rounded-full ${
                formData.gender === option ? "bg-[#ea580c]" : isDark ? "bg-[#2C2C2C]" : "bg-[#E0E0E0]"
              }`}
              onPress={() => handleInputChange("gender", option)}
            >
              <Text className={`${formData.gender === option ? "text-white" : isDark ? "text-white" : "text-black"}`}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className={`text-sm mb-1 ${isDark ? "text-white/70" : "text-black/70"}`}>
          Emergency Contact (Optional)
        </Text>
        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? "bg-[#1E1E1E] text-white border border-[#2C2C2C]"
              : "bg-[#F5F5F5] text-black border border-[#E0E0E0]"
          }`}
          value={formData.emergencyContact}
          onChangeText={(value) => handleInputChange("emergencyContact", value)}
          placeholder="Name and phone number"
          placeholderTextColor={isDark ? "#FFFFFF80" : "#00000080"}
        />
      </View>
    </>
  )

  const renderProfessionalForm = () => (
    <>
      <View className="mb-6">
        <Text className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          Personal Information
        </Text>
        
        <Text className={`text-sm mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          Name
        </Text>
        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
              : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
          }`}
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
        />
      </View>
      
      <View className="mb-6">
        <Text className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          Professional Information
        </Text>
        
        <Text className={`text-sm mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          Professional Title
        </Text>
        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
              : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
          }`}
          value={formData.title}
          onChangeText={(value) => handleInputChange('title', value)}
          placeholder="e.g., Psychologist, Therapist"
          placeholderTextColor={isDark ? '#FFFFFF80' : '#00000080'}
        />
        
        <Text className={`text-sm mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          Specialization
        </Text>
        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
              : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
          }`}
          value={formData.specialization}
          onChangeText={(value) => handleInputChange('specialization', value)}
          placeholder="e.g., Anxiety, Depression, PTSD"
          placeholderTextColor={isDark ? '#FFFFFF80' : '#00000080'}
        />
        
        <Text className={`text-sm mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          Years of Experience
        </Text>
        <TextInput
          className={`h-12 rounded-lg px-4 mb-4 text-base ${
            isDark
              ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
              : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
          }`}
          value={formData.experience}
          onChangeText={(value) => handleInputChange('experience', value)}
          keyboardType="numeric"
        />
        
        <Text className={`text-sm mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          Professional Bio
        </Text>
        <TextInput
          className={`rounded-lg p-4 min-h-[120px] mb-4 text-base ${
            isDark
              ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
              : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
          }`}
          value={formData.bio}
          onChangeText={(value) => handleInputChange('bio', value)}
          multiline
          textAlignVertical="top"
          placeholder="Tell patients about your background and approach"
          placeholderTextColor={isDark ? '#FFFFFF80' : '#00000080'}
        />
      </View>
      
      <View className="mb-6">
        <Text className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          Education
        </Text>
        
        {formData.education.map((edu, index) => (
          <View key={`edu-${index}`} className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                Education #{index + 1}
              </Text>
              {formData.education.length > 1 && (
                <TouchableOpacity onPress={() => removeEducation(index)}>
                  <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
            
            <Text className={`text-xs mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              Degree
            </Text>
            <TextInput
              className={`h-12 rounded-lg px-4 mb-2 text-base ${
                isDark
                  ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
                  : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
              }`}
              value={edu.degree}
              onChangeText={(value) => updateEducation(index, 'degree', value)}
            />
            
            <Text className={`text-xs mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              Institution
            </Text>
            <TextInput
              className={`h-12 rounded-lg px-4 mb-2 text-base ${
                isDark
                  ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
                  : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
              }`}
              value={edu.institution}
              onChangeText={(value) => updateEducation(index, 'institution', value)}
            />
            
            <Text className={`text-xs mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              Year
            </Text>
            <TextInput
              className={`h-12 rounded-lg px-4 text-base ${
                isDark
                  ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
                  : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
              }`}
              value={edu.year}
              onChangeText={(value) => updateEducation(index, 'year', value)}
              keyboardType="numeric"
            />
          </View>
        ))}
        
        <TouchableOpacity
          className="h-10 rounded-lg justify-center items-center border border-[#ea580c] mb-4"
          onPress={addEducation}
        >
          <Text className="text-[#ea580c] text-base">+ Add Education</Text>
        </TouchableOpacity>
      </View>
      
      <View className="mb-6">
        <Text className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          Certifications
        </Text>
        
        {formData.certifications.map((cert, index) => (
          <View key={`cert-${index}`} className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                Certification #{index + 1}
              </Text>
              {formData.certifications.length > 1 && (
                <TouchableOpacity onPress={() => removeCertification(index)}>
                  <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
            
            <Text className={`text-xs mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              Certification Name
            </Text>
            <TextInput
              className={`h-12 rounded-lg px-4 mb-2 text-base ${
                isDark
                  ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
                  : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
              }`}
              value={cert.name}
              onChangeText={(value) => updateCertification(index, 'name', value)}
            />
            
            <Text className={`text-xs mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              Issuing Organization
            </Text>
            <TextInput
              className={`h-12 rounded-lg px-4 mb-2 text-base ${
                isDark
                  ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
                  : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
              }`}
              value={cert.issuer}
              onChangeText={(value) => updateCertification(index, 'issuer', value)}
            />
            
            <Text className={`text-xs mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              Year
            </Text>
            <TextInput
              className={`h-12 rounded-lg px-4 mb-2 text-base ${
                isDark
                  ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
                  : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
              }`}
              value={cert.year}
              onChangeText={(value) => updateCertification(index, 'year', value)}
              keyboardType="numeric"
            />

            {/* Certificate Document Upload */}
            <Text className={`text-xs mb-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              Certificate Document
            </Text>
            <TouchableOpacity
              className={`h-12 rounded-lg px-4 mb-2 flex-row items-center justify-between ${
                isDark
                  ? 'bg-[#1E1E1E] border border-[#2C2C2C]'
                  : 'bg-[#F5F5F5] border border-[#E0E0E0]'
              }`}
              onPress={() => uploadCertificationDocument(index)}
              disabled={cert.uploading}
            >
              <View className="flex-row items-center flex-1">
                {cert.uploading ? (
                  <ActivityIndicator size="small" color="#ea580c" className="mr-2" />
                ) : cert.documentUrl ? (
                  <CheckCircle size={16} color="#10B981" className="mr-2" />
                ) : (
                  <Upload size={16} color={isDark ? '#FFFFFF80' : '#00000080'} className="mr-2" />
                )}
                <Text
                  className={`text-base flex-1 ${
                    cert.documentUrl
                      ? isDark ? 'text-green-400' : 'text-green-600'
                      : isDark ? 'text-white/70' : 'text-black/70'
                  }`}
                  numberOfLines={1}
                >
                  {cert.uploading 
                    ? 'Uploading...' 
                    : cert.documentName || 'Upload Certificate Document'
                  }
                </Text>
              </View>
              <FileText size={16} color={isDark ? '#FFFFFF80' : '#00000080'} />
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity
          className="h-10 rounded-lg justify-center items-center border border-[#ea580c] mb-4"
          onPress={addCertification}
        >
          <Text className="text-[#ea580c] text-base">+ Add Certification</Text>
        </TouchableOpacity>
      </View>

      {/* ID Card Upload Section for Professionals */}
      <View className="mb-6">
        <Text className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          Professional ID Card
        </Text>
        <Text className={`text-xs mb-4 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          Upload clear photos of both sides of your professional ID card for verification
        </Text>

        {/* Front ID Card */}
        <Text className={`text-sm mb-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          Front Side
        </Text>
        <TouchableOpacity
          className={`h-40 rounded-lg mb-4 justify-center items-center ${
            isDark
              ? 'bg-[#1E1E1E] border border-[#2C2C2C]'
              : 'bg-[#F5F5F5] border border-[#E0E0E0]'
          }`}
          onPress={() => showImagePickerOptions('front')}
          disabled={idCard.frontUploading}
        >
          {idCard.frontUploading ? (
            <View className="items-center">
              <ActivityIndicator size="large" color="#ea580c" />
              <Text className={`mt-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Uploading...
              </Text>
            </View>
          ) : idCard.frontUrl ? (
            <View className="items-center w-full h-full">
              <Image 
                source={{ uri: idCard.frontUrl }} 
                className="w-full h-full rounded-lg"
                resizeMode="cover"
              />
              <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <Check size={12} color="white" />
              </View>
            </View>
          ) : (
            <View className="items-center">
              <Camera size={32} color={isDark ? '#FFFFFF80' : '#00000080'} />
              <Text className={`mt-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Upload Front ID
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Back ID Card */}
        <Text className={`text-sm mb-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          Back Side
        </Text>
        <TouchableOpacity
          className={`h-40 rounded-lg mb-4 justify-center items-center ${
            isDark
              ? 'bg-[#1E1E1E] border border-[#2C2C2C]'
              : 'bg-[#F5F5F5] border border-[#E0E0E0]'
          }`}
          onPress={() => showImagePickerOptions('back')}
          disabled={idCard.backUploading}
        >
          {idCard.backUploading ? (
            <View className="items-center">
              <ActivityIndicator size="large" color="#ea580c" />
              <Text className={`mt-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Uploading...
              </Text>
            </View>
          ) : idCard.backUrl ? (
            <View className="items-center w-full h-full">
              <Image 
                source={{ uri: idCard.backUrl }} 
                className="w-full h-full rounded-lg"
                resizeMode="cover"
              />
              <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <Check size={12} color="white" />
              </View>
            </View>
          ) : (
            <View className="items-center">
              <Camera size={32} color={isDark ? '#FFFFFF80' : '#00000080'} />
              <Text className={`mt-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Upload Back ID
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </>
  )

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-black' : 'bg-white'}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-2 ${isDark ? 'text-white' : 'text-black'}`}>Loading profile...</Text>
      </View>
    )
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 border-b ${
        isDark ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'
      }`}>
        <TouchableOpacity onPress={handleCancel}>
          <X size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          Edit Profile
        </Text>
        
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className={`px-4 py-2 rounded-lg ${saving ? 'bg-gray-400' : 'bg-[#ea580c]'}`}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Check size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <ScrollView 
        className="flex-1 px-4 py-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {userRole === "professional" ? renderProfessionalForm() : renderPatientForm()}
      </ScrollView>
    </View>
  )
}