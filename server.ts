import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined. Please set it in the Settings secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. API: Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Memory store for real multi-account messages
interface AppServerMessage {
  id: string;
  senderEmail: string;
  senderName: string;
  senderAvatar: string;
  recipientEmail: string;
  text: string;
  timestamp: string;
}

const globalAppMessages: AppServerMessage[] = [];
const globalAppUsers = new Map<string, { name: string; email: string; avatar: string }>();

// Memory store for user registration and verification
interface RegisteredUserAccount {
  name: string;
  email: string;
  password: string;
  avatar: string;
  registeredAt: string;
}

const registeredAccounts = new Map<string, RegisteredUserAccount>();
const verificationCodes = new Map<string, { code: string; expires: number }>();

// 1. Send verification code to email
app.post('/api/auth/send-code', (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Elektron pochta manzili kiritilmadi' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(cleanEmail, {
    code,
    expires: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  console.log(`[AUTH] Verification code generated for ${cleanEmail}: ${code}`);

  res.json({
    ok: true,
    message: `Tasdiqlash kodi ${cleanEmail} pochtangizga yuborildi`,
    code // Return code for display in UI banner
  });
});

// 2. Register new user with verification code & password
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, code } = req.body;
  
  if (!name || !email || !password || !code) {
    return res.status(400).json({ error: 'Barcha maydonlarni to\'ldiring' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const storedCodeData = verificationCodes.get(cleanEmail);

  if (!storedCodeData || storedCodeData.expires < Date.now()) {
    return res.status(400).json({ error: "Tasdiqlash kodi muddati o'tgan yoki kodi so'ralmagan" });
  }

  if (storedCodeData.code !== code.trim()) {
    return res.status(400).json({ error: "Tasdiqlash kodi noto'g'ri" });
  }

  // Verification succeeded!
  verificationCodes.delete(cleanEmail);

  const firstChar = name.trim().charAt(0).toUpperCase() || 'U';
  const bgColors = ['1a73e8', '0f9d58', 'ea4335', 'fabc05', '9c27b0'];
  const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
  const avatar = `https://placehold.co/120x120/${randomBg}/fff?text=${encodeURIComponent(firstChar)}`;

  const newAccount: RegisteredUserAccount = {
    name: name.trim(),
    email: cleanEmail,
    password: password.trim(),
    avatar,
    registeredAt: new Date().toISOString()
  };

  registeredAccounts.set(cleanEmail, newAccount);
  globalAppUsers.set(cleanEmail, { name: newAccount.name, email: cleanEmail, avatar });

  res.json({
    ok: true,
    message: 'Ro\'yxatdan muvaffaqiyatli o\'tdingiz!',
    user: {
      name: newAccount.name,
      email: newAccount.email,
      avatar: newAccount.avatar
    }
  });
});

// 3. Password login for registered users
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Elektron pochta va parolni kiriting' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const account = registeredAccounts.get(cleanEmail);

  if (!account) {
    return res.status(404).json({ error: "Bunday elektron pochta manziliga ega hisob topilmadi. Iltimos, avval Ro'yxatdan o'ting." });
  }

  if (account.password !== password.trim()) {
    return res.status(401).json({ error: "Kiritilgan parol noto'g'ri. Qayta urinib ko'ring." });
  }

  globalAppUsers.set(cleanEmail, { name: account.name, email: cleanEmail, avatar: account.avatar });

  res.json({
    ok: true,
    message: 'Tizimga muvaffaqiyatli kirdingiz!',
    user: {
      name: account.name,
      email: account.email,
      avatar: account.avatar
    }
  });
});

// Server-side User Contacts store
interface ServerContact {
  id: string;
  userEmail: string;
  name: string;
  email?: string;
  avatar?: string;
  type: 'contact' | 'space';
  spaceType?: 'DIRECT_MESSAGE' | 'ROOM' | 'GROUP_CHAT';
  description?: string;
  memberCount?: number;
}

