import React from "react";
import { useRouter } from "next/navigation";

interface Feedback {
  score?: number;
  feedback?: string[];
  revisedAnswer?: string;
  error?: string;
}

interface CompletionPageProps {
  questions: { question: string; idealAnswer: string }[];
  answers: string[];
  feedbacks: (Feedback | null)[];
}

const CompletionPage: React.FC<CompletionPageProps> = ({ questions, answers, feedbacks }) => {
  const router = useRouter();
  const total = questions.length;
  const avgScore = (
    feedbacks.filter((f): f is Feedback => !!f && typeof f.score === 'number').reduce((sum, f) => sum + (f.score || 0), 0) / total
  ).toFixed(1);

  const handleDownloadPDF = () => {
    // Placeholder: implement PDF download logic
    alert("PDF download coming soon!");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 text-center">Session Complete</h1>
        <div className="mb-4 text-lg text-center">You answered <b>{total}</b> questions.</div>
        <div className="mb-6 text-xl font-semibold text-primary">Average Score: {avgScore} / 10</div>
        <div className="w-full mb-6">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Your Answer</th>
                <th className="p-2 border">AI Revised</th>
                <th className="p-2 border">Score</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2 border text-center">{idx + 1}</td>
                  <td className="p-2 border whitespace-pre-line">{answers[idx]}</td>
                  <td className="p-2 border whitespace-pre-line">{feedbacks[idx]?.revisedAnswer || "-"}</td>
                  <td className="p-2 border text-center">{feedbacks[idx]?.score ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4">
          <button
            className="px-6 py-2 bg-primary text-white rounded font-semibold shadow hover:bg-primary/90 transition-colors"
            onClick={handleDownloadPDF}
          >
            Download Summary as PDF
          </button>
          <button
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded font-semibold shadow hover:bg-gray-300 transition-colors"
            onClick={() => router.push("/mock-interview")}
          >
            Review Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionPage;
