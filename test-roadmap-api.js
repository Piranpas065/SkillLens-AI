/**
 * Test script for the roadmap API with real missing skills
 * This simulates a "Day 5" scenario with actual missing skills
 */

const testMissingSkills = [
  "Docker",
  "Jest", 
  "JWT Authentication",
  "API Testing",
  "Figma",
  "Stripe Integration"
];

async function testRoadmapAPI() {
  try {
    console.log("🧪 Testing Roadmap API with Missing Skills:");
    console.log("📋 Skills:", testMissingSkills.join(", "));
    console.log("\n🚀 Calling roadmap API...\n");

    const response = await fetch("http://localhost:3000/api/upskill", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        missingSkills: testMissingSkills,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log("✅ API Response received!");
    console.log("📝 Roadmap Content:");
    console.log("=" * 60);
    console.log(data.roadmap);
    console.log("=" * 60);

    // Analyze the quality
    console.log("\n🔍 QUALITY ANALYSIS:");
    
    // Check for required elements
    const roadmap = data.roadmap.toLowerCase();
    const hasTimeEstimates = /\d+\s*(week|hour|day|month)/i.test(data.roadmap);
    const hasResources = /resource|documentation|docs|tutorial|course/i.test(roadmap);
    const hasProjects = /project|build|create|develop/i.test(roadmap);
    const hasGoals = /goal|learn|understand|master/i.test(roadmap);

    console.log(`📊 Has Time Estimates: ${hasTimeEstimates ? '✅' : '❌'}`);
    console.log(`📚 Has Resources: ${hasResources ? '✅' : '❌'}`);
    console.log(`🛠️  Has Project Ideas: ${hasProjects ? '✅' : '❌'}`);
    console.log(`🎯 Has Learning Goals: ${hasGoals ? '✅' : '❌'}`);

    // Check if all skills are covered
    const skillsCovered = testMissingSkills.every(skill => 
      roadmap.includes(skill.toLowerCase())
    );
    console.log(`📝 All Skills Covered: ${skillsCovered ? '✅' : '❌'}`);

    const quality = [hasTimeEstimates, hasResources, hasProjects, hasGoals, skillsCovered]
      .filter(Boolean).length;
    
    console.log(`\n🎯 Overall Quality Score: ${quality}/5`);
    
    if (quality >= 4) {
      console.log("🌟 EXCELLENT - Roadmap meets quality standards!");
    } else if (quality >= 3) {
      console.log("👍 GOOD - Minor improvements needed");
    } else {
      console.log("⚠️  NEEDS IMPROVEMENT - Missing key elements");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    
    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n💡 Make sure the Next.js dev server is running:");
      console.log("   npm run dev");
    }
  }
}

// Run the test
testRoadmapAPI();