import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { InterviewFeedback } from "@/types/InterviewFeedback";

export async function POST(req: NextRequest) {
  try {
    const { answer, jobTitle, description } = await req.json();
    if (!answer || !jobTitle) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const prompt = `You are an interview coach. Given the job title and candidate's answer, do the following:
1. Score the answer (1–10)
2. Explain what was good or lacking
3. Rewrite it using the STAR method

Job Title: ${jobTitle}
Job Description: ${description || "(none)"}
Candidate Answer: ${answer}

Respond in JSON format as: { score, feedback, improved }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert interview coach." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    // Try to parse the response as InterviewFeedback
    let feedback: InterviewFeedback | null = null;
    const content: string = completion.choices[0].message.content ?? "";
    try {
      // Try direct JSON parse first
      feedback = JSON.parse(content);
    } catch (err1) {
      console.error('Direct JSON parse failed:', err1, content);
      // Try to extract JSON from text using regex
      try {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          feedback = JSON.parse(match[0]);
        } else {
          return NextResponse.json({ error: "Failed to parse AI response." }, { status: 500 });
        }
      } catch (err2) {
        console.error('Regex JSON parse failed:', err2, content);
        return NextResponse.json({ error: "Failed to parse AI response." }, { status: 500 });
      }
    }

    return NextResponse.json(feedback);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
