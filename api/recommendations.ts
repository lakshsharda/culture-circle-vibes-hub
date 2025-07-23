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
      throw new Error('Firebase service account credentials not found in environment variables');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

const db = admin.firestore();

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
  musicArtists?: string[];
  movies?: string[];
  books?: string[];
  cuisines?: string[];
  travelDestinations?: string[];
  tvShows?: string[];
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
        user.musicArtists?.forEach((a) => interests.add(a));
        break;
      case 'movie':
        user.movies?.forEach((m) => interests.add(m));
        break;
      case 'restaurant':
        user.cuisines?.forEach((c) => interests.add(c));
        break;
      case 'travel':
        user.travelDestinations?.forEach((d) => interests.add(d));
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

// Helper: Resolve interest names to Qloo entity IDs
async function resolveEntities(interests: string[], type: string, log: string[]): Promise<string[]> {
  const entityIds: string[] = [];
  for (const interest of interests) {
    try {
      const searchUrl = `https://hackathon.api.qloo.com/search`;
      const resp = await axios.get(searchUrl, {
        params: { query: interest },
        headers: { 'x-api-key': QLOO_API_KEY },
      });

      log.push(`RAW QLOO RESPONSE for '${interest}': ${JSON.stringify(resp.data)}`);

      if (resp.data && Array.isArray(resp.data.results) && resp.data.results.length > 0) {
        let foundId = null;
        for (const result of resp.data.results) {
          log.push(`INSPECTING RESULT for '${interest}': ${JSON.stringify(result)}`);
          if (result && result.entity_id) {
            foundId = result.entity_id;
            log.push(`FOUND ID for '${interest}' in result.entity_id`);
            break;
          }
          if (result && result.qloo && result.qloo.id) {
            foundId = result.qloo.id;
            log.push(`FOUND ID for '${interest}' in result.qloo.id`);
            break;
          }
          if (result && result.id) {
            foundId = result.id;
            log.push(`FOUND ID for '${interest}' in result.id`);
            break;
          }
        }

        if (foundId) {
          entityIds.push(foundId);
          log.push(`SUCCESS: Resolved '${interest}' to ID: ${foundId}`);
        } else {
          log.push(`FAILURE: No valid ID found for '${interest}' in any results.`);
        }
      } else {
        log.push(`No search results array for interest: '${interest}'`);
      }
    } catch (err) {
      const errorMessage = err.response ? JSON.stringify(err.response.data) : err.message;
      log.push(`AXIOS ERROR for interest '${interest}': ${errorMessage}`);
    }
  }
  return entityIds;
}

// Helper: Get Qloo recommendations
async function getQlooRecommendations(entityType: string, entityIds: string[], log: string[]): Promise<any[]> {
  const params = {
    'filter.type': entityType,
    'signal.interests.entities': entityIds.join(','),
    take: 5,
  };
  try {
    const resp = await axios.get(`${QLOO_BASE_URL}/insights`, {
      params,
      headers: { 'x-api-key': QLOO_API_KEY },
    });
    log.push(`Qloo insights call params: ${JSON.stringify(params)}`);
    log.push(`Qloo insights response: ${JSON.stringify(resp.data?.data || [])}`);
    return resp.data?.data || [];
  } catch (err) {
    const errorMessage = err.response ? JSON.stringify(err.response.data) : err.message;
    log.push(`Error calling Qloo insights: ${errorMessage}`);
    return [];
  }
}

