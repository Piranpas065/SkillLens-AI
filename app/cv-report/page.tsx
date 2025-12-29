"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SimpleAccordion } from "@/components/ui/SimpleAccordion";

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-500 rounded">
      {children}
    </div>
  );
}

export default function CVReportPage() {
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cvText, setCvText] = useState("");
  const [upgrade, setUpgrade] = useState<string>("");

  useEffect(() => {
    const cv = localStorage.getItem("uploadedCVText") || "";
    setCvText(cv);
    if (!cv) return;
    (async () => {
      setLoading(true);
      // Extract summary and skills
      const infoRes = await fetch("/api/extract-cv-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: cv }),
      });
      const info = await infoRes.json();



      // Normalize summary: remove excessive line breaks, parse if needed, and remove unwanted symbols
      let summary = info.summary || "";
      try {
        if (typeof summary === "string" && summary.trim().startsWith("{") && summary.trim().endsWith("}")) {
          const parsed = JSON.parse(summary);
          summary = parsed.summary || summary;
        }
      } catch (e) {
        // leave summary as is
      }
      if (typeof summary === "string") {
        summary = summary.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
        // Remove unwanted characters and symbols
        summary = summary.replace(/["{}\[\]`:.]/g, "");
      }

      // Normalize skills: split grouped skills into individual ones and remove unwanted symbols
      let skills: string[] = [];
      if (Array.isArray(info.skills)) {
        skills = info.skills
          .flatMap((s: any) =>
            typeof s === "string"
              ? s
                  .split(/[\n,;]+/)
                  .map((x: string) => x.trim().replace(/["{}\[\]`:.]/g, ""))
                  .filter(Boolean)
              : [String(s).replace(/["{}\[\]`:.]/g, "")]
          );
      } else if (typeof info.skills === "string") {
        skills = info.skills.split(/[\n,;]+/).map((s: string) => s.trim().replace(/["{}\[\]`:.]/g, "")).filter(Boolean);
      }
      // Remove empty and duplicate skills
      skills = Array.from(new Set(skills.filter(Boolean)));

      setSummary(summary);
      setSkills(skills);

      // Get job matches
      const matchRes = await fetch("/api/recommend-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: cv, matchCount: 3 }),
      });
      const matchData = await matchRes.json();
      setMatches(matchData.matches || []);

      // Get upgrade suggestions (bonus)
      const upgradeRes = await fetch("/api/extract-cv-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: cv + "\n\nSuggest 2-3 ways to improve this CV for tech jobs." }),
      });
      const upgradeData = await upgradeRes.json();
      setUpgrade(upgradeData.summary || "");
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="max-w-5xl mx-auto py-12 px-4 bg-white dark:bg-black rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 mt-10 mb-20">
          <h1 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-white tracking-tight">CV Report</h1>
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-300">Generating report...</div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">CV Summary</CardTitle>
                  </CardHeader>
                  <CardDescription className="px-6 pb-2 text-gray-700 dark:text-gray-300">
                    {summary}
                  </CardDescription>
                </Card>
                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Extracted Skills</CardTitle>
                  </CardHeader>
                  <CardDescription className="px-6 pb-2 text-gray-700 dark:text-gray-300">
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, i) => (
                        <span key={i} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">{skill}</span>
                      ))}
                    </div>
                  </CardDescription>
                </Card>
              </div>
              <div className="mb-8">
                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Top 3 Job Matches</CardTitle>
                  </CardHeader>
                  <CardDescription className="px-6 pb-2 text-gray-700 dark:text-gray-300">
                    {matches.length === 0 && <div>No matches found.</div>}
                    {matches.map((job, idx) => (
                      <div key={idx} className="mb-6">
                        <div className="flex items-center mb-1">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{job.title}</span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">{job.description?.slice(0, 200)}{job.description?.length > 200 ? "..." : ""}</div>
                        <SimpleAccordion title={<span className="font-medium">Why this job matches</span>}>
                          <span>{job.reason || "No explanation available."}</span>
                        </SimpleAccordion>
                      </div>
                    ))}
                  </CardDescription>
                </Card>
              </div>
              {upgrade && (
                <Alert>
                  <div className="font-semibold mb-1">Upgrade CV Suggestions</div>
                  <div>{upgrade}</div>
                </Alert>
              )}
            </>
          )}
        </div>
      </div>
    
    </div>
  );
}
