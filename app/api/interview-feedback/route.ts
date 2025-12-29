import { NextResponse } from 'next/server';
import { openai } from '@/lib/openAI';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { question, userAnswer } = await req.json();

    if (typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }
    if (typeof userAnswer !== 'string' || !userAnswer.trim()) {
      return NextResponse.json({ error: 'User answer is required' }, { status: 400 });
    }

    // OpenAI prompt for feedback
    const systemPrompt =
      'You are an expert technical interviewer. A candidate answered a question as follows.\n\nQuestion: [original question]\nAnswer: [user’s answer]\n\nGive a score from 1–10 (concise), list 2–3 improvement tips, and rewrite the answer to be stronger and more impactful.\n\nRespond in this JSON format:\n{\n  "score": 8,\n  "feedback": ["tip1", "tip2"],\n  "revisedAnswer": "..."\n}';

    const userPrompt = `Question: ${question}\nAnswer: ${userAnswer}`;

    let responseText = '';
    let modelUsed = '';
    // Helper for timeout
    function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
      ]);
    }
    try {
      const completion = await withTimeout(
        Promise.resolve(openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 600,
          temperature: 0.2,
        })),
        40000
      );
      responseText = completion.choices[0]?.message?.content || '';
      modelUsed = 'gpt-4o';
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'message' in err && (err as any).message === 'timeout') {
        return NextResponse.json({ error: 'OpenAI request timed out' }, { status: 504 });
      }
      // Fallback to GPT-3.5
      try {
        const completion = await withTimeout(
          Promise.resolve(openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 600,
            temperature: 0.2,
          })),
          40000
        );
        responseText = completion.choices[0]?.message?.content || '';
        modelUsed = 'gpt-3.5-turbo';
      } catch (err2) {
        if (typeof err2 === 'object' && err2 !== null && 'message' in err2 && (err2 as any).message === 'timeout') {
          return NextResponse.json({ error: 'OpenAI request timed out (fallback)' }, { status: 504 });
        }
        return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
      }
    }

    // Clean up code block markers if present
    let cleanText = responseText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
    }
    try {
      const result = JSON.parse(cleanText);
      if (
        typeof result.score !== 'number' ||
        !Array.isArray(result.feedback) ||
        typeof result.revisedAnswer !== 'string'
      ) {
        return NextResponse.json({ error: 'Invalid response from AI', details: responseText }, { status: 502 });
      }

      // Save session to Supabase
      const { error: dbError } = await supabase.from('interview_versions').insert({
        question,
        user_answer: userAnswer,
        revised_answer: result.revisedAnswer,
        score: result.score,
        feedback: result.feedback,
      });
      if (dbError) {
        console.error('Supabase insert error:', dbError);
      }

      return NextResponse.json({ ...result, model: modelUsed });
    } catch (err) {
      return NextResponse.json({ error: 'Invalid response from AI' }, { status: 502 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
