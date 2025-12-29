"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import JobDescriptionViewer from "@/components/JobDescriptionViewer";
import RoadmapQuickTest from "@/components/RoadmapQuickTest";
import { Upload, FileText, Zap, BarChart3, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  cvs: number;
  jobDescriptions: number;
  skillsExtracted: number;
  lastActivity: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    cvs: 0,
    jobDescriptions: 0,
    skillsExtracted: 0,
    lastActivity: 'Never'
  });
  const [score, setScore] = useState<number | null>(null);
  const [matchLevel, setMatchLevel] = useState<string | null>(null);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Job recommendations state
  const [jobs, setJobs] = useState<any[]>([]);

  // Fetch job recommendations from API (use both CV and job description)
  const getRecommendations = async () => {
    const jobDesc = localStorage.getItem("jobDescription") || "";
    const cvText = localStorage.getItem("uploadedCVText") || "";
    if (!cvText.trim() && !jobDesc.trim()) {
      alert("Please upload your CV or enter a job description before requesting recommendations.");
      return;
    }
    // Combine both CV and job description for better matching
    const combinedText = [cvText, jobDesc].filter(Boolean).join("\n\n");
    const res = await fetch("/api/recommend-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: combinedText }),
    });
    const data = await res.json();
    // Support new API format: matches array
    const jobsArr = Array.isArray(data.matches) ? data.matches : (Array.isArray(data.jobs) ? data.jobs : []);
    setJobs(jobsArr);
  };

  useEffect(() => {
    loadDashboardStats();
    // Load saved roadmap
    const savedRoadmap = localStorage.getItem("upskillRoadmap");
    if (savedRoadmap) {
      setRoadmap(savedRoadmap);
    }
  }, []);

  const loadDashboardStats = () => {
    try {
      // Load saved job descriptions
      const savedJobs = localStorage.getItem("savedJobDescriptions");
      let jobsArr = savedJobs ? JSON.parse(savedJobs) : [];
      // Load current job description
      const currentJob = localStorage.getItem("jobDescription");
      // Only add currentJob if it's not already in the saved list and is not empty
      if (currentJob && !jobsArr.includes(currentJob)) {
        jobsArr.push(currentJob);
      }
      // Count unique job descriptions
      const uniqueJobs = Array.from(new Set(jobsArr));
      // Get last activity (when job was last saved)
      const lastActivity = localStorage.getItem("lastJobActivity") || 'Never';
      setStats({
        cvs: 1, // This could be enhanced to track multiple CVs
        jobDescriptions: uniqueJobs.length,
        skillsExtracted: uniqueJobs.length > 0 ? 1 : 0, // Simplified for now
        lastActivity
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  };

  const calculateMatchScore = async () => {
    const cvEmbed = JSON.parse(localStorage.getItem("cvEmbedding") || "[]");
    const jdEmbed = JSON.parse(localStorage.getItem("jdEmbedding") || "[]");
    const cvSkills = JSON.parse(localStorage.getItem("cvSkills") || "[]");
    const jdSkills = JSON.parse(localStorage.getItem("jdSkills") || "[]");

    if (!cvEmbed.length || !jdEmbed.length) return;

    const res = await fetch("/api/match-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        cvEmbedding: cvEmbed, 
        jdEmbedding: jdEmbed,
        cvSkills,
        jdSkills
      }),
    });

    const data = await res.json();
    setScore(data.score);
    setMatchLevel(data.matchLevel || null);
    setMissingSkills(data.missingSkills || []);
  };

  const generateRoadmap = async () => {
    if (missingSkills.length === 0) return;
    setLoading(true);
    try {
      const userRole = localStorage.getItem("userRole") || undefined;
      const res = await fetch("/api/upskill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missingSkills: missingSkills,
          role: userRole,
        }),
      });
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
        localStorage.setItem("upskillRoadmap", data.roadmap);
      }
    } catch (error) {
      console.error("Error generating roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Upload CV",
      description: "Extract text and skills from your resume",
      icon: Upload,
      href: "/upload-cv",
      color: "bg-blue-500"
    },
    {
      title: "Manage Jobs",
      description: "Add or edit job descriptions",
      icon: FileText,
      href: "/job-match",
      color: "bg-green-500"
    },
    {
      title: "Download CV Report",
      description: "Download a detailed CV analysis as PDF",
      icon: BarChart3,
      href: "/cv-report",
      color: "bg-orange-500"
    },
    {
      title: "Interview Coach",
      description: "Get AI-powered interview questions",
      icon: CheckCircle,
      href: "/interview-coach",
      color: "bg-pink-500"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome to your SkillLens AI dashboard. Manage your CVs and job descriptions here.
          </p>
        </div>

        {/* Interview Coach Button - New Section */}
        

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">CVs Processed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cvs}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Job Descriptions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.jobDescriptions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Skills Extracted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.skillsExtracted}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Activity</p>
                <p className="text-sm font-bold text-gray-900">{stats.lastActivity}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Match Score Section */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">CV-Job Match Score</h2>
              <p className="text-gray-600">Calculate how well your CV matches job requirements</p>
            </div>
            <Button onClick={calculateMatchScore}>Calculate Match Score</Button>
          </div>
          {score !== null && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Match Score</h3>
              <div className="flex items-center space-x-4">
                <p className={`text-2xl font-bold 
                  ${matchLevel === "high" ? "text-green-600" : ""}
                  ${matchLevel === "medium" ? "text-blue-600" : ""}
                  ${matchLevel === "low" ? "text-orange-500" : ""}
                `}>{score}%</p>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={
                        matchLevel === "high" ? "bg-green-600" :
                        matchLevel === "medium" ? "bg-blue-500" :
                        "bg-orange-400"
                      }
                      style={{ width: `${score}%`, height: '0.75rem', borderRadius: '9999px', transition: 'all 0.5s' }}
                    ></div>
                  </div>
                </div>
              </div>
              <p className={`text-sm font-semibold mt-2 
                ${matchLevel === "high" ? "text-green-700 bg-green-100 px-2 py-1 rounded" : ""}
                ${matchLevel === "medium" ? "text-blue-700 bg-blue-100 px-2 py-1 rounded" : ""}
                ${matchLevel === "low" ? "text-orange-700 bg-orange-100 px-2 py-1 rounded" : ""}
              `}>
                {matchLevel === "high" && "High match! 🎯"}
                {matchLevel === "medium" && "Medium match 👍"}
                {matchLevel === "low" && "Low match 📉"}
              </p>
              {/* Missing Skills Section */}
              {missingSkills.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Missing Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {missingSkills.map((skill, i) => (
                      <Badge key={i} variant="outline" className="border-red-200 text-red-600 bg-red-50">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Job Recommendations Section */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Recommended Jobs</h2>
              <p className="text-gray-600">Top matches for your CV using AI vector search</p>
            </div>
            <Button onClick={getRecommendations}>Recommend Jobs</Button>
          </div>
          {jobs.length > 0 ? (
            <div>
              {/* Filter out duplicate jobs by id before rendering */}
              {Array.from(new Map(jobs.map(job => [job.id || job.title, job])).values()).map((job, idx) => (
                <Card key={job.id || job.title || idx} className="mb-6 p-6 border border-primary/30 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-bold text-primary mb-1 tracking-tight leading-tight">
                      {job.title}
                    </h3>
                    <p className="text-base text-muted-foreground mb-2">{job.description}</p>
                    {/* Similarity score hidden as requested */}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recommendations yet. Click the button above to get started.</p>
          )}
        </Card>

        {/* Roadmap API Quality Test - Full Width */}
        <div className="mb-8">
          <RoadmapQuickTest missingSkills={missingSkills} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Descriptions Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Descriptions</h2>
              <p className="text-gray-600">View and manage your saved job descriptions</p>
            </div>
            <JobDescriptionViewer maxItems={5} />
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold md:mt-2 text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer flex  justify-between">
                      <div className="flex items-center">
                        <div className={`p-2 ${action.color} rounded-lg`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium text-gray-900">{action.title}</h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </div>
                      {/* Download PDF button logic for /cv-report removed to open as normal page */}
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {stats.jobDescriptions > 0 ? (
                  <>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-600">Job descriptions saved</span>
                    </div>
                    {stats.skillsExtracted > 0 && (
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-gray-600">Skills extracted successfully</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">No recent activity</p>
                )}
              </div>
            </Card>

           
          </div>
        </div>
      </div>
    </div>
  );
}