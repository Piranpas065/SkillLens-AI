/**
 * Free AI Skills Extraction using Hugging Face Transformers
 * No API key or payment required
 */

export async function extractSkillsWithFreeAI(text: string): Promise<string[]> {
  // Always use regex-based extraction for now (most reliable)
  console.log("Using regex-based skill extraction as free alternative");
  return extractSkillsWithRegex(text);
}

/**
 * Fallback: Extract skills using regex patterns (completely offline)
 */
export function extractSkillsWithRegex(text: string): string[] {
  const commonSkills = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS', 'SASS', 'SCSS',
    
    // Frameworks & Libraries
    'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask',
    'Spring Boot', 'Laravel', 'Symfony', 'Rails', 'jQuery', 'Bootstrap', 'Tailwind',
    
    // Databases
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub',
    'GitLab', 'CI/CD', 'Terraform', 'Ansible',
    
    // Soft Skills
    'Leadership', 'Communication', 'Problem Solving', 'Team Work', 'Project Management',
    'Agile', 'Scrum', 'Critical Thinking', 'Adaptability', 'Time Management'
  ];

  const foundSkills: string[] = [];
  const textLower = text.toLowerCase();

  for (const skill of commonSkills) {
    if (textLower.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }

  return foundSkills;
}