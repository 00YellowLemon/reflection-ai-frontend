'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import {
  subscribeToChatHistory,
  subscribeToMessages,
  createNewChat,
  sendMessage as sendChatMessage,
  deleteChat as deleteChatService,
  Message as ChatMessage,
  ChatHistoryItem
} from '../../lib/chatService';

// Chat types imported from lib/chatService

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false); // For loading state of new chat button

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/auth');
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribeAuth();
  }, [router]);

  // Effect to fetch chat history
  useEffect(() => {
    if (user) {
      setIsLoadingAuth(true);
      const unsubscribe = subscribeToChatHistory(
        user.uid,
        (history) => {
          setChatHistory(history);
          setIsLoadingAuth(false);
        },
        (error) => {
          console.error('Error fetching chat history: ', error);
          setIsLoadingAuth(false);
        }
      );
      return unsubscribe;
    } else {
      setChatHistory([]);
      setActiveChatId(null);
    }
  }, [user]);

  // Effect to fetch messages for the selected chat
  useEffect(() => {
    if (activeChatId) {
      const unsubscribe = subscribeToMessages(
        activeChatId,
        (msgs: ChatMessage[]) => setMessages(msgs),
        (error) => console.error('Error fetching messages: ', error)
      );
      return unsubscribe;
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out: ', error);
      // Optionally show an error message to the user
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeChatId) return;

    setIsSending(true);

    // Optimistically update the UI
    const userMessage: ChatMessage = {
      id: Date.now().toString(), // Temporary ID
      text: newMessage,
      sender: 'user',
      timestamp: Timestamp.now(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setNewMessage('');

    try {
      // Send user message via service
      await sendChatMessage(activeChatId, {
        text: userMessage.text,
        sender: userMessage.sender,
        timestamp: userMessage.timestamp
      });

      // Simulate AI response
      setTimeout(async () => {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(), // Temporary ID
          text: `AI response to: "${userMessage.text}"`,
          sender: 'ai',
          timestamp: Timestamp.now(),
        };

        // Send AI response via service
        await sendChatMessage(activeChatId, {
          text: aiResponse.text,
          sender: aiResponse.sender,
          timestamp: aiResponse.timestamp
        });
      }, 1000); // Simulate delay for AI response
    } catch (error) {
      console.error("Error sending message: ", error);
      // Optionally, show an error message to the user
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = async () => {
    if (!user) return;
    setIsCreatingChat(true);
    try {
      const newChatId = await createNewChat(user.uid);
      setActiveChatId(newChatId);
      setMessages([]);
    } catch (error) {
      console.error('Error creating new chat: ', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!activeChatId) return;
    try {
      await deleteChatService(activeChatId);
      setActiveChatId(null);
      setMessages([]);
    } catch (error) {
      console.error('Error deleting chat: ', error);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Loading chat...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the redirect in useEffect,
    // but it's a good fallback.
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen font-sans bg-gray-100">
      {/* Side Panel (Chat History) */}
      <aside
        className={`bg-gray-800 text-white ${isSidePanelOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out flex flex-col`}
      >
        {isSidePanelOpen && (
          <>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Chat History</h2>
            </div>
            <div className="flex-grow overflow-y-auto">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 hover:bg-gray-700 cursor-pointer ${activeChatId === chat.id ? 'bg-blue-600' : ''}`}
                  onClick={() => setActiveChatId(chat.id)}
                >
                  <h3 className="text-sm font-medium truncate">{chat.title}</h3>
                  <p className="text-xs text-gray-400 truncate">
                    {/* Ensure chat.lastMessageTimestamp is a Firestore Timestamp before calling toDate() */}
                    {chat.lastMessageTimestamp && typeof chat.lastMessageTimestamp.toDate === 'function' 
                      ? new Date(chat.lastMessageTimestamp.toDate()).toLocaleTimeString()
                      : 'No recent messages'}
                  </p>
                </div>
              ))}
            </div>
            <button 
              onClick={handleNewChat} 
              disabled={isCreatingChat} // Disable button while creating chat
              className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingChat ? 'Creating...' : '+ New Chat'}
            </button>
          </>
        )}
      </aside>

      {/* Main Chat Area */} 
      <main className="flex-1 flex flex-col bg-white">
        {/* Header Bar */} 
        <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
          <div className="flex items-center">
            {!isSidePanelOpen && (
                <button 
                    onClick={() => setIsSidePanelOpen(true)}
                    className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 mr-3"
                >
                    {/* Placeholder for menu icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
            )}
            <h2 className="text-xl font-semibold text-gray-800">
              {activeChatId ? chatHistory.find(c => c.id === activeChatId)?.title : 'Select or Start a Chat'}
            </h2>
            {activeChatId && (
              <button
                onClick={handleDeleteChat}
                className="ml-4 text-red-500 hover:text-red-700 focus:outline-none"
                title="Delete this chat"
              >
                {/* Trash Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Message Display Area */} 
        <div className="flex-grow p-6 space-y-4 overflow-y-auto bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'} text-right`}>
                    {/* Ensure msg.timestamp is a Firestore Timestamp before calling toDate() */}
                    {msg.timestamp && typeof msg.timestamp.toDate === 'function' 
                      ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                </p>
              </div>
            </div>
          ))}
          {isSending && messages.length > 0 && messages[messages.length -1].sender === 'user' && (
             <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow bg-gray-200 text-gray-800">
                    <p className="text-sm italic">AI is thinking...</p> { /* Loading indicator for AI response */}
                </div>
            </div>
          )}
        </div>

        {/* Message Input Field */} 
        <form onSubmit={handleSendMessage} className="bg-white border-t p-4 flex items-center space-x-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as any); // Cast to any to satisfy FormEvent requirement
              }
            }}
            disabled={isSending || isLoadingAuth}
          />
          <button
            type="submit"
            disabled={isSending || isLoadingAuth || !newMessage.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
