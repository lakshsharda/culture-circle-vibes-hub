import admin from 'firebase-admin';
import axios from 'axios';

console.log("[COLD START] recommendations API loaded");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      // Try base64 encoded service account first
      const base64Str = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      console.log("Found base64 service account, length:", base64Str.length);
      try {
        const decoded = Buffer.from(base64Str, 'base64').toString();
        serviceAccount = JSON.parse(decoded);
        console.log("Successfully decoded and parsed service account");
      } catch (decodeError) {
        console.error("Failed to decode/parse base64 service account:", decodeError);
        throw decodeError;
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Fallback to regular JSON string
      console.log("Using fallback FIREBASE_SERVICE_ACCOUNT");
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      console.error('Firebase service account credentials not found in environment variables');
      // Don't throw error here, let the handler deal with it
      console.log("Firebase credentials missing, API will return error when Firebase is accessed");
    }
    
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin initialized successfully");
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    // Don't throw error here, let the handler deal with it
    console.log("Firebase initialization failed, API will return error when Firebase is accessed");
  }
}

// Check if Firebase is properly initialized
let db;
try {
  db = admin.firestore();
} catch (error) {
  console.error('Firebase Firestore not available:', error);
  db = null;
}

// Qloo API config
const QLOO_API_KEY = process.env.QLOO_API_KEY;
const QLOO_BASE_URL = 'https://hackathon.api.qloo.com/v2';

// Gemini API config
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_DEFAULT_MODEL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Recommendation type to Qloo entity mapping
const RECOMMENDATION_TYPE_TO_ENTITY: Record<string, string> = {
  music: 'urn:entity:artist',
  movie: 'urn:entity:movie',
  restaurant: 'urn:entity:place',
  travel: 'urn:entity:destination',
};

// Helper: Fetch group member IDs from Firestore
type GroupDoc = { members: string[] };
async function getGroupMemberIds(groupId: string): Promise<string[]> {
  const groupSnap = await db.collection('groups').doc(groupId).get();
  if (!groupSnap.exists) throw new Error('Group not found');
  const data = groupSnap.data() as GroupDoc;
  if (!data.members || !Array.isArray(data.members) || data.members.length === 0) {
    throw new Error('Group has no members');
  }
  return data.members;
}

// Helper: Fetch user interests from Firestore
interface UserInterests {
  musicArtists?: (string | { name: string; id: string })[];
  movies?: (string | { name: string; id: string })[];
  books?: (string | { name: string; id: string })[];
  cuisines?: (string | { name: string; id: string })[];
  travelDestinations?: (string | { name: string; id: string })[];
  tvShows?: (string | { name: string; id: string })[];
}
async function getUserInterests(userEmail: string): Promise<UserInterests> {
  const usersRef = db.collection('users');
  const q = usersRef.where('email', '==', userEmail).limit(1);
  const userSnap = await q.get();

  if (userSnap.empty) {
    throw new Error(`User with email ${userEmail} not found`);
  }
  return userSnap.docs[0].data() as UserInterests;
}

// Helper: Aggregate interests by type
function aggregateInterests(users: UserInterests[], type: string, log: string[]): string[] {
  const interests = new Set<string>();
  for (const user of users) {
    switch (type) {
      case 'music':
        user.musicArtists?.forEach((a) => {
          // Handle both string and object formats
          if (typeof a === 'string') {
            interests.add(a);
          } else if (a && typeof a === 'object' && a.name) {
            interests.add(a.name);
          }
        });
        break;
      case 'movie':
        user.movies?.forEach((m) => {
          if (typeof m === 'string') {
            interests.add(m);
          } else if (m && typeof m === 'object' && m.name) {
            interests.add(m.name);
          }
        });
        break;
      case 'restaurant':
        user.cuisines?.forEach((c) => {
          if (typeof c === 'string') {
            interests.add(c);
          } else if (c && typeof c === 'object' && c.name) {
            interests.add(c.name);
          }
        });
        break;
      case 'travel':
        user.travelDestinations?.forEach((d) => {
          if (typeof d === 'string') {
            interests.add(d);
          } else if (d && typeof d === 'object' && d.name) {
            interests.add(d.name);
          }
        });
        break;
      default:
        break;
    }
  }
  const finalInterests = Array.from(interests).filter(Boolean);

  // If no interests are found, provide a default set based on type
  if (finalInterests.length === 0) {
    log.push("No specific interests found, using defaults.");
    switch (type) {
      case 'music':
        return ['pop', 'rock', 'electronic']; // Default music genres
      case 'movie':
        return ['action', 'comedy']; // Default movie genres
      case 'restaurant':
        return ['italian', 'mexican']; // Default cuisines
      case 'travel':
        return ['beach', 'city break']; // Default travel types
      default:
        return [];
    }
  }

  return finalInterests;
}

