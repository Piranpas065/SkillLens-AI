import React, { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface InterviewQuestionCardProps {
  question: string;
  idealAnswer: string;
  userAnswer: string;
  setUserAnswer: (val: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onCopy: () => void;
  loading?: boolean;
  charLimit?: number;
  feedback?: { score?: number; feedback?: string[]; revisedAnswer?: string; error?: string } | null;
}

const InterviewQuestionCard: React.FC<InterviewQuestionCardProps> = ({
  question,
  idealAnswer,
  userAnswer,
  setUserAnswer,
  isOpen,
  onToggle,
  onCopy,
  loading = false,
  charLimit = 500,
}) => {
  const charCount = userAnswer.length;
  const wordCount = userAnswer.trim().length > 0 ? userAnswer.trim().split(/\s+/).length : 0;
  const overLimit = charCount > charLimit;
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ score?: number; feedback?: string[]; revisedAnswer?: string; error?: string } | null>(null);
  const feedbackShown = !!feedback;
  const { toast } = useToast();

  const handleGetFeedback = async () => {
    if (feedbackLoading) return; // Prevent double submission
    if (!userAnswer.trim()) return; // Prevent empty
    if (userAnswer.trim().split(/\s+/).length < 3) {
      toast({ title: "Answer too short", description: "Please write a more complete answer.", variant: "destructive" });
      return;
    }
    setFeedbackLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/interview-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, userAnswer }),
      });
      const data = await res.json();
      if (res.status !== 200 || data.error) {
        toast({ title: "Feedback generation failed", description: data.error || "OpenAI error.", variant: "destructive" });
        setFeedback({ error: data.error || "Feedback generation failed" });
      } else {
        setFeedback(data);
      }
    } catch (err) {
      toast({ title: "Feedback generation failed", description: "OpenAI error.", variant: "destructive" });
      setFeedback({ error: "Something went wrong. Try again." });
    }
    setFeedbackLoading(false);
  };

  // Removed 'Use This Answer' logic as per user request

  // Optional: autosave to localStorage (debounced)
  // React.useEffect(() => {
  //   const handler = setTimeout(() => {
  //     localStorage.setItem(`interview_answer_${question}`, userAnswer);
  //   }, 500);
  //   return () => clearTimeout(handler);
  // }, [userAnswer, question]);

  return (
    <div
      className={`border rounded-lg p-4 bg-white shadow transition-all duration-200 hover:shadow-lg hover:border-primary/60 group ${isOpen ? '' : 'opacity-80'}`}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium select-none" onClick={onToggle}>
          <span className="mr-2">{isOpen ? '▼' : '▶'}</span>Question
        </div>
        
      </div>
      {isOpen && (
        <div>
          <div className="mb-2 text-base">{question}</div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-500">Ideal Answer:</div>
            <button
              type="button"
              className="text-xs px-3 py-1 rounded border border-primary bg-primary text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors duration-150 flex items-center gap-2"
              style={{ fontWeight: 500 }}
              onClick={e => { e.stopPropagation(); onCopy(); }}
              tabIndex={-1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 justify-center" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none"/><rect x="3" y="3" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none"/></svg>
              Copy Ideal Answer
            </button>
          </div>
          <div className="mb-3 p-3 bg-gray-100 rounded text-gray-700 whitespace-pre-line border border-gray-200">
            {idealAnswer}
          </div>
          <Textarea
            placeholder="Write your answer here..."
            rows={4}
            className={`mb-2 ${overLimit ? 'border-red-500' : ''}`}
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            disabled={loading || feedbackShown}
            maxLength={charLimit + 100}
          />
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{charCount}/{charLimit} chars</span>
            <span>{wordCount} words</span>
          </div>
          {!feedbackShown && (
            <button
              type="button"
              className="text-xs px-3 py-1 rounded border border-primary bg-primary text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors duration-150 flex items-center gap-2 mb-2"
              style={{ fontWeight: 500 }}
              onClick={handleGetFeedback}
              disabled={feedbackLoading || loading || !userAnswer.trim()}
            >
              {feedbackLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  Get Feedback
                </>
              )}
            </button>
          )}
          <div ref={feedbackRef}></div>
          {feedback && (
            <div className="mt-3 p-3 border rounded bg-gray-50">
              {feedback.error ? (
                <div className="text-red-600 text-sm">{feedback.error}</div>
              ) : (
                <>
                  {/* Score badge with color */}
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold 
                        ${(feedback.score ?? 0) >= 8 ? 'bg-green-100 text-green-700 border border-green-300' : (feedback.score ?? 0) >= 5 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-red-100 text-red-700 border border-red-300'}`}
                    >
                      Score: {feedback.score ?? 0}/10
                    </span>
                  </div>
                  {/* Feedback tips */}
                  <div className="mb-2 text-xs text-gray-700">Tips:</div>
                  <ul className="mb-2 list-disc pl-5 text-sm text-gray-800">
                    {(feedback.score === 10 && (!feedback.feedback || feedback.feedback.length === 0)) ? (
                      <li>No major improvements needed. Great job!</li>
                    ) : (
                      feedback.feedback?.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))
                    )}
                  </ul>
                  {/* Collapsible revised answer */}
                  <details className="mb-2">
                    <summary className="cursor-pointer text-xs text-gray-700 select-none">Show Revised Answer</summary>
                    <div className="mt-2 p-2 bg-gray-200 border rounded text-gray-900 whitespace-pre-line">
                      {feedback.revisedAnswer}
                    </div>
                  </details>
                </>
              )}
            </div>
          )}
          {/* Removed empty score field below answer area */}
        </div>
      )}
    </div>
  );
};

export default InterviewQuestionCard;
