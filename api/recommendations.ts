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
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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
  const searchTypeMap: Record<string, string> = {
    music: 'artist',
    movie: 'movie',
    restaurant: 'place',
    travel: 'destination',
  };
  const qlooSearchType = searchTypeMap[type];
  if (!qlooSearchType) {
    log.push(`No Qloo search type mapping for recommendation type: '${type}'`);
    return [];
  }

  for (const interest of interests) {
    try {
      const searchUrl = `https://hackathon.api.qloo.com/search`;
      const resp = await axios.get(searchUrl, {
        params: { query: interest },
        headers: { 'x-api-key': QLOO_API_KEY },
      });

      log.push(`Qloo search response for '${interest}': ${JSON.stringify(resp.data)}`);

      if (resp.data && Array.isArray(resp.data.results) && resp.data.results.length > 0) {
        const entity = resp.data.results[0]; // Take the first, most relevant result
        if (entity && entity.id) {
          entityIds.push(entity.id);
          log.push(`Resolved interest '${interest}' to entity ID: ${entity.id} (type: ${entity.type})`);
        } else {
          log.push(`First search result for '${interest}' had no ID.`);
        }
      } else {
        log.push(`No search results for interest: '${interest}'`);
      }
    } catch (err) {
      const errorMessage = err.response ? JSON.stringify(err.response.data) : err.message;
      log.push(`Error resolving entity for interest '${interest}': ${errorMessage}`);
    }
  }
  return entityIds;
}

// Helper: Get Qloo recommendations
async function getQlooRecommendations(entityType: string, entityIds: string[], log: string[]): Promise<any[]> {
  const body = {
    filter: { type: entityType },
    signal: { interests: { entities: entityIds } },
    take: 5,
  };
  try {
    const resp = await axios.post(`${QLOO_BASE_URL}/insights`, body, {
      headers: { 'x-api-key': QLOO_API_KEY, 'Content-Type': 'application/json' },
    });
    log.push(`Qloo insights call body: ${JSON.stringify(body)}`);
    log.push(`Qloo insights response: ${JSON.stringify(resp.data?.data || [])}`);
    return resp.data?.data || [];
  } catch (err) {
    const errorMessage = err.response ? JSON.stringify(err.response.data) : err.message;
    log.push(`Error calling Qloo insights: ${errorMessage}`);
    return [];
  }
}

// Helper: Call Gemini API
async function getGeminiResponse(users: UserInterests[], qlooRecs: any[], type: string, log: string[]): Promise<{ summary: string; harmonyScore: number; reasoning: string }> {
  const prompt = `Given this group's cultural preferences (JSON):\n${JSON.stringify(users, null, 2)}\nand these Qloo recommendations (JSON):\n${JSON.stringify(qlooRecs, null, 2)}\n\nPlease do the following:\n1. Suggest a shared experience (playlist, movie night, trip, dinner plan) that best matches everyone's taste.\n2. Write a natural language summary of why these recommendations fit the group.\n3. Calculate a group harmony score (0-100) based on how much overlap or similarity you see in the preferences and tags.\n4. Explain your reasoning for the harmony score.\n\nReturn your answer as a JSON object with keys: summary (string), harmonyScore (number), reasoning (string).`;
  log.push(`Gemini prompt: ${prompt}`);
  const resp = await axios.post(
    `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
    }
  );
  // Try to extract JSON from Gemini response
  let summary = '';
  let harmonyScore = 0;
  let reasoning = '';
  try {
    const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      summary = parsed.summary || '';
      harmonyScore = parsed.harmonyScore || 0;
      reasoning = parsed.reasoning || '';
    } else {
      summary = text;
      reasoning = 'Could not parse structured reasoning.';
    }
  } catch (err) {
    summary = 'Could not parse Gemini response.';
    reasoning = 'Error parsing Gemini response.';
  }
  log.push(`Gemini response: summary='${summary}', harmonyScore=${harmonyScore}, reasoning='${reasoning}'`);
  return { summary, harmonyScore, reasoning };
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
    const { groupId, type } = req.body;
    if (!groupId || !type) {
      res.status(400).json({ error: 'Missing groupId or type in request body.' });
      return;
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