// Helper: Resolve interest names to Qloo entity IDs (optimized)
async function resolveEntities(interests: string[], type: string, log: string[]): Promise<string[]> {
  const entityIds: string[] = [];
  
  // Limit to top 3 interests to reduce API calls
  const limitedInterests = interests.slice(0, 3);
  
  // Make parallel API calls for faster response
  const searchPromises = limitedInterests.map(async (interest) => {
    try {
      const searchUrl = `https://hackathon.api.qloo.com/search`;
      const resp = await axios.get(searchUrl, {
        params: { query: interest },
        headers: { 'x-api-key': QLOO_API_KEY },
        timeout: 5000, // 5 second timeout
      });

      if (resp.data && Array.isArray(resp.data.results) && resp.data.results.length > 0) {
        const result = resp.data.results[0]; // Take first result only
        const foundId = result.entity_id || result.qloo?.id || result.id;
        
        if (foundId) {
          log.push(`SUCCESS: Resolved '${interest}' to ID: ${foundId}`);
          return foundId;
        }
      }
      return null;
    } catch (err) {
      log.push(`AXIOS ERROR for interest '${interest}': ${err.message}`);
      return null;
    }
  });

  // Wait for all searches to complete
  const results = await Promise.all(searchPromises);
  const validIds = results.filter(id => id !== null);
  
  log.push(`Resolved ${validIds.length} out of ${limitedInterests.length} interests`);
  return validIds;
}

// Helper: Get Qloo recommendations (optimized)
async function getQlooRecommendations(entityType: string, entityIds: string[], log: string[], filters: any = {}): Promise<any[]> {
  if (entityIds.length === 0) {
    log.push(`No entity IDs provided for ${entityType}`);
    return [];
  }
  
  // Build params based on entity type and provided filters
  const params: Record<string, any> = {
    'filter.type': entityType,
    'signal.interests.entities': entityIds.join(','),
    take: 3, // Reduced from 5 to 3 for faster response
  };
  
  // Popularity
  if (filters.popularityMin !== undefined) params['filter.popularity.min'] = filters.popularityMin;
  if (filters.popularityMax !== undefined) params['filter.popularity.max'] = filters.popularityMax;
  
  // Year (for movies, books, tv_show, video_game)
  if (['urn:entity:movie', 'urn:entity:book', 'urn:entity:tv_show', 'urn:entity:video_game'].includes(entityType)) {
    if (filters.yearMin !== undefined) {
      if (entityType === 'urn:entity:movie' || entityType === 'urn:entity:tv_show') params['filter.release_year.min'] = filters.yearMin;
      if (entityType === 'urn:entity:book') params['filter.publication_year.min'] = filters.yearMin;
    }
    if (filters.yearMax !== undefined) {
      if (entityType === 'urn:entity:movie' || entityType === 'urn:entity:tv_show') params['filter.release_year.max'] = filters.yearMax;
      if (entityType === 'urn:entity:book') params['filter.publication_year.max'] = filters.yearMax;
    }
  }
  
  // Country/location (for place, destination)
  if (filters.countryCode && (entityType === 'urn:entity:place' || entityType === 'urn:entity:destination')) {
    params['filter.geocode.country_code'] = filters.countryCode;
  }
  
  // Tags
  if (filters.tagIds && Array.isArray(filters.tagIds) && filters.tagIds.length > 0) {
    params['signal.interests.tags'] = filters.tagIds.join(',');
  }
  
  try {
    const resp = await axios.get(`${QLOO_BASE_URL}/insights`, {
      params,
      headers: { 'x-api-key': QLOO_API_KEY },
      timeout: 8000, // 8 second timeout
    });
    
    log.push(`Qloo returned ${resp.data?.data?.length || 0} recommendations for ${entityType}`);
    return resp.data?.data || [];
  } catch (err) {
    log.push(`QLOO INSIGHTS ERROR for ${entityType}: ${err.message}`);
    return [];
  }
}

// Helper: Get instant recommendation (no API calls) - REMOVED HARDCODED RESPONSES
function getInstantRecommendation(users: UserInterests[], categories: string[], type: string): { recommendation: string; alternative: string; harmonyScore: number; vibeAnalysis: string; } | null {
  // Only return null to force AI-generated responses
  return null;
}

