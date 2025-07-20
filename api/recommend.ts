process.on('uncaughtException', function (err) {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', function (reason, promise) {
  console.error('Unhandled Rejection:', reason);
});

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin SDK using env vars for Vercel/serverless compatibility
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

const QLOO_API_KEY = process.env.QLOO_API_KEY;
const QLOO_BASE_URL = 'https://hackathon.api.qloo.com/v2'; // Use hackathon endpoint
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

console.log('QLOO_API_KEY:', QLOO_API_KEY ? 'present' : 'MISSING');
console.log('GEMINI_API_KEY:', GEMINI_API_KEY ? 'present' : 'MISSING');

const RECOMMENDATION_TYPE_TO_ENTITY: Record<string, string> = {
  music: 'urn:entity:artist',
  movie: 'urn:entity:movie',
  restaurant: 'urn:entity:place',
  travel: 'urn:entity:destination',
};

type GroupDoc = { members: string[] };
interface UserInterests {
  musicArtists?: string[];
  books?: string[];
  cuisines?: string[];
  movies?: string[];
  travelDestinations?: string[];
}

// Fetch group member emails from Firestore
async function getGroupMemberEmails(groupId: string): Promise<string[]> {
  console.log('Fetching group:', groupId);
  const groupSnap = await db.collection('groups').doc(groupId).get();
  console.log('groupSnap.exists:', groupSnap.exists);
  const data = groupSnap.data();
  console.log('groupSnap.data():', data);
  if (!groupSnap.exists || !data) throw new Error('Group not found');
  console.log('Type of data.members:', typeof data.members, 'Is array:', Array.isArray(data.members), 'Value:', data.members);
  if (!data.members || !Array.isArray(data.members)) {
    console.log('data.members is not an array:', data.members);
    throw new Error('Group has no members');
  }
  console.log('About to check data.members.length:', data.members);
  if ((data.members?.length ?? 0) === 0) {
    console.log('data.members is empty array');
    throw new Error('Group has no members');
  }
  return data.members;
}

// Fetch user interests by email
async function getUserInterestsByEmail(email: string): Promise<UserInterests> {
  console.log('Fetching user by email:', email);
  const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
  console.log('userSnap.empty:', userSnap.empty);
  if (userSnap.empty) throw new Error(`User with email ${email} not found`);
  const userData = userSnap.docs[0].data();
  console.log('userSnap.docs[0].data():', userData);
  return userData as UserInterests;
}

function aggregateInterests(users: UserInterests[], type: string): string[] {
  console.log('Aggregating interests for type:', type, 'users:', users);
  const interests = new Set<string>();
  for (const user of users) {
    switch (type) {
      case 'music':
        if (user.musicArtists) {
          console.log('About to check user.musicArtists.length:', user.musicArtists);
          if (user.musicArtists.length > 0) {
            user.musicArtists.forEach((a) => interests.add(a));
          }
        }
        break;
      case 'movie':
        if (user.movies) {
          console.log('About to check user.movies.length:', user.movies);
          if (user.movies.length > 0) {
            user.movies.forEach((m) => interests.add(m));
          }
        }
        break;
      case 'restaurant':
        if (user.cuisines) {
          console.log('About to check user.cuisines.length:', user.cuisines);
          if (user.cuisines.length > 0) {
            user.cuisines.forEach((c) => interests.add(c));
          }
        }
        break;
      case 'travel':
        if (user.travelDestinations) {
          console.log('About to check user.travelDestinations.length:', user.travelDestinations);
          if (user.travelDestinations.length > 0) {
            user.travelDestinations.forEach((d) => interests.add(d));
          }
        }
        break;
      default:
        break;
    }
  }
  const arr = Array.from(interests).filter(Boolean);
  console.log('Aggregated interests:', arr);
  return arr;
}

async function resolveTags(interests: string[]): Promise<string[]> {
  const tagUrns: string[] = [];
  for (const interest of interests) {
    try {
      console.log('Qloo tag search for:', interest);
      console.log('About to check interest.length:', interest);
      if (typeof interest === 'string' && interest.length === 0) {
        console.log('Interest is empty string, skipping');
        continue;
      }
      const resp = await axios.get(`${QLOO_BASE_URL}/tags`, {
        params: { q: interest },
        headers: { 'x-api-key': QLOO_API_KEY },
      });
      console.log('Qloo tag response:', resp.data);
      if (resp.data && Array.isArray(resp.data.tags) && (resp.data.tags?.length ?? 0) > 0) {
        tagUrns.push(resp.data.tags[0].urn);
        console.log(`Resolved interest '${interest}' to tag URN: ${resp.data.tags[0].urn}`);
      } else {
        console.log(`No tag URN found for interest: '${interest}'`);
      }
    } catch (err) {
      console.log(`Error resolving tag for interest '${interest}':`, err);
    }
  }
  console.log('Resolved tagUrns:', tagUrns);
  return tagUrns;
}

