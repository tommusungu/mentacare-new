"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { useTheme } from "../../context/ThemeContext"
import { useDispatch } from "react-redux"
import { updateUserProfile } from "../../redux/slices/userSlice"
import { useToast } from "react-native-toast-notifications"
import { Trash2 } from "lucide-react-native"
import { fetchChatToken } from "../../hooks/fetchChatTokenHook"

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
  const [certifications, setCertifications] = useState([{ name: "", issuer: "", year: "" }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
    setCertifications([...certifications, { name: "", issuer: "", year: "" }])
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
        certifications,
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
        toast.show("Profile completed successfully!", {
          type: "success",
          placement: "top",
          duration: 3000,
        })

        // Generate a mock token for Stream - in a real app, this would come from your backend
        const mockToken = await fetchChatToken(userData.uid)
        console.log('mockToken: ',mockToken)

        // Call the login callback to set up Stream clients and complete the auth flow
        onLogin(userData.uid, userData.name, mockToken, "professional", { ...userData, ...profileData })
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
              className={`h-12 rounded-lg px-4 text-base ${
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
          </View>
        ))}

        <TouchableOpacity
          className="h-10 rounded-lg justify-center items-center border border-[#ea580c] mb-6"
          onPress={addCertification}
        >
          <Text className="text-[#ea580c] text-base">+ Add Certification</Text>
        </TouchableOpacity>

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