// Helper: Call Gemini API (ENHANCED - Context-aware prompts)
async function getGeminiResponseUltraFast(users: UserInterests[], categories: string[], type: string, log: string[]): Promise<{ recommendation: string; alternative: string; harmonyScore: number; vibeAnalysis: string; }> {
  // Extract meaningful interests from users
  const userInterests = users.map(u => ({
    music: u.musicArtists?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean),
    movies: u.movies?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean),
    cuisines: u.cuisines?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean),
    travel: u.travelDestinations?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean),
    books: u.books?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean),
    tvShows: u.tvShows?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean)
  })).filter(u => Object.values(u).some(arr => arr && arr.length > 0));

  // Create entity-specific prompts
  const entityPrompts = {
    'urn:entity:artist': {
      focus: 'music artists and songs',
      instruction: `Create a specific music recommendation for this group. Consider:
1. A curated playlist with specific song titles and artists
2. A music discovery session plan
3. Concert or live music recommendations
4. Genre exploration suggestions

Be specific with artist names, song titles, and actionable steps.`,
      example: `"🎵 **Curated Playlist: Indie Vibes Mix**
• Tame Impala - 'The Less I Know The Better'
• Clairo - 'Pretty Girl' 
• Boy Pablo - 'Everytime'
• Mac DeMarco - 'Chamber of Reflection'

**Why this works:** Combines dreamy vocals with psychedelic rock elements that appeal to your group's diverse tastes."`
    },
    'urn:entity:movie': {
      focus: 'movies and films',
      instruction: `Create a specific movie recommendation for this group. Consider:
1. A movie night lineup with specific film titles
2. A themed movie marathon
3. New releases that match their tastes
4. Hidden gems or cult classics

Be specific with movie titles, genres, and viewing suggestions.`,
      example: `"🎬 **Movie Night: Psychological Thrillers**
• 'Inception' (2010) - Mind-bending sci-fi
• 'The Prestige' (2006) - Mystery thriller
• 'Shutter Island' (2010) - Psychological drama

**Why this works:** These films combine your group's love for complex storytelling and visual effects."`
    },
    'urn:entity:place': {
      focus: 'restaurants and dining experiences',
      instruction: `Create a specific dining recommendation for this group. Consider:
1. Specific restaurant recommendations with cuisine types
2. A progressive dinner plan
3. Food tour suggestions
4. Cooking class or food experience ideas

Be specific with restaurant names, dishes, and dining experiences.`,
      example: `"🍽️ **Progressive Dinner Adventure**
• Appetizers: Dim sum at Golden Dragon (authentic Chinese)
• Main course: Spicy Thai at Bangkok Palace
• Dessert: Gelato at Bella Italia

**Why this works:** This culinary journey satisfies everyone's taste for authentic international flavors."`
    },
    'urn:entity:destination': {
      focus: 'travel destinations and experiences',
      instruction: `Create a specific travel recommendation for this group. Consider:
1. Specific destination recommendations
2. A detailed travel itinerary
3. Cultural experience suggestions
4. Adventure or relaxation activities

Be specific with destinations, activities, and travel tips.`,
      example: `"✈️ **Weekend Getaway: Cultural Immersion**
• Destination: Kyoto, Japan
• Activities: Temple visits, tea ceremony, traditional ryokan stay
• Food: Kaiseki dinner, street food tour

**Why this works:** Combines your group's love for culture, history, and authentic experiences."`
    },
    'urn:entity:book': {
      focus: 'books and reading',
      instruction: `Create a specific book recommendation for this group. Consider:
1. A book club reading list with specific titles
2. Genre exploration suggestions
3. Author recommendations
4. Reading challenge ideas

Be specific with book titles, authors, and reading suggestions.`,
      example: `"📚 **Book Club: Contemporary Fiction**
• 'The Midnight Library' by Matt Haig
• 'Klara and the Sun' by Kazuo Ishiguro
• 'The Seven Husbands of Evelyn Hugo' by Taylor Jenkins Reid

**Why this works:** These books offer thought-provoking themes that will spark great group discussions."`
    },
    'urn:entity:tv_show': {
      focus: 'TV shows and series',
      instruction: `Create a specific TV show recommendation for this group. Consider:
1. A binge-worthy series lineup
2. A themed TV night plan
3. New show recommendations
4. Classic series suggestions

Be specific with show titles, genres, and viewing suggestions.`,
      example: `"📺 **Binge-Worthy Series: Mystery & Drama**
• 'Dark' (Netflix) - German sci-fi thriller
• 'The Good Place' (Netflix) - Philosophical comedy
• 'Mindhunter' (Netflix) - Crime drama

**Why this works:** These shows combine complex storytelling with your group's appreciation for thought-provoking content."`
    },
    'urn:entity:video_game': {
      focus: 'video games and gaming',
      instruction: `Create a specific video game recommendation for this group. Consider:
1. Multiplayer games that work well for groups
2. Single-player games with shared experiences
3. Gaming events or tournaments
4. Game genres that match their interests

Be specific with game titles, platforms, and gaming suggestions.`,
      example: `"🎮 **Group Gaming Night: Cooperative Adventures**
• 'Overcooked 2' - Chaotic cooking cooperation
• 'Among Us' - Social deduction fun
• 'Minecraft' - Creative building together

**Why this works:** These games encourage teamwork and social interaction while being accessible to different skill levels."`
    },
    'urn:entity:podcast': {
      focus: 'podcasts and audio content',
      instruction: `Create a specific podcast recommendation for this group. Consider:
1. Podcast series that match their interests
2. Listening party suggestions
3. Discussion topics based on episodes
4. Audio content for different activities

Be specific with podcast titles, episodes, and listening suggestions.`,
      example: `"🎧 **Podcast Club: Thought-Provoking Discussions**
• 'This American Life' - Storytelling excellence
• 'Radiolab' - Science and curiosity
• 'The Moth' - Personal storytelling

**Why this works:** These podcasts offer engaging content that will spark meaningful group discussions."`
    },
    'urn:entity:brand': {
      focus: 'brands and products',
      instruction: `Create a specific brand recommendation for this group. Consider:
1. Product recommendations that match their lifestyle
2. Brand experiences or events
3. Shopping or discovery suggestions
4. Lifestyle brand alignments

Be specific with brand names, products, and experience suggestions.`,
      example: `"🛍️ **Lifestyle Brand Discovery**
• Patagonia - Sustainable outdoor gear
• Glossier - Minimalist beauty essentials
• Allbirds - Comfortable sustainable footwear

**Why this works:** These brands align with your group's values of sustainability and quality."`
    },
    'multi-category': {
      focus: 'multi-category experiences',
      instruction: `Create a comprehensive recommendation that combines multiple categories. Consider:
1. A themed event that incorporates different interests
2. A progressive experience across multiple categories
3. A cultural immersion that touches on various aspects
4. A discovery journey through different media types

Be specific with activities, venues, and experience details.`,
      example: `"🎉 **Cultural Immersion Night**
• Music: Live jazz performance
• Food: International tapas tasting
• Art: Gallery walk with local artists
• Conversation: Cultural exchange activities

**Why this works:** This multi-sensory experience appeals to everyone's interests while creating shared memories."`
    }
  };

  // Determine the primary category for focused recommendations
  const primaryCategory = categories.length === 1 ? categories[0] : categories[0];
  const promptConfig = entityPrompts[primaryCategory] || entityPrompts['urn:entity:artist'];

  // Create a detailed, context-rich prompt
  const prompt = `You are CultureCircle AI, an expert in creating personalized recommendations for groups.

**Group Interests Analysis:**
${JSON.stringify(userInterests, null, 2)}

**Requested Categories:** ${categories.join(', ')}

**Your Task:** ${promptConfig.instruction}

**Requirements:**
1. Be SPECIFIC with names, titles, and actionable steps
2. Consider the group's diverse interests and find common ground
3. Provide a clear "why this works" explanation
4. Suggest an alternative option
5. Calculate a harmony score (0-100) based on interest overlap

**Response Format (JSON only):**
{
  "recommendation": "Specific, detailed recommendation with names/titles",
  "whyThisWorks": "Clear explanation of why this fits the group",
  "alternative": "Alternative specific suggestion",
  "harmonyScore": 85
}

**Example Response:**
${promptConfig.example}

Now create a recommendation for this specific group based on their interests.`;

  try {
    const resp = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 800,
          candidateCount: 1
        }
      },
      {
        timeout: 12000
      }
    );
    
    const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    log.push(`Raw Gemini response: ${text}`);
    
    // Enhanced JSON parsing with multiple fallback methods
    let parsed: any = null;
    
    // Method 1: Look for JSON object with regex (most common)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        log.push(`Failed to parse JSON match: ${e.message}`);
      }
    }
    
    // Method 2: Try parsing the entire response
    if (!parsed) {
      try {
        parsed = JSON.parse(text.trim());
      } catch (e) {
        log.push(`Failed to parse entire response as JSON: ${e.message}`);
      }
    }
    
    // Method 3: If still no JSON, create a structured response from the text
    if (!parsed) {
      log.push(`Could not extract JSON, creating structured response from text`);
      
      // Try to extract meaningful parts from the text
      const lines = text.split('\n').filter(line => line.trim());
      const recommendation = lines.find(line => line.includes('🎵') || line.includes('🎬') || line.includes('🍽️') || line.includes('✈️') || line.includes('📚') || line.includes('📺')) || lines[0] || "Specific recommendation based on your group's interests.";
      
      const whyThisWorks = lines.find(line => line.toLowerCase().includes('why') || line.toLowerCase().includes('works') || line.toLowerCase().includes('because')) || "This recommendation combines your group's diverse interests to create a shared experience everyone will enjoy.";
      
      const alternative = lines.find(line => line.toLowerCase().includes('alternative') || line.toLowerCase().includes('also') || line.toLowerCase().includes('try')) || "Consider exploring similar genres or themes together as a group.";
      
      parsed = {
        recommendation,
        whyThisWorks,
        alternative,
        harmonyScore: 75
      };
    }
    
    // Extract values with proper fallbacks
    const recommendation = parsed.recommendation || "Based on your group's interests, I recommend exploring shared cultural experiences together.";
    const alternative = parsed.alternative || "Consider trying something completely new that none of you have experienced before.";
    const harmonyScore = typeof parsed.harmonyScore === 'number' ? Math.max(0, Math.min(100, parsed.harmonyScore)) : 75;
    const vibeAnalysis = parsed.whyThisWorks || parsed.vibeAnalysis || "This recommendation is tailored to your group's unique combination of interests and preferences.";
    
    log.push(`Successfully parsed: recommendation='${recommendation.substring(0, 50)}...', harmonyScore=${harmonyScore}`);
    
    return { recommendation, alternative, harmonyScore, vibeAnalysis };
    
  } catch (error) {
    log.push(`Gemini API error: ${error.message}`);
    return {
      recommendation: "I'm having trouble generating a recommendation right now. Please try again with a different request.",
      alternative: "Consider manually exploring your group's shared interests together.",
      harmonyScore: 50,
      vibeAnalysis: "Unable to process your request at this time. Please try again."
    };
  }
}

