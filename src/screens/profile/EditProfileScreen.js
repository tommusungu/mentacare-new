"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useNavigation } from "@react-navigation/native"
import { useDispatch, useSelector } from "react-redux"
import { updateUserProfile } from "../../redux/slices/userSlice"
import { useToast } from "react-native-toast-notifications"
import { Check, X, Trash2 } from "lucide-react-native"

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
        certifications: currentUser.certifications || [],
      })
    }
  }, [currentUser])

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
      certifications: [...prev.certifications, { name: "", issuer: "", year: "" }],
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
      // Prepare profile data
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
        profileData.certifications = formData.certifications
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
          {["Male", "Female", "Non-binary", "Prefer not to say"].map((option) => (
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

  const renderProfessionalForm = () =>
    (
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
              className={`h-12 rounded-lg px-4 text-base ${
                isDark
                  ? 'bg-[#1E1E1E] text-white border border-[#2C2C2C]'
                  : 'bg-[#F5F5F5] text-black border border-[#E0E0E0]'
              }`}
              value={cert.year}
              onChangeText={(value) => updateCertification(index, 'year', value)}
              keyboardType="numeric"
            />
          </View>
        ))}
        
        <TouchableOpacity
          className="h-10 rounded-lg justify-center items-center border border-[#ea580c] mb-4"
          onPress={addCertification}
        >
          <Text className="text-[#ea580c] text-base">+ Add Certification</Text>
        </TouchableOpacity>
      </View>
    </>
    )

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#121212]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className={`mt-4 text-base ${isDark ? "text-white" : "text-black"}`}>Loading profile data...</Text>
      </View>
    )
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-[#121212]" : "bg-white"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Edit Profile</Text>

        {userRole === "patient" ? renderPatientForm() : renderProfessionalForm()}

        <View className="flex-row justify-between mt-4">
          <TouchableOpacity
            className="flex-1 h-12 rounded-lg justify-center items-center border border-[#FF3B30] mr-2"
            onPress={handleCancel}
            disabled={saving}
          >
            <View className="flex-row items-center">
              <X size={20} color="#FF3B30" />
              <Text className="text-[#FF3B30] text-base font-bold ml-2">Cancel</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 h-12 rounded-lg justify-center items-center bg-[#ea580c] ml-2"
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center">
                <Check size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-bold ml-2">Save</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

