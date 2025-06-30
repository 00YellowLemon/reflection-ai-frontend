import {
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  setDoc,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

export type ReflectionEntry = {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Timestamp;
  type?: string;
};

export type ReflectionLog = {
  id: string;
  userId: string;
  title: string;
  date: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastEntryText?: string;
  status?: 'in-progress' | 'completed';
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Timestamp;
};

export type ChatSession = {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Timestamp;
  createdAt: Timestamp;
  messages?: ChatMessage[];
};

/**
 * Subscribe to reflection logs for a user. Calls onUpdate with the logs array.
 * Returns an unsubscribe function.
 */
export const subscribeToReflectionSessions = (
  userId: string,
  onUpdate: (logs: ReflectionLog[]) => void,
  onError?: (error: any) => void
) => {
  const reflectionsRef = collection(db, 'users', userId, 'reflections');
  const q = query(
    reflectionsRef,
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(
    q,
    (querySnapshot) => {
      const logs: ReflectionLog[] = [];
      querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        logs.push({
          id: docSnap.id,
          userId: userId,
          title: data.title || 'Untitled Reflection',
          date: data.date || Timestamp.now(),
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
          lastEntryText: data.lastEntryText || '',
          status: data.status
        });
      });
      onUpdate(logs);
    },
    onError
  );
};

/**
 * Subscribe to entries for a reflection. Calls onUpdate with the entries array.
 * Returns an unsubscribe function.
 */
export const subscribeToReflectionEntries = (
  userId: string,
  reflectionId: string,
  onUpdate: (entries: ReflectionEntry[]) => void,
  onError?: (error: any) => void
) => {
  const entriesRef = collection(db, 'users', userId, 'reflections', reflectionId, 'entries');
  const q = query(entriesRef, orderBy('timestamp', 'asc'));
  return onSnapshot(
    q,
    (querySnapshot) => {
      const entries: ReflectionEntry[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          id: docSnap.id,
          text: data.text,
          sender: data.sender,
          timestamp: data.timestamp || Timestamp.now(),
          type: data.type
        });
      });
      onUpdate(entries);
    },
    onError
  );
};

/**
 * Create a new reflection session for a user. Returns the new reflection ID.
 */
export const startNewReflectionSession = async (userId: string, title?: string): Promise<string> => {
  const now = Timestamp.now();
  const newChatId = uuidv4(); // Generate UUID for chat ID
  const newReflectionLogData = {
    userId,
    title: title || `Reflection - ${now.toDate().toLocaleDateString()}`,
    createdAt: now,
    updatedAt: now,
    lastEntryText: '',
    status: 'in-progress' as 'in-progress' | 'completed'
  };
  // Use the generated UUID as the document ID by passing it to doc()
  // Create new reflection session under user-specific path for chat entries
  await setDoc(doc(db, 'users', userId, 'reflections', newChatId), newReflectionLogData);
  return newChatId; // Return the generated UUID
};

/**
 * Add an entry to a reflection session and update reflection metadata.
 */
export const addReflectionEntry = async (
  userId: string,
  reflectionId: string,
  entry: {
    text: string;
    sender: 'user' | 'ai' | 'system';
    timestamp: Timestamp;
    type?: string;
  }
): Promise<string> => {
  const entriesRef = collection(db, 'users', userId, 'reflections', reflectionId, 'entries');
  const entryRef = await addDoc(entriesRef, entry);
  // update last entry info on reflection log
  const reflectionLogRef = doc(db, 'users', userId, 'reflections', reflectionId);
  await updateDoc(reflectionLogRef, {
    updatedAt: entry.timestamp,
    lastEntryText: entry.text
  });
  return entryRef.id;
};

/**
 * Delete a reflection log document. Note: entries subcollection not removed automatically.
 */
export const deleteReflectionSession = async (userId: string, reflectionId: string): Promise<void> => {
  const reflectionLogRef = doc(db, 'users', userId, 'reflections', reflectionId);
  await deleteDoc(reflectionLogRef);
}

