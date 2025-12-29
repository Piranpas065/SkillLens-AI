"use client";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Clipboard, Trash2, FileText, Zap, Loader2, CheckCircle } from "lucide-react";

export default function JobMatchPage() {
  const [jobDesc, setJobDesc] = useState("");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Job Description Embedding states
  const [jdEmbedding, setJdEmbedding] = useState<number[] | null>(null);
  const [embeddingLoading, setEmbeddingLoading] = useState(false);
  
  // Job Description Skills states
  const [jdSkills, setJdSkills] = useState<string[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  
  const { toast } = useToast();

  // Load saved job descriptions and embedding on component mount
  useEffect(() => {
    const saved = localStorage.getItem("jobDescription");
    if (saved) {
      setJobDesc(saved);
    }
    
    const savedJobsList = localStorage.getItem("savedJobDescriptions");
    if (savedJobsList) {
      setSavedJobs(JSON.parse(savedJobsList));
    }

    // Load saved JD embedding if exists
    const savedEmbedding = localStorage.getItem("jdEmbedding");
    if (savedEmbedding) {
      try {
        const embedding = JSON.parse(savedEmbedding);
        if (Array.isArray(embedding) && embedding.length === 1536) {
          setJdEmbedding(embedding);
          console.log("Loaded saved JD embedding from localStorage");
        } else {
          console.warn("Invalid JD embedding dimensions, removing from localStorage");
          localStorage.removeItem("jdEmbedding");
        }
      } catch (error) {
        console.error("Failed to parse saved JD embedding:", error);
        localStorage.removeItem("jdEmbedding");
      }
    }
    
    // Load saved JD skills if exists
    const savedSkills = localStorage.getItem("jdSkills");
    if (savedSkills) {
      try {
        const skills = JSON.parse(savedSkills);
        if (Array.isArray(skills)) {
          setJdSkills(skills);
          console.log("Loaded saved JD skills from localStorage");
        }
      } catch (error) {
        console.error("Failed to parse saved JD skills:", error);
        localStorage.removeItem("jdSkills");
      }
    }
  }, []);

  // Listen for custom events when CV is uploaded to clear job description
  useEffect(() => {
    const handleCvUpload = () => {
      // Clear job description when new CV is uploaded
      setJobDesc("");
      setJdEmbedding(null);
      setJdSkills([]);
      
      toast({
        title: "Job Description Cleared",
        description: "Starting fresh with your new CV upload!",
      });
    };

    // Listen for custom event fired when new CV is uploaded
    window.addEventListener('cvUploaded', handleCvUpload);

    return () => {
      window.removeEventListener('cvUploaded', handleCvUpload);
    };
  }, []);

  const handleSave = async () => {
    if (!jobDesc.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Job Description",
        description: "Please paste a job description before saving.",
      });
      return;
    }

    setSaving(true);
    
    try {
      // Save current job description
      localStorage.setItem("jobDescription", jobDesc);
      
      // Add to saved jobs list (avoid duplicates)
      const preview = jobDesc.substring(0, 100) + (jobDesc.length > 100 ? "..." : "");
      const updatedJobs = [...savedJobs];
      
      // Check if this job description already exists
      const exists = updatedJobs.some(job => job.substring(0, 100) === preview.substring(0, 100));
      if (!exists) {
        updatedJobs.unshift(jobDesc); // Add to beginning
        if (updatedJobs.length > 5) updatedJobs.pop(); // Keep only 5 recent jobs
        setSavedJobs(updatedJobs);
        localStorage.setItem("savedJobDescriptions", JSON.stringify(updatedJobs));
      }

      toast({
        variant: "success",
        title: "Job Description Saved!",
        description: `Saved ${jobDesc.length} characters successfully.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save job description. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJobDesc(text);
      toast({
        variant: "success",
        title: "Pasted!",
        description: `Pasted ${text.length} characters from clipboard.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Paste Failed",
        description: "Failed to read from clipboard. Please paste manually.",
      });
    }
  };

  const handleClear = () => {
    setJobDesc("");
    toast({
      title: "Cleared",
      description: "Job description cleared.",
    });
  };

  const loadSavedJob = (job: string) => {
    setJobDesc(job);
    toast({
      variant: "success",
      title: "Job Loaded",
      description: "Previous job description loaded.",
    });
  };

  const deleteSavedJob = (index: number) => {
    const updatedJobs = savedJobs.filter((_, i) => i !== index);
    setSavedJobs(updatedJobs);
    localStorage.setItem("savedJobDescriptions", JSON.stringify(updatedJobs));
    toast({
      title: "Deleted",
      description: "Job description deleted from saved list.",
    });
  };

  // ==== Job Description Embedding Generation Function ====
  const extractJdSkills = async () => {
    if (!jobDesc.trim()) {
      toast({
        variant: "destructive",
        title: "No Job Description",
        description: "Please paste a job description first before extracting skills.",
      });
      return;
    }

    setSkillsLoading(true);
    
    try {
      const res = await fetch("/api/extract-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: jobDesc }),
      });

      const data = await res.json();
      
      if (res.ok && data.skills && Array.isArray(data.skills)) {
        const extractedSkills = data.skills.filter((skill: string) => skill && skill.trim().length > 0);
        setJdSkills(extractedSkills);
        
        // Save skills to localStorage for dashboard use
        localStorage.setItem("jdSkills", JSON.stringify(extractedSkills));
        
        let successMessage = `Successfully extracted ${extractedSkills.length} skills from the job description.`;
        if (data.source) {
          const sourceText = data.source === 'openai' ? 'OpenAI' : 
                           data.source === 'free-ai' ? 'Free AI' : 'Pattern Matching';
          successMessage += ` (via ${sourceText})`;
        }
        
        toast({
          variant: "success",
          title: "Skills Extracted Successfully!",
          description: successMessage,
        });
        
      } else {
        const errorMessage = data.error || "Skills extraction failed";
        
        toast({
          variant: "destructive",
          title: "Skills Extraction Failed",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("JD Skills extraction error:", error);
      
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to the skills extraction service.",
      });
    } finally {
      setSkillsLoading(false);
    }
  };

  const generateJdEmbedding = async () => {
    // Validation: Ensure job description is not empty before calling API
    if (!jobDesc || !jobDesc.trim()) {
      toast({
        variant: "destructive",
        title: "No Job Description Available",
        description: "Please paste a job description before generating embeddings.",
      });
      return;
    }

    // Additional validation for minimum text length
    if (jobDesc.trim().length < 100) {
      toast({
        variant: "destructive",
        title: "Insufficient Text",
        description: "Job description is too short for meaningful embedding generation. Please provide a complete job description.",
      });
      return;
    }

    setEmbeddingLoading(true);

    // Show loading toast
    toast({
      title: "Generating Job Description Embedding",
      description: "Converting job requirements into a vector representation...",
    });

    try {
      const res = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: jobDesc }),
      });

      const data = await res.json();
      
      if (res.ok && data.embedding && Array.isArray(data.embedding)) {
        setJdEmbedding(data.embedding);
        
        // Store JD embedding in localStorage for persistence
        localStorage.setItem("jdEmbedding", JSON.stringify(data.embedding));
        localStorage.setItem("jdEmbeddingTimestamp", new Date().toISOString());
        
        toast({
          variant: "success",
          title: "Job Description Embedding Generated!",
          description: `Successfully created a ${data.embedding.length}-dimensional vector representation of the job requirements.`,
        });
        
      } else {
        // Handle API errors
        const errorMessage = data.error || "Embedding generation failed";
        
        toast({
          variant: "destructive",
          title: "Embedding Generation Failed",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("JD Embedding generation error:", error);
      
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to the embedding service. Please check your internet connection and try again.",
      });
    } finally {
      setEmbeddingLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Job Description Manager</h1>
        <p className="text-gray-600">Paste, save, and manage job descriptions for skill matching</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Job Description Input */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Job Description
            </h2>
            <div className="text-sm text-gray-500">
              {jobDesc.length} characters
            </div>
          </div>
          
          <Textarea
            placeholder="Paste the job description here..."
            rows={15}
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            className="resize-none"
          />
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleSave} 
              disabled={saving || !jobDesc.trim()}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Job Description"}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handlePaste}
              className="flex items-center gap-2"
            >
              <Clipboard className="w-4 h-4" />
              Paste from Clipboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={!jobDesc.trim()}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>

          {/* Skills Extraction Section */}
          <div className="border-t pt-4 space-y-4">
            <Button 
              onClick={extractJdSkills}
              disabled={skillsLoading || !jobDesc.trim()}
              className="w-full relative"
            >
              {skillsLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting Skills...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Extract Skills from Job Description
                </>
              )}
            </Button>

            {/* Skills Display */}
            {jdSkills.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-900">
                      Skills Extracted ({jdSkills.length})
                    </h3>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {jdSkills.map((skill, index) => (
                    <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="text-xs text-green-700">
                  💡 These skills can now be compared with CV skills for match analysis.
                </div>
              </div>
            )}
          </div>

          {/* Job Description Embedding Section */}
          <div className="border-t pt-4 space-y-4">
            <Button 
              onClick={generateJdEmbedding}
              disabled={embeddingLoading || !jobDesc.trim() || jobDesc.trim().length < 100}
              className="w-full relative"
            >
              {embeddingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating JD Embedding with AI...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Generate JD Embedding
                </>
              )}
            </Button>

            {/* Embedding Loading State */}
            {embeddingLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900">Processing Job Description</h3>
                    <p className="text-sm text-blue-700">
                      Converting {jobDesc.length.toLocaleString()} characters into vector representation...
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Embedding Success State */}
            {jdEmbedding && !embeddingLoading && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-900">
                      JD Embedding Generated Successfully
                    </h3>
                  </div>
                  <div className="text-sm text-green-700 font-medium">
                    {jdEmbedding.length}D vector
                  </div>
                </div>
                
                <div className="bg-white border border-green-200 rounded px-3 py-2 mb-3">
                  <p className="text-xs text-green-700 font-mono">
                    Vector length: {jdEmbedding.length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    First 5 dimensions: [{jdEmbedding.slice(0, 5).map(n => n.toFixed(4)).join(', ')}...]
                  </p>
                </div>
                
                <div className="text-xs text-green-700">
                  💡 This embedding can now be compared with CV embeddings for intelligent job matching.
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Saved Job Descriptions */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Recently Saved Jobs</h2>
          
          {savedJobs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No saved job descriptions yet
            </div>
          ) : (
            <div className="space-y-2">
              {savedJobs.map((job, index) => (
                <div key={index} className="border rounded p-3 hover:bg-gray-50">
                  <div className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {job.substring(0, 120) + (job.length > 120 ? "..." : "")}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadSavedJob(job)}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSavedJob(index)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}