// Helper: Call Gemini API (ENHANCED - With Qloo data integration)
async function getGeminiResponse(users: UserInterests[], qlooRecs: any[], type: string, log: string[]): Promise<{ recommendation: string; alternative: string; harmonyScore: number; vibeAnalysis: string; }> {
  // Extract meaningful interests from users
  const userInterests = users.map(u => ({
    music: u.musicArtists?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean),
    movies: u.movies?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean),
    cuisines: u.cuisines?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean),
    travel: u.travelDestinations?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean),
    books: u.books?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean),
    tvShows: u.tvShows?.slice(0, 3)?.map(i => typeof i === 'string' ? i : i.name).filter(Boolean)
  })).filter(u => Object.values(u).some(arr => arr && arr.length > 0));

  // Create entity-specific prompts with Qloo integration
  const entityPrompts = {
    'music': {
      focus: 'music artists and songs',
      instruction: `Create a specific music recommendation using both the group's interests and Qloo's data-driven suggestions. Consider:
1. A curated playlist combining their favorite artists with Qloo recommendations
2. A music discovery session featuring Qloo-suggested artists
3. Concert recommendations based on Qloo insights
4. Genre exploration using Qloo's popularity data

Be specific with artist names, song titles, and actionable steps.`,
      example: `"🎵 **Curated Playlist: Indie Vibes Mix**
• Tame Impala - 'The Less I Know The Better'
• Clairo - 'Pretty Girl' 
• Boy Pablo - 'Everytime'
• Mac DeMarco - 'Chamber of Reflection'

**Why this works:** Combines dreamy vocals with psychedelic rock elements that appeal to your group's diverse tastes."`
    },
    'movie': {
      focus: 'movies and films',
      instruction: `Create a specific movie recommendation using both the group's interests and Qloo's data-driven suggestions. Consider:
1. A movie night lineup combining their favorites with Qloo recommendations
2. A themed movie marathon using Qloo's genre insights
3. New releases that match their tastes based on Qloo data
4. Hidden gems suggested by Qloo's popularity algorithms

Be specific with movie titles, genres, and viewing suggestions.`,
      example: `"🎬 **Movie Night: Psychological Thrillers**
• 'Inception' (2010) - Mind-bending sci-fi
• 'The Prestige' (2006) - Mystery thriller
• 'Shutter Island' (2010) - Psychological drama

**Why this works:** These films combine your group's love for complex storytelling and visual effects."`
    },
    'restaurant': {
      focus: 'restaurants and dining experiences',
      instruction: `Create a specific dining recommendation using both the group's interests and Qloo's data-driven suggestions. Consider:
1. Restaurant recommendations combining their preferences with Qloo insights
2. A progressive dinner plan using Qloo's popularity data
3. Food tour suggestions based on Qloo recommendations
4. Cooking class or food experience ideas

Be specific with restaurant names, dishes, and dining experiences.`,
      example: `"🍽️ **Progressive Dinner Adventure**
• Appetizers: Dim sum at Golden Dragon (authentic Chinese)
• Main course: Spicy Thai at Bangkok Palace
• Dessert: Gelato at Bella Italia

**Why this works:** This culinary journey satisfies everyone's taste for authentic international flavors."`
    },
    'travel': {
      focus: 'travel destinations and experiences',
      instruction: `Create a specific travel recommendation using both the group's interests and Qloo's data-driven suggestions. Consider:
1. Destination recommendations combining their preferences with Qloo insights
2. A detailed travel itinerary using Qloo's popularity data
3. Cultural experience suggestions based on Qloo recommendations
4. Adventure or relaxation activities

Be specific with destinations, activities, and travel tips.`,
      example: `"✈️ **Weekend Getaway: Cultural Immersion**
• Destination: Kyoto, Japan
• Activities: Temple visits, tea ceremony, traditional ryokan stay
• Food: Kaiseki dinner, street food tour

**Why this works:** Combines your group's love for culture, history, and authentic experiences."`
    }
  };

  const promptConfig = entityPrompts[type] || entityPrompts['music'];

  // Create a detailed, context-rich prompt with Qloo integration
  const prompt = `You are CultureCircle AI, an expert in creating personalized recommendations for groups using both user interests and data-driven insights.

**Group Interests Analysis:**
${JSON.stringify(userInterests, null, 2)}

**Qloo Data-Driven Recommendations:**
${JSON.stringify(qlooRecs.slice(0, 3), null, 2)}

**Requested Category:** ${type}

**Your Task:** ${promptConfig.instruction}

**Requirements:**
1. Be SPECIFIC with names, titles, and actionable steps
2. Combine the group's interests with Qloo's data-driven suggestions
3. Consider Qloo's popularity and similarity data when making recommendations
4. Provide a clear "why this works" explanation
5. Suggest an alternative option
6. Calculate a harmony score (0-100) based on interest overlap and Qloo data

**Response Format (JSON only):**
{
  "recommendation": "Specific, detailed recommendation with names/titles",
  "whyThisWorks": "Clear explanation of why this fits the group",
  "alternative": "Alternative specific suggestion",
  "harmonyScore": 85
}

**Example Response:**
${promptConfig.example}

Now create a recommendation for this specific group that combines their interests with Qloo's data-driven insights.`;

  log.push(`Gemini prompt: ${prompt}`);
  
  try {
    const resp = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 800,
          candidateCount: 1
        }
      },
      {
        timeout: 15000
      }
    );
    
    const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    log.push(`Raw Gemini response: ${text}`);
    
    // Enhanced JSON parsing with multiple fallback methods
    let parsed: any = null;
    
    // Method 1: Look for JSON object with regex (most common)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        log.push(`Failed to parse JSON match: ${e.message}`);
      }
    }
    
    // Method 2: Try parsing the entire response
    if (!parsed) {
      try {
        parsed = JSON.parse(text.trim());
      } catch (e) {
        log.push(`Failed to parse entire response as JSON: ${e.message}`);
      }
    }
    
    // Method 3: If still no JSON, create a structured response from the text
    if (!parsed) {
      log.push(`Could not extract JSON, creating structured response from text`);
      
      // Try to extract meaningful parts from the text
      const lines = text.split('\n').filter(line => line.trim());
      const recommendation = lines.find(line => line.includes('🎵') || line.includes('🎬') || line.includes('🍽️') || line.includes('✈️') || line.includes('📚') || line.includes('📺')) || lines[0] || "Specific recommendation based on your group's interests and data-driven insights.";
      
      const whyThisWorks = lines.find(line => line.toLowerCase().includes('why') || line.toLowerCase().includes('works') || line.toLowerCase().includes('because')) || "This recommendation combines your group's diverse interests with data-driven suggestions to create a shared experience everyone will enjoy.";
      
      const alternative = lines.find(line => line.toLowerCase().includes('alternative') || line.toLowerCase().includes('also') || line.toLowerCase().includes('try')) || "Consider exploring similar genres or themes together as a group.";
      
      parsed = {
        recommendation,
        whyThisWorks,
        alternative,
        harmonyScore: 75
      };
    }
    
    // Extract values with proper fallbacks
    const recommendation = parsed.recommendation || "Based on your group's interests and data-driven insights, I recommend exploring shared cultural experiences together.";
    const alternative = parsed.alternative || "Consider trying something completely new that none of you have experienced before.";
    const harmonyScore = typeof parsed.harmonyScore === 'number' ? Math.max(0, Math.min(100, parsed.harmonyScore)) : 75;
    const vibeAnalysis = parsed.whyThisWorks || parsed.vibeAnalysis || "This recommendation is tailored to your group's unique combination of interests and preferences, enhanced by data-driven insights.";
    
    log.push(`Successfully parsed: recommendation='${recommendation.substring(0, 50)}...', harmonyScore=${harmonyScore}`);
    
    return { recommendation, alternative, harmonyScore, vibeAnalysis };
    
  } catch (error) {
    log.push(`Gemini API error: ${error.message}`);
    return {
      recommendation: "I'm having trouble generating a recommendation right now. Please try again with a different request.",
      alternative: "Consider manually exploring your group's shared interests together.",
      harmonyScore: 50,
      vibeAnalysis: "Unable to process your request at this time. Please try again."
    };
  }
}
//secret comment1
//secret comment