// Fetch chat history for a user, ordered from latest to oldest by updatedAt
export async function fetchChatHistory(userId: string) {
  const chatHistoryRef = collection(db, 'users', userId, 'chatHistory');
  const q = query(chatHistoryRef, orderBy('updatedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  // Ensure all required fields are present and fallback to empty string/null if missing
  return querySnapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      lastMessage: typeof data.lastMessage === 'string' ? data.lastMessage : '',
      updatedAt: data.updatedAt || null,
      chatId: typeof data.chatId === 'string' ? data.chatId : docSnap.id
    };
  });
}

// Update the last message for a specific chat in chatHistory
export async function updateChatHistoryLastMessage(userId: string, chatId: string, newMessage: string) {
  const chatDocRef = doc(db, 'users', userId, 'chatHistory', chatId);
  await updateDoc(chatDocRef, {
    lastMessage: newMessage,
    updatedAt: Timestamp.now()
  });
}

/**
 * Subscribe to chat sessions for a user. Calls onUpdate with the sessions array.
 * Returns an unsubscribe function.
 */
export const subscribeToChatSessions = (
  userId: string,
  onUpdate: (sessions: ChatSession[]) => void,
  onError?: (error: any) => void
) => {
  const chatHistoryRef = collection(db, 'users', userId, 'chatHistory');
  const q = query(chatHistoryRef, orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (querySnapshot) => {
      const sessions: ChatSession[] = [];
      querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        sessions.push({
          id: docSnap.id,
          title: data.title || 'New Chat',
          lastMessage: data.lastMessage || '',
          updatedAt: data.updatedAt || Timestamp.now(),
          createdAt: data.createdAt || Timestamp.now(),
        });
      });
      onUpdate(sessions);
    },
    onError
  );
};

/**
 * Subscribe to messages for a specific chat session. Calls onUpdate with the messages array.
 * Returns an unsubscribe function.
 */
export const subscribeToChatMessages = (
  userId: string,
  chatId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: any) => void
) => {
  const messagesRef = collection(db, 'users', userId, 'chatHistory', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (querySnapshot) => {
      const messages: ChatMessage[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        messages.push({
          id: docSnap.id,
          role: data.role,
          content: data.content,
          createdAt: data.createdAt || Timestamp.now(),
        });
      });
      onUpdate(messages);
    },
    onError
  );
};

/**
 * Create a new chat session for a user. Returns the new chat session ID.
 */
export const startNewChatSession = async (userId: string): Promise<string> => {
  const now = Timestamp.now();
  const newChatId = uuidv4();
  
  const newChatSessionData = {
    title: 'New Chat',
    lastMessage: '',
    createdAt: now,
    updatedAt: now,
  };
  
  await setDoc(doc(db, 'users', userId, 'chatHistory', newChatId), newChatSessionData);
  return newChatId;
};

/**
 * Add a message to a chat session and update chat session metadata.
 */
export const addChatMessage = async (
  userId: string,
  chatId: string,
  message: {
    role: 'user' | 'assistant';
    content: string;
  }
): Promise<string> => {
  const now = Timestamp.now();
  const messagesRef = collection(db, 'users', userId, 'chatHistory', chatId, 'messages');
  const messageRef = await addDoc(messagesRef, {
    ...message,
    createdAt: now,
  });
  
  // Update chat session metadata
  const chatSessionRef = doc(db, 'users', userId, 'chatHistory', chatId);
  await updateDoc(chatSessionRef, {
    lastMessage: message.content,
    updatedAt: now,
    // Update title if this is the first user message
    ...(message.role === 'user' ? {
      title: message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
    } : {})
  });
  
  return messageRef.id;
};

/**
 * Delete a chat session and all its messages.
 */
export const deleteChatSession = async (userId: string, chatId: string): Promise<void> => {
  // First delete all messages in the session
  const messagesRef = collection(db, 'users', userId, 'chatHistory', chatId, 'messages');
  const messagesSnapshot = await getDocs(messagesRef);
  
  const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  // Then delete the chat session document
  const chatSessionRef = doc(db, 'users', userId, 'chatHistory', chatId);
  await deleteDoc(chatSessionRef);
};

/**
 * Get messages for a specific chat session (one-time fetch).
 */
export const getChatMessages = async (userId: string, chatId: string): Promise<ChatMessage[]> => {
  const messagesRef = collection(db, 'users', userId, 'chatHistory', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      role: data.role,
      content: data.content,
      createdAt: data.createdAt || Timestamp.now(),
    };
  });
};
