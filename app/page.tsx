import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Section */}
      

      {/* Hero Section */}
      <main className="container py-20 px-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight text-slate-900">
              AI-Powered Career
              <span className="text-slate-600 block">Intelligence Platform</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Transform your career with intelligent CV analysis, skill mapping, and 
              personalized job recommendations powered by advanced AI technology.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Smart CV Analysis</h3>
                <p className="text-sm text-slate-600">
                  Upload your CV and get instant AI-powered insights into your skills, experience, and career potential.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Job Matching</h3>
                <p className="text-sm text-slate-600">
                  Find the perfect job opportunities that match your skills and career aspirations with precision.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Career Insights</h3>
                <p className="text-sm text-slate-600">
                  Get actionable recommendations to improve your profile and accelerate your career growth.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="pt-12 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/upload-cv">
                <Button size="lg" className="px-8 py-3 text-base">
                  Get Started - Upload CV
                </Button>
              </Link>
              <Link href="/job-match">
                <Button variant="outline" size="lg" className="px-8 py-3 text-base">
                  Explore Job Matches
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              Free to use • No registration required • Secure & private
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto py-6">
          <div className="text-center text-sm text-slate-500">
            © 2025 SkillLens AI. Empowering careers through intelligent technology.
          </div>
        </div>
      </footer>
    </div>
  );
}
