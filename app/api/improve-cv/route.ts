import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";

export async function POST(req: NextRequest) {
  try {
    const { cvText } = await req.json();
    if (!cvText || typeof cvText !== "string" || cvText.length < 20) {
      return NextResponse.json({ error: "Missing or invalid CV text." }, { status: 400 });
    }

    const prompt = `Improve this CV to better match jobs in software engineering. Add metrics and active phrasing. Don't change job roles or fake skills.\n\nCV:\n${cvText}`;

    const gptRes = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert technical recruiter and resume writer." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.5,
    });

    const improvedCV = gptRes.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ improvedCV });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal error", message: err?.message || err }, { status: 500 });
  }
}
