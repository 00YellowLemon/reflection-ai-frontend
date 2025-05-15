import { db } from '../firebaseConfig';
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
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Timestamp;
};

export type ChatHistoryItem = {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  lastMessageTimestamp: Timestamp;
  lastMessageText?: string;
};

/**
 * Subscribe to chat history for a user. Calls onUpdate with the history array.
 * Returns an unsubscribe function.
 */
export const subscribeToChatHistory = (
  userId: string,
  onUpdate: (history: ChatHistoryItem[]) => void,
  onError?: (error: any) => void
) => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('userId', '==', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );
  return onSnapshot(
    q,
    (querySnapshot) => {
      const history: ChatHistoryItem[] = [];
      querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        history.push({
          id: docSnap.id,
          userId: data.userId,
          title: data.title || 'Untitled Chat',
          createdAt: data.createdAt || Timestamp.now(),
          lastMessageTimestamp: data.lastMessageTimestamp || Timestamp.now(),
          lastMessageText: data.lastMessageText || ''
        });
      });
      onUpdate(history);
    },
    onError
  );
};

/**
 * Subscribe to messages for a chat. Calls onUpdate with the messages array.
 * Returns an unsubscribe function.
 */
export const subscribeToMessages = (
  chatId: string,
  onUpdate: (messages: Message[]) => void,
  onError?: (error: any) => void
) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  return onSnapshot(
    q,
    (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({
          id: docSnap.id,
          text: data.text,
          sender: data.sender,
          timestamp: data.timestamp || Timestamp.now()
        });
      });
      onUpdate(msgs);
    },
    onError
  );
};

/**
 * Create a new chat for a user. Returns the new chat ID.
 */
export const createNewChat = async (userId: string): Promise<string> => {
  const now = Timestamp.now();
  const newChatData = {
    userId,
    title: 'New Chat',
    createdAt: now,
    lastMessageTimestamp: now,
    lastMessageText: ''
  };
  const docRef = await addDoc(collection(db, 'chats'), newChatData);
  return docRef.id;
};

/**
 * Send a message in a chat and update chat metadata.
 */
export const sendMessage = async (
  chatId: string,
  message: {
    text: string;
    sender: 'user' | 'ai';
    timestamp: Timestamp;
  }
): Promise<string> => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const msgRef = await addDoc(messagesRef, message);
  // update last message on chat
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessageTimestamp: message.timestamp,
    lastMessageText: message.text
  });
  return msgRef.id;
};

/**
 * Delete a chat document. Note: messages subcollection not removed automatically.
 */
export const deleteChat = async (chatId: string): Promise<void> => {
  const chatRef = doc(db, 'chats', chatId);
  await deleteDoc(chatRef);
};
