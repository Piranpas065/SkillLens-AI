
import { NextResponse } from 'next/server';
import { openai } from '@/lib/openAI';

export async function POST(req: Request) {
  try {
    const { jobTitle, jobDescription, resumeText } = await req.json();

    if (typeof jobTitle !== 'string' || !jobTitle.trim()) {
      return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
    }
    if (typeof jobDescription !== 'string' || !jobDescription.trim()) {
      return NextResponse.json({ error: 'Job Description is required' }, { status: 400 });
    }
    if (typeof resumeText !== 'string' || !resumeText.trim()) {
      return NextResponse.json({ error: 'Resume content is required' }, { status: 400 });
    }
    if (resumeText.trim().length < 20) {
      return NextResponse.json({ error: 'Resume content is too short' }, { status: 400 });
    }

    // System prompt for interview coach
    const systemPrompt =
      'You are an expert tech interview coach. Based on the job title, job description, and resume below, generate 5 tailored interview questions. Provide an ideal answer for each question. Return only valid JSON in the following format: { "questions": [ { "question": "...", "idealAnswer": "..." } ] }';

    // User message formatting
    const userPrompt = `Job Title: ${jobTitle}\nJob Description: ${jobDescription}\nResume: ${resumeText}`;

    // Try GPT-4 first, fallback to GPT-3.5 if error
    let responseText = '';
    let modelUsed = '';
    let completion: any;
    // Helper for timeout
    function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
      ]);
    }
    try {
      completion = await withTimeout(
        Promise.resolve(openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 1200,
          temperature: 0.2,
        })),
        80000
      );
      responseText = completion.choices[0]?.message?.content || '';
      modelUsed = 'gpt-4o';
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'message' in err && (err as any).message === 'timeout') {
        console.error('OpenAI request timed out');
        return NextResponse.json({ error: 'OpenAI request timed out' }, { status: 504 });
      }
      // Fallback to GPT-3.5
      try {
        completion = await withTimeout(
          Promise.resolve(openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 1200,
            temperature: 0.2,
          })),
          80000
        );
        responseText = completion.choices[0]?.message?.content || '';
        modelUsed = 'gpt-3.5-turbo';
      } catch (err2) {
        if (typeof err2 === 'object' && err2 !== null && 'message' in err2 && (err2 as any).message === 'timeout') {
          console.error('OpenAI request timed out (fallback)');
          return NextResponse.json({ error: 'OpenAI request timed out (fallback)' }, { status: 504 });
        }
        // Handle OpenAI rate limit or 500 errors
        if ((typeof err2 === 'object' && err2 !== null && 'status' in err2 && ((err2 as any).status === 429 || (err2 as any).status === 500))) {
          return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
        }
        console.error('OpenAI API failure:', err2);
        return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
      }
    }

    // Parse and validate output
    try {
      // Clean up code block markers if present
      let cleanText = responseText.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
      }
      const result = JSON.parse(cleanText);
      if (!result.questions || !Array.isArray(result.questions)) {
        console.error('Invalid model response: missing questions array');
        return NextResponse.json({ error: 'Invalid response from AI' }, { status: 502 });
      }
      // Validate each question object
      for (const q of result.questions) {
        if (typeof q.question !== 'string' || typeof q.idealAnswer !== 'string') {
          console.error('Invalid question object format:', q);
          return NextResponse.json({ error: 'Invalid response from AI' }, { status: 502 });
        }
      }
      // Log output size and keys
      const outputSize = responseText.length;
      const outputKeys = Object.keys(result);
      console.log('Interview Coach Output:', {
        model: modelUsed,
        outputSize,
        outputKeys,
        questionsCount: result.questions.length,
        sample: result.questions[0],
      });
      // Return parsed question/answer set to frontend
      return NextResponse.json({ ...result, model: modelUsed });
    } catch (err) {
      console.error('Failed to parse OpenAI response:', responseText);
      return NextResponse.json({ error: 'Invalid response from AI' }, { status: 502 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
