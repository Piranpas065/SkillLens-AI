"use client";
import React, { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
// import FileUploader from "@/components/FileUploader";
import InterviewQuestionCard from "@/components/InterviewQuestionCard";

const InterviewCoachPage = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Auto-populate job description from localStorage if available
  React.useEffect(() => {
    const saved = localStorage.getItem("jobDescription");
    if (saved) setJobDescription(saved);
  }, []);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<any | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackIdx, setFeedbackIdx] = useState<number | null>(null);
  const [showImproved, setShowImproved] = useState(false);
  const questionsRef = useRef<HTMLDivElement | null>(null);

  // Auto-populate resume text from localStorage if available (using 'resumeText' key)
  React.useEffect(() => {
    const stored = localStorage.getItem("resumeText");
    if (stored) setResumeText(stored);
  }, []);
  // Only textarea for resume input

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setQuestions([]);
    setOpenIndexes([]);
    // Validate required fields
    if (!jobTitle.trim() || !jobDescription.trim() || !resumeText.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/interview-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, jobDescription, resumeText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to get questions.");
        setLoading(false);
        return;
      }
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setUserAnswers(Array(data.questions.length).fill(""));
        setSuccess(true);
        setTimeout(() => {
          questionsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 200);
        setOpenIndexes([0]); // Open first question by default
      } else {
        setError("Invalid response format.");
      }
    } catch (err) {
      setError("API request failed.");
    }
    setLoading(false);
  };

  const handleToggle = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  // Evaluate answer handler
  const handleEvaluate = async (idx: number) => {
    setFeedbackLoading(true);
    setFeedback(null);
    setFeedbackIdx(idx);
    try {
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: userAnswers[idx],
          jobTitle,
          description: jobDescription
        })
      });
      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      setFeedback({ error: "Failed to get feedback." });
    }
    setFeedbackLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Interview Coach</h1>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1 font-medium">Job Title</label>
          <input
            type="text"
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${error && !jobTitle.trim() ? 'border-red-500' : ''}`}
            placeholder="e.g. Frontend Developer"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Job Description</label>
          <Textarea
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            rows={5}
            className={error && !jobDescription.trim() ? 'border-red-500' : ''}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Resume</label>
          <Textarea
            placeholder="Paste your resume here..."
            value={resumeText}
            onChange={e => {
              setResumeText(e.target.value);
              localStorage.setItem("resumeText", e.target.value);
            }}
            rows={7}
            className={error && !resumeText.trim() ? 'border-red-500' : ''}
            disabled={loading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Preview: {resumeText.slice(0, 60)}{resumeText.length > 60 ? '...' : ''}</span>
            <span>Lines: {resumeText.split(/\r?\n/).length}</span>
          </div>
        </div>
        {error && (
          <div className="text-red-600 text-sm text-center font-medium border border-red-200 bg-red-50 rounded p-2">{error}</div>
        )}
        {success && loading && questions.length === 0 && (
          <div className="text-green-700 text-center font-medium border border-green-200 bg-green-50 rounded p-3 flex flex-col items-center gap-2">
            <svg className="animate-spin h-6 w-6 text-green-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            AI is preparing questions...
          </div>
        )}
        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Preparing...
            </span>
          ) : (
            'Start Coaching'
          )}
        </Button>
      </form>
      {/* Display questions */}
      {questions.length > 0 && (
        <div className="mt-8" ref={questionsRef}>
          <h2 className="text-xl font-semibold mb-4">AI Interview Questions</h2>
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={idx} className="border rounded-lg p-4 mb-4">
                <InterviewQuestionCard
                  question={q.question}
                  idealAnswer={q.idealAnswer}
                  userAnswer={userAnswers[idx] || ""}
                  setUserAnswer={val => setUserAnswers(ans => ans.map((a, i) => i === idx ? val : a))}
                  isOpen={openIndexes.includes(idx)}
                  onToggle={() => handleToggle(idx)}
                  onCopy={() => handleCopy(q.idealAnswer)}
                  loading={loading}
                  charLimit={500}
                  disabled={feedbackIdx === idx || feedbackLoading}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    onClick={() => handleEvaluate(idx)}
                    disabled={feedbackLoading || feedbackIdx === idx || !userAnswers[idx]?.trim()}
                  >
                    {feedbackLoading && feedbackIdx === idx ? "Evaluating..." : "Submit Answer"}
                  </Button>
                </div>
                {/* Feedback UI */}
                {feedback && feedbackIdx === idx && (
                  <div className="mt-4 border border-blue-200 bg-blue-50 rounded p-4">
                    {feedback.error ? (
                      <div className="text-red-600">{feedback.error}</div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block bg-blue-600 text-white text-xs font-bold rounded px-2 py-1">Score: {feedback.score}</span>
                          {feedback.tags && feedback.tags.length > 0 && (
                            <span className="text-xs text-gray-500">{feedback.tags.join(", ")}</span>
                          )}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Feedback:</span> {feedback.feedback}
                        </div>
                        {feedback.improved && (
                          <div className="mb-2">
                            <Button
                              type="button"
                              size="sm"
                              className="mb-2"
                              onClick={() => setShowImproved((prev) => !prev)}
                            >
                              {showImproved ? "Show My Answer" : "Show AI Suggested Answer"}
                            </Button>
                            <div className="border rounded p-2 bg-white">
                              <span className="font-semibold">
                                {showImproved ? "AI Suggested (STAR):" : "Your Answer:"}
                              </span>
                              <div className="mt-1 text-sm">
                                {showImproved ? feedback.improved : userAnswers[idx]}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewCoachPage;
