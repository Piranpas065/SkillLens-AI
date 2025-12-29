import React, { useState } from "react";
import { useRouter } from "next/navigation";

const MockInterviewPage: React.FC = () => {
  const router = useRouter();
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    setStarted(true);
    // For now, redirect to Q1 or show Q1 inline
    router.push("/mock-interview/q1");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 text-center">Mock Interview</h1>
        <div className="mb-6 text-center text-gray-700">
          You’ll be asked <span className="font-semibold">5 questions</span>, one at a time. Answer each to get feedback and tips. Ready?
        </div>
        <button
          className="px-6 py-2 bg-primary text-white rounded font-semibold shadow hover:bg-primary/90 transition-colors"
          onClick={handleStart}
        >
          Start Interview
        </button>
      </div>
    </div>
  );
};

export default MockInterviewPage;
