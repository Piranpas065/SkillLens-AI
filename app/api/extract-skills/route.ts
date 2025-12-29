import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { extractSkillsWithFreeAI } from "@/lib/free-ai-skills";

export async function POST(req: NextRequest) {
  let text: string;
  
  try {
    const requestData = await req.json();
    text = requestData.text;
    console.log("[extract-skills] Incoming request data:", requestData);

    if (!text) {
      console.error("[extract-skills] No input text provided in request body:", requestData);
      return NextResponse.json({ error: "No input text provided" }, { status: 400 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here") {
      console.error("[extract-skills] OpenAI API key not configured or invalid:", process.env.OPENAI_API_KEY);
      return NextResponse.json({ 
        error: "OpenAI API key not configured",
        details: "Please set OPENAI_API_KEY in your .env.local file"
      }, { status: 500 });
    }

    const prompt = `Extract ALL technical skills, tools, platforms, concepts, and technologies mentioned in this text. Be extremely comprehensive and include:

- Programming languages (JavaScript, Python, etc.)
- Frameworks & libraries (React, Next.js, Express, Django, etc.)
- Databases (MongoDB, PostgreSQL, MySQL, etc.)
- Tools & platforms (Postman, Figma, Canva, Visual Studio Code, Vercel, Render, etc.)
- Authentication methods (JWT, session-based, etc.)
- Concepts & architectures (RESTful APIs, MVC, CI/CD, etc.)
- Cloud services (AWS, etc.)
- Payment systems (Stripe, etc.)
- Any other technology/skill mentioned

Text: "${text}"

Extract every single technical term and skill. Return as comma-separated list only:`;

    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Updated model name
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });
    } catch (openaiError) {
      console.error("[extract-skills] OpenAI API call failed:", openaiError);
      throw openaiError;
    }

    const skillsRaw = response.choices[0].message.content || "";
    const skills = skillsRaw.split(",").map((s) => s.trim());

    console.log("[extract-skills] Extracted skills from OpenAI:", skills);
    return NextResponse.json({ skills, source: "openai" });
  } catch (error) {
    console.error("[extract-skills] Skills extraction error:", error);
    if (typeof error === 'object' && error !== null) {
      console.error("[extract-skills] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
    // Check if this is a quota/rate limit error (429)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isQuotaError = 
      (error && typeof error === 'object' && ('status' in error) && (error as any).status === 429) ||
      errorMessage.includes('429') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('Too Many Requests');
    
    // Try free alternative for any quota-related errors
    if (isQuotaError) {
      console.log("Quota/rate limit detected, trying free alternative...");
      try {
        const freeSkills = await extractSkillsWithFreeAI(text);
        
        if (!freeSkills || freeSkills.length === 0) {
          throw new Error("No skills extracted from free AI fallback");
        }
        
        return NextResponse.json({ 
          skills: freeSkills, 
          source: "free-ai",
          message: "Using free AI fallback (quota exceeded)"
        });
      } catch (fallbackError) {
        console.error("Free fallback also failed:", fallbackError);
        return NextResponse.json({ 
          error: "Quota Exceeded",
          details: "OpenAI quota exceeded and free alternative failed. Please try again later."
        }, { status: 429 });
      }
    }
    
    // Handle other OpenAI API errors
    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = error as any;
      return NextResponse.json({ 
        error: "OpenAI API error",
        details: apiError.error?.message || apiError.message || "Failed to communicate with OpenAI API"
      }, { status: apiError.status || 500 });
    }

    // Handle general errors
    return NextResponse.json({ 
      error: "Skills extraction failed",
      details: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}