'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// Removed unused fetchAiResponse import
import { startNewReflectionSession, addReflectionEntry } from '@/lib/chatService';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import MessageList from './MessageList'; // Import MessageList

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = 'demo-user'; // Placeholder for actual user ID
  const router = useRouter();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setError(null);
    setIsSending(true);
    try {
      // Create new chat session and add first message
      const newChatId = await startNewReflectionSession(userId);
      console.log('New chat session created:', newChatId);
      await addReflectionEntry(userId, newChatId, {
        text: input,
        sender: 'user',
        timestamp: Timestamp.now(),
      });
      // Add to chatHistory for the sidebar
      await setDoc(doc(db, 'users', userId, 'chatHistory', newChatId), {
        lastMessage: input,
        updatedAt: Timestamp.now(),
        chatId: newChatId,
      });
      // Clear input and navigate to new chat page
      setInput('');
      await router.push(`/chat/${newChatId}`);
    } catch (err: any) {
      console.error('Error starting chat:', err);
      setError(err.message || 'Failed to start new chat.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans"> {/* Use font-sans from globals or root layout */}
      {/* Side Panel */}
      <div className="w-1/4 bg-gray-100 p-4 border-r border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Chat History</h2>
        <MessageList userId={userId} />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 items-center justify-center p-4">
        <div className="w-full max-w-2xl"> {/* Increased max-width for better layout */}
          <div className="mb-4 h-[calc(100vh-12rem)] overflow-y-auto border rounded-lg bg-gray-50 p-6 shadow-sm"> {/* Adjusted height and styling */}
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center py-10">Start chatting with the AI...</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`p-3 rounded-lg max-w-md lg:max-w-lg xl:max-w-xl shadow ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              disabled={isSending || !input.trim()}
            >
              Send
            </button>
          </form>
          {error && <div className="mt-3 text-red-600 text-sm text-center">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;