const globalUserContacts: ServerContact[] = [];

// Get contacts for user
app.get('/api/contacts', (req, res) => {
  const email = (req.query.email as string)?.toLowerCase();
  if (!email) return res.json({ contacts: [] });
  const userContacts = globalUserContacts.filter(c => c.userEmail === email);
  res.json({ contacts: userContacts });
});

// Add contact for user
app.post('/api/contacts', (req, res) => {
  const { userEmail, contact } = req.body;
  if (!userEmail || !contact) return res.status(400).json({ error: 'Missing required parameters' });
  const cleanEmail = userEmail.toLowerCase();
  const newContact: ServerContact = {
    ...contact,
    userEmail: cleanEmail
  };
  globalUserContacts.push(newContact);
  res.json({ ok: true, contact: newContact });
});

// Delete contact for user
app.delete('/api/contacts', (req, res) => {
  const { userEmail, contactId } = req.body;
  if (!userEmail || !contactId) return res.status(400).json({ error: 'Missing required parameters' });
  const cleanEmail = userEmail.toLowerCase();
  const idx = globalUserContacts.findIndex(c => c.userEmail === cleanEmail && c.id === contactId);
  if (idx !== -1) {
    globalUserContacts.splice(idx, 1);
  }
  res.json({ ok: true });
});

// 4. Search all registered users by name or email
app.get('/api/users/search', (req, res) => {
  const query = (req.query.q as string || '').trim().toLowerCase();
  const usersList: { name: string; email: string; avatar: string }[] = [];
  const seenEmails = new Set<string>();

  globalAppUsers.forEach((u, email) => {
    if (!seenEmails.has(email)) {
      seenEmails.add(email);
      usersList.push(u);
    }
  });

  registeredAccounts.forEach((u, email) => {
    if (!seenEmails.has(email)) {
      seenEmails.add(email);
      usersList.push({ name: u.name, email: u.email, avatar: u.avatar });
    }
  });

  if (!query) {
    return res.json({ users: usersList });
  }

  const filtered = usersList.filter(u =>
    u.name.toLowerCase().includes(query) ||
    u.email.toLowerCase().includes(query)
  );

  res.json({ users: filtered });
});

// Memory store for user thread messages
interface StoredThreadMessage {
  id: string;
  text: string;
  timestamp: string;
  sender: 'user' | 'contact';
  status?: 'sent' | 'delivered' | 'read';
  senderName?: string;
  senderAvatar?: string;
}

// userEmail (lowercase) -> { [contactId: string]: StoredThreadMessage[] }
const globalUserThreads = new Map<string, { [contactId: string]: StoredThreadMessage[] }>();

