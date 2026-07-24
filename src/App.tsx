import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsDialog from './components/SettingsDialog';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
import NokPearLogo from './components/NokPearLogo';
import { Contact, Message, UserProfile } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, MessageSquareCode, MessageSquare, Users, Settings, LogOut } from 'lucide-react';
import { initAuth, googleSignIn, logoutUser } from './lib/firebase';

const FALLBACK_CONTACTS: Contact[] = [];

const FALLBACK_SPACES: Contact[] = [];

const INITIAL_MESSAGES: { [contactId: string]: Message[] } = {};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ [contactId: string]: Message[] }>({});
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'contacts' | 'spaces'>('contacts');

  const [deletedItemIds, setDeletedItemIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('gchat_deleted_item_ids');
    return cached ? JSON.parse(cached) : [];
  });

  // Purge any local message/contact caches from browser localStorage
  useEffect(() => {
    localStorage.removeItem('gchat_messages');
    localStorage.removeItem('gchat_contacts');
    
    // Purge specific email local storage keys if present
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('gchat_messages_') || key.startsWith('gchat_contacts_')) {
        localStorage.removeItem(key);
      }
    });

    const cachedUser = localStorage.getItem('gchat_user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {}
    }
  }, []);

  // Initialize and listen to Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        const loggedInUser: UserProfile = {
          name: firebaseUser.displayName || 'Foydalanuvchi',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || '',
          accessToken: token
        };
        setUser(loggedInUser);
        localStorage.setItem('gchat_user', JSON.stringify(loggedInUser));
        
        await syncContactsAndSpaces(token, loggedInUser);
      },
      () => {
        // Not authenticated via Google OAuth
        const cachedUserStr = localStorage.getItem('gchat_user');
        if (cachedUserStr) {
          try {
            const parsed = JSON.parse(cachedUserStr);
            if (parsed && parsed.email) {
              setUser(parsed);
              return;
            }
          } catch (e) {
            console.error('Failed to parse cached user:', e);
          }
        }
        setUser(null);
        setContacts([]);
        setMessages({});
        setActiveContactId(null);
        localStorage.removeItem('gchat_user');
        sessionStorage.removeItem('gchat_access_token');
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Register user and load persistent contacts/messages from server backend when logged in
  useEffect(() => {
    if (!user?.email) return;

    const userEmail = user.email.toLowerCase();

    // 1. Fetch user contacts from server backend
    fetch(`/api/contacts?email=${encodeURIComponent(userEmail)}`)
      .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json() : { contacts: [] })
      .then(data => {
        if (Array.isArray(data.contacts) && data.contacts.length > 0) {
          setContacts(prev => {
            const map = new Map<string, Contact>();
            data.contacts.forEach((c: Contact) => map.set(c.id, c));
            prev.forEach(c => map.set(c.id, c));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    // 2. Fetch user messages & threads from server backend
    fetch(`/api/messages?email=${encodeURIComponent(userEmail)}`)
      .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json() : { messages: [], threads: {} })
      .then(data => {
        const loadedMsgs: { [contactId: string]: Message[] } = {};

        // A) Load from server saved threads
        if (data.threads && typeof data.threads === 'object') {
          Object.keys(data.threads).forEach(contactId => {
            if (Array.isArray(data.threads[contactId])) {
              loadedMsgs[contactId] = data.threads[contactId];
            }
          });
        }

        // B) Load from globalAppMessages (inter-account DMs)
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          data.messages.forEach((m: any) => {
            const isMe = m.senderEmail.toLowerCase() === userEmail;
            const otherEmail = isMe ? m.recipientEmail.toLowerCase() : m.senderEmail.toLowerCase();
            
            const targetKey = otherEmail;
            if (!loadedMsgs[targetKey]) loadedMsgs[targetKey] = [];
            
            if (!loadedMsgs[targetKey].some(existing => existing.id === m.id)) {
              loadedMsgs[targetKey].push({
                id: m.id,
                text: m.text,
                timestamp: m.timestamp,
                sender: isMe ? 'user' : 'contact',
                status: 'read'
              });
            }
          });
        }

        // Set messages state
        setMessages(prev => ({
          ...loadedMsgs,
          ...prev
        }));

        // C) Ensure every thread contact exists in contacts list so no history is hidden
        setContacts(prevContacts => {
          const map = new Map<string, Contact>();
          prevContacts.forEach(c => map.set(c.id, c));

          Object.keys(loadedMsgs).forEach(threadKey => {
            const exists = prevContacts.some(c => c.id === threadKey || (c.email && c.email.toLowerCase() === threadKey));
            if (!exists && threadKey.includes('@')) {
              const namePart = threadKey.split('@')[0];
              const autoContact: Contact = {
                id: threadKey,
                name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
                email: threadKey,
                avatar: `https://placehold.co/100x100/1a73e8/fff?text=${encodeURIComponent(namePart[0].toUpperCase())}`,
                unreadCount: 0,
                isOnline: true,
                type: 'contact',
                lastMessage: loadedMsgs[threadKey][loadedMsgs[threadKey].length - 1]?.text || '',
                lastMessageTime: loadedMsgs[threadKey][loadedMsgs[threadKey].length - 1]?.timestamp || ''
              };
              map.set(threadKey, autoContact);
            }
          });

          return Array.from(map.values());
        });
      })
      .catch(e => console.error('Failed to load server messages:', e));

    // 3. Register user on backend memory
    fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: user.name, email: user.email, avatar: user.avatar })
    }).catch(() => {});
  }, [user?.email]);

  // Real-time inter-account messaging sync via BroadcastChannel & server polling
  useEffect(() => {
    if (!user?.email) return;

    const currentEmail = user.email.toLowerCase();
    const bc = new BroadcastChannel('gchat_realtime_sync');

    const handleIncomingRealMsg = (msgData: {
      id: string;
      senderEmail: string;
      senderName: string;
      senderAvatar: string;
      recipientEmail: string;
      text: string;
      timestamp: string;
    }) => {
      if (msgData.recipientEmail.toLowerCase() !== currentEmail) return;

      const senderEmail = msgData.senderEmail.toLowerCase();

      // Ensure sender contact exists in user's sidebar
      setContacts((prevContacts) => {
        const exists = prevContacts.some(
          (c) => (c.email && c.email.toLowerCase() === senderEmail) || c.id === senderEmail
        );

        if (!exists) {
          const newContact: Contact = {
            id: senderEmail,
            name: msgData.senderName,
            email: senderEmail,
            avatar: msgData.senderAvatar,
            unreadCount: 1,
            isOnline: true,
            type: 'contact',
            lastMessage: msgData.text,
            lastMessageTime: msgData.timestamp
          };
          return [newContact, ...prevContacts];
        }

        return prevContacts.map((c) => {
          if ((c.email && c.email.toLowerCase() === senderEmail) || c.id === senderEmail) {
            return {
              ...c,
              lastMessage: msgData.text,
              lastMessageTime: msgData.timestamp,
              isOnline: true,
              unreadCount: c.id === activeContactId ? 0 : (c.unreadCount || 0) + 1
            };
          }
          return c;
        });
      });

      // Append message to conversation thread
      setMessages((prevMsgs) => {
        const threadKey = senderEmail;
        const existingThread = prevMsgs[threadKey] || [];
        if (existingThread.some((m) => m.id === msgData.id)) {
          return prevMsgs;
        }

        const newMsg: Message = {
          id: msgData.id,
          text: msgData.text,
          timestamp: msgData.timestamp,
          sender: 'contact',
          status: 'read'
        };

        return {
          ...prevMsgs,
          [threadKey]: [...existingThread, newMsg]
        };
      });
    };

    bc.onmessage = (event) => {
      if (event.data && event.data.type === 'REAL_MSG') {
        handleIncomingRealMsg(event.data.payload);
      }
    };

    // Poll server for any offline/missed messages for this account
    const syncServerMessages = async () => {
      try {
        const res = await fetch(`/api/messages?email=${encodeURIComponent(currentEmail)}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            data.messages.forEach((m: any) => {
              if (m.recipientEmail.toLowerCase() === currentEmail) {
                handleIncomingRealMsg(m);
              }
            });
          }
        }
      } catch (err) {}
    };

    syncServerMessages();
    const interval = setInterval(syncServerMessages, 2000);

    return () => {
      bc.close();
      clearInterval(interval);
    };
  }, [user?.email, activeContactId]);

  // Sync Google Chat Spaces with Google API
  const syncContactsAndSpaces = async (token: string, currentUserProfile: UserProfile) => {
    try {
      setLoadingContacts(true);

      // Fetch Google Chat Spaces (Direct Messages and Rooms/Spaces)
      let fetchedSpacesList: Contact[] = [];
      try {
        const targetUrl = 'https://chat.googleapis.com/v1/spaces';
        const spacesRes = await fetch(`/api/google-proxy?url=${encodeURIComponent(targetUrl)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (spacesRes.ok && spacesRes.headers.get('content-type')?.includes('application/json')) {
          const spacesData = await spacesRes.json();
          const rawSpaces = spacesData.spaces || [];
          
          for (const space of rawSpaces) {
            const isDM = space.spaceType === 'DIRECT_MESSAGE' || space.spaceType === 'DM';
            let name = space.displayName;
            let avatar = '';
            let email: string | undefined = undefined;

            if (isDM && !name) {
              // Fetch memberships to identify the participant's name
              try {
                const memberUrl = `https://chat.googleapis.com/v1/${space.name}/memberships`;
                const memberRes = await fetch(`/api/google-proxy?url=${encodeURIComponent(memberUrl)}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (memberRes.ok && memberRes.headers.get('content-type')?.includes('application/json')) {
                  const memberData = await memberRes.json();
                  const memberships = memberData.memberships || [];
                  const otherMember = memberships.find((m: any) => m.member?.email?.toLowerCase() !== currentUserProfile.email.toLowerCase());
                  if (otherMember && otherMember.member) {
                    name = otherMember.member.displayName || 'Foydalanuvchi';
                    email = otherMember.member.email;
                    avatar = otherMember.member.avatarUrl || '';
                  }
                }
              } catch (memberError) {
                console.error('Error fetching memberships for DM:', space.name, memberError);
              }
            }

            if (!name) {
              name = isDM ? 'Shaxsiy Chat' : 'Guruh Chat';
            }
            if (!avatar) {
              avatar = `https://placehold.co/100x100/${isDM ? '00a884' : '3b82f6'}/fff?text=${encodeURIComponent(name[0])}`;
            }

            fetchedSpacesList.push({
              id: space.name, // e.g. "spaces/XXXX"
              name,
              email,
              avatar,
              unreadCount: 0,
              isOnline: true,
              type: isDM ? 'contact' as const : 'space' as const,
              spaceType: space.spaceType || 'ROOM',
              memberCount: isDM ? 2 : 6,
              lastMessage: isDM ? 'Suhbatga ulandingiz' : 'Guruh muloqotiga ulandingiz',
              lastMessageTime: 'Hozir'
            });
          }
        }
      } catch (spacesError) {
        console.error('Error fetching Google Chat Spaces:', spacesError);
      }

      const localDeletedRaw = localStorage.getItem('gchat_deleted_item_ids');
      const localDeletedIds: string[] = localDeletedRaw ? JSON.parse(localDeletedRaw) : [];

      const mockIdsToPurge = ['ai-assistant', 'sherzod-dev', 'umida-manager', 'space-ai', 'space-general', 'space-dev', 'space-marketing'];
      const totalList = fetchedSpacesList.filter(c => !localDeletedIds.includes(c.id) && !mockIdsToPurge.includes(c.id));
      setContacts(totalList);

    } catch (err) {
      console.error('Synchronization failed:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Fetch real Google Chat messages and space details (like member count) when a real space is selected
  useEffect(() => {
    if (!activeContactId || !user?.accessToken) return;
    
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact || !activeContact.id.startsWith('spaces/')) return;

    const fetchSpaceData = async () => {
      // 1. Fetch Messages
      try {
        const targetUrl = `https://chat.googleapis.com/v1/${activeContact.id}/messages?pageSize=50`;
        const messagesRes = await fetch(`/api/google-proxy?url=${encodeURIComponent(targetUrl)}`, {
          headers: { 'Authorization': `Bearer ${user.accessToken}` }
        });

        if (messagesRes.ok && messagesRes.headers.get('content-type')?.includes('application/json')) {
          const data = await messagesRes.json();
          const googleMessages = data.messages || [];

          const mappedMessages: Message[] = googleMessages.map((msg: any) => {
            const isMe = msg.sender?.email?.toLowerCase() === user.email.toLowerCase();
            const createTime = new Date(msg.createTime);
            const timestamp = createTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            
            return {
              id: msg.name,
              text: msg.text || '',
              timestamp,
              sender: isMe ? 'user' as const : 'contact' as const,
              status: 'read' as const,
              senderName: msg.sender?.displayName || "Guruh A'zosi"
            };
          }).reverse();

          setMessages(prev => ({
            ...prev,
            [activeContact.id]: mappedMessages
          }));
        }
      } catch (err) {
        console.error('Failed to fetch real Google Chat messages:', err);
      }

      // 2. Fetch Memberships to update memberCount
      try {
        const targetUrl = `https://chat.googleapis.com/v1/${activeContact.id}/memberships`;
        const membershipsRes = await fetch(`/api/google-proxy?url=${encodeURIComponent(targetUrl)}`, {
          headers: { 'Authorization': `Bearer ${user.accessToken}` }
        });

        if (membershipsRes.ok && membershipsRes.headers.get('content-type')?.includes('application/json')) {
          const data = await membershipsRes.json();
          const memberships = data.memberships || [];
          const count = memberships.length;

          setContacts(prev =>
            prev.map(c =>
              c.id === activeContact.id
                ? { ...c, memberCount: count }
                : c
            )
          );
        }
      } catch (err) {
        console.error('Failed to fetch real Google Chat memberships:', err);
      }
    };

    fetchSpaceData();
  }, [activeContactId, user?.accessToken]);

  // Poll for new Google Chat messages when a real space is active
  useEffect(() => {
    if (!activeContactId || !user?.accessToken) return;
    
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!activeContact || !activeContact.id.startsWith('spaces/')) return;

    const interval = setInterval(async () => {
      try {
        const targetUrl = `https://chat.googleapis.com/v1/${activeContact.id}/messages?pageSize=50`;
        const messagesRes = await fetch(`/api/google-proxy?url=${encodeURIComponent(targetUrl)}`, {
          headers: { 'Authorization': `Bearer ${user.accessToken}` }
        });

        if (messagesRes.ok && messagesRes.headers.get('content-type')?.includes('application/json')) {
          const data = await messagesRes.json();
          const googleMessages = data.messages || [];

          const mappedMessages: Message[] = googleMessages.map((msg: any) => {
            const isMe = msg.sender?.email?.toLowerCase() === user.email.toLowerCase();
            const createTime = new Date(msg.createTime);
            const timestamp = createTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            
            return {
              id: msg.name,
              text: msg.text || '',
              timestamp,
              sender: isMe ? 'user' as const : 'contact' as const,
              status: 'read' as const,
              senderName: msg.sender?.displayName || "Guruh A'zosi"
            };
          }).reverse();

          setMessages(prev => {
            const currentThread = prev[activeContact.id] || [];
            if (currentThread.length !== mappedMessages.length || JSON.stringify(currentThread) !== JSON.stringify(mappedMessages)) {
              return {
                ...prev,
                [activeContact.id]: mappedMessages
              };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to poll Google Chat messages:', err);
      }
    }, 8000); // Poll every 8 seconds

    return () => clearInterval(interval);
  }, [activeContactId, user?.accessToken, contacts]);

  // Trigger Google Login using robust popup signIn
  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const result = await googleSignIn();
      if (result) {
        const loggedInUser: UserProfile = {
          name: result.user.displayName || 'Foydalanuvchi',
          email: result.user.email || '',
          avatar: result.user.photoURL || '',
          accessToken: result.accessToken
        };
        setUser(loggedInUser);
        localStorage.setItem('gchat_user', JSON.stringify(loggedInUser));
        await syncContactsAndSpaces(result.accessToken, loggedInUser);
      }
    } catch (err: any) {
      console.error('Google login failed:', err);
      // Seamless automatic fallback for Vercel or external domains without Firebase Console setup
      const userEmail = prompt(
        "💡 Vercel domeningiz uchun parolsiz tezkor kirish:\n\nGoogle pochtangizni yoki ismingizni kiriting:",
        "user@gmail.com"
      );
      if (userEmail && userEmail.trim()) {
        const cleanEmail = userEmail.includes('@') ? userEmail.trim().toLowerCase() : `${userEmail.trim().toLowerCase()}@gmail.com`;
        const namePart = cleanEmail.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const fallbackUser: UserProfile = {
          name: formattedName,
          email: cleanEmail,
          avatar: `https://placehold.co/100x100/1a73e8/fff?text=${encodeURIComponent(formattedName[0])}`
        };
        setUser(fallbackUser);
        localStorage.setItem('gchat_user', JSON.stringify(fallbackUser));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Manual Sign In
  const handleManualSignIn = (userProfile: UserProfile) => {
    setUser(userProfile);
    localStorage.setItem('gchat_user', JSON.stringify(userProfile));
  };

  // Sign out user
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setContacts([]);
      setMessages({});
      setActiveContactId(null);
      setShowSettings(false);
      localStorage.removeItem('gchat_user');
      sessionStorage.removeItem('gchat_access_token');
    }
  };

  // Add custom contact manually
  const handleAddCustomContact = (name: string, email: string) => {
    const newContact: Contact = {
      id: `custom-${Date.now()}`,
      name,
      email: email || undefined,
      avatar: `https://placehold.co/100x100/00a884/fff?text=${encodeURIComponent(name[0])}`,
      unreadCount: 0,
      isOnline: true,
      type: 'contact'
    };

    setContacts((prev) => [newContact, ...prev]);

    if (user?.email) {
      fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, contact: newContact })
      }).catch(() => {});
    }
  };

  // Add custom space manually
  const handleAddCustomSpace = (name: string, description?: string, memberIds?: string[]) => {
    const newSpace: Contact = {
      id: `custom-space-${Date.now()}`,
      name,
      avatar: `https://placehold.co/100x100/3b82f6/fff?text=${encodeURIComponent(name[0])}`,
      unreadCount: 0,
      isOnline: true,
      type: 'space',
      spaceType: 'ROOM',
      memberCount: (memberIds?.length || 0) + 1,
      memberIds: memberIds || [],
      description: description || "Guruh muloqoti boshlandi",
      lastMessage: description || "Guruh muloqoti boshlandi",
      lastMessageTime: 'Kecha'
    };

    setContacts((prev) => [newSpace, ...prev]);

    if (user?.email) {
      fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, contact: newSpace })
      }).catch(() => {});
    }
  };

  // Delete contact or space persistently
  const handleDeleteContact = (id: string) => {
    setDeletedItemIds(prev => [...prev, id]);
    setContacts(prev => prev.filter(c => c.id !== id));
    if (activeContactId === id) {
      setActiveContactId(null);
    }

    if (user?.email) {
      fetch('/api/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, contactId: id })
      }).catch(() => {});
    }
  };

  // Update a contact/space (e.g., name, description, memberIds)
  const handleUpdateContact = (updated: Contact) => {
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  // Send message to Google Chat API or save locally in Google Chat format
  const handleSendMessage = async (text: string) => {
    if (!activeContactId) return;

    const timestamp = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      text,
      timestamp,
      sender: 'user',
      status: 'sent'
    };

    // Update state with user message
    const currentThread = messages[activeContactId] || [];
    const updatedThread = [...currentThread, userMsg];

    setMessages((prev) => ({
      ...prev,
      [activeContactId]: updatedThread,
    }));

    const activeContact = contacts.find((c) => c.id === activeContactId);
    if (!activeContact) return;

    // Update active contact status in sidebar
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContactId
          ? { ...c, lastMessage: text, lastMessageTime: timestamp, isTyping: false }
          : c
      )
    );

    // Simulate "Delivered" state quickly (double gray ticks)
    setTimeout(() => {
      setMessages((prev) => {
        const thread = prev[activeContactId] || [];
        return {
          ...prev,
          [activeContactId]: thread.map((m) =>
            m.id === userMsg.id ? { ...m, status: 'delivered' as const } : m
          ),
        };
      });

      if (activeContact.isOnline) {
        setTimeout(() => {
          setMessages((prev) => {
            const thread = prev[activeContactId] || [];
            return {
              ...prev,
              [activeContactId]: thread.map((m) =>
                m.id === userMsg.id ? { ...m, status: 'read' as const } : m
              ),
            };
          });
        }, 1200);
      }
    }, 600);

    // Check if it's a real Google Chat Space or DM
    const isRealGoogleSpace = activeContact.id.startsWith('spaces/');

    if (user?.email) {
      fetch('/api/messages/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          contactId: activeContactId,
          recipientEmail: activeContact.email || activeContact.id,
          messages: updatedThread
        })
      }).catch(() => {});
    }

    if (isRealGoogleSpace && user?.accessToken) {
      // Post to real Google Chat API!
      try {
        const targetUrl = `https://chat.googleapis.com/v1/${activeContact.id}/messages`;
        const response = await fetch(`/api/google-proxy?url=${encodeURIComponent(targetUrl)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        });

        if (response.ok) {
          setMessages((prev) => {
            const thread = prev[activeContactId] || [];
            return {
              ...prev,
              [activeContactId]: thread.map((m) =>
                m.id === userMsg.id ? { ...m, status: 'read' as const } : m
              ),
            };
          });
        }
      } catch (err) {
        console.error('Failed to post message to real Google Chat space:', err);
      }
    } else if (!isRealGoogleSpace && user?.email) {
      // Real Direct Message to another account (e.g. user2@gmail.com)
      const recipientEmail = (activeContact.email || activeContact.id).toLowerCase();
      const payload = {
        id: userMsg.id,
        senderEmail: user.email.toLowerCase(),
        senderName: user.name,
        senderAvatar: user.avatar,
        recipientEmail,
        text,
        timestamp
      };

      // 1. Post message to server endpoint for persistence across devices/sessions
      fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch((e) => console.error('Error posting message to server:', e));

      // 2. Broadcast via BroadcastChannel for instant local multi-tab delivery
      try {
        const bc = new BroadcastChannel('gchat_realtime_sync');
        bc.postMessage({ type: 'REAL_MSG', payload });
        bc.close();
      } catch (e) {
        console.error('BroadcastChannel broadcast error:', e);
      }
    }
  };

  const handleClearHistory = () => {
    setMessages({});
    setContacts([...FALLBACK_CONTACTS, ...FALLBACK_SPACES]);
    localStorage.removeItem('gchat_messages');
    localStorage.removeItem('gchat_contacts');
    setActiveContactId(null);
  };

  const activeContact = contacts.find((c) => c.id === activeContactId) || null;
  const activeMessages = activeContactId ? messages[activeContactId] || [] : [];

  let totalMessagesCount = 0;
  for (const key of Object.keys(messages)) {
    const list = messages[key];
    if (Array.isArray(list)) {
      totalMessagesCount += list.length;
    }
  }

  if (!user) {
    return (
      <div id="app-container" className="w-screen h-screen overflow-hidden relative">
        <LandingPage
          onGoogleSignIn={handleGoogleLogin}
          onOpenAuthModal={() => setShowAuthModal(true)}
          isLoggingIn={isLoggingIn}
        />

        {/* Auth Modal (Google OAuth & Manual Email/Name Input) */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onGoogleSignIn={handleGoogleLogin}
          onManualSignIn={handleManualSignIn}
          isLoggingIn={isLoggingIn}
        />

        {/* Google Authentication Loading Overlay */}
        {isLoggingIn && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-xs flex flex-col items-center gap-4 border border-gray-100">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 border-4 border-[#f15c8d] border-t-transparent rounded-full animate-spin"></div>
                <Sparkles size={20} className="text-[#f15c8d] absolute animate-pulse" />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm">Tizimga ulanish...</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Hisobingiz orqali xavfsiz ulanish oynasi ochilmoqda...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="app-container" className="flex items-center justify-center h-screen h-[100dvh] w-screen bg-[#f0f4f9] p-0 md:p-3 select-none relative overflow-hidden">
      {/* Google Workspace clean background pattern */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#eef2f9] via-[#f3f7fd] to-[#f8fafd] -z-20" />

      <div className="w-full h-full h-[100dvh] md:h-[96vh] max-w-7xl bg-white shadow-2xl flex overflow-hidden md:rounded-2xl relative z-10 border border-gray-200/50">
        
        {/* ======================================================== */}
        {/* GOOGLE CHAT / WORKSPACE LEFT NAVIGATION RAIL */}
        {/* ======================================================== */}
        <div className="w-[68px] bg-[#f3f6fc] border-r border-gray-200/80 flex flex-col items-center py-5 justify-between shrink-0 hidden sm:flex select-none">
          {/* Top Logo */}
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="relative group cursor-pointer" title="Nok Chat">
              {/* Nok Pear Logo */}
              <NokPearLogo size={42} showPinkBg={true} />
            </div>

            {/* Nav Items */}
            <div className="flex flex-col gap-3 w-full px-2">
              {/* Chat Tab */}
              <button
                onClick={() => setActiveTab('contacts')}
                className={`w-full py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all duration-150 cursor-pointer group relative ${
                  activeTab === 'contacts'
                    ? 'bg-[#d3e3fd] text-[#041e49] font-bold'
                    : 'text-gray-500 hover:bg-gray-200/60 hover:text-gray-800'
                }`}
                title="Shaxsiy Chatlar"
              >
                <div className={`p-1.5 rounded-full transition-colors ${activeTab === 'contacts' ? '' : 'group-hover:bg-gray-300/30'}`}>
                  <MessageSquare size={20} className={activeTab === 'contacts' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                </div>
                <span className="text-[10px] font-medium tracking-tight">Chat</span>
                {/* Unread badge for contacts */}
                {contacts.filter(c => c.type !== 'space').reduce((acc, curr) => acc + (curr.unreadCount || 0), 0) > 0 && (
                  <span className="absolute top-1.5 right-3 w-2.5 h-2.5 bg-red-500 border border-white rounded-full animate-pulse" />
                )}
              </button>

              {/* Spaces Tab */}
              <button
                onClick={() => setActiveTab('spaces')}
                className={`w-full py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all duration-150 cursor-pointer group relative ${
                  activeTab === 'spaces'
                    ? 'bg-[#d3e3fd] text-[#041e49] font-bold'
                    : 'text-gray-500 hover:bg-gray-200/60 hover:text-gray-800'
                }`}
                title="Guruhlar"
              >
                <div className={`p-1.5 rounded-full transition-colors ${activeTab === 'spaces' ? '' : 'group-hover:bg-gray-300/30'}`}>
                  <Users size={20} className={activeTab === 'spaces' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                </div>
                <span className="text-[10px] font-medium tracking-tight">Xonalar</span>
                {/* Unread badge for spaces */}
                {contacts.filter(c => c.type === 'space').reduce((acc, curr) => acc + (curr.unreadCount || 0), 0) > 0 && (
                  <span className="absolute top-1.5 right-3 w-2.5 h-2.5 bg-blue-600 border border-white rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col items-center gap-4 w-full px-2">
            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200/60 hover:text-gray-800 transition-colors cursor-pointer group"
              title="Sozlamalar"
            >
              <Settings size={20} className="group-hover:rotate-45 transition-transform duration-300" />
            </button>

            {/* User Profile Avatar / Login */}
            <div className="relative">
              {user ? (
                <img
                  src={user.avatar || `https://placehold.co/40x40/1a73e8/fff?text=${encodeURIComponent(user.name[0])}`}
                  alt={user.name}
                  onClick={() => setShowSettings(true)}
                  className="w-9 h-9 rounded-full border border-gray-300 hover:border-blue-500 object-cover cursor-pointer shadow-xs"
                  title={`${user.name} (${user.email})`}
                />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-sm"
                  title="Kirish"
                >
                  G
                </button>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white rounded-full" />
            </div>
          </div>
        </div>

        {/* Sidebar Component */}
        <div className={`${activeContactId ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full shrink-0`}>
          <Sidebar
            user={user}
            contacts={contacts}
            activeContactId={activeContactId}
            onSelectContact={setActiveContactId}
            onOpenSettings={() => setShowSettings(true)}
            onLogout={handleLogout}
            onLoginClick={() => setShowAuthModal(true)}
            loadingContacts={loadingContacts}
            onAddCustomContact={handleAddCustomContact}
            onAddCustomSpace={handleAddCustomSpace}
            onDeleteContact={handleDeleteContact}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Main Content Area: Chat Window */}
        <div className={`flex-1 flex flex-col h-full min-w-0 relative ${activeContactId ? 'flex' : 'hidden md:flex'}`}>
          <ChatWindow
            contact={activeContact}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            allContacts={contacts}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            onBack={() => setActiveContactId(null)}
          />
        </div>

        {/* Auth Modal (Google OAuth & Manual Email/Name Input) */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onGoogleSignIn={handleGoogleLogin}
          onManualSignIn={handleManualSignIn}
          isLoggingIn={isLoggingIn}
        />

        {/* Google Authentication Loading Overlay */}
        {isLoggingIn && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-xs flex flex-col items-center gap-4 border border-gray-100">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <Sparkles size={20} className="text-blue-500 absolute animate-pulse" />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm">Tizimga ulanish...</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Hisobingiz orqali xavfsiz ulanish oynasi ochilmoqda. Kirganingizdan so'ng, kontaktlaringiz va guruhlaringiz avtomatik tarzda sinxronlanadi.
              </p>
            </div>
          </div>
        )}

        {/* Settings Dialog Modal */}
        {showSettings && (
          <SettingsDialog
            user={user}
            onClearHistory={handleClearHistory}
            onClose={() => setShowSettings(false)}
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
}
