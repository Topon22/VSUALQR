import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are VSUAL Assistant, a helpful AI for VSUALdigitalmedia — a promotional marketing agency.
You help users with networking strategies, marketing campaigns, brand growth, social media, event planning, and business development.
Be concise, professional, and actionable in your responses. Use bold formatting for key points.`;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Ensure the .z-ai-config file exists.
 * On Vercel, the file may not be bundled, so we create it from environment variables.
 */
function ensureZAIConfig() {
  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
  ];

  // Check if any config already exists
  for (const p of configPaths) {
    if (fs.existsSync(p)) return;
  }

  // Create from environment variable
  const envConfig = process.env.Z_AI_CONFIG;
  if (envConfig) {
    try {
      const targetPath = configPaths[0];
      fs.writeFileSync(targetPath, envConfig);
      console.log('[Z-AI] Created config from Z_AI_CONFIG env var');
    } catch (err) {
      console.error('[Z-AI] Failed to write config:', err);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Ensure Z AI config exists (needed for Vercel serverless)
    ensureZAIConfig();

    const { messages, session_id } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const sid = session_id || 'default';
    let aiMessage = '';
    let usedProvider = 'z-ai';

    // Use Z AI (FREE) for chat
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_PROMPT },
          ...messages,
        ],
      });
      aiMessage = completion.choices[0]?.message?.content || '';
      usedProvider = 'z-ai';
    } catch (zaiErr) {
      const errMsg = zaiErr instanceof Error ? zaiErr.message : String(zaiErr);
      console.error('Z AI chat failed:', errMsg);
      if (!aiMessage) {
        aiMessage = 'I\'m having trouble connecting right now. Please try again in a moment.';
      }
    }

    if (!aiMessage) {
      aiMessage = 'Sorry, I could not generate a response. Please try again.';
    }

    // Save chat to database (non-blocking)
    try {
      const lastUserMsg = messages.filter((m: Message) => m.role === 'user').pop();
      if (lastUserMsg) {
        await db.chatSession.create({
          data: { sessionId: sid, role: 'user', content: lastUserMsg.content },
        });
      }
      await db.chatSession.create({
        data: { sessionId: sid, role: 'assistant', content: aiMessage, model: 'z-ai', provider: usedProvider },
      });
    } catch (dbErr) {
      console.error('Failed to save chat to DB:', dbErr);
    }

    return Response.json({ message: aiMessage, model: 'z-ai', provider: usedProvider });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get('session_id') || 'default';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const history = await db.chatSession.findMany({
      where: { sessionId: session_id },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { role: true, content: true, model: true, provider: true, createdAt: true },
    });

    return Response.json({ success: true, session_id, messages: history, count: history.length });
  } catch {
    return Response.json({ success: false, messages: [], count: 0, message: 'Database not available.' });
  }
}