async function getQlooRecommendations(entityType: string, tagUrns: string[]): Promise<any[]> {
  const params = {
    'filter.type': entityType,
    'signal.interests.tags': tagUrns.join(','),
    take: 5,
  };
  try {
    console.log('Qloo insights params:', params);
    const resp = await axios.get(`${QLOO_BASE_URL}/insights`, {
      params,
      headers: { 'x-api-key': QLOO_API_KEY },
    });
    console.log('Qloo insights response:', resp.data);
    return resp.data?.results || [];
  } catch (err) {
    console.log('Error calling Qloo insights:', err?.response?.data || err.message || err);
    return [];
  }
}

async function getGeminiResponse(users: UserInterests[], qlooRecs: any[], type: string): Promise<{ harmonyScore: number; reasoning: string }> {
  const prompt = `Given this group's cultural preferences (JSON):\n${JSON.stringify(users, null, 2)}\nand these Qloo recommendations (JSON):\n${JSON.stringify(qlooRecs, null, 2)}\n\nPlease do the following:\n1. Suggest a shared experience (playlist, movie night, trip, dinner plan) that best matches everyone's taste.\n2. Write a natural language summary of why these recommendations fit the group.\n3. Calculate a group harmony score (0-100) based on how much overlap or similarity you see in the preferences and tags.\n4. Explain your reasoning for the harmony score.\n\nReturn your answer as a JSON object with keys: harmonyScore (number), reasoning (string).`;
  console.log('Gemini prompt:', prompt);
  try {
    const resp = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: {
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Gemini response:', resp.data);
    let harmonyScore = 0;
    let reasoning = '';
    try {
      const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        harmonyScore = parsed.harmonyScore || 0;
        reasoning = parsed.reasoning || '';
      } else {
        reasoning = text;
      }
    } catch (err) {
      reasoning = 'Could not parse Gemini response.';
    }
    return { harmonyScore, reasoning };
  } catch (err: any) {
    console.log('Gemini API error:', err?.response?.data || err.message || err);
    throw new Error('Gemini API error: ' + (err?.response?.data?.error?.message || err.message || err));
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST requests are allowed.' });
    return;
  }
  const { groupId, type } = req.body;
  console.log('Received request:', { groupId, type });
  if (!groupId || !type) {
    console.log('Missing groupId or type in request body');
    res.status(400).json({ error: 'Missing groupId or type in request body.' });
    return;
  }
  const entityType = RECOMMENDATION_TYPE_TO_ENTITY[type];
  if (!entityType) {
    console.log('Invalid recommendation type:', type);
    res.status(400).json({ error: 'Invalid recommendation type.' });
    return;
  }
  try {
    // 1. Fetch group member emails
    const memberEmails = await getGroupMemberEmails(groupId);
    console.log('Fetched memberEmails:', memberEmails);
    // 2. Fetch user interests by email
    const users: UserInterests[] = [];
    for (const email of memberEmails) {
      try {
        users.push(await getUserInterestsByEmail(email));
      } catch (err) {
        console.log(`User not found or error for email: ${email}`);
      }
    }
    console.log('Fetched users:', users);
    if (users.length === 0) {
      console.log('No valid users found in group');
      res.status(404).json({ error: 'No valid users found in group.' });
      return;
    }
    // 3. Aggregate interests
    const interests = aggregateInterests(users, type);
    if (interests.length === 0) {
      console.log('No interests found for group');
      res.status(404).json({ error: 'No interests found for group.' });
      return;
    }
    // 4. Resolve tags
    const tagUrns = await resolveTags(interests);
    if (tagUrns.length === 0) {
      console.log('No Qloo tags found for interests');
      res.status(404).json({ error: 'No Qloo tags found for interests.' });
      return;
    }
    // 5. Qloo recommendations
    const qlooRecommendations = await getQlooRecommendations(entityType, tagUrns);
    // 6. Gemini response
    const gemini = await getGeminiResponse(users, qlooRecommendations, type);
    // 7. Return JSON
    res.json({
      groupId,
      type,
      interests,
      tagUrns,
      qlooRecommendations,
      gemini,
    });
    return;
  } catch (err: any) {
    console.log('Error:', err.message || err);
    res.status(500).json({ error: err.message || 'Internal server error' });
    return;
  }
} 