import React, { useState, useRef, useEffect } from "react";
import InterviewQuestionCard from "@/components/InterviewQuestionCard";

// Example questions array (replace with GPT/session data)
const questions = [
  {
    question: "What is React and how does it work?",
    idealAnswer: "React is a JavaScript library for building user interfaces...",
  },
  {
    question: "Explain the concept of closures in JavaScript.",
    idealAnswer: "A closure is a function that remembers its outer variables...",
  },
  // Add more questions as needed
];

const StepperMockInterview: React.FC = () => {
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('mock_step');
    return saved ? Number(saved) : 0;
  });
  const [answers, setAnswers] = useState<string[]>(() => {
    const saved = localStorage.getItem('mock_answers');
    return saved ? JSON.parse(saved) : Array(questions.length).fill("");
  });
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbacks, setFeedbacks] = useState<(null | { score?: number; feedback?: string[]; revisedAnswer?: string; error?: string })[]>(() => {
    const saved = localStorage.getItem('mock_feedbacks');
    return saved ? JSON.parse(saved) : Array(questions.length).fill(null);
  });
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(false);
  const questionRef = useRef<HTMLDivElement>(null);

  const handleAnswerChange = (val: string) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[step] = val;
      localStorage.setItem('mock_answers', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (answers[step].trim().split(/\s+/).length < 3) return;
    setLoading(true);
    setRetry(false);
    // Save answer
    setAnswers((prev) => {
      const updated = [...prev];
      updated[step] = answers[step];
      localStorage.setItem('mock_answers', JSON.stringify(updated));
      return updated;
    });
    // Call feedback API
    try {
      const res = await fetch("/api/interview-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questions[step].question, userAnswer: answers[step] }),
      });
      const data = await res.json();
      setFeedbacks((prev) => {
        const updated = [...prev];
        updated[step] = data;
        localStorage.setItem('mock_feedbacks', JSON.stringify(updated));
        return updated;
      });
      setShowFeedback(true);
      localStorage.setItem('mock_step', String(step));
    } catch (err) {
      setFeedbacks((prev) => {
        const updated = [...prev];
        updated[step] = { error: "Feedback generation failed" };
        localStorage.setItem('mock_feedbacks', JSON.stringify(updated));
        return updated;
      });
      setShowFeedback(true);
      setRetry(true);
    }
    setLoading(false);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setStep((prev) => {
      const next = Math.min(prev + 1, questions.length - 1);
      localStorage.setItem('mock_step', String(next));
      return next;
    });
    setTimeout(() => {
      questionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Progress dots
  const ProgressDots = () => (
    <div className="flex gap-2 mb-4">
      {questions.map((_, idx) => (
        <span
          key={idx}
          className={`w-3 h-3 rounded-full border transition-all duration-150 ${
            idx < step
              ? 'bg-green-500 border-green-500'
              : idx === step
              ? 'bg-primary border-primary scale-125'
              : 'bg-gray-200 border-gray-300'
          }`}
        />
      ))}
    </div>
  );

  // Prevent skipping ahead
  useEffect(() => {
    if (step > 0 && (!feedbacks[step - 1] || !answers[step - 1])) {
      setStep(0);
    }
  }, [step, feedbacks, answers]);

  // Scroll into view after each step
  useEffect(() => {
    questionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  // Mobile & UX polish: responsive
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-2">
      <div ref={questionRef} className="w-full max-w-xl bg-white rounded-lg shadow-lg p-4 sm:p-8 flex flex-col items-center transition-all duration-300">
        <ProgressDots />
        <div className="mb-4 text-lg font-semibold text-center">
          Question {step + 1} of {questions.length}
        </div>
        <InterviewQuestionCard
          question={questions[step].question}
          idealAnswer={questions[step].idealAnswer}
          userAnswer={answers[step]}
          setUserAnswer={handleAnswerChange}
          isOpen={true}
          onToggle={() => {}}
          onCopy={() => {navigator.clipboard.writeText(questions[step].idealAnswer);}}
          loading={loading}
          feedback={feedbacks[step]}
        />
        {!showFeedback && (
          <button
            className="mt-6 px-6 py-2 bg-primary text-white rounded font-semibold shadow hover:bg-primary/90 transition-colors w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={loading || answers[step].trim().split(/\s+/).length < 3}
          >
            Submit Answer
          </button>
        )}
        {showFeedback && feedbacks[step]?.error && (
          <button
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded font-semibold shadow hover:bg-red-700 transition-colors w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={loading}
          >
            Retry
          </button>
        )}
        {showFeedback && !feedbacks[step]?.error && step < questions.length - 1 && (
          <button
            className="mt-6 px-6 py-2 bg-green-600 text-white rounded font-semibold shadow hover:bg-green-700 transition-colors w-full sm:w-auto"
            onClick={handleNext}
            disabled={loading}
          >
            Next Question
          </button>
        )}
        {showFeedback && !feedbacks[step]?.error && step === questions.length - 1 && (
          <button
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded font-semibold shadow hover:bg-blue-700 transition-colors w-full sm:w-auto"
            onClick={() => alert('Session finished!')}
            disabled={loading}
          >
            Finish Session
          </button>
        )}
      </div>
    </div>
  );
};

export default StepperMockInterview;