// Sync/Save full thread for a user
app.post('/api/messages/sync', (req, res) => {
  const { userEmail, contactId, recipientEmail, messages } = req.body;
  if (!userEmail || !contactId || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const cleanUserEmail = userEmail.toLowerCase();
  
  if (!globalUserThreads.has(cleanUserEmail)) {
    globalUserThreads.set(cleanUserEmail, {});
  }

  const userThreads = globalUserThreads.get(cleanUserEmail)!;
  userThreads[contactId] = messages;

  // If this is a DM to another user email, also sync to recipient's thread
  if (recipientEmail && typeof recipientEmail === 'string' && recipientEmail.includes('@')) {
    const cleanRecipientEmail = recipientEmail.toLowerCase();
    if (cleanRecipientEmail !== cleanUserEmail) {
      if (!globalUserThreads.has(cleanRecipientEmail)) {
        globalUserThreads.set(cleanRecipientEmail, {});
      }
      const recipientThreads = globalUserThreads.get(cleanRecipientEmail)!;
      // Invert sender for recipient
      const invertedMsgs: StoredThreadMessage[] = messages.map(m => ({
        ...m,
        sender: m.sender === 'user' ? 'contact' : 'user'
      }));
      recipientThreads[cleanUserEmail] = invertedMsgs;
    }
  }

  res.json({ ok: true });
});

// Send message between 2 real accounts
app.post('/api/messages/send', (req, res) => {
  const { senderEmail, senderName, senderAvatar, recipientEmail, contactId, text, id, timestamp } = req.body;
  if (!senderEmail || !recipientEmail || !text) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const cleanSender = senderEmail.toLowerCase();
  const cleanRecipient = recipientEmail.toLowerCase();
  const timeStr = timestamp || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  const msgId = id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const msg: AppServerMessage = {
    id: msgId,
    senderEmail: cleanSender,
    senderName: senderName || cleanSender.split('@')[0],
    senderAvatar: senderAvatar || `https://placehold.co/100x100/1a73e8/fff?text=${encodeURIComponent((senderName || cleanSender)[0])}`,
    recipientEmail: cleanRecipient,
    text,
    timestamp: timeStr
  };

  globalAppMessages.push(msg);

  // Auto update user threads for both sender and recipient
  const targetContactId = contactId || cleanRecipient;

  // Update sender thread
  if (!globalUserThreads.has(cleanSender)) globalUserThreads.set(cleanSender, {});
  const senderThreads = globalUserThreads.get(cleanSender)!;
  if (!senderThreads[targetContactId]) senderThreads[targetContactId] = [];
  if (!senderThreads[targetContactId].some(m => m.id === msgId)) {
    senderThreads[targetContactId].push({
      id: msgId,
      text,
      timestamp: timeStr,
      sender: 'user',
      status: 'read'
    });
  }

  // Update recipient thread
  if (!globalUserThreads.has(cleanRecipient)) globalUserThreads.set(cleanRecipient, {});
  const recipientThreads = globalUserThreads.get(cleanRecipient)!;
  if (!recipientThreads[cleanSender]) recipientThreads[cleanSender] = [];
  if (!recipientThreads[cleanSender].some(m => m.id === msgId)) {
    recipientThreads[cleanSender].push({
      id: msgId,
      text,
      timestamp: timeStr,
      sender: 'contact',
      status: 'read',
      senderName: senderName || cleanSender.split('@')[0],
      senderAvatar
    });
  }

  res.json({ ok: true, message: msg });
});

// Get all messages for a specific account email
app.get('/api/messages', (req, res) => {
  const email = (req.query.email as string)?.toLowerCase();
  if (!email) {
    return res.json({ messages: [], threads: {} });
  }

  const userMsgs = globalAppMessages.filter(
    m => m.senderEmail === email || m.recipientEmail === email
  );

  const userThreads = globalUserThreads.get(email) || {};

  res.json({ messages: userMsgs, threads: userThreads });
});

// 2. API: Simulated Chat via Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const { contactName, messages } = req.body;

    if (!contactName || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing contactName or messages array' });
    }

    const ai = getGeminiClient();

    // Prepare custom system instruction based on the contact name
    const systemInstruction = `You are playing the role of "${contactName}". You are a contact on Google Chat (styled in a premium WhatsApp Web design).
The user is talking to you in a chat interface. You must reply naturally, authentically, and in the SAME language they speak to you (which is likely Uzbek, e.g., "Salom, nima gaplar?", but match their language perfectly).
Keep your response short, warm, conversational, and friendly, just like a standard instant message or mobile chat.
Do NOT use markdown headers, bold bullet lists, or long explanations unless specifically asked.
Avoid any robotic, assistant-like preambles (e.g. "Sizga qanday yordam bera olaman?" or "Inson sifatida...").
Just reply as if you are a real person named "${contactName}" who is a friend, colleague, or acquaintance of the user.
Be warm, casual, and responsive. Use emojis (like 😊, 👍, ☕, 😂) occasionally to feel like a real messaging app experience.`;

    // Filter and combine consecutive messages from the same sender to satisfy Gemini's strict alternating roles
    const cleanedHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    
    for (const msg of messages) {
      const role = msg.sender === 'user' ? 'user' : 'model';
      const text = msg.text || '';
      
      if (cleanedHistory.length > 0 && cleanedHistory[cleanedHistory.length - 1].role === role) {
        cleanedHistory[cleanedHistory.length - 1].parts[0].text += '\n' + text;
      } else {
        cleanedHistory.push({
          role,
          parts: [{ text }],
        });
      }
    }

    // Gemini expects the first message to be from the 'user'
    if (cleanedHistory.length > 0 && cleanedHistory[0].role === 'model') {
      cleanedHistory.shift();
    }

    if (cleanedHistory.length === 0) {
      return res.status(400).json({ error: 'No valid user message found' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: cleanedHistory,
      config: {
        systemInstruction,
        temperature: 0.9,
      },
    });

    const replyText = response.text || "Uzr, aloqa bir oz xiralashdi. Qaytadan urinib ko'ra olasizmi? 😊";
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Gemini Chat error:', error);
    res.status(500).json({ error: error.message || 'Gemini error occurred' });
  }
});

