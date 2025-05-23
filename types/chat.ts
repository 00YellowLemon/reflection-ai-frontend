export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: any; // Or Date, or a more specific timestamp type
}
