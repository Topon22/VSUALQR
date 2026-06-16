import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are VSUAL Assistant, a helpful AI for VSUALdigitalmedia — a promotional marketing agency.
You help users with networking strategies, marketing campaigns, brand growth, social media, event planning, and business development.
Be concise, professional, and actionable in your responses. Use bold formatting for key points.`;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, session_id } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const sid = session_id || 'default';
    let aiMessage = '';
    let usedProvider = 'z-ai';

    // Use Z AI (FREE) for chat — try with model specification
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        model: 'qwen/qwen3-235b-a22b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        thinking: { type: 'disabled' },
      });
      aiMessage = completion.choices[0]?.message?.content || '';
      usedProvider = 'z-ai';
    } catch (zaiErr) {
      console.error('Z AI primary model failed:', zaiErr instanceof Error ? zaiErr.message : 'Unknown');

      // Fallback: try without explicit model (uses default)
      try {
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
          ],
        });
        aiMessage = completion.choices[0]?.message?.content || '';
        usedProvider = 'z-ai-fallback';
      } catch (fallbackErr) {
        console.error('Z AI fallback also failed:', fallbackErr instanceof Error ? fallbackErr.message : 'Unknown');
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
