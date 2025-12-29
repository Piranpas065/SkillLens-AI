/**
 * Quick Test Component for Roadmap API
 * Add this to dashboard page for easy testing
 */



import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RoadmapQuickTestProps {
  missingSkills?: string[];
}



const DEFAULT_TEST_SKILLS: string[] = [];

const RoadmapQuickTest = ({ missingSkills }: RoadmapQuickTestProps) => {
  const [testResults, setTestResults] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Use missingSkills if provided, otherwise fallback to default
  const testSkills = (missingSkills && missingSkills.length > 0) ? missingSkills : DEFAULT_TEST_SKILLS;

  const runQuickTest = async () => {
    setTesting(true);
    try {
      const userRole = localStorage.getItem("userRole") || undefined;
      const response = await fetch("/api/upskill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missingSkills: testSkills, role: userRole }),
      });
      // Debug: log API response
      const clonedResponse = response.clone();
      try {
        const debugText = await clonedResponse.text();
        console.log('[RoadmapQuickTest] API raw response:', debugText);
      } catch (e) { /* ignore */ }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error ${response.status}: ${errorData.details || errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      // Quick quality analysis  
      const roadmap = data.roadmap.toLowerCase();
      const hasTime = /\d+[-–]?\d*\s*(week|hour|day|month)s?/i.test(data.roadmap);
      const hasResources = /resource|documentation|docs|tutorial|course|guide|link|website|video/i.test(roadmap);
      const hasProjects = /project|build|create|develop|practice|implement|exercise/i.test(roadmap);
      const hasGoals = /goal|learn|understand|master|objective|aim|focus/i.test(roadmap);
      
      const quality = [hasTime, hasResources, hasProjects, hasGoals].filter(Boolean).length;
      
      // Save to localStorage for dashboard use
      localStorage.setItem("upskillRoadmap", data.roadmap);
      



      // Format roadmap for better alignment and clear separation between skills
      function formatRoadmap(text: string): string {
        let formatted = text;

        // 1️⃣ Remove orphan number-only lines (lines that contain ONLY "1", "2", etc.)
        formatted = formatted.replace(/^\s*\d+\s*$/gm, '');

        // 2️⃣ Remove unwanted symbols at line start
        formatted = formatted.replace(
          /^[★☆$=📝✅❌📊📋🧪💲💵💰💴💶💷💸•*#`_\[\]]+/gm,
          ''
        );

        // 3️⃣ Normalize section headers
        formatted = formatted.replace(/^###\s*(.+)$/gm, '\n\n$1');

        // 4️⃣ Clean excessive blank lines
        formatted = formatted.replace(/\n{3,}/g, '\n\n');

        // 5️⃣ Add separator between each skill's block (look for lines that start with a skill name, e.g., capitalized word, and insert --- before)
        formatted = formatted.replace(/(?<=\n|^)\s*([A-Z][A-Za-z0-9\-/ ]{2,})\n1\. Learning Goal:/g, '\n---\n$1\n1. Learning Goal:');

        // Remove leading separator if present
        formatted = formatted.replace(/^---\n/, '');

        return formatted.trim();
      }

      // Format summary as a single paragraph
      function formatSummary(text: string): string {
        return text.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
      }

      // Split and clean skills into a single-column list
      function splitSkills(skills: string[]): string[] {
        return skills.flatMap(skill =>
          skill
            .replace(/["{}\[\]`:.]/g, "")
            .split(/[\n,()]+/)
            .map(s => s.trim())
            .filter(Boolean)
        );
      }
      const formattedSkills = splitSkills(testSkills);
      // Add a space between each skill for clarity
      const skillsList = formattedSkills.length
        ? `\nSkills:\n${formattedSkills.join("\n\n")}` // double newline for space between
        : "\nSkills: None";

      // Custom roadmap formatter for requested layout
      function formatCustomRoadmap(text: string, allSkills: string[]): string {
        let formatted = '';
        // ...existing code...
        return formatted.trim();
      }

      // If data.summary exists, format it as a single paragraph
      let formattedSummary = '';
      if (data.summary) {
        formattedSummary = formatSummary(String(data.summary));
      }

      const improvedAnalysis = `
    QUICK TEST RESULTS
    ------------------

    ${formattedSummary ? `CV Summary:\n${formattedSummary}\n` : ''}
    Time Estimates: ${hasTime ? 'Yes' : 'No'}
    Learning Resources: ${hasResources ? 'Yes' : 'No'}
    Project Ideas: ${hasProjects ? 'Yes' : 'No'}
    Learning Goals: ${hasGoals ? 'Yes' : 'No'}
    ${skillsList}

    Full Generated Roadmap (Formatted):

    ${sanitizeRoadmap(formatRoadmap(data.roadmap))}
      `;

// Helper function to remove unwanted characters and markdown from roadmap
function sanitizeRoadmap(text: string): string {
  return text
    .replace(/[★☆$=📝✅❌📊📋🧪💲💵💰💴💶💷💸•*#`_\[\]]+/g, "") // Remove symbols, markdown, bullets, brackets
    .replace(/https?:\/\/\S+/g, (url) => url) // Keep URLs
    .replace(/\n+/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

      setTestResults(improvedAnalysis);
      // Debug: log what is being set
      console.log('[RoadmapQuickTest] setTestResults:', improvedAnalysis);
    } catch (error) {
      setTestResults(`❌ Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">🧪 Roadmap API Quick Test</h3>
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <span>Test missing skills:</span>
          <ul className="list-disc list-inside ml-4">
            {testSkills.length > 0 ? testSkills.map((skill, i) => (
              <li key={i}>{skill}</li>
            )) : <li>None</li>}
          </ul>
        </div>
        <Button 
          onClick={runQuickTest} 
          disabled={testing}
          className="w-full"
        >
          {testing ? "Testing..." : "Run Quality Test"}
        </Button>
        {testResults && (
          <div className="mt-4">
            <div className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap overflow-y-auto max-h-96 border">
              {testResults}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RoadmapQuickTest;