// Main handler for Vercel
export default async function handler(req, res) {
  console.log("[HANDLER INVOKED] recommendations API");
  console.log("QLOO_API_KEY:", process.env.QLOO_API_KEY ? "Present" : "Missing");
  console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
  console.log("FIREBASE_SERVICE_ACCOUNT_BASE64:", process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? "Present" : "Missing");
  console.log("FIREBASE_SERVICE_ACCOUNT:", process.env.FIREBASE_SERVICE_ACCOUNT ? "Present" : "Missing");
  console.log("Request method:", req.method);
  console.log("Request body:", JSON.stringify(req.body));
  console.log("Request headers:", JSON.stringify(req.headers));
  
  const log: string[] = [];
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Only POST requests are allowed.' });
      return;
    }
    
    // Validate request body
    if (!req.body) {
      res.status(400).json({ error: 'Request body is required.' });
      return;
    }
    
    const { groupId, type, destination, days, categories, filters = {} } = req.body;
    
    if (!groupId) {
      res.status(400).json({ error: 'Missing groupId in request body.' });
      return;
    }
    
    if (!type && (!categories || !Array.isArray(categories) || categories.length === 0)) {
      res.status(400).json({ error: 'Missing type or categories in request body.' });
      return;
    }
    
    // Check if Firebase is available
    if (!db) {
      res.status(500).json({ 
        error: 'Database not available. Please check Firebase configuration.',
        debugLog: log 
      });
      return;
    }
    if (type === 'itinerary') {
      // 1. Fetch group members
      try {
        const memberIds = await getGroupMemberIds(groupId);
        console.log("Found memberIds:", memberIds);
        // 2. Fetch user interests
        const users: UserInterests[] = [];
        for (const userEmail of memberIds) {
          try {
            users.push(await getUserInterests(userEmail));
          } catch (err) {
            log.push(`User not found or error for userEmail: ${userEmail}`);
          }
        }
        if (users.length === 0) {
          res.status(404).json({ error: 'No valid users found in group.' });
          return;
        }
        // 3. Aggregate interests
        const interests = aggregateInterests(users, 'travel', log);
        // 4. Compose Gemini prompt for itinerary
        const tripDestination = destination || 'a fun city';
        const tripDays = days || 3;
        const itineraryPrompt = `You are CultureCircle AI, an expert travel planner. Given the following group travel preferences and interests, create a detailed ${tripDays}-day itinerary for a trip to ${tripDestination}. Each day should include morning, afternoon, and evening activities, with a focus on food, culture, and experiences that fit the group's tastes. Be specific and creative.\n\nGroup Interests (JSON):\n${JSON.stringify(users, null, 2)}\n\nOutput a JSON array, where each element is an object with 'day', 'activities' (array of strings), and 'description' (string).`;
        log.push(`Gemini itinerary prompt: ${itineraryPrompt}`);
        const resp = await axios.post(
          `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
          {
            contents: [{ parts: [{ text: itineraryPrompt }] }],
          }
        );
        let itinerary = [];
        try {
          const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const match = text.match(/\[.*\]/s);
          if (match) {
            itinerary = JSON.parse(match[0]);
          } else {
            itinerary = [{ error: 'Could not parse Gemini itinerary response.', raw: text }];
          }
        } catch (err) {
          itinerary = [{ error: 'Could not parse Gemini itinerary response.' }];
        }
        res.json({
          groupId,
          type,
          destination: tripDestination,
          days: tripDays,
          interests,
          itinerary,
          debugLog: log,
        });
        return;
      } catch (err) {
        log.push(`Error fetching group members: ${err.message || err}`);
        res.status(500).json({ error: err.message || 'Internal server error', debugLog: log });
        return;
      }
    }

    // --- Multi-category recommendation (ENHANCED) ---
    if (Array.isArray(categories) && categories.length > 0) {
      try {
        const memberIds = await getGroupMemberIds(groupId);
        const users: UserInterests[] = [];
        for (const userEmail of memberIds) {
          try {
            users.push(await getUserInterests(userEmail));
          } catch (err) {
            log.push(`User not found or error for userEmail: ${userEmail}`);
          }
        }
        if (users.length === 0) {
          res.status(404).json({ error: 'No valid users found in group.' });
          return;
        }
        
        // Enhanced multi-category logic
        const geminiType = categories.length === 1 ? 
          Object.keys(RECOMMENDATION_TYPE_TO_ENTITY).find(k => RECOMMENDATION_TYPE_TO_ENTITY[k] === categories[0]) || 'multi-category' 
          : 'multi-category';
        
        // Always use AI-generated responses for better quality
        const gemini = await getGeminiResponseUltraFast(users, categories, geminiType, log);
        
        res.json({
          groupId,
          categories,
          gemini,
          debugLog: log,
          mode: 'enhanced-ai'
        });
        return;
      } catch (err) {
        log.push(`Error in multi-category: ${err.message || err}`);
        res.status(500).json({ error: err.message || 'Internal server error', debugLog: log });
        return;
      }
    }
    const entityType = RECOMMENDATION_TYPE_TO_ENTITY[type];
    if (!entityType) {
      res.status(400).json({ error: 'Invalid recommendation type.' });
      return;
    }
    // 1. Fetch group members
    try {
      const memberIds = await getGroupMemberIds(groupId);
      console.log("Found memberIds:", memberIds);
      // 2. Fetch user interests
      const users: UserInterests[] = [];
      for (const userEmail of memberIds) {
        try {
          users.push(await getUserInterests(userEmail));
        } catch (err) {
          log.push(`User not found or error for userEmail: ${userEmail}`);
        }
      }
      if (users.length === 0) {
        res.status(404).json({ error: 'No valid users found in group.' });
        return;
      }
      // 3. Aggregate interests
      const interests = aggregateInterests(users, type, log);
      if (interests.length === 0) {
        res.status(404).json({ error: 'No interests found for group.' });
        res.status(404).json({ error: 'No interests found for group.', debugLog: log });
        return;
      }
      // 4. Resolve entities
      const entityIds = await resolveEntities(interests, type, log);
      if (entityIds.length === 0) {
        res.status(404).json({ error: 'Could not resolve interests to any known entities.', debugLog: log });
        return;
      }
      // 5. Qloo recommendations
      const qlooRecs = await getQlooRecommendations(entityType, entityIds, log, filters);
      // 6. Gemini response
      const gemini = await getGeminiResponse(users, qlooRecs, type, log);
      // 7. Return JSON
      res.json({
        groupId,
        type,
        interests,
        entityIds,
        qlooRecommendations: qlooRecs,
        gemini,
        debugLog: log,
      });
      return;
    } catch (err) {
      log.push(`Error fetching group members: ${err.message || err}`);
      res.status(500).json({ error: err.message || 'Internal server error', debugLog: log });
      return;
    }
  } catch (err) {
    console.error("FATAL ERROR in recommendations API:", err);
    log.push(`Error: ${err.message || err}`);
    res.status(500).json({ 
      error: err.message || 'Internal server error', 
      debugLog: log,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    return;
  }
}

// ---
// Sample JSON response:
// {
//   "groupId": "abc123",
//   "type": "music",
//   "interests": ["k-pop", "indie rock", "lofi"],
//   "tagUrns": [
//     "urn:tag:genre:music:kpop",
//     "urn:tag:genre:music:indie_rock",
//     ...
//   ],
//   "qlooRecommendations": [ /* from Qloo API */ ],
//   "gemini": {
//     "summary": "This playlist blends group tastes like K-pop and indie rock...",
//     "harmonyScore": 86,
//     "reasoning": "3 out of 4 members share similar tags like lofi & alternative pop..."
//   },
//   "debugLog": [ /* intermediate logs for debugging */ ]
// } 