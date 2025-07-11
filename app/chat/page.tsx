"use client"

import type React from "react"

import { useChat, type Message } from "@ai-sdk/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { MessageCircle, Plus, Trash2, Send, Menu, X, LogOut } from "lucide-react"
import { useAuth } from "@/lib/useAuth";
import { 
  subscribeToChatSessions, 
  subscribeToChatMessages, 
  startNewChatSession, 
  addChatMessage, 
  deleteChatSession as deleteFirestoreChatSession,
  getChatMessages,
  type ChatMessage as FirestoreChatMessage,
  type ChatSession as FirestoreChatSession
} from "@/lib/chatService";
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt?: string // Ensure this is string for storage/display
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
}

export default function ChatApp() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  
  // Redirect to auth if not authenticated
  useEffect(() => {
    console.log('Chat page auth check - loading:', loading, 'user:', user?.uid);
    if (loading) return; // Wait for auth state to be determined
    if (!user) {
      console.log('No user found, redirecting to auth');
      router.push('/auth');
    } else {
      console.log('User authenticated, staying on chat page');
    }
  }, [user, loading, router]);

  // Helper to convert Firestore ChatMessage to local ChatMessage
  const convertFirestoreChatMessage = (msg: FirestoreChatMessage): ChatMessage => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt.toDate().toISOString(),
  });

  // Helper to convert stored ChatMessage to Message for useChat
  const convertChatMessageToUIMessage = (msg: ChatMessage): Message => ({
    id: msg.id,
    role: msg.role as Message['role'],
    content: msg.content,
    createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
  });

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    // Removed onFinish callback as we'll handle AI response manually
  });

  // Load saved session from localStorage when component mounts
  useEffect(() => {
    if (user) {
      const savedSessionId = localStorage.getItem(`currentChatSession_${user.uid}`);
      if (savedSessionId) {
        setCurrentSessionId(savedSessionId);
      }
    }
  }, [user]);

  // Save current session to localStorage when it changes
  useEffect(() => {
    if (user && currentSessionId) {
      localStorage.setItem(`currentChatSession_${user.uid}`, currentSessionId);
    } else if (user && currentSessionId === null) {
      localStorage.removeItem(`currentChatSession_${user.uid}`);
    }
  }, [user, currentSessionId]);

  // Subscribe to chat sessions when user is authenticated
  useEffect(() => {
    if (!user) return;

    console.log("Subscribing to chat sessions for user:", user.uid);

    const unsubscribe = subscribeToChatSessions(
      user.uid,
      (firestoreSessions) => {
        console.log("Received chat sessions:", firestoreSessions.length);
        const sessions: ChatSession[] = firestoreSessions.map(session => ({
          id: session.id,
          title: session.title,
          messages: [], // Will be loaded when session is selected
          createdAt: session.createdAt.toDate().toISOString(),
        }));
        setChatSessions(sessions);
        
        // Auto-load session based on stored session ID or most recent session
        if (sessions.length > 0) {
          const savedSessionId = localStorage.getItem(`currentChatSession_${user.uid}`);
          console.log("Saved session ID:", savedSessionId, "Current session ID:", currentSessionId);
          
          // Check if saved session still exists
          if (savedSessionId && sessions.find(s => s.id === savedSessionId)) {
            if (!currentSessionId || currentSessionId !== savedSessionId) {
              console.log("Loading saved session:", savedSessionId);
              setCurrentSessionId(savedSessionId);
            }
          } else if (!currentSessionId) {
            // If no saved session or it doesn't exist, load the most recent one
            console.log("Loading most recent session:", sessions[0].id);
            setCurrentSessionId(sessions[0].id);
          }
        } else {
          console.log("No chat sessions found");
        }
      },
      (error) => {
        console.error("Error subscribing to chat sessions:", error);
      }
    );

    return () => unsubscribe();
  }, [user]); // Removed currentSessionId dependency to avoid infinite loops

  // Subscribe to messages for the current session
  useEffect(() => {
    if (!user || !currentSessionId) {
      console.log("Skipping message subscription - user:", !!user, "currentSessionId:", currentSessionId);
      return;
    }

    console.log("Subscribing to messages for session:", currentSessionId);

    const unsubscribe = subscribeToChatMessages(
      user.uid,
      currentSessionId,
      (firestoreMessages) => {
        console.log("Received messages for session:", currentSessionId, "count:", firestoreMessages.length);
        const messages = firestoreMessages.map(convertFirestoreChatMessage);
        setDisplayMessages(messages);
        
        // Update useChat messages
        const chatMessagesForUseChat = messages.map((msg) => ({
          ...convertChatMessageToUIMessage(msg),
          parts: [], // Add empty parts array to satisfy UIMessage type
        }));
        setMessages(chatMessagesForUseChat);
      },
      (error) => {
        console.error("Error subscribing to chat messages:", error);
      }
    );

    return () => unsubscribe();
  }, [user, currentSessionId, setMessages]);
  const startNewChat = async () => {
    if (!user) return;
    
    setMessages([]) // Clear messages in useChat
    setDisplayMessages([]) // Clear displayed messages immediately
    setCurrentSessionId(null) // Set current session to null
    
    // Clear input field
    const syntheticEvent = { target: { value: "" }, currentTarget: { value: "" }} as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  }

  const loadChatSession = async (session: ChatSession) => {
    if (!user) return;
    
    setCurrentSessionId(session.id);
    
    // Clear input field
    const syntheticEvent = { target: { value: "" }, currentTarget: { value: "" }} as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
    
    // Messages will be loaded automatically by the useEffect subscription
  }

  const deleteChatSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      await deleteFirestoreChatSession(user.uid, sessionId);
      
      if (currentSessionId === sessionId) {
        startNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat session:", error);
    }
  }
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || !user) return

    const userInput = input; // Capture input before clearing

    let sessionIdToUse = currentSessionId;

    // Handle session creation if no current session
    if (!sessionIdToUse) {
      try {
        sessionIdToUse = await startNewChatSession(user.uid);
        setCurrentSessionId(sessionIdToUse);
      } catch (error) {
        console.error("Error creating new chat session:", error);
        return;
      }
    }

    // Clear input field immediately
    const syntheticEvent = { target: { value: "" }, currentTarget: { value: "" }} as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
    
    try {
      // Add user message to Firestore
      await addChatMessage(user.uid, sessionIdToUse, {
        role: 'user',
        content: userInput,
      });

      // Call the API route to get AI response
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          chatHistory: displayMessages, // Send current chat history
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }

      const data = await response.json();
      const aiResponseContent = data.response;

      // Add AI response to Firestore
      await addChatMessage(user.uid, sessionIdToUse, {
        role: 'assistant',
        content: aiResponseContent ?? "Sorry, I couldn't generate a response.",
      });

    } catch (error) {
      console.error("Error in chat submission:", error);
      
      // Add error message to Firestore
      try {
        await addChatMessage(user.uid, sessionIdToUse, {
          role: 'assistant',
          content: "Sorry, I encountered an error trying to respond. Please try again.",
        });
      } catch (errorAddingError) {
        console.error("Error adding error message:", errorAddingError);
      }
    }
  }

  // Show loading spinner while authenticating
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200`}
      >
        <div className="p-4 border-b border-gray-200">
          <Button onClick={startNewChat} className="w-full justify-start gap-2" variant="outline">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {chatSessions.map((session) => (
              <Card
                key={session.id}
                className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  currentSessionId === session.id ? "bg-blue-50 border-blue-200" : ""
                }`}
                onClick={() => loadChatSession(session)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <p className="text-sm font-medium truncate">{session.title}</p>
                    </div>                    <p className="text-xs text-gray-500">
                      {new Date(session.createdAt).toLocaleDateString()}
                      {currentSessionId === session.id ? ` • ${displayMessages.length} messages` : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteChatSession(session.id)
                    }}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">AI Chat Assistant</h1>
            {currentSessionId && (
              <span className="text-sm text-gray-500">
                • {chatSessions.find((s) => s.id === currentSessionId)?.title}
              </span>
            )}
          </div>
          <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {displayMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-500">Ask me anything and I'll help you out!</p>
              </div>
            ) : (
              displayMessages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input Form */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={onSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1"
                autoFocus
              />
              <Button type="submit" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
