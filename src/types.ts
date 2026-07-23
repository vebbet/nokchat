export interface Contact {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
  isTyping?: boolean;
  type?: 'contact' | 'space'; // 'contact' for standard simulated contact, 'space' for real Google Chat Space
  spaceType?: 'DM' | 'ROOM';  // DM or multi-person room
  memberCount?: number;
  memberIds?: string[];       // Member contact IDs for custom groups
  description?: string;       // Custom group description
  hasLeft?: boolean;          // Whether the user has left the group
}

export interface Message {
  id: string;
  text: string;
  timestamp: string; // ISO string or time string e.g. "14:30"
  sender: 'user' | 'contact';
  status: 'sent' | 'delivered' | 'read';
  senderName?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  accessToken?: string;
}

