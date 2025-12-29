import Link from "next/link";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "SkillLens AI - AI-Powered Career Intelligence",
  description: "Transform your career with intelligent CV analysis, skill mapping, and personalized job recommendations powered by advanced AI technology.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {/* Professional Header */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="container mx-auto">
            <div className="flex h-16 items-center px-6">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 md:ml-15">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
                  </svg>
                </div>
                <span className="hidden font-bold text-slate-900 sm:inline-block">
                  SkillLens AI
                </span>
              </Link>

              {/* Centered Navigation */}
              <nav className="flex items-center justify-center space-x-5 flex-1">
                <Link 
                  href="/upload-cv" 
                  className="rounded-md px-6 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Upload CV
                </Link>
                <Link 
                  href="/job-match" 
                  className="rounded-md px-6 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Job Match
                </Link>
                <Link 
                  href="/dashboard" 
                  className="rounded-md bg-slate-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Dashboard
                </Link>
              </nav>

              {/* Right spacer to balance the logo */}
              <div className="w-30"></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-12">
          {children}
        </main>

        {/* Professional Footer */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
              <div className="flex items-center space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-white">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-900">SkillLens AI</span>
              </div>
              
              <div className="flex items-center space-x-6">
                <Link 
                  href="/about" 
                  className="text-sm text-slate-600 transition-colors hover:text-slate-900"
                >
                  About
                </Link>
                <Link 
                  href="/privacy" 
                  className="text-sm text-slate-600 transition-colors hover:text-slate-900"
                >
                  Privacy
                </Link>
                <Link 
                  href="/contact" 
                  className="text-sm text-slate-600 transition-colors hover:text-slate-900"
                >
                  Contact
                </Link>
              </div>
              
              <p className="text-sm text-slate-500">
                © 2025 SkillLens AI. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
