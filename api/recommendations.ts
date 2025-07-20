import * as admin from 'firebase-admin';
import axios from 'axios';

console.log("[COLD START] recommendations API loaded");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Qloo API config
const QLOO_API_KEY = process.env.QLOO_API_KEY;
const QLOO_BASE_URL = 'https://api.qloo.com/v2';

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
type GroupDoc = { memberIds: string[] };
async function getGroupMemberIds(groupId: string): Promise<string[]> {
  const groupSnap = await db.collection('groups').doc(groupId).get();
  if (!groupSnap.exists) throw new Error('Group not found');
  const data = groupSnap.data() as GroupDoc;
  if (!data.memberIds || !Array.isArray(data.memberIds) || data.memberIds.length === 0) {
    throw new Error('Group has no members');
  }
  return data.memberIds;
}

// Helper: Fetch user interests from Firestore
interface UserInterests {
  musicGenres?: string[];
  favoriteArtists?: string[];
  favoriteBooks?: string[];
  favoriteCuisines?: string[];
  favoriteDestinations?: string[];
}
async function getUserInterests(userId: string): Promise<UserInterests> {
  const userSnap = await db.collection('users').doc(userId).get();
  if (!userSnap.exists) throw new Error(`User ${userId} not found`);
  return userSnap.data() as UserInterests;
}

// Helper: Aggregate interests by type
function aggregateInterests(users: UserInterests[], type: string): string[] {
  const interests = new Set<string>();
  for (const user of users) {
    switch (type) {
      case 'music':
        user.musicGenres?.forEach((g) => interests.add(g));
        user.favoriteArtists?.forEach((a) => interests.add(a));
        break;
      case 'movie':
        user.favoriteBooks?.forEach((b) => interests.add(b)); // fallback if needed
        break;
      case 'restaurant':
        user.favoriteCuisines?.forEach((c) => interests.add(c));
        break;
      case 'travel':
        user.favoriteDestinations?.forEach((d) => interests.add(d));
        break;
      default:
        break;
    }
  }
  return Array.from(interests).filter(Boolean);
}

// Helper: Resolve interests to Qloo tag URNs
async function resolveTags(interests: string[], log: string[]): Promise<string[]> {
  const tagUrns: string[] = [];
  for (const interest of interests) {
    try {
      const resp = await axios.get(`${QLOO_BASE_URL}/tags`, {
        params: { q: interest },
        headers: { 'x-api-key': QLOO_API_KEY },
      });
      if (resp.data && Array.isArray(resp.data.tags) && resp.data.tags.length > 0) {
        tagUrns.push(resp.data.tags[0].urn); // Take the first matching tag
        log.push(`Resolved interest '${interest}' to tag URN: ${resp.data.tags[0].urn}`);
      } else {
        log.push(`No tag URN found for interest: '${interest}'`);
      }
    } catch (err) {
      log.push(`Error resolving tag for interest '${interest}': ${err}`);
    }
  }
  return tagUrns;
}

// Helper: Get Qloo recommendations
async function getQlooRecommendations(entityType: string, tagUrns: string[], log: string[]): Promise<any[]> {
  const params = {
    'filter.type': entityType,
    'signal.interests.tags': tagUrns.join(','),
    take: 5,
  };
  try {
    const resp = await axios.get(`${QLOO_BASE_URL}/insights`, {
      params,
      headers: { 'x-api-key': QLOO_API_KEY },
    });
    log.push(`Qloo insights call params: ${JSON.stringify(params)}`);
    log.push(`Qloo insights response: ${JSON.stringify(resp.data?.results || [])}`);
    return resp.data?.results || [];
  } catch (err) {
    log.push(`Error calling Qloo insights: ${err}`);
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
//secret comment

// Main handler for Vercel
export default async function handler(req, res) {
  console.log("[HANDLER INVOKED] recommendations API");
  console.log("QLOO_API_KEY:", process.env.QLOO_API_KEY);
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
    const memberIds = await getGroupMemberIds(groupId);
    // 2. Fetch user interests
    const users: UserInterests[] = [];
    for (const userId of memberIds) {
      try {
        users.push(await getUserInterests(userId));
      } catch (err) {
        log.push(`User not found or error for userId: ${userId}`);
      }
    }
    if (users.length === 0) {
      res.status(404).json({ error: 'No valid users found in group.' });
      return;
    }
    // 3. Aggregate interests
    const interests = aggregateInterests(users, type);
    if (interests.length === 0) {
      res.status(404).json({ error: 'No interests found for group.' });
      return;
    }
    // 4. Resolve tags
    const tagUrns = await resolveTags(interests, log);
    if (tagUrns.length === 0) {
      res.status(404).json({ error: 'No Qloo tags found for interests.' });
      return;
    }
    // 5. Qloo recommendations
    const qlooRecs = await getQlooRecommendations(entityType, tagUrns, log);
    // 6. Gemini response
    const gemini = await getGeminiResponse(users, qlooRecs, type, log);
    // 7. Return JSON
    res.json({
      groupId,
      type,
      interests,
      tagUrns,
      qlooRecommendations: qlooRecs,
      gemini,
      debugLog: log,
    });
    return;
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