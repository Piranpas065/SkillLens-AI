
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Upload, FileText, Loader2, Zap } from "lucide-react";

/**
 * Type definition for extracted PDF data and metadata
 * @interface ExtractedData
 * @property {string} text - The extracted and sanitized text content
 * @property {object} metadata - Optional metadata about the extraction process
 */
interface ExtractedData {
  text: string;
  metadata?: {
    originalLength: number;    // Original text length before sanitization
    sanitizedLength: number;   // Final text length after cleaning
    pageCount: number;         // Number of pages in the PDF
    fileSize: number;          // File size in bytes
    fileName: string;          // Original filename
  };
}

interface FileUploaderProps {
  onExtractedText?: (text: string) => void;
}

export default function FileUploader({ onExtractedText }: FileUploaderProps) {
  // File handling states
  const [file, setFile] = useState<File | null>(null);                    // Currently selected PDF file
  const [cvText, setCvText] = useState("");                              // Extracted text content
  const [loading, setLoading] = useState(false);                        // Upload/extraction in progress
  const [error, setError] = useState<string | null>(null);              // Error message display
  const [metadata, setMetadata] = useState<ExtractedData['metadata'] | null>(null); // Extraction metadata
  
  // Skills extraction states
  const [extractSkills, setExtractSkills] = useState(true);             // Enable skill extraction
  const [skillsData, setSkillsData] = useState<any>(null);              // Extracted skills data
  const [skillsLoading, setSkillsLoading] = useState(false);            // Skills extraction in progress
  const [skills, setSkills] = useState<string[]>([]);                   // Skills from dedicated API
  
  // CV Embedding states
  const [cvEmbedding, setCvEmbedding] = useState<number[] | null>(null); // Generated CV embedding vector
  const [embeddingLoading, setEmbeddingLoading] = useState(false);       // Embedding generation in progress
  
  // UI interaction states
  const [dragOver, setDragOver] = useState(false);                      // Drag and drop visual feedback
  const [success, setSuccess] = useState(false);                        // Successful extraction indicator
  
  // Toast notification system
  const { toast } = useToast();

  // ==== Load Saved CV Embedding on Component Mount ====
  useEffect(() => {
    const savedEmbedding = localStorage.getItem("cvEmbedding");
    if (savedEmbedding) {
      try {
        const embedding = JSON.parse(savedEmbedding);
        if (Array.isArray(embedding) && embedding.length === 1536) {
          setCvEmbedding(embedding);
          console.log("Loaded saved CV embedding from localStorage");
        }
      } catch (error) {
        console.error("Failed to parse saved CV embedding:", error);
        localStorage.removeItem("cvEmbedding");
      }
    }
  }, []);

  // ==== File Validation Logic ====
  /**
   * Validates uploaded file against multiple criteria
   * @param {File} selectedFile - The file to validate
   * @returns {string | null} Error message if invalid, null if valid
   * 
   * Validation checks:
   * 1. File size limit (10MB maximum)
   * 2. Non-empty file check
   * 3. MIME type validation (application/pdf)
   * 4. File extension verification (.pdf)
   */
  const validateFile = (selectedFile: File): string | null => {
    // Check 1: File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > maxSize) {
      return "File too large. Maximum size is 10MB.";
    }

    // Check 2: Ensure file is not empty
    if (selectedFile.size === 0) {
      return "File is empty.";
    }

    // Check 3: MIME type validation for PDF files
    if (selectedFile.type !== "application/pdf") {
      return "Only PDF files are supported. Please select a PDF file.";
    }

    // Check 4: File extension validation (additional security layer)
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      return "File must have a .pdf extension. Please select a PDF file.";
    }

    // All validation checks passed
    return null;
  };

  // ==== File Selection Handler ====
  /**
   * Handles file selection from input or drag-and-drop
   * Validates the file and updates component state accordingly
   * @param {File | null} selectedFile - The file selected by user
   */
  const handleFileSelect = (selectedFile: File | null) => {
    // Reset all state when new file is selected
    setError(null);      // Clear any previous errors
    setCvText("");       // Clear extracted text
    setMetadata(null);   // Clear extraction metadata
    setSkillsData(null); // Clear skills data
    setSkills([]);       // Clear GPT extracted skills
    setSuccess(false);   // Reset success state
    
    // Clear job description data to ensure fresh start with new CV
    localStorage.removeItem("jobDescription");
    localStorage.removeItem("jdEmbedding");
    localStorage.removeItem("jdEmbeddingTimestamp");
    localStorage.removeItem("jdSkills");
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('cvUploaded'));

    // Handle case where no file is selected (user cancels)
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate the selected file against our criteria
    const validationError = validateFile(selectedFile);
    if (validationError) {
      // File failed validation - update error state
      setError(validationError);
      setFile(null);
      
      // Notify user of validation failure via toast
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: validationError,
      });
      return;
    }

    // File passed validation - update state and notify success
    setFile(selectedFile);
    
    // Show success toast for valid file selection
    toast({
      variant: "success",
      title: "File Selected",
      description: `${selectedFile.name} is ready for extraction.`,
    });
  };

  // ==== Skills Extraction Function ====
  /**
   * Extracts skills from CV text using the dedicated skills API
   */
  const extractSkillsFromText = async () => {
    // Validation: Ensure text is not empty before calling APIs
    if (!cvText || !cvText.trim()) {
      toast({
        variant: "destructive",
        title: "No Text Available",
        description: "Please upload and extract text from a CV first before extracting skills.",
      });
      return;
    }

    // Additional validation for minimum text length
    if (cvText.trim().length < 50) {
      toast({
        variant: "destructive",
        title: "Insufficient Text",
        description: "CV text is too short for meaningful skill extraction. Please upload a complete CV.",
      });
      return;
    }
    
    setSkillsLoading(true);
    setError(null); // Clear any previous errors
    
    // Show loading toast
    const loadingToast = toast({
      title: "Extracting Skills",
      description: "AI is analyzing your CV for relevant skills...",
    });
    
    try {
      const res = await fetch("/api/extract-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cvText.trim() }),
      });

      const data = await res.json();
      
      if (res.ok && data.skills && Array.isArray(data.skills)) {
        const extractedSkills = data.skills.filter((skill: string) => skill && skill.trim().length > 0);
        setSkills(extractedSkills);
        
        // Save skills to localStorage for dashboard use
        localStorage.setItem("cvSkills", JSON.stringify(extractedSkills));
        
        // Enhanced success message with source information
        let successMessage = `Successfully extracted ${extractedSkills.length} skills from your CV.`;
        if (data.source) {
          const sourceText = data.source === 'openai' ? 'OpenAI' : 
                           data.source === 'free-ai' ? 'Free AI' : 'Pattern Matching';
          successMessage += ` (via ${sourceText})`;
        }
        if (data.message) {
          successMessage += ` ${data.message}`;
        }
        
        toast({
          variant: "success",
          title: "Skills Extracted Successfully!",
          description: successMessage,
        });

        // Clear any previous errors
        setError(null);
        
      } else {
        // Handle API errors with specific messages
        const errorMessage = data.error || "Skills extraction failed";
        const errorDetails = data.details || "Please try again or contact support if the problem persists.";
        
        setError(`${errorMessage}: ${errorDetails}`);
        
        toast({
          variant: "destructive",
          title: "Skills Extraction Failed",
          description: `${errorMessage}. ${errorDetails}`,
        });
      }
    } catch (error) {
      console.error("Skills extraction error:", error);
      
      const networkError = "Network error occurred while extracting skills.";
      setError(networkError);
      
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to the skills extraction service. Please check your internet connection and try again.",
      });
    } finally {
      setSkillsLoading(false);
    }
  };

  // ==== CV Embedding Generation Function ====
  /**
   * Generates embedding vector from CV text using the embeddings API
   */
  const generateCvEmbedding = async () => {
    // Validation: Ensure text is not empty before calling API
    if (!cvText || !cvText.trim()) {
      toast({
        variant: "destructive",
        title: "No CV Text Available",
        description: "Please upload and extract text from a CV first before generating embeddings.",
      });
      return;
    }

    // Additional validation for minimum text length
    if (cvText.trim().length < 100) {
      toast({
        variant: "destructive",
        title: "Insufficient Text",
        description: "CV text is too short for meaningful embedding generation. Please upload a complete CV.",
      });
      return;
    }

    setEmbeddingLoading(true);
    setError(null); // Clear any previous errors

    // Show loading toast
    toast({
      title: "Generating CV Embedding",
      description: "Converting your CV text into a vector representation...",
    });

    try {
      const res = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cvText }),
      });

      const data = await res.json();
      
      if (res.ok && data.embedding && Array.isArray(data.embedding)) {
        setCvEmbedding(data.embedding);
        
        // Store CV embedding in localStorage for persistence
        localStorage.setItem("cvEmbedding", JSON.stringify(data.embedding));
        localStorage.setItem("cvEmbeddingTimestamp", new Date().toISOString());
        
        toast({
          variant: "success",
          title: "CV Embedding Generated!",
          description: `Successfully created a ${data.embedding.length}-dimensional vector representation of your CV.`,
        });

        // Clear any previous errors
        setError(null);
        
      } else {
        // Handle API errors
        const errorMessage = data.error || "Embedding generation failed";
        setError(errorMessage);
        
        toast({
          variant: "destructive",
          title: "Embedding Generation Failed",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("Embedding generation error:", error);
      
      const networkError = "Network error occurred while generating CV embedding.";
      setError(networkError);
      
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to the embedding service. Please check your internet connection and try again.",
      });
    } finally {
      setEmbeddingLoading(false);
    }
  };

  // ==== PDF Upload and Text Extraction Handler ====
  /**
   * Handles the PDF upload and text extraction process
   * Makes API call to /api/extract-cv and processes the response
   * Updates component state based on success/failure
   */
  const handleUpload = async () => {
    // Early return if no file selected
    if (!file) return;

    // Initialize loading state and clear previous results
    setLoading(true);     // Show loading indicators
    setSkillsLoading(extractSkills); // Show skills loading if enabled
    setError(null);       // Clear any previous errors
    setCvText("");        // Clear previous extracted text
    setMetadata(null);    // Clear previous metadata
    setSkillsData(null);  // Clear previous skills data
    setSkills([]);        // Clear GPT extracted skills
    setSuccess(false);    // Reset success state
    
    // Clear job description data to ensure fresh start with new CV
    localStorage.removeItem("jobDescription");
    localStorage.removeItem("jdEmbedding");
    localStorage.removeItem("jdEmbeddingTimestamp");
    localStorage.removeItem("jdSkills");
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('cvUploaded'));

    try {
      // Prepare file for API upload using FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("extractSkills", extractSkills.toString());

      // Make API call to extract text from PDF (and optionally skills)
      const res = await fetch("/api/extract-cv", {
        method: "POST",
        body: formData,
      });

      // Parse the JSON response from API
      const data = await res.json();
      
      // Handle API error responses (4xx, 5xx status codes)
      if (!res.ok) {
        const errorMessage = data.error || `Upload failed (${res.status})`;
        setError(errorMessage);
        
        // Notify user of extraction failure
        toast({
          variant: "destructive",
          title: "Extraction Failed",
          description: errorMessage,
        });
        return;
      }

      // Handle successful API response with extracted text
      if (data.text) {
        // Update state with extraction results
        setCvText(data.text);           // Store extracted text
        localStorage.setItem("resumeText", data.text); // Store for interview-coach auto-populate
        setMetadata(data.metadata);     // Store extraction metadata
        setSkillsData(data.skills);     // Store skills data if available
        setSuccess(true);               // Mark as successful
        
        // Create success message based on what was extracted
        let successMessage = `Extracted ${data.text.length.toLocaleString()} characters from your CV.`;
        if (data.skills && Array.isArray(data.skills)) {
          successMessage += ` Found ${data.skills.length} skills.`;
        }
        
        // Notify user of successful extraction
        toast({
          variant: "success",
          title: "Success!",
          description: successMessage,
        });

        // If skills extraction failed, show a separate warning toast
        if (data.skillsError) {
          toast({
            variant: "destructive",
            title: "Skills Extraction Failed",
            description: data.skillsError.details || "Failed to extract skills from your CV. You can try the manual skill extraction below.",
          });
        }
        // Call parent callback if provided
        if (onExtractedText) {
          onExtractedText(data.text);
        }
      } else {
        // Handle case where API succeeds but no text was extracted
        const errorMessage = "No text could be extracted from the PDF.";
        setError(errorMessage);
        
        toast({
          variant: "destructive",
          title: "No Text Found",
          description: errorMessage,
        });
      }
    } catch (err) {
      // Handle network errors, timeouts, or other fetch failures
      console.error("Upload error:", err);
      const errorMessage = "Network error. Please check your connection and try again.";
      setError(errorMessage);
      
      // Show fallback error toast for network issues
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: errorMessage,
      });
    } finally {
      // Always reset loading state regardless of success/failure
      setLoading(false);
      setSkillsLoading(false);
    }
  }; // End of handleUpload

  // ==== Drag and Drop Event Handlers ====
  /**
   * Handles file drop events when user drops a file onto the drop zone
   * @param {React.DragEvent} e - The drag event containing file data
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();          // Prevent browser default file handling
    setDragOver(false);         // Remove visual drag feedback
    // Get the first file from the dropped files
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Process the dropped file through normal file selection flow
      handleFileSelect(droppedFile);
    }
  };

  /**
   * Handles dragover events to provide visual feedback during drag
   * @param {React.DragEvent} e - The drag event
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();          // Prevent browser default to allow drop
    setDragOver(true);          // Show visual feedback that drop zone is active
  };

  /**
   * Handles drag leave events to remove visual feedback
   * @param {React.DragEvent} e - The drag event
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();          // Prevent browser default behavior
    setDragOver(false);         // Remove visual drag feedback
  };

  // ==== Utility Functions ====
  /**
   * Formats file size in bytes to human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size string (B, KB, or MB)
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";                                    // Less than 1KB
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";      // Less than 1MB
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";                      // 1MB or larger
  };

  return (
    <div className="flex flex-col py-6 items-center justify-center min-h-[60vh]">
      <Card className="p-6 space-y-4 w-full max-w-5xl">
        <h2 className="text-xl font-bold text-center">Upload Your CV</h2>
        {/* ==== Drag & Drop Upload Zone ==== */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragOver 
              ? "border-blue-500 bg-blue-50 scale-105"
              : error
              ? "border-red-300 bg-red-50"
              : success && file
              ? "border-green-300 bg-green-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          } ${loading ? "pointer-events-none opacity-75" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
        {/* Hidden file input - triggered by label clicks */}
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          className="hidden"
          id="file-upload"
          disabled={loading}
        />
        <label htmlFor="file-upload" className={`cursor-pointer ${loading ? "cursor-not-allowed" : ""}`}>
          <div className="space-y-4">
            <div className="flex justify-center">
              {loading ? (
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              ) : success && file ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : error ? (
                <AlertCircle className="h-12 w-12 text-red-500" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div className="space-y-2">
              <div className="text-gray-700 font-medium">
                {loading 
                  ? "Extracting text from your PDF..."
                  : dragOver 
                  ? "Drop your PDF here"
                  : "Click to select or drag & drop your PDF"}
              </div>
              <div className="text-sm text-gray-500">
                {loading 
                  ? "This may take a few moments depending on file size"
                  : "Only PDF files • Maximum size: 10MB"}
              </div>
            </div>
          </div>
        </label>
      </div>
      {file && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="font-medium text-blue-900">{file.name}</div>
              <div className="text-sm text-blue-600">
                Size: {formatFileSize(file.size)} • PDF Document
              </div>
            </div>
            {success && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}
      {file && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="extract-skills"
              checked={extractSkills}
              onChange={(e) => setExtractSkills(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="extract-skills" className="flex-1 text-sm">
              <div className="font-medium text-gray-900">Extract Skills with AI</div>
              <div className="text-gray-600">
                Use GPT to automatically identify and categorize skills from your CV
              </div>
            </label>
            {skillsLoading && (
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            )}
          </div>
        </div>
      )}
      <Button 
        onClick={handleUpload} 
        disabled={!file || loading || !!error}
        className="w-full h-12 text-base"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Extracting text...
          </>
        ) : success ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Extract Complete
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Extract CV Text
          </>
        )}
      </Button>
      {metadata && success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-green-800 mb-2">Extraction Complete!</div>
              <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                <div>
                  <span className="font-medium">Pages:</span> {metadata.pageCount}
                </div>
                <div>
                  <span className="font-medium">Characters:</span> {metadata.sanitizedLength.toLocaleString()}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">File:</span> {metadata.fileName}
                </div>
                {metadata.originalLength !== metadata.sanitizedLength && (
                  <div className="col-span-2 text-green-600">
                    <span className="font-medium">Cleaned:</span> From {metadata.originalLength.toLocaleString()} to {metadata.sanitizedLength.toLocaleString()} characters
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {cvText && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={extractSkillsFromText}
              disabled={skillsLoading || !cvText.trim() || cvText.trim().length < 50}
              className="w-full relative"
            >
              {skillsLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting Skills with AI...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Extract Skills from CV
                </>
              )}
            </Button>
          </div>
          {skillsLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900">Processing Your CV</h3>
                  <p className="text-sm text-blue-700">
                    AI is analyzing {cvText.length.toLocaleString()} characters to identify relevant skills...
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            </div>
          )}
          {Array.isArray(skills) && skills.length > 0 && !skillsLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">
                    Successfully Extracted {skills.length} Skills
                  </h3>
                </div>
                <div className="text-sm text-blue-700 font-medium">
                  {skills.length} skills found
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                {skills.map((skill, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white border border-blue-200 rounded px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 transition-colors"
                  >
                    {skill}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-700">
                  💡 These skills can be used for job matching and resume optimization.
                </p>
              </div>
            </div>
          )}
          {skills && skills.length === 0 && !skillsLoading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-900">No Skills Detected</h3>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                No recognizable skills were found in your CV text. This might happen if:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc">
                <li>The CV format is unusual or heavily formatted</li>
                <li>Skills are embedded in complex sentences</li>
                <li>The text quality after extraction is poor</li>
              </ul>
              <p className="text-sm text-yellow-700 mt-2">
                Try uploading a different CV or check if the extracted text looks correct.
              </p>
            </div>
          )}
          {error && !skillsLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-900">Extraction Failed</h3>
              </div>
              <p className="text-sm text-red-700 mt-2">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={extractSkillsFromText}
                className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      )}
      {skillsData && Array.isArray(skillsData) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Skills Extracted (Legacy)</h3>
              </div>
              <div className="text-sm text-blue-700">
                {skillsData.length} total skills found
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="flex flex-wrap gap-1">
                {skillsData.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {cvText && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={generateCvEmbedding}
              disabled={embeddingLoading || !cvText.trim() || cvText.trim().length < 100}
              className="w-full relative"
            >
              {embeddingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating CV Embedding with AI...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Generate CV Embedding
                </>
              )}
            </Button>
          </div>
          {embeddingLoading && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                <div className="flex-1">
                  <h3 className="font-medium text-purple-900">Converting CV to Vector</h3>
                  <p className="text-sm text-purple-700">
                    Creating a mathematical representation of your CV for similarity matching...
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{width: '80%'}}></div>
                </div>
              </div>
            </div>
          )}
          {cvEmbedding && !embeddingLoading && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <h3 className="font-medium text-purple-900">
                    CV Embedding Generated Successfully
                  </h3>
                </div>
                <div className="text-sm text-purple-700 font-medium">
                  {cvEmbedding.length}D vector
                </div>
              </div>
              <div className="bg-white border border-purple-200 rounded px-3 py-2 mb-3">
                <p className="text-xs text-purple-700 font-mono">
                  Vector length: {cvEmbedding.length}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  First 5 dimensions: [{cvEmbedding.slice(0, 5).map(n => n.toFixed(4)).join(', ')}...]
                </p>
              </div>
              <div className="text-xs text-purple-700">
                💡 This embedding can now be used for AI-powered job matching and similarity analysis.
              </div>
            </div>
          )}
          {cvEmbedding && (
            <p className="text-xs text-muted-foreground">
              Vector length: {cvEmbedding.length}
            </p>
          )}
        </div>
      )}
      {cvText && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">
              Extracted CV Text ({cvText.length.toLocaleString()} characters)
            </label>
          </div>
          <Textarea 
            value={cvText} 
            readOnly
            rows={12}
            className="font-mono text-sm resize-none"
            placeholder="Extracted text will appear here..."
          />
          <div className="text-xs text-gray-500">
            💡 This text has been cleaned and sanitized. You can copy and use it for further analysis.
          </div>
        </div>
      )}
    </Card>
  </div>
  );
}