// Helper: Call Gemini API
async function getGeminiResponse(users: UserInterests[], qlooRecs: any[], type: string, log: string[]): Promise<{ recommendation: string; alternative: string; harmonyScore: number; vibeAnalysis: string; }> {
  const prompt = `You are CultureCircle AI, an expert cultural concierge and vibe curator. Your specialty is crafting unique, delightful, and memorable shared experiences for groups, even when their tastes are wildly different.

Analyze the following group's cultural preferences and the data-driven recommendations from our backend.

Group Preferences (JSON):
${JSON.stringify(users, null, 2)}

Initial Recommendations (JSON):
${JSON.stringify(qlooRecs, null, 2)}

Your task is to transform this raw data into a truly inspired suggestion. Please do the following:

1.  **Craft a Compelling Recommendation:**
    *   Instead of just one idea, propose a main recommendation and maybe a "wild card" alternative.
    *   Be specific and evocative. For a movie night, don't just say "watch a comedy." Suggest a specific film, explain *why* it bridges the group's tastes (e.g., "it has the witty dialogue User A loves and the heartwarming moments User B enjoys"), and maybe even suggest a themed snack or drink.
    *   For a dinner, don't just name a cuisine. Describe the atmosphere. Suggest a type of restaurant or even a recipe if they were to cook at home.
    *   Think outside the box! Could their love for different things be combined? (e.g., "A historical fiction book set in a travel destination one of them loves").

2.  **Calculate a "Harmony Score" (0-100):**
    *   This score should reflect the potential for a shared good time, not just data overlap. A low score might mean the tastes are very different, but your creative recommendation can still make for a high-harmony experience.

3.  **Write the "Vibe Analysis":**
    *   This is the most important part. Explain your reasoning for the recommendation and the score.
    *   Frame the group's dynamic positively. Instead of "they have nothing in common," say "this group has a wonderfully eclectic mix of tastes, which opens up exciting possibilities."
    *   Explain *how* your recommendation bridges their interests and creates a new, shared experience. Highlight the "why" behind your suggestion.

**Output Format:**
Return your answer as a single, clean JSON object with the following keys:
- \`recommendation\`: (string) Your main, detailed recommendation.
- \`alternative\`: (string) A creative alternative suggestion.
- \`harmonyScore\`: (number) The 0-100 score.
- \`vibeAnalysis\`: (string) Your detailed explanation and reasoning.
`;
  log.push(`Gemini prompt: ${prompt}`);
  const resp = await axios.post(
    `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
    }
  );
  // Try to extract JSON from Gemini response
  let recommendation = '';
  let alternative = '';
  let harmonyScore = 0;
  let vibeAnalysis = '';
  try {
    const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      recommendation = parsed.recommendation || '';
      alternative = parsed.alternative || '';
      harmonyScore = parsed.harmonyScore || 0;
      vibeAnalysis = parsed.vibeAnalysis || '';
    } else {
      recommendation = text;
      vibeAnalysis = 'Could not parse structured reasoning.';
    }
  } catch (err) {
    recommendation = 'Could not parse Gemini response.';
    vibeAnalysis = 'Error parsing Gemini response.';
  }
  log.push(`Gemini response: recommendation='${recommendation}', harmonyScore=${harmonyScore}`);
  return { recommendation, alternative, harmonyScore, vibeAnalysis };
}
//secret comment1
//secret comment

// Main handler for Vercel
export default async function handler(req, res) {
  console.log("[HANDLER INVOKED] recommendations API");
  console.log("QLOO_API_KEY:", process.env.QLOO_API_KEY ? "Present" : "Missing");
  console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
  console.log("Request body:", JSON.stringify(req.body));
  const log: string[] = [];
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Only POST requests are allowed.' });
      return;
    }
    const { groupId, type, destination, days, categories } = req.body;
    if (!groupId || (!type && !categories)) {
      res.status(400).json({ error: 'Missing groupId or type/categories in request body.' });
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

    // --- Multi-category recommendation ---
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
        // For each category, aggregate interests, resolve entities, get Qloo recs
        const allCategoryResults: any[] = [];
        for (const catUrn of categories) {
          // Map urn to type string (e.g., 'urn:entity:artist' -> 'music')
          let typeKey = Object.keys(RECOMMENDATION_TYPE_TO_ENTITY).find(
            k => RECOMMENDATION_TYPE_TO_ENTITY[k] === catUrn
          );
          if (!typeKey) continue;
          const interests = aggregateInterests(users, typeKey, log);
          if (interests.length === 0) continue;
          const entityIds = await resolveEntities(interests, typeKey, log);
          if (entityIds.length === 0) continue;
          const qlooRecs = await getQlooRecommendations(catUrn, entityIds, log);
          allCategoryResults.push({
            category: catUrn,
            type: typeKey,
            interests,
            entityIds,
            qlooRecommendations: qlooRecs
          });
        }
        // Blend all Qloo recs for Gemini
        const allQlooRecs = allCategoryResults.flatMap(r => r.qlooRecommendations);
        const gemini = await getGeminiResponse(users, allQlooRecs, 'multi-category', log);
        res.json({
          groupId,
          categories,
          allCategoryResults,
          gemini,
          debugLog: log,
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
      const qlooRecs = await getQlooRecommendations(entityType, entityIds, log);
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
    log.push(`Error: ${err.message || err}`);
    res.status(500).json({ error: err.message || 'Internal server error', debugLog: log });
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