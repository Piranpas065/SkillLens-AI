/**
 * Example Usage: Skills Extraction API
 * 
 * This file demonstrates how to use the skills extraction functionality
 * both through the integrated FileUploader component and directly via API calls.
 */

// Example 1: Using the skills extraction API directly
async function extractSkillsFromText(cvText: string) {
  try {
    const response = await fetch('/api/extract-skills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cvText
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('Skills extraction result:', result);
    console.log('Total skills found:', result.data.skills.length);
    console.log('Technical skills:', result.data.categories.technical);
    console.log('Experience level:', result.data.experience_level);
    
    return result;
  } catch (error) {
    console.error('Error extracting skills:', error);
    return null;
  }
}

// Example 2: Sample CV text for testing
const sampleCVText = `
John Smith
Senior Software Engineer

EXPERIENCE:
Software Engineer at Tech Corp (2020-2024)
- Developed web applications using React, Node.js, and TypeScript
- Built RESTful APIs with Express.js and MongoDB
- Implemented CI/CD pipelines using Docker and Jenkins
- Collaborated with cross-functional teams using Agile methodologies

SKILLS:
Programming Languages: JavaScript, TypeScript, Python, Java
Frontend: React, Vue.js, HTML5, CSS3, SASS
Backend: Node.js, Express.js, Django, Spring Boot
Databases: MongoDB, PostgreSQL, Redis
Tools: Docker, Jenkins, Git, VS Code, Postman
Cloud: AWS, Azure, Google Cloud Platform

EDUCATION:
Bachelor of Science in Computer Science
University of Technology (2016-2020)

CERTIFICATIONS:
- AWS Certified Solutions Architect
- Google Cloud Professional Developer
- Certified ScrumMaster (CSM)
`;

// Example 3: Test the skills extraction
async function testSkillsExtraction() {
  console.log('Testing skills extraction...');
  const result = await extractSkillsFromText(sampleCVText);
  
  if (result && result.success) {
    console.log('✅ Skills extraction successful!');
    console.log('📊 Statistics:', result.metadata);
    console.log('🎯 Skills found:', result.data.skills);
  } else {
    console.log('❌ Skills extraction failed');
  }
}

// Example 4: Upload PDF file with skills extraction enabled
async function uploadPDFWithSkillsExtraction(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('extractSkills', 'true'); // Enable skills extraction

    const response = await fetch('/api/extract-cv', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('📄 Text extracted:', result.text.length, 'characters');
    
    if (result.skills) {
      console.log('🎯 Skills extracted:', result.skills.skills.length, 'skills');
      console.log('📈 Experience level:', result.skills.experience_level);
      console.log('📝 Summary:', result.skills.summary);
    }
    
    if (result.skillsError) {
      console.log('⚠️ Skills extraction error:', result.skillsError);
    }
    
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

// Example 5: Environment setup check
function checkEnvironmentSetup() {
  console.log('🔍 Checking environment setup...');
  
  // Note: This would need to be run on the server side
  const hasOpenAIKey = process.env.OPENAI_API_KEY;
  
  if (hasOpenAIKey) {
    console.log('✅ OpenAI API key is configured');
  } else {
    console.log('❌ OpenAI API key is missing');
    console.log('💡 Please set OPENAI_API_KEY in your .env.local file');
    console.log('🔗 Get your API key from: https://platform.openai.com/api-keys');
  }
}

// Export functions for use in other components
export {
  extractSkillsFromText,
  uploadPDFWithSkillsExtraction,
  testSkillsExtraction,
  checkEnvironmentSetup,
  sampleCVText
};

/**
 * Usage Instructions:
 * 
 * 1. Set up your OpenAI API key:
 *    - Create a .env.local file in your project root
 *    - Add: OPENAI_API_KEY=your_api_key_here
 *    - Get your key from: https://platform.openai.com/api-keys
 * 
 * 2. Use the FileUploader component:
 *    - The component now has a checkbox to enable skills extraction
 *    - Upload a PDF CV and check "Extract Skills with AI"
 *    - View categorized skills and experience level analysis
 * 
 * 3. Use the API endpoints directly:
 *    - POST /api/extract-cv - Upload PDF with optional skills extraction
 *    - POST /api/extract-skills - Extract skills from provided text
 *    - GET /api/extract-skills - View API documentation
 * 
 * 4. Skills are categorized into:
 *    - Technical: Programming languages, databases, systems
 *    - Soft: Communication, leadership, problem-solving
 *    - Languages: Human languages (English, Spanish, etc.)
 *    - Tools: Software tools, IDEs, applications
 *    - Frameworks: Libraries and frameworks
 *    - Certifications: Professional certifications
 */