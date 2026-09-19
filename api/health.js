/**
 * Health check endpoint for Portfolio 2.0 and BOB AI service.
 * Safely confirms service readiness without exposing any API keys or secrets.
 */

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

  return res.status(200).json({
    status: 'healthy',
    service: 'bob-ai',
    hasGeminiKey,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
}
