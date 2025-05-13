import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Bar */}
      <header className="flex justify-between items-center p-6 bg-white shadow-md">
        <h1 className="text-xl font-bold">Reflection AI</h1>
        <Link
          href="/auth"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center flex-grow text-center p-8">
        <h2 className="text-4xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text animate-fade-in">
          Welcome to Reflection AI
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl">
          Experience the future of AI-powered conversations with a clean and
          intuitive interface.
        </p>
        <Link
          href="/auth"
          className="mt-6 px-6 py-3 bg-blue-500 text-white text-lg rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring"
        >
          Get Started Free
        </Link>
        <div className="mt-10 w-full max-w-md h-64 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg shadow-md animate-slide-in"></div>
      </main>

      {/* Footer */}
      <footer className="p-6 bg-gray-100 text-center text-sm text-gray-500">
        <p>&copy; 2025 Reflection AI. All rights reserved.</p>
        <div className="mt-2">
          <Link
            href="/privacy"
            className="hover:underline"
          >
            Privacy Policy
          </Link>{" "}
          |{" "}
          <Link
            href="/terms"
            className="hover:underline"
          >
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
