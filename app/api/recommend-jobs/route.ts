import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    console.log("Received request to /api/recommend-jobs");
    const body = await req.json();
    // Accept either 'message' or 'cvText' as input
    const message = body.message || body.cvText || "";
    const matchCount = typeof body.matchCount === "number" ? body.matchCount : 4;
    console.log("Message:", message);
    // Simple matching: load jobs.json and match by skill overlap
    const jobsPath = path.join(process.cwd(), "data", "jobs.json");
    const jobsRaw = fs.readFileSync(jobsPath, "utf-8");
    const jobs = JSON.parse(jobsRaw);

    // Extract skills/words from the message (split by comma/space, lowercase)
    const skillWords = message.split(/[\s,]+/).map((s: string) => s.trim().toLowerCase()).filter(Boolean);


    // Helper: normalize UI/UX terms
    function normalizeSkill(skill) {
      return skill
        .replace(/ui\/?ux(\s+)?(design(er)?)/gi, 'uiux')
        .replace(/\s+/g, '')
        .toLowerCase();
    }

    // Helper: partial/fuzzy match with normalization
    function fuzzyIncludes(arr, word) {
      const normWord = normalizeSkill(word);
      return arr.some((item) => {
        const normItem = normalizeSkill(item);
        return normItem.includes(normWord) || normWord.includes(normItem);
      });
    }

    // Score jobs by number of matching skills (partial/fuzzy), and boost if job title matches summary/skills
    const scoredJobs = jobs.map((job: any) => {
      const jobSkills = (job.skills || []).map((s: string) => s.toLowerCase());
      // Fuzzy/partial match for skills with normalization
      const matchedSkills = jobSkills.filter((js) => skillWords.some((sw) => fuzzyIncludes([js], sw)));
      let matchCountVal = matchedSkills.length;
      let similarity = jobSkills.length > 0 ? matchCountVal / jobSkills.length : 0;

      // Boost if job title or skills match UI/UX design/designer
      const jobTitle = (job.title || '').toLowerCase();
      const summaryWords = message.toLowerCase().split(/[\s,]+/);
      const normJobTitle = normalizeSkill(jobTitle);
      const normSkillWords = skillWords.map(normalizeSkill);
      const uiuxTitleMatch = normJobTitle.includes('uiux') || normSkillWords.includes('uiux');
      const titleMatch = summaryWords.some((sw) => jobTitle.includes(sw) || sw.includes(jobTitle));
      if (titleMatch || uiuxTitleMatch) {
        similarity += 0.4; // extra boost for UI/UX match
      }

      // Debug log for each job
      console.log('[JobMatchDebug]', {
        jobTitle: job.title,
        jobSkills,
        matchedSkills,
        similarity,
        skillWords,
      });

      return { ...job, matchedSkills, matchCount: matchCountVal, similarity };
    });

    // Lower similarity threshold to 0.4
    const threshold = 0.4;
    const filteredJobs = scoredJobs.filter((j: any) => j.similarity >= threshold);
    // Sort by similarity and match count, descending
    const sortedJobs = filteredJobs.sort((a: any, b: any) => b.similarity - a.similarity || b.matchCount - a.matchCount);

    // Limit to top N matches
    const topMatches = sortedJobs.slice(0, matchCount);

    // Log top 5 jobs for debugging
    const debugTop = sortedJobs.slice(0, 5).map((job: any) => ({ title: job.title, similarity: Number(job.similarity).toFixed(3) }));
    console.log("Top 5 jobs:", debugTop);

    // Format for cv-report: matches array with job, rounded similarity, and reason
    const matches = topMatches.map((job: any) => ({
      title: job.title,
      description: job.description,
      similarity: Number(job.similarity).toFixed(3),
      reason: job.matchedSkills && job.matchedSkills.length > 0
        ? `Matched skills: ${job.matchedSkills.join(", ")}`
        : (job.title ? `Title match: ${job.title}` : "No specific skills matched.")
    }));

    return NextResponse.json({ matches });
  } catch (err: any) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
  }
}
