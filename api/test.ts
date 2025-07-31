import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    // Check environment variables
    const envCheck = {
      QLOO_API_KEY: process.env.QLOO_API_KEY ? 'Present' : 'Missing',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Present' : 'Missing',
      FIREBASE_SERVICE_ACCOUNT_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? 'Present' : 'Missing',
      FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT ? 'Present' : 'Missing',
      NODE_ENV: process.env.NODE_ENV || 'Not set'
    };

    res.status(200).json({
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers
      }
    });
  } catch (error) {
    console.error('Test API error:', error);
    res.status(500).json({
      error: 'Test API failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 