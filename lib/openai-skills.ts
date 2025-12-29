/**
 * OpenAI Skills Extraction Module
 * Uses GPT to extract and clean skill lists from CV text
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SkillExtractionResult {
  skills: string[];
  categories: {
    technical: string[];
    soft: string[];
    languages: string[];
    tools: string[];
    frameworks: string[];
    certifications: string[];
  };
  experience_level?: string;
  summary?: string;
}

export interface SkillExtractionError {
  error: string;
  details?: string;
  statusCode: number;
}

/**
 * Extract and categorize skills from CV text using GPT
 * @param cvText - The extracted text from a CV/resume
 * @returns Structured skill data with categories
 */
export async function extractSkillsWithGPT(cvText: string): Promise<SkillExtractionResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw {
        error: "OpenAI API key not configured",
        details: "Please set OPENAI_API_KEY in environment variables",
        statusCode: 500
      } as SkillExtractionError;
    }

    if (!cvText || cvText.trim().length === 0) {
      throw {
        error: "No CV text provided",
        details: "CV text is empty or invalid",
        statusCode: 400
      } as SkillExtractionError;
    }

    const prompt = `
You are an expert HR analyst. Extract and categorize ALL skills mentioned in the following CV/resume text. 

Please analyze the text and return a JSON response with the following structure:
{
  "skills": ["array of all unique skills found"],
  "categories": {
    "technical": ["programming languages, databases, operating systems"],
    "soft": ["communication, leadership, problem-solving, etc."],
    "languages": ["English, Spanish, etc."],
    "tools": ["specific software tools, IDEs, applications"],
    "frameworks": ["React, Angular, Django, etc."],
    "certifications": ["AWS Certified, PMP, etc."]
  },
  "experience_level": "Junior/Mid-level/Senior/Expert",
  "summary": "Brief 2-3 sentence summary of the candidate's key strengths"
}

Rules:
1. Extract ALL skills mentioned, even if implied
2. Normalize skill names (e.g., "JS" → "JavaScript", "React.js" → "React")
3. Remove duplicates and variations of the same skill
4. Don't invent skills not mentioned in the text
5. Categorize each skill appropriately
6. Determine experience level based on years of experience, job titles, and complexity of projects
7. Return only valid JSON

CV Text:
${cvText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert HR analyst specializing in skill extraction from resumes. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw {
        error: "No response from OpenAI",
        details: "OpenAI returned empty response",
        statusCode: 500
      } as SkillExtractionError;
    }

    try {
      // Parse the JSON response
      const skillData = JSON.parse(responseText) as SkillExtractionResult;
      
      // Validate the response structure
      if (!skillData.skills || !Array.isArray(skillData.skills)) {
        throw new Error("Invalid skills array in response");
      }
      
      if (!skillData.categories || typeof skillData.categories !== 'object') {
        throw new Error("Invalid categories object in response");
      }

      // Ensure all category arrays exist
      const defaultCategories = {
        technical: [],
        soft: [],
        languages: [],
        tools: [],
        frameworks: [],
        certifications: []
      };

      skillData.categories = { ...defaultCategories, ...skillData.categories };

      return skillData;
      
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Raw response:", responseText);
      
      throw {
        error: "Failed to parse skill extraction response",
        details: parseError instanceof Error ? parseError.message : "Invalid JSON response from AI",
        statusCode: 500
      } as SkillExtractionError;
    }

  } catch (error) {
    console.error("Skill extraction error:", error);
    
    // If it's already a SkillExtractionError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    // Handle OpenAI API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw {
          error: "OpenAI API authentication failed",
          details: "Invalid or missing API key",
          statusCode: 401
        } as SkillExtractionError;
      }
      
      if (error.message.includes('quota') || error.message.includes('billing')) {
        throw {
          error: "OpenAI API quota exceeded",
          details: "Please check your OpenAI billing and usage limits",
          statusCode: 429
        } as SkillExtractionError;
      }
    }

    // Generic error fallback
    throw {
      error: "Skill extraction failed",
      details: error instanceof Error ? error.message : "Unknown error occurred",
      statusCode: 500
    } as SkillExtractionError;
  }
}

/**
 * Extract a simple list of skills (backward compatibility)
 * @param cvText - The extracted text from a CV/resume
 * @returns Array of skill strings
 */
export async function extractSkillsList(cvText: string): Promise<string[]> {
  try {
    const result = await extractSkillsWithGPT(cvText);
    return result.skills;
  } catch (error) {
    console.error("Error extracting skills list:", error);
    return [];
  }
}