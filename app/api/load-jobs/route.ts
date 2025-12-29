import { NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { supabase } from "@/lib/supabase";
import jobs from "@/data/jobs.json";

async function getEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

export async function POST() {
  const results = [];
  for (const job of jobs) {
    try {
      const embedding = await getEmbedding(job.description);
      console.log(`Embedding length for ${job.title}: ${embedding.length}`);
      if (!embedding || embedding.length !== 1536) {
        throw new Error(`Invalid embedding length: ${embedding ? embedding.length : 0}`);
      }
      if (!supabase) {
        results.push({ job: job.title, status: "error", error: "Supabase client not configured. Please add lib/supabase.ts." });
        continue;
      }
      const { error } = await supabase.from("jobs").insert({
        title: job.title,
        description: job.description,
        skills: job.skills,
        embedding,
      });
      if (error) {
        results.push({ job: job.title, status: "error", error });
      } else {
        results.push({ job: job.title, status: "inserted" });
      }
    } catch (err) {
      results.push({ job: job.title, status: "embedding_error", error: err });
    }
  }
  return NextResponse.json({
    inserted: results.filter(r => r.status === "inserted").length,
    failed: results.filter(r => r.status !== "inserted").length,
    details: results
  });
}
