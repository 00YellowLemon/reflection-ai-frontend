'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { subscribeToReflectionEntries, addReflectionEntry, updateChatHistoryLastMessage } from '@/lib/chatService';
import { fetchAiResponse } from '@/lib/aiService';
import { Timestamp } from 'firebase/firestore';
import dynamic from 'next/dynamic';
// Dynamically import MessageList to avoid SSR issues
const MessageList = dynamic(() => import('../MessageList'), { ssr: false });

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export default function DynamicChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Replace with actual userId from auth context/session
  const userId = 'demo-user';

  // Subscribe to chat messages for this chatId
  useEffect(() => {
    if (!chatId) return;
    setError(null);
    // Unsubscribe function
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToReflectionEntries(
        userId,
        chatId as string,
        (entries) => {
          // Map ReflectionEntry to Message
          setMessages(
            entries.map((entry) => ({
              id: entry.id,
              text: entry.text,
              sender: entry.sender === 'user' || entry.sender === 'ai' ? entry.sender : 'ai',
              timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate().toISOString() : new Date().toISOString(),
            }))
          );
        },
        (err) => setError('Failed to load chat messages.')
      );
    } catch (err) {
      setError('Failed to load chat messages.');
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setError(null);
    // Optimistic UI update for user message
    const userMsgObj: Message = {
      id: `user-${Date.now()}`,
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsgObj]);
    // Persist user message
    await addReflectionEntry(userId, chatId as string, {
      text: input,
      sender: 'user',
      timestamp: Timestamp.now(),
    });
    // Update chat history
    await updateChatHistoryLastMessage(userId, chatId as string, input);
    setInput('');
    setIsSending(true);
    try {
      // Fetch AI response
      const aiText = await fetchAiResponse(chatId as string, input);
      // Optimistic UI update for AI message
      const aiMsgObj: Message = {
        id: `ai-${Date.now()}`,
        text: aiText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsgObj]);
      // Persist AI message
      await addReflectionEntry(userId, chatId as string, {
        text: aiText,
        sender: 'ai',
        timestamp: Timestamp.now(),
      });
      // Update chat history with AI message
      await updateChatHistoryLastMessage(userId, chatId as string, aiText);
    } catch (err: any) {
      setError(err.message || 'Failed to get AI response.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Side panel for chat history */}
      <aside className="hidden md:block border-r bg-gray-50 min-h-screen" style={{ minWidth: 320 }}>
        <MessageList userId={userId} />
      </aside>
      {/* Main chat area */}
      <main className="flex flex-col flex-1 items-center justify-center">
        <div className="w-full max-w-xl p-4">
          <div className="mb-4 h-96 overflow-y-auto border rounded bg-gray-50 p-4">
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`mb-2 text-sm ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}> 
                  <span className={msg.sender === 'user' ? 'text-blue-600' : 'text-black'}>
                    {msg.text}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={isSending || !input.trim()}
            >
              Send
            </button>
          </form>
          {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
        </div>
      </main>
    </div>
  );
}
