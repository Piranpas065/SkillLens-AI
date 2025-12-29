/**
 * JobDescriptionViewer Component
 * 
 * A reusable component for displaying and managing saved job descriptions
 * Can be used in Dashboard, Job Match page, or anywhere else
 */
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Eye, Edit, Trash2, Plus, Calendar } from "lucide-react";
import Link from "next/link";

interface JobDescription {
  id: string;
  title: string;
  content: string;
  savedAt: string;
  preview: string;
}

interface JobDescriptionViewerProps {
  showAddButton?: boolean;
  maxItems?: number;
  compact?: boolean;
}

export default function JobDescriptionViewer({ 
  showAddButton = true, 
  maxItems = 10, 
  compact = false 
}: JobDescriptionViewerProps) {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [currentJob, setCurrentJob] = useState<string>("");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const { toast } = useToast();

  // Load job descriptions from localStorage
  useEffect(() => {
    loadJobDescriptions();
  }, []);

  const loadJobDescriptions = () => {
    try {
      // Load current job description
      const current = localStorage.getItem("jobDescription");
      if (current) {
        setCurrentJob(current);
      }

      // Load saved job descriptions
      const savedList = localStorage.getItem("savedJobDescriptions");
      if (savedList) {
        const jobs = JSON.parse(savedList);
        const formattedJobs: JobDescription[] = jobs.map((job: string, index: number) => ({
          id: `job-${index}-${Date.now()}`,
          title: extractJobTitle(job) || `Job Description ${index + 1}`,
          content: job,
          savedAt: new Date().toLocaleDateString(),
          preview: job.substring(0, 150) + (job.length > 150 ? "..." : "")
        }));
        setJobDescriptions(formattedJobs.slice(0, maxItems));
      }
    } catch (error) {
      console.error("Error loading job descriptions:", error);
    }
  };

  // Extract job title from job description text
  const extractJobTitle = (jobText: string): string => {
    const lines = jobText.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // Look for common title patterns
      if (firstLine.length < 100 && (
        firstLine.includes('Position:') ||
        firstLine.includes('Role:') ||
        firstLine.includes('Job Title:') ||
        firstLine.toUpperCase() === firstLine ||
        /^[A-Z][a-zA-Z\s-]+$/.test(firstLine)
      )) {
        return firstLine.replace(/^(Position:|Role:|Job Title:)\s*/i, '');
      }
    }
    return '';
  };

  const deleteJob = (index: number) => {
    try {
      const savedList = localStorage.getItem("savedJobDescriptions");
      if (savedList) {
        const jobs = JSON.parse(savedList);
        jobs.splice(index, 1);
        localStorage.setItem("savedJobDescriptions", JSON.stringify(jobs));
        loadJobDescriptions();
        toast({
          title: "Deleted",
          description: "Job description deleted successfully.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete job description.",
      });
    }
  };

  const loadJobAsActive = (job: JobDescription, index: number) => {
    localStorage.setItem("jobDescription", job.content);
    setCurrentJob(job.content);
    toast({
      variant: "success",
      title: "Job Loaded",
      description: `"${job.title}" is now your active job description.`,
    });
  };

  if (jobDescriptions.length === 0 && !currentJob) {
    return (
      <Card className="p-6 text-center">
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Job Descriptions Yet</h3>
        <p className="text-gray-600 mb-4">
          Save job descriptions to view and manage them here.
        </p>
        {showAddButton && (
          <Link href="/job-match">
            <Button className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Add Job Description
            </Button>
          </Link>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Active Job Description */}
      {currentJob && (
        <Card className="p-6 border-l-4 border-blue-500">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Active Job Description
              </h3>
              <p className="text-sm text-gray-600">Currently loaded for skill matching</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpandedJob(expandedJob === 'current' ? null : 'current')}
              >
                <Eye className="w-4 h-4" />
                {expandedJob === 'current' ? 'Hide' : 'View'}
              </Button>
              <Link href="/job-match">
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
          
          {expandedJob === 'current' ? (
            <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
              {currentJob}
            </div>
          ) : (
            <p className="text-gray-700 text-sm">
              {extractJobTitle(currentJob) || "Job description loaded and ready for skill matching"}
            </p>
          )}
        </Card>
      )}

      {/* Saved Job Descriptions */}
      {jobDescriptions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Saved Job Descriptions ({jobDescriptions.length})
            </h3>
            {showAddButton && (
              <Link href="/job-match">
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New
                </Button>
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {jobDescriptions.map((job, index) => (
              <div
                key={job.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {job.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      Saved {job.savedAt}
                    </div>
                    {!compact && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {job.preview}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadJobAsActive(job, index)}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteJob(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {expandedJob === job.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {job.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}