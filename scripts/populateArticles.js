/**
 * This script can be run to create the initial article schema in Firestore
 * Use with Node.js
 */

import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Sample articles to populate the database
const sampleArticles = [
  {
    title: "Understanding Anxiety: Causes and Coping Strategies",
    titleLower: "understanding anxiety: causes and coping strategies",
    excerpt: "Learn about the root causes of anxiety and discover effective strategies to manage symptoms.",
    coverImage: "https://images.unsplash.com/photo-1474418397713-7ede21d49118?q=80&w=2053&auto=format&fit=crop",
    category: "Mental Health",
    tags: ["anxiety", "stress", "mental health", "coping strategies"],
    readTime: "5 min",
    authorName: "Dr. Sarah Mitchell",
    authorId: "sample-author-1",
    viewCount: 0,
    ratingCount: 0,
    ratingSum: 0,
    avgRating: 0,
    content: [
      "Anxiety is one of the most common mental health concerns, affecting millions of people worldwide. While occasional anxiety is a normal part of life, persistent, excessive worry can interfere with daily activities and relationships.",
      {
        type: "heading",
        text: "What Causes Anxiety?",
      },
      "Anxiety disorders can develop from a complex set of risk factors including genetics, brain chemistry, personality, and life events. Traumatic experiences, stress from illness, work pressure, financial worries, or relationship problems can all trigger anxiety disorders in susceptible individuals.",
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=2070&auto=format&fit=crop",
        caption: "Stress and anxiety can manifest in many different ways",
      },
      "Research suggests that anxiety disorders run in families, indicating that genetics and neurobiology play an important role. Certain personality traits, such as perfectionism and being easily flustered, may increase vulnerability to anxiety disorders.",
      {
        type: "heading",
        text: "Common Symptoms of Anxiety",
      },
      {
        type: "list",
        items: [
          "Persistent worrying or fear",
          "Feeling restless, wound-up, or on-edge",
          "Physical symptoms like increased heart rate, rapid breathing, sweating, or trembling",
          "Difficulty concentrating or mind going blank",
          "Sleep disturbances",
          "Muscle tension and fatigue",
        ],
      },
      "It's important to remember that anxiety manifests differently in each person, and the symptoms can vary significantly in intensity.",
      {
        type: "heading",
        text: "Effective Coping Strategies",
      },
      "While anxiety disorders are highly treatable, only about one-third of those suffering receive treatment. Here are some evidence-based strategies to manage anxiety:",
      "1. **Deep breathing exercises**: When you're anxious, your breathing becomes shallow and rapid. Practicing deep breathing can help activate your parasympathetic nervous system, which controls relaxation.",
      "2. **Progressive muscle relaxation**: This involves tensing and then releasing different muscle groups to reduce physical tension associated with anxiety.",
      "3. **Mindfulness meditation**: Mindfulness can help you stay grounded in the present moment, rather than getting caught up in anxious thoughts about the future.",
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2022&auto=format&fit=crop",
        caption: "Mindfulness meditation can help manage anxiety symptoms",
      },
      "4. **Regular physical exercise**: Exercise has been shown to decrease overall levels of tension, elevate mood, improve sleep, and boost self-esteem.",
      "5. **Cognitive-behavioral therapy (CBT)**: This therapeutic approach helps change thought patterns that trigger anxiety and teaches practical techniques to manage symptoms.",
      "Remember that while these self-help strategies can be effective, severe anxiety may require professional treatment. If anxiety is significantly impacting your daily life, consider reaching out to a mental health professional.",
    ],
  },
  {
    title: "The Science of Sleep: How Rest Affects Mental Health",
    titleLower: "the science of sleep: how rest affects mental health",
    excerpt: "Discover the crucial connection between quality sleep and your psychological wellbeing.",
    coverImage: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=2060&auto=format&fit=crop",
    category: "Wellness",
    tags: ["sleep", "mental health", "wellness", "self-care"],
    readTime: "7 min",
    authorName: "Dr. James Rodriguez",
    authorId: "sample-author-2",
    viewCount: 0,
    ratingCount: 0,
    ratingSum: 0,
    avgRating: 0,
    content: [
      "Sleep is not merely a time when your body shuts down. Instead, it's an active period during which critical processing, restoration, and strengthening occurs. A growing body of research reveals that sleep quality and mental health are deeply interconnected.",
      {
        type: "heading",
        text: "The Sleep-Mentacareion",
      },
      "The relationship between sleep and mental health is bidirectional. Mental health issues can disrupt sleep, and sleep problems can exacerbate or even cause mental health challenges. During sleep, your brain processes emotional information and consolidates memories, helping you regulate mood and cope with daily stressors.",
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2080&auto=format&fit=crop",
        caption: "Quality sleep is essential for maintaining good mental health",
      },
      "Research has consistently shown that people with insomnia are at significantly higher risk of developing depression and anxiety disorders. Conversely, treating sleep problems can help alleviate symptoms of mental health conditions.",
      {
        type: "heading",
        text: "Sleep Architecture and Mental Health",
      },
      "Sleep consists of multiple stages, including light sleep, deep sleep, and REM (rapid eye movement) sleep. Each stage plays different roles in cognitive functioning and emotional regulation:",
      {
        type: "list",
        items: [
          "Deep sleep helps restore physical energy and boost immune function",
          "REM sleep assists with emotional processing and memory consolidation",
          "The overall sleep cycle helps regulate neurotransmitters like serotonin and dopamine that affect mood",
        ],
      },
      "Disruptions to normal sleep architecture can have serious mental health implications. For example, many people with depression experience abnormal REM sleep patterns, which may contribute to emotional dysregulation and cognitive difficulties.",
      {
        type: "heading",
        text: "How Sleep Deprivation Affects Mental Health",
      },
      "Even short-term sleep deprivation can have significant psychological effects, including:",
      "- Increased irritability and stress sensitivity",
      "- Difficulty concentrating and making decisions",
      "- Heightened emotional reactivity",
      "- Reduced cognitive performance",
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1467987506553-8f3916508521?q=80&w=2070&auto=format&fit=crop",
        caption: "Sleep deprivation can significantly impact mood and cognitive function",
      },
      "Chronic sleep problems have been linked to serious mental health conditions including major depression, anxiety disorders, bipolar disorder, and PTSD. Notably, people with insomnia are ten times more likely to develop depression than those who sleep well.",
      {
        type: "heading",
        text: "Improving Sleep for Better Mental Health",
      },
      "Fortunately, there are many effective strategies to improve sleep quality:",
      "1. **Maintain a consistent sleep schedule**: Go to bed and wake up at the same time every day, even on weekends.",
      "2. **Create a restful environment**: Keep your bedroom dark, quiet, and at a comfortable temperature.",
      "3. **Develop a bedtime routine**: Engage in relaxing activities before bed, such as reading or taking a warm bath.",
      "4. **Limit screen time**: Avoid electronic devices for at least an hour before bedtime, as blue light can interfere with melatonin production.",
      "5. **Watch your diet**: Avoid caffeine, alcohol, and large meals close to bedtime.",
      "6. **Exercise regularly**: Physical activity can promote better sleep, but try to complete workouts at least a few hours before bedtime.",
      "If sleep problems persist despite these measures, consider consulting a healthcare provider. Effective treatments are available for sleep disorders, including cognitive-behavioral therapy for insomnia (CBT-I), which is considered the first-line treatment for chronic sleep problems.",
      "Prioritizing sleep is not a luxury—it's a necessity for mental health and overall wellbeing. By understanding how sleep affects psychological functioning and taking steps to improve sleep quality, you can support both your mental and physical health.",
    ],
  },
  {
    title: "Mindfulness Meditation: A Beginner's Guide",
    titleLower: "mindfulness meditation: a beginner's guide",
    excerpt: "Start your mindfulness journey with these simple techniques anyone can practice.",
    coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2022&auto=format&fit=crop",
    category: "Meditation",
    tags: ["mindfulness", "meditation", "stress relief", "self-care"],
    readTime: "4 min",
    authorName: "Lisa Wong, LMFT",
    authorId: "sample-author-3",
    viewCount: 0,
    ratingCount: 0,
    ratingSum: 0,
    avgRating: 0,
    content: [
      "Mindfulness meditation is a mental training practice that teaches you to slow down racing thoughts, let go of negativity, and calm both your mind and body. It combines meditation with the practice of mindfulness, which is being aware of the present moment without judgment.",
      {
        type: "heading",
        text: "What is Mindfulness?",
      },
      "Mindfulness is the basic human ability to be fully present, aware of where we are and what we're doing, and not overly reactive or overwhelmed by what's going on around us. While mindfulness is something we all naturally possess, it's more readily available to us when we practice on a daily basis.",
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=2070&auto=format&fit=crop",
        caption: "Mindfulness helps us connect with the present moment",
      },
      "Research has shown that mindfulness meditation can reduce stress, anxiety, and depression, improve focus and concentration, and even positively affect physical health markers like blood pressure and immune function.",
      {
        type: "heading",
        text: "Getting Started with Mindfulness Meditation",
      },
      "You don't need any special equipment to practice mindfulness meditation—just a quiet space and a comfortable place to sit. Here's a simple guide to begin your practice:",
      {
        type: "list",
        items: [
          "Find a quiet and comfortable place. Sit in a chair or on the floor with your head, neck, and back straight but not stiff.",
          "Set a time limit. If you're just beginning, it can help to choose a short time, such as 5 or 10 minutes.",
          "Notice your body. Be aware of the sensations, the connection with the floor or chair.",
          "Feel your breath. Follow the sensation of your breath as it goes in and out.",
          "Notice when your mind wanders. Inevitably, your attention will leave the breath and wander to other places. When you notice this, simply return your attention to the breath.",
          "Be kind to your wandering mind. Don't judge yourself or get upset when your mind wanders—this is normal. Just gently bring your attention back to your breath.",
        ],
      },
      {
        type: "heading",
        text: "Simple Mindfulness Exercises for Beginners",
      },
      "If formal meditation seems challenging at first, here are some simpler mindfulness exercises to incorporate into your daily routine:",
      "1. **One-minute breathing**: Close your eyes and focus on your breathing for just one minute.",
      "2. **Mindful observation**: Choose a natural object and focus on it for five minutes, exploring every aspect of its appearance.",
      "3. **Mindful awareness**: Select a routine activity (like brushing your teeth or washing dishes) and give it your full attention.",
      "4. **Body scan**: Slowly focus your attention from head to toe, being aware of sensations throughout your body without judgment.",
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1465189684280-6a8fa9b19a7a?q=80&w=2070&auto=format&fit=crop",
        caption: "A body scan meditation can help connect you with physical sensations",
      },
      "5. **Mindful listening**: Close your eyes and notice all the sounds around you without labeling or judging them.",
      {
        type: "heading",
        text: "Tips for Building a Regular Practice",
      },
      "Like any skill, mindfulness takes practice. Here are some tips to help you establish a regular mindfulness meditation practice:",
      "- **Start small**: Begin with just a few minutes each day and gradually increase the duration.",
      "- **Set a specific time**: Many people find it helpful to meditate first thing in the morning or before bed.",
      "- **Create reminders**: Use phone alerts or sticky notes to remind yourself to practice.",
      "- **Join a group or use an app**: Community support or guided meditation apps can help maintain motivation.",
      "- **Be patient and kind with yourself**: Learning mindfulness is a process—there will be days when it feels easier than others.",
      "Remember that mindfulness is not about achieving a particular state of calm or emptying your mind. It's about being present with whatever is happening, including all your thoughts and feelings, without judgment. The goal is not to stop thinking but to develop a different relationship with your thoughts.",
    ],
  },
  {
    title: "Building Resilience: Bouncing Back from Setbacks",
    titleLower: "building resilience: bouncing back from setbacks",
    excerpt: "Learn practical ways to develop emotional resilience and thrive despite life's challenges.",
    coverImage: "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?q=80&w=1964&auto=format&fit=crop",
    readTime: "6 min",
    category: "Personal Growth",
    tags: ["resilience", "stress management", "personal development", "coping skills"],
    authorName: "Dr. Michael Chen",
    authorId: "sample-author-4",
    viewCount: 0,
    ratingCount: 0,
    ratingSum: 0,
    avgRating: 0,
    content: [
      "Resilience is the ability to adapt well in the face of adversity, trauma, tragedy, or significant stress. It's about bouncing back from difficult experiences and growing stronger from challenges. While some people seem naturally more resilient than others, resilience is not a trait that people either have or don't have—it's a set of skills that can be developed.",
      {
        type: "heading",
        text: "Why Resilience Matters",
      },
      "Life inevitably includes setbacks, disappointments, and difficult periods. Resilient people are better equipped to handle such challenges, maintain their mental health, and continue working toward their goals despite obstacles. Research has shown that resilience is associated with lower rates of depression and anxiety, greater job satisfaction, and improved physical health outcomes.",
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?q=80&w=1974&auto=format&fit=crop",
        caption: "Resilience helps us navigate life's ups and downs",
      },
      "Developing resilience doesn't mean avoiding stress or difficult emotions—rather, it means having the tools to manage these experiences effectively and grow from them.",
      {
        type: "heading",
        text: "Core Components of Resilience",
      },
      "Psychologists have identified several key factors that contribute to resilience:",
      {
        type: "list",
        items: [
          "Strong social connections and support systems",
          "The ability to make realistic plans and take steps to carry them out",
          "A positive view of yourself and confidence in your strengths and abilities",
          "Skills in communication and problem-solving",
          "The capacity to manage strong feelings and impulses",
          "A sense of purpose and meaning in life",
        ],
      },
      "These factors work together to help individuals navigate challenging circumstances and recover from setbacks.",
      {
        type: "heading",
        text: "Practical Strategies to Build Resilience",
      },
      "Building resilience is a personal journey that involves finding strategies that work for your unique situation. Here are some evidence-based approaches to strengthen your resilience:",
      "1. **Nurture social connections**: Prioritize relationships with empathetic and supportive people. Being able to ask for help when you need it is a sign of strength, not weakness.",
      "2. **Practice self-care**: Attend to your own needs and feelings. Engage in activities that you enjoy and find relaxing, such as reading, gardening, or practicing yoga.",
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2020&auto=format&fit=crop",
        caption: "Self-care is essential for building and maintaining resilience",
      },
      "3. **Develop a growth mindset**: See challenges as opportunities to learn and grow rather than insurmountable obstacles. Embrace the belief that abilities can be developed through dedication and hard work.",
      "4. **Set realistic goals**: Break large tasks into smaller, manageable steps. Celebrate your accomplishments, no matter how small, to build momentum and confidence.",
      "5. **Accept change as part of life**: Certain goals may no longer be attainable due to adverse situations. Accepting circumstances that cannot be changed can help you focus on circumstances that you can alter.",
      "6. **Maintain perspective**: Try to consider stressful situations in a broader context and keep a long-term perspective. Avoid blowing events out of proportion.",
      "7. **Cultivate positive emotions**: While acknowledging difficult emotions is important, also make room for positive feelings like joy, gratitude, and hope. Research shows that positive emotions help buffer against stress.",
      "8. **Find purpose and meaning**: Contributing to your community, helping others, or engaging in spiritual practices can provide a sense of purpose and perspective that enhances resilience.",
      {
        type: "heading",
        text: "Resilience During Times of Crisis",
      },
      "Major crises, such as the COVID-19 pandemic, economic downturns, or personal tragedies, can test our resilience in profound ways. During such times, it's especially important to:",
      "- **Acknowledge your feelings**: Allow yourself to experience and express all emotions, including fear, sadness, and frustration.",
      "- **Maintain routines where possible**: Structure provides a sense of normalcy and control.",
      "- **Focus on what you can control**: Direct your energy toward actions that can improve your situation, however small.",
      "- **Look for opportunities for self-discovery**: Many people report finding unexpected strength and personal growth through difficulty.",
      "- **Practice gratitude**: Even in hard times, noticing and appreciating positive aspects of life can build resilience.",
      "Remember that building resilience is an ongoing process, not a destination. It involves developing and practicing skills over time. And while self-help strategies are valuable, seeking professional support when needed is also an important aspect of resilient coping.",
    ],
  },
]

// Function to add articles to Firestore
async function createArticles() {
  try {
    for (const article of sampleArticles) {
      // Add createdAt field with server timestamp
      const articleWithTimestamp = {
        ...article,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "articles"), articleWithTimestamp)
      console.log(`Article added with ID: ${docRef.id}`)
    }
    console.log("All articles added successfully!")
  } catch (error) {
    console.error("Error adding articles:", error)
  }
}

// Run the function
createArticles()
