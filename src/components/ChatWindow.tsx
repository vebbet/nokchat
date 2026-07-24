import React, { useState, useRef, useEffect } from 'react';
import { Contact, Message } from '../types';
import { Smile, Send, Search, MoreVertical, ShieldCheck, CheckCheck, Check, Paperclip, Paintbrush, Users, LogOut, Trash2, ArrowLeft, ArrowDown } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { motion, AnimatePresence } from 'motion/react';

interface ChatWindowProps {
  contact: Contact | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  allContacts?: Contact[];
  onUpdateContact?: (updatedContact: Contact) => void;
  onDeleteContact?: (id: string) => void;
  onBack?: () => void;
}

function getFriendlyDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Bugun';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Kecha';
    } else {
      return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch (e) {
    return 'Yozishmalar';
  }
}

const WALLPAPERS = [
  { id: 'google-light', name: 'Standard (Yorug\')', class: 'bg-[#f0f4f9]' },
  { id: 'google-soft', name: 'Yumshoq Moviy', class: 'bg-[#eef2f7]' },
  { id: 'google-indigo', name: 'Silliq Indigo', class: 'bg-[#f4f5f9]' },
  { id: 'dark-cosmic', name: 'Monomoda To\'q', class: 'bg-[#111214] text-white' }
];

