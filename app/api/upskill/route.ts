import { NextRequest, NextResponse } from "next/server";
import { openai } from "../../../lib/openAI";

export async function POST(req: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here") {
      return NextResponse.json({ 
        error: "OpenAI API key not configured",
        details: "Please set OPENAI_API_KEY in your .env.local file"
      }, { status: 500 });
    }


    const { missingSkills, role } = await req.json();

    if (!missingSkills || !Array.isArray(missingSkills)) {
      return NextResponse.json({ error: "Missing or invalid skills list" }, { status: 400 });
    }

    const userRole = role && typeof role === "string" && role.trim() !== "" ? role : "computer science undergraduate";
    const prompt = `I'm a ${userRole}. For EACH of the following skills, generate a detailed learning roadmap step in this exact format:

Skill Name
1. Learning Goal: (fill with specific, practical, skill-relevant content)
2. Time Required: (fill with a realistic estimate)
3. Best Free/Online Resources: (list at least one high-quality, free online resource)
4. Projects: (suggest a practical project or exercise)

Example:
low-fidelity mockups
1. Learning Goal: Understand how to quickly visualize ideas and user flows using simple sketches or wireframes.
2. Time Required: 1 week (5-7 hours)
3. Best Free/Online Resources: "Wireframing for Beginners" on Coursera, "Low-Fidelity Prototyping" on Interaction Design Foundation.
4. Projects: Create wireframes for a simple mobile app, redesign a website homepage using paper sketches.

Skills: ${missingSkills.join(", ")}

For every skill in the list, fill ALL four fields with specific, practical, and skill-relevant content. Do not skip any skill. Do not leave any field blank. Use a new block for each skill, and keep the format consistent as shown above.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    console.log("[RoadmapAI Debug] Raw AI response:\n", content);
    if (!content) {
      return NextResponse.json({ error: "Failed to generate roadmap" }, { status: 500 });
    }

    return NextResponse.json({ roadmap: content });
  } catch (error) {
    console.error("Error generating upskill roadmap:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json({ 
          error: "OpenAI API key issue",
          details: "Please check your OpenAI API key in .env.local"
        }, { status: 500 });
      }
      
      // Handle quota exceeded error with mock response
      if (error.message.includes("429") || error.message.includes("quota")) {
        console.log("OpenAI quota exceeded, providing mock roadmap for testing...");
        return NextResponse.json({ error: "Roadmap feature removed" }, { status: 410 });
      }
    }

    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}