// 2.2. API: Google REST API Proxy to bypass browser CORS constraints
app.all('/api/google-proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing target url parameter' });
    }

    // Validate hostname to prevent general SSRF
    const urlObj = new URL(targetUrl);
    if (urlObj.hostname !== 'chat.googleapis.com' && urlObj.hostname !== 'people.googleapis.com') {
      return res.status(400).json({ error: 'Only Google Chat and People APIs are allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const headers: Record<string, string> = {
      'Authorization': authHeader,
    };
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const apiRes = await fetch(targetUrl, fetchOptions);
    const contentType = apiRes.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await apiRes.json();
      res.status(apiRes.status).json(data);
    } else {
      const text = await apiRes.text();
      res.status(apiRes.status).send(text);
    }
  } catch (error: any) {
    console.error('Google Proxy Error:', error);
    res.status(500).json({ error: error.message || 'Error proxying request' });
  }
});

// 3. OAuth Callback handler (Popup)
app.get(['/auth/callback', '/auth/callback/'], (req, res) => {
  // Since this will be opened as a popup, we render a small HTML page that passes
  // the hash token or query parameters back to the parent window and closes itself.
  res.send(`
    <!DOCTYPE html>
    <html lang="uz">
    <head>
      <meta charset="UTF-8">
      <title>Google Hisobi orqali Tizimga Kirish</title>
      <style>
        body {
          font-family: 'Segoe UI', system-ui, sans-serif;
          background-color: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          color: #1f2937;
        }
        .container {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 400px;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #00a884;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 16px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <h3>Tizimga kirilmoqda...</h3>
        <p style="font-size: 14px; color: #6b7280;">Ushbu oyna avtomatik tarzda yopiladi.</p>
      </div>
      <script>
        // Check for tokens in hash parameters (implicit flow)
        const hash = window.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const error = params.get('error');
          if (accessToken) {
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', accessToken }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          } else if (error) {
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error }, '*');
              window.close();
            } else {
              document.body.innerHTML = '<h3>Xatolik yuz berdi: ' + error + '</h3>';
            }
          }
        } else {
          // Check search query parameters (for code flow or error callback)
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          const error = urlParams.get('error');
          if (code) {
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_CODE_SUCCESS', code }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          } else if (error) {
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error }, '*');
              window.close();
            } else {
              document.body.innerHTML = '<h3>Xatolik yuz berdi: ' + error + '</h3>';
            }
          } else {
            // No credentials found, redirect or close
            setTimeout(() => {
              if (window.opener) {
                window.close();
              } else {
                window.location.href = '/';
              }
            }, 3000);
          }
        }
      </script>
    </body>
    </html>
  `);
});

// 4. Vite Dev Server & Production serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} with environment ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