export default function ChatWindow({
  contact,
  messages,
  onSendMessage,
  allContacts = [],
  onUpdateContact,
  onDeleteContact,
  onBack,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeWallpaper, setActiveWallpaper] = useState('google-light');
  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);

  // Group settings panel states
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingGroupDesc, setEditingGroupDesc] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [draftMemberIds, setDraftMemberIds] = useState<string[]>([]);

  // Sync group settings form inputs with the active contact/space
  useEffect(() => {
    if (contact) {
      setEditingGroupName(contact.name);
      setEditingGroupDesc(contact.description || '');
      setDraftMemberIds(contact.memberIds || []);
      setShowGroupSettings(false);
    }
  }, [contact]);

  // Sync draft member IDs when group settings panel is opened
  useEffect(() => {
    if (showGroupSettings && contact) {
      setDraftMemberIds(contact.memberIds || []);
    }
  }, [showGroupSettings, contact]);
  
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (smooth = true) => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  };

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    setShowScrollToBottom(distanceToBottom > 120);
  };

  // Scroll to bottom on load, messages update, or contact change
  useEffect(() => {
    scrollToBottom(false);
    const timer = setTimeout(() => scrollToBottom(true), 150);
    return () => clearTimeout(timer);
  }, [messages, contact?.id, contact?.isTyping]);

  // Handle visualViewport resize on mobile (when soft keyboard opens)
  useEffect(() => {
    const handleViewportChange = () => {
      scrollToBottom(false);
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const selectedWallpaper = WALLPAPERS.find(w => w.id === activeWallpaper) || WALLPAPERS[0];
  const isDarkWallpaper = activeWallpaper === 'dark-cosmic';

  // If no contact selected, show beautiful instructions page
  if (!contact) {
    return (
      <div id="no-chat-selected" className="flex-1 bg-[#f8f9fa] flex flex-col items-center justify-center p-8 relative border-b-4 border-b-blue-600 h-full shadow-inner">
        <div className="max-w-md text-center flex flex-col items-center gap-5">
          {/* High fidelity logo resembling Google Chat */}
          <div className="relative mb-2">
            <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transition duration-300 hover:scale-105">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center border-2 border-white shadow-md">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Nok - Tezkor va Xavfsiz Muloqot</h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
            Kontaktlarni yoki guruhlarni chap tomondagi qidiruv orqali toping va suhbatni boshlang.
          </p>
          <div className="grid grid-cols-2 gap-3.5 w-full mt-2">
            <div className="p-3 bg-white border border-gray-100 rounded-xl text-left shadow-xs">
              <span className="text-xs font-bold text-blue-600 block mb-1">Shaxsiy Chatlar</span>
              <span className="text-[10px] text-gray-400">Har bir onlayn kontakt o'ziga xos tarzda siz bilan suhbatlashadi va javob beradi.</span>
            </div>
            <div className="p-3 bg-white border border-gray-100 rounded-xl text-left shadow-xs">
              <span className="text-xs font-bold text-indigo-600 block mb-1">Guruhlar</span>
              <span className="text-[10px] text-gray-400">Guruh g'oyalarini va jamoa a'zolari muloqotlarini simulyatsiya qilish mumkin.</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-6 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-2xs">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>Nok xavfsizlik va shifrlash tizimi ostida</span>
          </div>
        </div>
      </div>
    );
  }

  const isSpace = contact.type === 'space';

  return (
    <div id="chat-window" className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Chat Window Header */}
      <header className="h-16 bg-white px-3 sm:px-5 flex items-center justify-between border-b border-gray-200/60 shrink-0 z-20 shadow-2xs">
        <div className="flex items-center min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-2.5 p-2 rounded-full hover:bg-gray-100 text-gray-600 md:hidden transition cursor-pointer active:scale-95"
              title="Orqaga"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <img
            src={contact.avatar}
            alt={contact.name}
            className="rounded-full w-10 h-10 object-cover bg-gray-50 border border-gray-200/80 shadow-2xs shrink-0"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const col = isSpace ? '1a73e8' : '0b57d0';
              (e.target as HTMLImageElement).src = `https://placehold.co/40x40/${col}/fff?text=${encodeURIComponent(contact.name[0])}`;
            }}
          />
          <div className="ml-3 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 id="active-chat-name" className="font-semibold text-gray-800 text-sm truncate">{contact.name}</h3>
              {isSpace && (
                <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 border border-blue-100/30">
                  <Users size={8} /> Xona
                </span>
              )}
            </div>
            <span className="text-[11px] text-gray-500 block truncate">
              {contact.isTyping ? (
                <span className="text-blue-600 font-semibold animate-pulse">Yozmoqda...</span>
              ) : isSpace ? (
                `${(contact.memberIds?.length || 0) + 1} ta faol a'zo`
              ) : contact.isOnline ? (
                'Onlayn'
              ) : (
                'Oflayn'
              )}
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex space-x-1.5 md:space-x-2 text-gray-600 shrink-0 relative items-center">
          {isSpace && (
            <button
              title="Xona sozlamalari va a'zolari"
              onClick={() => setShowGroupSettings(!showGroupSettings)}
              className={`p-2 rounded-lg transition duration-150 cursor-pointer ${showGroupSettings ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <Users size={18} />
            </button>
          )}

          {/* Wallpaper Selection Button */}
          <button
            title="Fon rangini o'zgartirish"
            onClick={() => setShowWallpaperMenu(!showWallpaperMenu)}
            className={`p-2 hover:bg-gray-100 rounded-lg transition duration-150 cursor-pointer ${showWallpaperMenu ? 'bg-blue-50 text-blue-600' : ''}`}
          >
            <Paintbrush size={18} />
          </button>

          {showWallpaperMenu && (
            <div className="absolute right-12 top-11 bg-white border border-gray-200/80 rounded-xl shadow-xl p-2 z-50 w-44 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 px-2.5 py-1 uppercase tracking-wider block">Fon sozlamalari</span>
              {WALLPAPERS.map((paper) => (
                <button
                  key={paper.id}
                  onClick={() => {
                    setActiveWallpaper(paper.id);
                    setShowWallpaperMenu(false);
                  }}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition duration-150 cursor-pointer flex items-center justify-between ${
                    activeWallpaper === paper.id ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span>{paper.name}</span>
                  {activeWallpaper === paper.id && (
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
          )}

          <button title="Qidirish" className="p-2 hover:bg-gray-100 rounded-lg transition duration-150 cursor-pointer">
            <Search size={18} />
          </button>
          <button title="Batafsil" className="p-2 hover:bg-gray-100 rounded-lg transition duration-150 cursor-pointer">
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Main Row layout split: Chat messages/inputs on left, settings on right */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative w-full">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Message Area */}
          <div
            id="chatBox"
            ref={chatBoxRef}
            onScroll={handleChatScroll}
            className={`flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto flex flex-col gap-3 sm:gap-4 relative transition-all duration-300 ${selectedWallpaper.class}`}
          >
            {groupedMessages.map((group, groupIdx) => (
              <div key={groupIdx} className="flex flex-col gap-3 z-10">
                {/* Date Separator */}
                <div className="flex justify-center my-1">
                  <span className={`text-[10px] font-semibold px-3 py-1 rounded-full shadow-2xs uppercase tracking-wider ${
                    isDarkWallpaper ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200/70 text-gray-600'
                  }`}>
                    {group.date}
                  </span>
                </div>

                {/* Messages in Group */}
                {group.list.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.12 }}
                        className={`p-3 rounded-2xl shadow-2xs max-w-[85%] sm:max-w-[80%] md:max-w-md relative pb-1.5 ${
                          isUser
                            ? 'bg-[#c2e7ff] text-[#041e49] rounded-tr-sm'
                            : isDarkWallpaper
                              ? 'bg-zinc-800 text-zinc-100 rounded-tl-sm border border-zinc-700'
                              : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                        }`}
                      >
                        {/* Speaker name if in a multi-user space/group chat */}
                        {isSpace && !isUser && (
                          <span className="text-[10px] font-bold block mb-1 text-blue-600 tracking-wide">
                            {msg.senderName || (msg.id.includes('sg-') || msg.id.includes('sa-') || msg.id.includes('sm-') ? 'Jamoa A\'zosi' : 'Guruh A\'zosi')}
                          </span>
                        )}

                        <p className="text-xs md:text-[13px] whitespace-pre-wrap leading-relaxed pr-6 select-text">{msg.text}</p>
                        
                        <div className="flex items-center justify-end space-x-1 mt-1 -mr-1">
                          <span className={`text-[9px] block text-right ${isDarkWallpaper ? 'text-zinc-400' : 'text-gray-400'}`}>
                            {msg.timestamp}
                          </span>
                          {isUser && (
                            <span className="inline-block">
                              {msg.status === 'read' ? (
                                <CheckCheck size={13} className="text-blue-600" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck size={13} className="text-gray-400" />
                              ) : (
                                <Check size={13} className="text-gray-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Dynamic Typing Indicator */}
            {contact.isTyping && (
              <div className="flex justify-start z-10">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`px-3 py-2.5 rounded-2xl shadow-2xs flex items-center space-x-1.5 ${
                    isDarkWallpaper ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-100'
                  }`}
                >
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </motion.div>
              </div>
            )}

            <div ref={chatEndRef} className="h-2" />
          </div>

          {/* Floating Scroll-to-Bottom Button */}
          <AnimatePresence>
            {showScrollToBottom && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-18 right-4 sm:right-6 z-30 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition cursor-pointer active:scale-95 border border-white/20"
                title="Eng pastga tushish"
              >
                <ArrowDown size={18} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Chat Window Footer */}
          {contact?.hasLeft ? (
            <div className="h-14 sm:h-16 bg-red-50 text-red-600 flex items-center justify-center px-4 border-t border-gray-200 shrink-0 font-medium text-xs md:text-sm shadow-inner gap-2 relative z-20">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shrink-0"></span>
              Siz ushbu guruhni tark etgansiz. Xabar yuborib bo'lmaydi.
            </div>
          ) : (
            <footer className="bg-white flex items-center px-3 sm:px-5 py-2.5 border-t border-gray-200/50 shrink-0 relative z-20 space-x-2 sm:space-x-3">
              <button
                id="btn-emoji"
                onClick={() => {
                  setShowEmojis(!showEmojis);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition duration-150 text-gray-500 hover:text-gray-700 cursor-pointer shrink-0"
              >
                <Smile size={21} className={showEmojis ? 'text-blue-600 stroke-[2.5px]' : ''} />
              </button>

              {/* Emoji Selector Panel */}
              {showEmojis && (
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmojis(false)}
                />
              )}

              <button
                title="Fayl biriktirish"
                onClick={() => alert("Fayl biriktirish hozircha faqat vizual element hisoblanadi. 😊")}
                className="p-2 hover:bg-gray-100 rounded-lg transition duration-150 text-gray-500 hover:text-gray-700 cursor-pointer shrink-0"
              >
                <Paperclip size={19} />
              </button>

              <input
                id="msgInput"
                ref={inputRef}
                type="text"
                placeholder={isSpace ? "Xonaga xabar yuborish..." : "Xabar yozing..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={() => {
                  setShowEmojis(false);
                  setTimeout(() => scrollToBottom(false), 100);
                  setTimeout(() => scrollToBottom(true), 350);
                }}
                onKeyDown={handleKeyPress}
                className="flex-1 bg-[#f1f3f4] px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-transparent focus:border-transparent outline-none placeholder-gray-500 text-xs md:text-sm text-gray-800 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all duration-200"
              />

              <button
                id="btn-send-message"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`p-2.5 rounded-full transition cursor-pointer flex items-center justify-center shrink-0 active:scale-95 ${
                  inputText.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Send size={15} className={inputText.trim() ? 'stroke-[2.5px]' : ''} />
              </button>
            </footer>
          )}
        </div>

        {/* Group Settings Panel Drawer */}
        <AnimatePresence>
          {showGroupSettings && isSpace && (
            <motion.div
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-full md:w-[340px] h-full bg-white border-l border-gray-200 z-30 flex flex-col absolute right-0 top-0 md:relative shadow-xl shrink-0"
            >
              {/* Drawer Header */}
              <div className="h-16 bg-[#f8f9fa] px-4 border-b border-gray-200 flex items-center justify-between shrink-0">
                <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                  <Users size={16} className="text-blue-600" /> Xona sozlamalari
                </span>
                <button
                  onClick={() => setShowGroupSettings(false)}
                  className="px-2.5 py-1 text-xs bg-gray-200/70 hover:bg-gray-300 rounded-lg text-gray-600 font-medium cursor-pointer transition"
                >
                  Yopish
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                
                {/* 1. Group info manager (Name and description) */}
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Guruh ma'lumotlari</span>
                  
                  {contact.id.startsWith('custom-space-') ? (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Guruh nomi</label>
                        <input
                          type="text"
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          className="w-full bg-white px-3 py-2 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-blue-500 font-semibold text-gray-800"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Guruh tavsifi</label>
                        <textarea
                          rows={2}
                          value={editingGroupDesc}
                          onChange={(e) => setEditingGroupDesc(e.target.value)}
                          className="w-full bg-white px-3 py-2 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-blue-500 text-gray-600 resize-none"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!editingGroupName.trim()) return;
                          onUpdateContact?.({
                            ...contact,
                            name: editingGroupName.trim(),
                            description: editingGroupDesc.trim()
                          });
                          alert("Guruh ma'lumotlari muvaffaqiyatli yangilandi! 👍");
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
                      >
                        Ma'lumotlarni saqlash
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold text-gray-700 block">{contact.name}</span>
                      <span className="text-[11px] text-gray-400 block mt-1">{contact.description || 'Nok muloqot guruhi'}</span>
                      <div className="bg-blue-50 p-2.5 rounded-lg text-[10px] text-blue-700 leading-relaxed border border-blue-100 mt-2">
                        Ushbu sinxronlangan guruh nomi va tavsifini faqat xona ma'muri o'zgartira oladi.
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Members Area (Interactive checkbox list) */}
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex flex-col gap-3 min-h-[220px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Akkountdagilarni qo'shish</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                      {draftMemberIds.length + 1} kishi
                    </span>
                  </div>

                  {contact.id.startsWith('custom-space-') ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Kontaktni qidirish..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-blue-500"
                      />

                      <div className="overflow-y-auto max-h-[160px] bg-white rounded-lg border border-gray-100 p-1 flex flex-col gap-1 shadow-inner">
                        {allContacts
                          .filter(c => c.type !== 'space')
                          .filter(c => c.name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                          .map(candidate => {
                            const isMember = draftMemberIds.includes(candidate.id);
                            return (
                              <button
                                key={candidate.id}
                                type="button"
                                onClick={() => {
                                  if (isMember) {
                                    setDraftMemberIds(prev => prev.filter(id => id !== candidate.id));
                                  } else {
                                    setDraftMemberIds(prev => [...prev, candidate.id]);
                                  }
                                }}
                                className={`flex items-center justify-between p-2 rounded-md text-left transition cursor-pointer ${
                                  isMember ? 'bg-blue-50/75 border border-blue-100/50' : 'hover:bg-gray-50 border border-transparent'
                                }}`}
                              >
                                <div className="flex items-center min-w-0 gap-2">
                                  <img
                                    src={candidate.avatar}
                                    alt={candidate.name}
                                    className="w-6 h-6 rounded-full object-cover shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://placehold.co/24x24/1a73e8/fff?text=${encodeURIComponent(candidate.name[0])}`;
                                    }}
                                  />
                                  <div className="min-w-0">
                                    <span className="text-xs text-gray-700 truncate font-semibold block">{candidate.name}</span>
                                    {candidate.email && <span className="text-[9px] text-gray-400 truncate block">{candidate.email}</span>}
                                  </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  isMember ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
                                }}`}>
                                  {isMember && <span className="text-[9px] font-bold">✓</span>}
                                </div>
                              </button>
                            );
                          })}
                        
                        {allContacts.filter(c => c.type !== 'space').length === 0 && (
                          <span className="text-[11px] text-gray-400 p-2 text-center block">Sizda hali kontaktlar yo'q</span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onUpdateContact?.({
                            ...contact,
                            memberIds: draftMemberIds,
                            memberCount: draftMemberIds.length + 1
                          });
                          alert("Guruh a'zolari muvaffaqiyatli yangilandi! 👍");
                        }}
                        className="w-full mt-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs flex items-center justify-center gap-1"
                      >
                        A'zolarni saqlash
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Guruhda simulyatsiya qilingan a'zolar</span>
                      <div className="max-h-[140px] overflow-y-auto bg-white rounded-lg border border-gray-100 p-2 flex flex-col gap-2 shadow-inner">
                        {allContacts.filter(c => c.type !== 'space').slice(0, 5).map(candidate => (
                          <div key={candidate.id} className="flex items-center gap-2">
                            <img src={candidate.avatar} className="w-5 h-5 rounded-full object-cover shrink-0" />
                            <span className="text-xs text-gray-700 font-medium truncate">{candidate.name}</span>
                            <span className="text-[9px] text-green-600 ml-auto">Onlayn</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. General other settings */}
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex flex-col gap-2.5 text-xs text-gray-700">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Qo'shimcha sozlamalar</span>
                  
                  <div className="flex justify-between items-center py-0.5">
                    <span>Bildirishnomalar ovozsiz</span>
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-0 cursor-pointer h-3.5 w-3.5" />
                  </div>

                  <div className="flex justify-between items-center py-0.5">
                    <span>Aktiv rejim</span>
                    <span className="text-[10px] text-green-600 font-bold uppercase">Faol</span>
                  </div>

                  <div className="flex justify-between items-center py-0.5">
                    <span>Xabarlar shifrlanishi</span>
                    <span className="text-[10px] text-blue-500 font-bold uppercase">E2E shifrlangan</span>
                  </div>
                </div>

                {/* 4. Group Actions (Tark etish va hamma uchun o'chirish) */}
                <div className="bg-red-50/40 p-3.5 rounded-xl border border-red-100/50 flex flex-col gap-2.5 text-xs text-gray-700 mt-1">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">Xavfli hudud / Guruh amallari</span>

                  {!contact.hasLeft ? (
                    <button
                      onClick={() => {
                        if (window.confirm("Haqiqatan ham ushbu guruhni tark etmoqchimisiz?")) {
                          onUpdateContact?.({
                            ...contact,
                            hasLeft: true,
                            isOnline: false
                          });
                          setShowGroupSettings(false);
                          alert("Siz guruhni muvaffaqiyatli tark etdingiz. 🚪");
                        }
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <LogOut size={13} /> Guruhni tark etish
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (window.confirm("Guruhga qayta a'zo bo'lmoqchimisiz?")) {
                          onUpdateContact?.({
                            ...contact,
                            hasLeft: false,
                            isOnline: true
                          });
                          alert("Siz guruhga qayta qo'shildingiz! 🎉");
                        }
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      Guruhga qayta qo'shilish
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (window.confirm("Haqiqatan ham ushbu guruhni hamma uchun butunlay o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.")) {
                        onDeleteContact?.(contact.id);
                        setShowGroupSettings(false);
                        alert("Guruh muvaffaqiyatli o'chirildi. 🗑️");
                      }
                    }}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} /> Hamma uchun o'chirish
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
