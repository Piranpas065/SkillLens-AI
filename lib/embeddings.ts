import { openai } from "./openAI";

/**
 * Clean text for embedding processing
 * Removes newlines, extra whitespace, and special symbols
 */
function cleanTextForEmbedding(text: string): string {
  return text
    .replace(/\n+/g, ' ')           // Replace newlines with spaces
    .replace(/\r+/g, ' ')           // Replace carriage returns with spaces
    .replace(/[^\w\s\-.,()]/g, ' ') // Keep only alphanumeric, spaces, hyphens, periods, commas, parentheses
    .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
    .trim();                        // Remove leading/trailing whitespace
}

/**
 * Get text embedding using OpenAI's text-embedding-3-large model
 * Returns a normalized 1536-dimension vector
 * Reusable for both CV text and Job Description text
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty for embedding generation");
  }

  // Clean the text for better embedding quality
  const cleanedText = cleanTextForEmbedding(text);
  
  if (cleanedText.length === 0) {
    throw new Error("Text becomes empty after cleaning - please provide meaningful text");
  }

  // Truncate text if too long (OpenAI has token limits)
  const maxChars = 8000; // Conservative limit for embedding model
  const finalText = cleanedText.length > maxChars 
    ? cleanedText.substring(0, maxChars) + "..."
    : cleanedText;

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: finalText,
    });

    const embedding = response.data[0].embedding;
    
    // Validate embedding dimensions (text-embedding-3-small returns 1536 dimensions)
    if (!Array.isArray(embedding)) {
      throw new Error("Invalid embedding response format");
    }

    // Validate expected dimensions
    if (embedding.length !== 1536) {
      console.warn(`Expected 1536 dimensions, got ${embedding.length}`);
    }

    return embedding;
  } catch (error: any) {
    console.error("Embedding generation failed:", error);
    
    // Handle specific OpenAI API errors
    if (error.status === 429) {
      throw new Error("OpenAI quota exceeded. Please check your billing and usage.");
    } else if (error.status === 401) {
      throw new Error("Invalid OpenAI API key. Please check your configuration.");
    } else if (error.status === 400) {
      throw new Error("Invalid request to OpenAI API. Text may be too long or contain invalid characters.");
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error("Network error: Unable to connect to OpenAI API. Please check your internet connection.");
    }
    
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns a score between -1 and 1 (higher = more similar)
 */
export function calculateCosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
  if (embeddingA.length !== embeddingB.length) {
    throw new Error("Embeddings must have the same dimensions");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
    magnitudeA += embeddingA[i] * embeddingA[i];
    magnitudeB += embeddingB[i] * embeddingB[i];
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  
  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}