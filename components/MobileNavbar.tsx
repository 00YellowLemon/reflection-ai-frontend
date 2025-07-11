'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function MobileNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="relative z-10 backdrop-blur-sm bg-white/70 border-b border-gray-100">
      <div className="flex justify-between items-center px-8 py-6">
        <div className="flex items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
            Soita
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/auth" className="text-gray-600 hover:text-gray-900 transition-colors">
            How it Works
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
            Resources
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
            Support
          </Link>
          
          {!loading && (
            user ? (
              <div className="flex items-center gap-4">
                <Link 
                  href="/chat" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Chat
                </Link>
                <span className="text-gray-600 text-sm">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="ml-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
              >
                Start Free
              </Link>
            )
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={toggleMenu}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={toggleMenu}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-6 py-4 space-y-4">
                <Link
                  href="/auth"
                  className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={toggleMenu}
                >
                  How it Works
                </Link>
                <Link
                  href="#"
                  className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={toggleMenu}
                >
                  Resources
                </Link>
                <Link
                  href="#"
                  className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={toggleMenu}
                >
                  Support
                </Link>
                
                {!loading && (
                  user ? (
                    <div className="pt-4 space-y-4">
                      <Link
                        href="/chat"
                        className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                        onClick={toggleMenu}
                      >
                        Chat
                      </Link>
                      <div className="py-2">
                        <span className="text-gray-600 text-sm">
                          {user.email}
                        </span>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="pt-4">
                      <Link
                        href="/auth"
                        className="block w-full px-4 py-2 bg-black text-white text-center rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                        onClick={toggleMenu}
                      >
                        Start Free
                      </Link>
                    </div>
                  )
                )}
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
