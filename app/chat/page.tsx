"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { MessageCircle, Plus, Trash2, Send, Menu, X } from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt?: string
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
}

export default function ChatApp() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    onFinish: (message) => {
      // The message is already handled by the useEffect above
      // Just ensure we save to storage if needed
      if (currentSessionId) {
        const currentMessages = messages.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          createdAt: new Date().toISOString(),
        }))
        saveChatToStorage(currentMessages)
      }
    },
  })

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("chatSessions")
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions)
        setChatSessions(sessions)
      } catch (error) {
        console.error("Error loading chat sessions:", error)
        localStorage.removeItem("chatSessions")
      }
    }
  }, [])

  // Sync useChat messages with display messages
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      // Convert useChat messages to our format
      const chatMessages: ChatMessage[] = messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: new Date().toISOString(),
      }))

      // Update display messages to match useChat messages
      setDisplayMessages(chatMessages)

      // Save to storage
      saveChatToStorage(chatMessages)
    }
  }, [messages, currentSessionId])

  const saveChatToStorage = (updatedMessages: ChatMessage[]) => {
    if (!currentSessionId) return

    const updatedSessions = chatSessions.map((session) =>
      session.id === currentSessionId
        ? {
            ...session,
            messages: updatedMessages,
            title: session.title || updatedMessages[0]?.content?.slice(0, 30) + "..." || "New Chat",
          }
        : session,
    )

    setChatSessions(updatedSessions)
    localStorage.setItem("chatSessions", JSON.stringify(updatedSessions))
  }

  const startNewChat = () => {
    setMessages([])
    setDisplayMessages([])
    setCurrentSessionId(null)
  }

  const loadChatSession = (session: ChatSession) => {
    // Set the session first
    setCurrentSessionId(session.id)

    // Load the historical messages into display
    setDisplayMessages(session.messages)

    // Also set them in useChat so new messages continue the conversation
    const chatMessages = session.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
    }))

    setMessages(chatMessages)
  }

  const deleteChatSession = (sessionId: string) => {
    const updatedSessions = chatSessions.filter((session) => session.id !== sessionId)
    setChatSessions(updatedSessions)
    localStorage.setItem("chatSessions", JSON.stringify(updatedSessions))

    if (currentSessionId === sessionId) {
      startNewChat()
    }
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!input.trim()) return

    // If this is an existing chat, we need to set up useChat with the complete history
    if (currentSessionId && displayMessages.length > 0) {
      // Convert display messages to useChat format (without adding the new message yet)
      const chatMessages = displayMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
      }))

      // Set the complete conversation history in useChat
      setMessages(chatMessages)
    } else {
      // New chat - create session
      if (!currentSessionId) {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: input.slice(0, 30) + (input.length > 30 ? "..." : ""),
          messages: [],
          createdAt: new Date().toISOString(),
        }

        const updatedSessions = [newSession, ...chatSessions]
        setChatSessions(updatedSessions)
        setCurrentSessionId(newSession.id)
        localStorage.setItem("chatSessions", JSON.stringify(updatedSessions))
      }
    }

    // Submit to AI (this will add the user message and trigger the AI response)
    handleSubmit(e)
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
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(session.createdAt).toLocaleDateString()} • {session.messages.length} messages
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
