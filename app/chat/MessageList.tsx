import React, { useEffect, useState } from 'react';
import { fetchChatHistory } from '../../lib/chatService';
import { useRouter } from 'next/navigation';

interface ChatHistoryTileProps {
  id: string;
  lastMessage: string;
  updatedAt: { seconds: number } | null;
  chatId: string;
}

function truncateMessage(message: string, maxLength = 40) {
  if (!message) return '';
  return message.length > maxLength ? message.slice(0, maxLength) + '…' : message;
}

const ChatHistoryTile: React.FC<ChatHistoryTileProps> = ({ id, lastMessage, updatedAt, chatId }) => {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/chat/${chatId}`)}
      style={{
        cursor: 'pointer',
        border: '1px solid #eee',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        background: '#fafafa',
        transition: 'background 0.2s',
      }}
    >
      <div style={{ fontWeight: 'bold' }}>Chat {chatId}</div>
      <div style={{ color: '#555', fontSize: 14 }}>
        {truncateMessage(lastMessage)}
      </div>
      <div style={{ color: '#aaa', fontSize: 12 }}>
        {updatedAt && updatedAt.seconds ? new Date(updatedAt.seconds * 1000).toLocaleString() : 'No date'}
      </div>
    </div>
  );
};

const MessageList: React.FC<{ userId: string }> = ({ userId }) => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryTileProps[]>([]);

  useEffect(() => {
    async function load() {
      const data = await fetchChatHistory(userId);
      setChatHistory(data);
    }
    load();
  }, [userId]);

  return (
    <div style={{ width: 320, padding: 16 }}>
      {chatHistory.map((chat) => (
        <ChatHistoryTile key={chat.id} {...chat} />
      ))}
    </div>
  );
};

export default MessageList;
