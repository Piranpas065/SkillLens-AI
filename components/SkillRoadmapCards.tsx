import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, BookOpen, Code } from "lucide-react";

interface SkillRoadmapProps {
  roadmapText: string;
}

interface SkillSection {
  skill: string;
  goal: string;
  time: string;
  resources: string[];
  project: string;
}

const SkillRoadmapCards = ({ roadmapText }: SkillRoadmapProps) => {
  const parseRoadmap = (text: string): SkillSection[] => {
    // Clean the text first
    const cleanText = text.replace(/Note:.*?vary\./g, '').trim();
    if (!cleanText) return [];
    const lines = cleanText.split(/\n|\r/).map(l => l.trim());
    const skills: SkillSection[] = [];
    let current: SkillSection | null = null;
    let inResources = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Start new skill section on numbered line (e.g., '1 of 14', '2 of 14', ...)
      if (/^\d+\s*of\s*\d+/i.test(line) || /^\d+\./.test(line)) {
        if (current && current.skill && !skills.some(s => s.skill === current!.skill)) {
          skills.push(current);
        }
        current = { skill: '', goal: '', time: '', resources: [], project: '' };
        inResources = false;
        continue;
      }
      // Skill name (if not set and not a label)
      if (current && !current.skill && line && !/^Learning Goal|Time Required|Learning Resources|Practice Project|-/i.test(line)) {
        current.skill = line.replace(/[★☆$=📝✅❌📊📋🧪💲💵💰💴💶💷💸•*#`_\[\]]+/g, '').replace(/^#+\s*/, '').trim();
        continue;
      }
      // Learning Goal
      if (/^Learning Goal/i.test(line)) {
        inResources = false;
        if (current) current.goal = '';
        continue;
      }
      if (/^\*\*?\s?(.+)/.test(line) && current && current.goal === '') {
        // Bolded goal line
        current.goal = line.replace(/^\*\*?\s?/, '').trim();
        continue;
      }
      if (/^-\s*Learning Goal:/i.test(line) && current) {
        current.goal = line.replace(/^-\s*Learning Goal:/i, '').trim();
        continue;
      }
      // Time Required
      if (/^Time Required/i.test(line)) {
        inResources = false;
        if (current) current.time = '';
        continue;
      }
      if (/^-\s*Time Required:/i.test(line) && current) {
        current.time = line.replace(/^-\s*Time Required:/i, '').trim();
        continue;
      }
      if (/\d+\s*(week|hour|day|month)/i.test(line) && current && !current.time) {
        current.time = line.trim();
        continue;
      }
      // Learning Resources
      if (/^Learning Resources/i.test(line)) {
        inResources = true;
        if (current) current.resources = [];
        continue;
      }
      if (/^-\s*Best Free\/Online Resources:/i.test(line)) {
        inResources = true;
        continue;
      }
      if (inResources && /^-\s*\[?[^\]]+\]?/i.test(line) && current) {
        // Resource bullet
        current.resources.push(line.replace(/^-\s*/, ''));
        continue;
      }
      // Practice Project
      if (/^Practice Project/i.test(line)) {
        inResources = false;
        if (current) current.project = '';
        continue;
      }
      if (/^-\s*Project Ideas:/i.test(line)) {
        inResources = false;
        continue;
      }
      if (/^-\s*Learning Goal:/i.test(line) || /Learning Goal:/i.test(line)) continue;
      if (/^-\s*Time Required:/i.test(line) || /Time Required:/i.test(line)) continue;
      if (/^-\s*Best Free\/Online Resources:/i.test(line) || /Best Free\/Online Resources:/i.test(line)) continue;
      if (/^-\s*Project Ideas:/i.test(line) || /Project Ideas:/i.test(line)) continue;
      if (/^-\s*No specific goal provided\./i.test(line) || /No specific goal provided\./i.test(line)) continue;
      if (/^-\s*No time estimate provided\./i.test(line) || /No time estimate provided\./i.test(line)) continue;
      if (/^-\s*No resources listed\./i.test(line) || /No resources listed\./i.test(line)) continue;
      if (/^-\s*No project suggestion provided\./i.test(line) || /No project suggestion provided\./i.test(line)) continue;
      // Project
      if (/^-\s*Project:/i.test(line) && current) {
        current.project = line.replace(/^-\s*Project:/i, '').trim();
        continue;
      }
    }
    // Push last section
    if (current && current.skill && !skills.some(s => s.skill === current!.skill)) {
      skills.push(current);
    }
    // Remove empty/duplicate cards
    return skills.filter(s => s.skill && (s.goal || s.time || s.resources.length > 0 || s.project));
  };

  const skills = parseRoadmap(roadmapText);

  if (skills.length === 0) {
    return (
      <div className="bg-gray-100 p-4 rounded-md">
        <p className="text-gray-600">No roadmap data to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6">
        {skills.map((skill, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow border border-gray-200 bg-white">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">{skill.skill}</h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {index + 1} of {skills.length}
                </Badge>
              </div>

              {/* Goal */}
              <div>
                <div className="flex items-center mb-1">
                  <Target className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-semibold text-gray-800">Learning Goal</span>
                </div>
                <p className={skill.goal ? "text-gray-700" : "text-gray-400 italic"}>
                  {skill.goal.replace(/^#+\s*/, '') || 'No specific goal provided.'}
                </p>
              </div>
              <hr className="my-2 border-gray-100" />

              {/* Time */}
              <div>
                <div className="flex items-center mb-1">
                  <Clock className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="font-semibold text-gray-800">Time Required</span>
                </div>
                <p className={skill.time ? "text-gray-700" : "text-gray-400 italic"}>
                  {skill.time || 'No time estimate provided.'}
                </p>
              </div>
              <hr className="my-2 border-gray-100" />

              {/* Resources */}
              <div>
                <div className="flex items-center mb-1">
                  <BookOpen className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-semibold text-gray-800">Learning Resources</span>
                </div>
                {skill.resources.length > 0 ? (
                  <ul className="space-y-1 mt-1">
                    {skill.resources.map((resource, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="w-2 h-2 bg-purple-300 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {resource}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic">No resources listed.</p>
                )}
              </div>
              <hr className="my-2 border-gray-100" />

              {/* Project */}
              <div>
                <div className="flex items-center mb-1">
                  <Code className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-gray-800">Practice Project</span>
                </div>
                <p className={skill.project ? "text-gray-700" : "text-gray-400 italic"}>
                  {skill.project || 'No project suggestion provided.'}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SkillRoadmapCards;