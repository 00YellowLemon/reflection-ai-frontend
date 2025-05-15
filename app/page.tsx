import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50 to-white opacity-70"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 blur-3xl opacity-60"></div>
        <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 rounded-full bg-gradient-to-r from-blue-50 to-indigo-100 blur-3xl opacity-60"></div>
      </div>

      {/* Navigation Bar */}
      <header className="relative z-10 flex justify-between items-center px-8 py-6 backdrop-blur-sm bg-white/70 border-b border-gray-100">
        <div className="flex items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Reflection AI</h1>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/chat" className="text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Docs</Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
          <Link
            href="/auth"
            className="ml-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-grow text-center px-8 py-16">
        <div className="w-full max-w-5xl mx-auto">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl sm:text-7xl font-extrabold text-gray-900 tracking-tight">
              AI-Powered <span className="bg-gradient-to-r from-blue-600 to-indigo-700 text-transparent bg-clip-text">Reflection</span> For Everyone
            </h2>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of AI-powered conversations with a clean and
              intuitive interface that helps you reflect and grow.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/auth"
                className="px-8 py-3 text-white text-lg font-medium bg-black rounded-md shadow-sm hover:bg-gray-800 transition-all"
              >
                Get Started Free
              </Link>
              <Link
                href="/chat"
                className="px-8 py-3 text-gray-800 text-lg font-medium bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-all"
              >
                Try Demo
              </Link>
            </div>
          </div>

          {/* Demo Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl blur-xl opacity-75 transform -rotate-1"></div>
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-xl">
              <div className="flex items-center p-3 bg-gray-50/80 border-b border-gray-100">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto text-sm text-gray-500">Reflection AI Chat</div>
              </div>
              <div className="p-6 h-72 flex flex-col">
                <div className="flex items-start mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-blue-600 font-medium">AI</span>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-2xl rounded-tl-none max-w-md text-left text-gray-800">
                    How can I help you reflect on your goals today?
                  </div>
                </div>
                <div className="flex items-start mb-4 self-end">
                  <div className="p-3 bg-blue-50 rounded-2xl rounded-tr-none max-w-md text-left text-gray-800">
                    I've been feeling stuck with my career path. Can you help me explore some options?
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-3 flex-shrink-0">
                    <span className="text-gray-600 font-medium">U</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-blue-600 font-medium">AI</span>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-2xl rounded-tl-none max-w-md text-left text-gray-800">
                    I'd be happy to help you explore your career options. Let's start by reflecting on your current strengths and interests...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 py-16 px-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12 text-gray-900">Features designed for your personal growth</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Image src="/globe.svg" width={24} height={24} alt="Global" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900">Personalized Insights</h4>
              <p className="text-gray-600">AI-powered analysis that adapts to your unique thinking patterns and goals.</p>
            </div>
            
            <div className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Image src="/window.svg" width={24} height={24} alt="Window" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900">Guided Reflection</h4>
              <p className="text-gray-600">Structured prompts and questions designed to deepen your self-awareness.</p>
            </div>
            
            <div className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <Image src="/file.svg" width={24} height={24} alt="File" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900">Progress Tracking</h4>
              <p className="text-gray-600">Monitor your personal development journey with visual insights and metrics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 p-8 border-t border-gray-100 text-center text-sm text-gray-500 backdrop-blur-sm bg-white/70">
        <div className="max-w-5xl mx-auto">
          <p>&copy; 2025 Reflection AI. All rights reserved.</p>
          <div className="mt-2">
            <Link
              href="/privacy"
              className="hover:text-gray-800 transition-colors"
            >
              Privacy Policy
            </Link>{" "}
            |{" "}
            <Link
              href="/terms"
              className="hover:text-gray-800 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
