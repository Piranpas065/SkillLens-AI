import { NextRequest, NextResponse } from "next/server";
import { getEmbedding } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      console.error("Invalid input:", { text: typeof text, body });
      return NextResponse.json({ 
        error: "Invalid input text",
        details: "Text must be a non-empty string" 
      }, { status: 400 });
    }

    if (text.trim().length === 0) {
      return NextResponse.json({ 
        error: "Empty text",
        details: "Text cannot be empty after trimming" 
      }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here") {
      console.error("OpenAI API key not configured");
      return NextResponse.json({ 
        error: "OpenAI API key not configured",
        details: "Please set OPENAI_API_KEY in your .env.local file"
      }, { status: 500 });
    }

    console.log(`Generating embedding for text of length: ${text.length}`);
    
    // Try OpenAI first, but gracefully fall back to mock
    let vector;
    let source = "openai";
    let message;

    try {
      // Try to generate real embedding
      vector = await getEmbedding(text);
      console.log("Embedding length:", vector.length);
      console.log(`Successfully generated OpenAI embedding with ${vector.length} dimensions`);
    } catch (embeddingError: any) {
      console.log("OpenAI embedding failed, using mock embedding for development");
      console.log("Error details:", embeddingError.message || embeddingError);
      
      // Generate mock embedding as fallback
      vector = generateMockEmbedding(text);
      source = "mock";
      message = "OpenAI quota exceeded - using mock embedding for development";
      console.log("Embedding length:", vector.length);
      console.log(`Generated mock embedding with ${vector.length} dimensions`);
    }
    
    return NextResponse.json({ 
      embedding: vector,
      dimensions: vector.length,
      textLength: text.length,
      source,
      ...(message && { message })
    });
    
  } catch (err) {
    console.error("Embeddings API error:", err);
    
    // Provide detailed error information
    if (err instanceof Error) {
      return NextResponse.json({ 
        error: "Embedding generation failed",
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: "Unknown error occurred",
      details: "An unexpected error occurred while generating embeddings"
    }, { status: 500 });
  }
}

/**
 * Generate a mock embedding for development purposes when OpenAI quota is exceeded
 * Creates a deterministic but random-looking vector based on text content
 */
function generateMockEmbedding(text: string): number[] {
  const dimensions = 1536; // Same as OpenAI text-embedding-3-small
  const mockEmbedding: number[] = [];
  
  // Use text content to seed the "random" numbers for consistency
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed += text.charCodeAt(i);
  }
  
  // Simple pseudo-random number generator
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  
  // Generate mock embedding values between -1 and 1
  for (let i = 0; i < dimensions; i++) {
    const value = (random(seed + i) - 0.5) * 2; // Scale to [-1, 1]
    mockEmbedding.push(parseFloat(value.toFixed(6))); // Round to 6 decimal places like OpenAI
  }
  
  // Normalize the vector (make it unit length like real embeddings)
  const magnitude = Math.sqrt(mockEmbedding.reduce((sum, val) => sum + val * val, 0));
  return mockEmbedding.map(val => val / magnitude);
}