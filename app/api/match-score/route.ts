import { NextRequest, NextResponse } from "next/server";
import { cosineSimilarity } from "@/lib/cosine";

export async function POST(req: NextRequest) {
  const { cvEmbedding, jdEmbedding, cvSkills, jdSkills } = await req.json();

  if (!cvEmbedding || !jdEmbedding) {
    return NextResponse.json({ error: "Missing embeddings" }, { status: 400 });
  }

  // Embedding similarity
  const embeddingScore = cosineSimilarity(cvEmbedding, jdEmbedding);

  // Skill overlap score
  let skillScore = 0;
  let missingSkills: string[] = [];
  if (cvSkills && jdSkills) {
    // Normalize skills to lowercase for comparison
    const normalizedCvSkills = cvSkills.map((skill: string) => skill.toLowerCase());
    const normalizedJdSkills = jdSkills.map((skill: string) => skill.toLowerCase());
    missingSkills = jdSkills.filter(
      (skill: string) => !normalizedCvSkills.includes(skill.toLowerCase())
    );
    // Skill overlap: Jaccard similarity
    const intersection = normalizedJdSkills.filter((skill: string) => normalizedCvSkills.includes(skill));
    const union = Array.from(new Set([...normalizedJdSkills, ...normalizedCvSkills]));
    skillScore = union.length > 0 ? intersection.length / union.length : 0;

    // If no missing skills found but score is low, add common missing skills
    if (missingSkills.length === 0 && embeddingScore < 0.6) {
      const commonMissingSkills = [
        "JWT", "Authentication", "RESTful APIs", "API Testing", 
        "Postman", "Figma", "Canva", "Visual Studio Code",
        "Vercel", "Render", "Stripe", "MVC Architecture",
        "Session Management", "Payment Integration", "UI/UX Design"
      ];
      const skillsToAdd = commonMissingSkills.filter(skill => 
        !normalizedCvSkills.includes(skill.toLowerCase())
      ).slice(0, 6);
      missingSkills = skillsToAdd;
    }
  }

  // Combine scores: 50% embedding, 50% skill overlap
  let combinedScore = 0.5 * embeddingScore + 0.5 * skillScore;
  // Clamp to [0, 1] and set a minimum threshold (e.g., 5%) unless both are zero
  if (combinedScore > 0 && combinedScore < 0.05) combinedScore = 0.05;
  if (combinedScore < 0) combinedScore = 0;

  // Determine match level for UI
  let matchLevel = "low";
  if (combinedScore >= 0.8) {
    matchLevel = "high";
  } else if (combinedScore >= 0.5) {
    matchLevel = "medium";
  }

  return NextResponse.json({ 
    score: Number((combinedScore * 100).toFixed(2)),
    missingSkills,
    matchLevel
  });
}