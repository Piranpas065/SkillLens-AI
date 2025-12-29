import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";

export async function POST(req: NextRequest) {
  try {
    const { cvText } = await req.json();
    if (!cvText || typeof cvText !== "string" || cvText.length < 20) {
      return NextResponse.json({ error: "Missing or invalid CV text." }, { status: 400 });
    }

    // Detect if this is an upgrade suggestion request
    const isUpgradeRequest = /improve|suggest|upgrade/i.test(cvText);
    let prompt = "";
    if (isUpgradeRequest) {
      prompt = `Read this CV and suggest 2-3 specific ways to improve it for tech jobs.\n\nCV:\n${cvText}\n\nReturn JSON with a field: upgrade (string, 2-3 actionable suggestions).`;
    } else {
      prompt = `Read this CV and extract a short 2-line summary and a list of technical skills:\n\nCV:\n${cvText}\n\nReturn JSON with fields: summary (string), skills (array of strings).`;
    }

    const gptRes = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert technical recruiter." },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.4,
    });

    const content = gptRes.choices?.[0]?.message?.content || "";
    let summary = "", skills: string[] = [], upgrade = "";
    try {
      const parsed = JSON.parse(content);
      if (isUpgradeRequest) {
        upgrade = parsed.upgrade || content;
      } else {
        summary = parsed.summary || "";
        skills = parsed.skills || [];
      }
    } catch {
      if (isUpgradeRequest) {
        // fallback: just use the content as upgrade
        upgrade = content;
      } else {
        // fallback: try to extract from text
        const summaryMatch = content.match(/summary\s*[:=\-]?\s*([\s\S]*?)skills/i);
        const skillsMatch = content.match(/skills\s*[:=\-]?\s*([\s\S]*)/i);
        summary = summaryMatch ? summaryMatch[1].trim() : "";
        skills = skillsMatch ? skillsMatch[1].split(/,|\n|\s+/).map(s => s.trim()).filter(Boolean) : [];
      }
    }

    if (isUpgradeRequest) {
      return NextResponse.json({ upgrade });
    } else {
      return NextResponse.json({ summary, skills });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Internal error", message: err?.message || err }, { status: 500 });
  }
}
