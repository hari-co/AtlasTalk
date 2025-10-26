export interface CountryData {
  name: string
  slug: string
  flag: string
  language: string
  accentColor: string
  heroImage: string
  funFact: string
  scenarios: {
    culture: ScenarioDetail
    language: ScenarioDetail
    education: ScenarioDetail
    economy: ScenarioDetail
    "daily-life": ScenarioDetail
  }
}

export interface ScenarioDetail {
  title: string
  description: string
  situation: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  emoji: string
  tagline: string
  localPhrase?: string
  AGENT: "TAXI" | "GEMINI" | string
}

export const countryDatabase: Record<string, CountryData> = {
  "united-states": {
    name: "United States",
    slug: "united-states",
    flag: "🇺🇸",
    language: "English",
    accentColor: "from-blue-500 to-red-500",
    heroImage: "/new-york-city-skyline-at-sunset.jpg",
    funFact: "The U.S. has no official language at the federal level, though English is the most widely spoken.",
    scenarios: {
      culture: {
        title: "Fourth of July Taxi Ride",
        AGENT: "TAXI",
        tagline: "Experience American hospitality and traditions",
        description: "Experience transit on the busiest day of the year.",
        situation:
          "You're attending a Fourth of July barbecue in a suburban neighborhood. Neighbors are gathering, sharing food, and discussing local community events. How would you navigate an interaction in the taxi on your way there?",
        difficulty: "Beginner",
        emoji: "🎆",
        localPhrase: "Happy Fourth of July!",
      },
      language: {
        title: "Coffee Shop Conversations",
        AGENT: "BARISTA",
        tagline: "Master casual American English",
        description: "Practice everyday slang and expressions",
        situation:
          "You're at a coffee shop in Seattle and overhear locals using phrases like 'grab a bite,' 'hang out,' and 'catch up.' Practice using casual American English in everyday conversations.",
        difficulty: "Intermediate",
        emoji: "☕",
        localPhrase: "Let's grab a coffee!",
      },
      education: {
        title: "College Campus Tour",
        AGENT: "COLLEGE_ADVISOR",
        tagline: "Explore the American education system",
        description: "Learn about liberal arts and campus life",
        situation:
          "You're meeting with a college advisor to discuss the American higher education system, including liberal arts education, student loans, and campus life. What questions would you ask?",
        difficulty: "Beginner",
        emoji: "🎓",
        localPhrase: "Welcome to campus!",
      },
      economy: {
        title: "Startup Pitch Meeting",
        AGENT: "INVESTOR",
        tagline: "Navigate American business culture",
        description: "Present your ideas to investors",
        situation:
          "You're in a business meeting in New York City discussing a startup pitch. The conversation involves venture capital, innovation culture, and entrepreneurship. How would you present your ideas?",
        difficulty: "Advanced",
        emoji: "💼",
        localPhrase: "Let's pitch this idea.",
      },
      "daily-life": {
        title: "A Day in American Life",
        AGENT: "LOCAL_FRIEND",
        tagline: "Experience typical daily routines",
        description: "From coffee runs to evening activities",
        situation:
          "You're spending a day with an American family: morning coffee run, commuting to work, grocery shopping at a supermarket, and evening activities. What aspects of daily life would you explore?",
        difficulty: "Beginner",
        emoji: "🏡",
        localPhrase: "How's it going?",
      },
    },
  },
  china: {
    name: "China",
    slug: "china",
    flag: "🇨🇳",
    language: "Mandarin Chinese",
    accentColor: "from-red-600 to-yellow-500",
    heroImage: "/beijing-traditional-architecture-with-modern-skyli.jpg",
    funFact: "Mandarin Chinese is the most spoken language in the world with over 1 billion speakers.",
    scenarios: {
      culture: {
        title: "Chinese New Year Celebration",
        AGENT: "FAMILY_MEMBER",
        tagline: "Immerse in traditional festivities",
        description: "Join a family celebration",
        situation:
          "You're invited to a traditional Chinese New Year celebration with a local family. Red envelopes, dumplings, and family gatherings are central. How would you participate respectfully in these customs?",
        difficulty: "Intermediate",
        emoji: "🧧",
        localPhrase: "新年快乐 (Xīnnián kuàilè)",
      },
      language: {
        title: "Beijing Market Bargaining",
        AGENT: "MARKET_VENDOR",
        tagline: "Practice Mandarin tones and phrases",
        description: "Navigate a bustling local market",
        situation:
          "You're at a bustling market in Beijing trying to negotiate prices and order food using Mandarin. Practice tones, common phrases, and respectful forms of address.",
        difficulty: "Advanced",
        emoji: "🏮",
        localPhrase: "多少钱？(Duōshǎo qián?)",
      },
      education: {
        title: "Gaokao Preparation Season",
        AGENT: "TEACHER",
        tagline: "Understand Chinese education values",
        description: "Visit a high school during exam prep",
        situation:
          "You're visiting a Chinese high school during Gaokao preparation season. Students are intensely studying for the national college entrance exam. What would you learn about educational values?",
        difficulty: "Intermediate",
        emoji: "📚",
        localPhrase: "加油！(Jiāyóu!)",
      },
      economy: {
        title: "Shanghai Business Meeting",
        AGENT: "BUSINESS_PARTNER",
        tagline: "Build guanxi and partnerships",
        description: "Navigate Chinese business etiquette",
        situation:
          "You're in a business meeting in Shanghai discussing a partnership. The conversation involves guanxi (relationships), long-term thinking, and respect for hierarchy. How would you build trust?",
        difficulty: "Advanced",
        emoji: "🤝",
        localPhrase: "合作愉快 (Hézuò yúkuài)",
      },
      "daily-life": {
        title: "Urban Chinese Lifestyle",
        AGENT: "CITY_RESIDENT",
        tagline: "Experience modern Chinese daily life",
        description: "From tai chi to mobile payments",
        situation:
          "You're spending a day in a Chinese city: morning tai chi in the park, using mobile payment apps, dining at local restaurants, and evening square dancing. What cultural practices would you observe?",
        difficulty: "Beginner",
        emoji: "🥟",
        localPhrase: "你好 (Nǐ hǎo)",
      },
    },
  },
  spain: {
    name: "Spain",
    slug: "spain",
    flag: "🇪🇸",
    language: "Spanish",
    accentColor: "from-red-500 to-yellow-400",
    heroImage: "/spanish-village-fiesta-with-flamenco-dancers.jpg",
    funFact: "Spain has 47 UNESCO World Heritage Sites, the third most in the world.",
    scenarios: {
      culture: {
        title: "Village Fiesta",
        AGENT: "FIESTA_ORGANIZER",
        tagline: "Dance, dine, and celebrate Spanish style",
        description: "Join a traditional celebration",
        situation:
          "You're attending a local fiesta in a Spanish village with flamenco dancing, tapas, and late-night celebrations. How would you immerse yourself in the festive atmosphere?",
        difficulty: "Beginner",
        emoji: "💃",
        localPhrase: "¡Vamos a bailar!",
      },
      language: {
        title: "Madrid Café Conversations",
        AGENT: "CAFÉ_SERVER",
        tagline: "Master Castilian Spanish",
        description: "Practice regional variations",
        situation:
          "You're in a Madrid café practicing Spanish with locals who use 'vosotros' and speak with a Castilian accent. Practice conversational Spanish and regional expressions.",
        difficulty: "Intermediate",
        emoji: "🍷",
        localPhrase: "¿Qué tal?",
      },
      education: {
        title: "Spanish School System",
        AGENT: "TEACHER",
        tagline: "Learn about education and culture",
        description: "Discuss siesta and school schedules",
        situation:
          "You're discussing the Spanish education system with a teacher, including the siesta culture's impact on school schedules and the emphasis on humanities. What would you explore?",
        difficulty: "Intermediate",
        emoji: "🏫",
        localPhrase: "Buenos días",
      },
      economy: {
        title: "Barcelona Business Lunch",
        AGENT: "BUSINESS_COLLEAGUE",
        tagline: "Blend business with personal connection",
        description: "Navigate extended business meals",
        situation:
          "You're in a business lunch in Barcelona that extends for hours. The conversation blends personal relationships with business discussions. How would you adapt to this style?",
        difficulty: "Advanced",
        emoji: "🍽️",
        localPhrase: "Un placer conocerte",
      },
      "daily-life": {
        title: "Spanish Daily Rhythm",
        AGENT: "LOCAL_RESIDENT",
        tagline: "Adapt to the Spanish lifestyle",
        description: "Late dinners and afternoon siestas",
        situation:
          "You're living a day in Spain: late breakfast, afternoon siesta, evening paseo (stroll), and dinner at 10 PM. How would you adjust to the Spanish rhythm of life?",
        difficulty: "Beginner",
        emoji: "🌅",
        localPhrase: "¡Hasta luego!",
      },
    },
  },
  france: {
    name: "France",
    slug: "france",
    flag: "🇫🇷",
    language: "French",
    accentColor: "from-blue-600 to-red-600",
    heroImage: "/parisian-cafe-with-eiffel-tower-in-background.jpg",
    funFact: "French is an official language in 29 countries across five continents.",
    scenarios: {
      culture: {
        title: "French Dinner Party",
        AGENT: "DINNER_HOST",
        tagline: "Engage in sophisticated conversation",
        description: "Experience French dining culture",
        situation:
          "You're invited to a French dinner party where conversation flows from philosophy to politics to art. The meal has multiple courses and lasts hours. How would you engage?",
        difficulty: "Advanced",
        emoji: "🥐",
        localPhrase: "Bon appétit!",
      },
      language: {
        title: "Parisian Café Order",
        AGENT: "WAITER",
        tagline: "Perfect your French pronunciation",
        description: "Practice formal and informal French",
        situation:
          "You're at a Parisian café trying to order in French. The waiter appreciates your effort but corrects your pronunciation. Practice formal and informal French expressions.",
        difficulty: "Intermediate",
        emoji: "🗼",
        localPhrase: "Un café, s'il vous plaît",
      },
      education: {
        title: "French Education System",
        AGENT: "SCHOOL_COUNSELOR",
        tagline: "Explore grandes écoles and philosophy",
        description: "Learn about academic excellence",
        situation:
          "You're learning about the French education system, including the baccalauréat exam, grandes écoles, and the emphasis on philosophy. What aspects interest you most?",
        difficulty: "Intermediate",
        emoji: "📖",
        localPhrase: "Enchanté",
      },
      economy: {
        title: "Paris Business Meeting",
        AGENT: "BUSINESS_MANAGER",
        tagline: "Navigate French formality and debate",
        description: "Present ideas intellectually",
        situation:
          "You're in a business meeting in Paris where formality, intellectual debate, and work-life balance are valued. How would you present ideas in this environment?",
        difficulty: "Advanced",
        emoji: "🎨",
        localPhrase: "Ravi de vous rencontrer",
      },
      "daily-life": {
        title: "French Daily Elegance",
        AGENT: "NEIGHBOR",
        tagline: "Embrace the art of living well",
        description: "From baguettes to apéritifs",
        situation:
          "You're spending a day in France: morning baguette run, leisurely lunch break, afternoon work, and evening apéritif with friends. What French customs would you adopt?",
        difficulty: "Beginner",
        emoji: "🍾",
        localPhrase: "Bonne journée!",
      },
    },
  },
  germany: {
    name: "Germany",
    slug: "germany",
    flag: "🇩🇪",
    language: "German",
    accentColor: "from-gray-800 to-yellow-500",
    heroImage: "/oktoberfest-beer-garden-in-munich.jpg",
    funFact: "Germany has over 1,500 different types of beer and 8,000 breweries.",
    scenarios: {
      culture: {
        title: "Oktoberfest Experience",
        AGENT: "BEER_GARDEN_SERVER",
        tagline: "Celebrate German traditions",
        description: "Join the world's largest festival",
        situation:
          "You're attending Oktoberfest in Munich, experiencing beer gardens, traditional music, and German hospitality. How would you participate in this cultural celebration?",
        difficulty: "Beginner",
        emoji: "🍺",
        localPhrase: "Prost!",
      },
      language: {
        title: "German Language Practice",
        AGENT: "BAKERY_CLERK",
        tagline: "Master compound words and formality",
        description: "Navigate Sie and du",
        situation:
          "You're navigating German compound words and formal/informal address (Sie/du) in various social situations. Practice German language structure and politeness levels.",
        difficulty: "Advanced",
        emoji: "🥨",
        localPhrase: "Guten Tag",
      },
      education: {
        title: "Dual Education System",
        AGENT: "APPRENTICESHIP_COORDINATOR",
        tagline: "Explore vocational training",
        description: "Learn about apprenticeships",
        situation:
          "You're learning about the German dual education system that combines apprenticeships with classroom learning. What would you discover about vocational training?",
        difficulty: "Intermediate",
        emoji: "🔧",
        localPhrase: "Viel Erfolg!",
      },
      economy: {
        title: "Frankfurt Business Culture",
        AGENT: "BANK_MANAGER",
        tagline: "Demonstrate German efficiency",
        description: "Practice punctuality and directness",
        situation:
          "You're in a business meeting in Frankfurt where punctuality, efficiency, and direct communication are highly valued. How would you demonstrate professionalism?",
        difficulty: "Advanced",
        emoji: "⚙️",
        localPhrase: "Sehr gut",
      },
      "daily-life": {
        title: "German Daily Precision",
        AGENT: "LOCAL_RESIDENT",
        tagline: "Experience structured routines",
        description: "From early starts to Kaffee und Kuchen",
        situation:
          "You're spending a day in Germany: early start, structured work hours, afternoon Kaffee und Kuchen, and evening activities. What aspects of German efficiency would you notice?",
        difficulty: "Beginner",
        emoji: "🏰",
        localPhrase: "Wie geht's?",
      },
    },
  },
  japan: {
    name: "Japan",
    slug: "japan",
    flag: "🇯🇵",
    language: "Japanese",
    accentColor: "from-red-500 to-pink-400",
    heroImage: "/kyoto-traditional-tea-ceremony-with-cherry-blossom.jpg",
    funFact: "Japan has three writing systems: hiragana, katakana, and kanji.",
    scenarios: {
      culture: {
        title: "Traditional Tea Ceremony",
        AGENT: "TEA_MASTER",
        tagline: "Experience wa and mindfulness",
        description: "Learn Japanese cultural practices",
        situation:
          "You're attending a traditional tea ceremony in Kyoto, learning about wa (harmony), respect, and mindfulness. How would you show appreciation for these cultural practices?",
        difficulty: "Intermediate",
        emoji: "🍵",
        localPhrase: "いただきます (Itadakimasu)",
      },
      language: {
        title: "Japanese Honorifics",
        AGENT: "OFFICE_RECEPTIONIST",
        tagline: "Master keigo and politeness levels",
        description: "Navigate formal and casual speech",
        situation:
          "You're navigating Japanese keigo (honorific language) in different social contexts, from casual friends to formal business settings. Practice appropriate language levels.",
        difficulty: "Advanced",
        emoji: "🎌",
        localPhrase: "よろしくお願いします (Yoroshiku)",
      },
      education: {
        title: "Japanese School Life",
        AGENT: "HOMEROOM_TEACHER",
        tagline: "Understand group harmony values",
        description: "Explore entrance exams and clubs",
        situation:
          "You're learning about Japanese schools, including entrance exams, club activities, and the emphasis on group harmony. What educational values would you explore?",
        difficulty: "Intermediate",
        emoji: "🏫",
        localPhrase: "頑張って (Ganbatte)",
      },
      economy: {
        title: "Tokyo Business Etiquette",
        AGENT: "COMPANY_SUPERVISOR",
        tagline: "Build consensus and respect hierarchy",
        description: "Master business card exchange",
        situation:
          "You're in a business meeting in Tokyo where consensus-building, respect for hierarchy, and attention to detail are crucial. How would you exchange business cards properly?",
        difficulty: "Advanced",
        emoji: "🏢",
        localPhrase: "お疲れ様です (Otsukaresama)",
      },
      "daily-life": {
        title: "Japanese Urban Life",
        AGENT: "STATION_ATTENDANT",
        tagline: "Navigate modern Tokyo",
        description: "From train commutes to late-night ramen",
        situation:
          "You're spending a day in Japan: morning train commute, convenience store meals, after-work socializing, and late-night ramen. What aspects of Japanese life would you experience?",
        difficulty: "Beginner",
        emoji: "🍜",
        localPhrase: "こんにちは (Konnichiwa)",
      },
    },
  },
  india: {
    name: "India",
    slug: "india",
    flag: "🇮🇳",
    language: "Hindi",
    accentColor: "from-orange-500 to-blue-600",
    heroImage: "/colorful-diwali-celebration-in-delhi-with-lights-a.jpg",
    funFact: "India has 22 officially recognized languages and over 19,500 dialects.",
    scenarios: {
      culture: {
        title: "Diwali Festival of Lights",
        AGENT: "FAMILY_MEMBER",
        tagline: "Celebrate with fireworks and sweets",
        description: "Join a traditional celebration",
        situation:
          "You're attending a colorful Diwali celebration with fireworks, sweets, and family gatherings. How would you participate in this festival of lights?",
        difficulty: "Beginner",
        emoji: "🪔",
        localPhrase: "दीवाली की शुभकामनाएं (Diwali ki shubhkamnayein)",
      },
      language: {
        title: "Delhi Market Hinglish",
        AGENT: "SHOPKEEPER",
        tagline: "Practice Hindi and English mix",
        description: "Navigate urban Indian communication",
        situation:
          "You're in a Delhi market practicing Hindi phrases, navigating the mix of Hindi and English (Hinglish) that's common in urban India. Practice greetings and bargaining.",
        difficulty: "Intermediate",
        emoji: "🛍️",
        localPhrase: "नमस्ते (Namaste)",
      },
      education: {
        title: "Indian Education System",
        AGENT: "COLLEGE_ADMISSIONS_OFFICER",
        tagline: "Explore competitive academics",
        description: "Learn about entrance exams",
        situation:
          "You're learning about India's competitive education system, including coaching centers, engineering/medical entrance exams, and the growing tech education sector.",
        difficulty: "Intermediate",
        emoji: "📱",
        localPhrase: "शुभकामनाएं (Shubhkamnayein)",
      },
      economy: {
        title: "Bangalore Tech Hub",
        AGENT: "IT_PROJECT_MANAGER",
        tagline: "Navigate India's innovation scene",
        description: "Discuss startups and tradition",
        situation:
          "You're in a business meeting in Bangalore's tech hub, discussing innovation, startups, and the blend of traditional and modern business practices. How would you build relationships?",
        difficulty: "Advanced",
        emoji: "💻",
        localPhrase: "धन्यवाद (Dhanyavaad)",
      },
      "daily-life": {
        title: "Vibrant Indian Daily Life",
        AGENT: "LOCAL_RESIDENT",
        tagline: "Experience diverse culture",
        description: "From chai to bustling streets",
        situation:
          "You're spending a day in India: morning chai, navigating busy streets, enjoying diverse cuisine, and experiencing the vibrant social life. What cultural aspects would you notice?",
        difficulty: "Beginner",
        emoji: "🍛",
        localPhrase: "चाय पीजिए (Chai peejiye)",
      },
    },
  },
  brazil: {
    name: "Brazil",
    slug: "brazil",
    flag: "🇧🇷",
    language: "Portuguese",
    accentColor: "from-green-500 to-yellow-400",
    heroImage: "/rio-de-janeiro-carnival-with-samba-dancers-and-col.jpg",
    funFact: "Brazil is the only Portuguese-speaking country in the Americas.",
    scenarios: {
      culture: {
        title: "Carnival in Rio",
        AGENT: "SAMBA_INSTRUCTOR",
        tagline: "Dance to samba and celebrate life",
        description: "Join the world's biggest party",
        situation:
          "You're at a Carnival celebration in Rio de Janeiro with samba music, colorful costumes, and street parties. How would you embrace the Brazilian spirit?",
        difficulty: "Beginner",
        emoji: "🎭",
        localPhrase: "Vamos sambar!",
      },
      language: {
        title: "Brazilian Portuguese",
        AGENT: "BEACH_VENDOR",
        tagline: "Learn the musical rhythm",
        description: "Practice beach conversations",
        situation:
          "You're learning Brazilian Portuguese at a beach in Rio, noticing how it differs from European Portuguese. Practice informal expressions and the musical rhythm of the language.",
        difficulty: "Intermediate",
        emoji: "🏖️",
        localPhrase: "Tudo bem?",
      },
      education: {
        title: "Brazilian Education",
        AGENT: "SCHOOL_ADMINISTRATOR",
        tagline: "Understand the ENEM system",
        description: "Explore educational challenges",
        situation:
          "You're discussing Brazil's education system, including public universities, the ENEM exam, and challenges in educational access. What would you learn?",
        difficulty: "Intermediate",
        emoji: "⚽",
        localPhrase: "Boa sorte!",
      },
      economy: {
        title: "São Paulo Business",
        AGENT: "BUSINESS_PARTNER",
        tagline: "Build warm professional relationships",
        description: "Navigate Brazilian flexibility",
        situation:
          "You're in a business meeting in São Paulo where personal relationships, flexibility, and warmth are important. How would you navigate Brazilian business culture?",
        difficulty: "Advanced",
        emoji: "🌴",
        localPhrase: "Prazer em conhecê-lo",
      },
      "daily-life": {
        title: "Brazilian Lifestyle",
        AGENT: "LOCAL_RESIDENT",
        tagline: "Embrace beach culture and joy",
        description: "From beaches to social gatherings",
        situation:
          "You're spending a day in Brazil: beach culture, late lunches, social gatherings, and evening activities. What aspects of Brazilian lifestyle would you enjoy?",
        difficulty: "Beginner",
        emoji: "🥥",
        localPhrase: "Até logo!",
      },
    },
  },
}

export function getCountryData(slug: string): CountryData | null {
  return countryDatabase[slug] || null
}

export function getAllCountrySlugs(): string[] {
  return Object.keys(countryDatabase)
}
