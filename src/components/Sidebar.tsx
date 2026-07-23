import React, { useState, useEffect } from 'react';
import { Contact, UserProfile } from '../types';
import { Search, MessageSquare, UserPlus, Users, MessageSquareCode, Trash2, Compass, Settings, LogOut, Sparkles, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NokPearLogo from './NokPearLogo';

interface SidebarProps {
  user: UserProfile | null;
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onLoginClick: () => void;
  loadingContacts: boolean;
  onAddCustomContact: (name: string, email: string) => void;
  onAddCustomSpace: (name: string, description?: string, memberIds?: string[]) => void;
  onDeleteContact: (id: string) => void;
  activeTab: 'contacts' | 'spaces';
  onTabChange: (tab: 'contacts' | 'spaces') => void;
}

export default function Sidebar({
  user,
  contacts,
  activeContactId,
  onSelectContact,
  onOpenSettings,
  onLogout,
  onLoginClick,
  loadingContacts,
  onAddCustomContact,
  onAddCustomSpace,
  onDeleteContact,
  activeTab,
  onTabChange,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  const [showAddSpace, setShowAddSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDescription, setNewSpaceDescription] = useState('');
  const [selectedMemberIdsForNewSpace, setSelectedMemberIdsForNewSpace] = useState<string[]>([]);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Live search registered users state
  const [registeredUserResults, setRegisteredUserResults] = useState<{ name: string; email: string; avatar: string }[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim() || activeTab === 'spaces') {
      setRegisteredUserResults([]);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    setIsSearchingServer(true);

    fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        const users: { name: string; email: string; avatar: string }[] = data.users || [];

        // Also check local storage accounts
        try {
          const localAccountsStr = localStorage.getItem('nok_accounts');
          if (localAccountsStr) {
            const localObj = JSON.parse(localAccountsStr);
            Object.values(localObj).forEach((acc: any) => {
              if (acc.email && !users.some(u => u.email.toLowerCase() === acc.email.toLowerCase())) {
                if (acc.name?.toLowerCase().includes(query) || acc.email?.toLowerCase().includes(query)) {
                  users.push({ name: acc.name, email: acc.email, avatar: acc.avatar });
                }
              }
            });
          }
        } catch (e) {}

        // Filter out logged in user & existing contacts
        const existingEmails = new Set(contacts.map(c => c.email?.toLowerCase()).filter(Boolean));
        if (user?.email) existingEmails.add(user.email.toLowerCase());

        const filteredUsers = users.filter(u => !existingEmails.has(u.email.toLowerCase()));
        setRegisteredUserResults(filteredUsers);
      })
      .catch(() => {})
      .finally(() => setIsSearchingServer(false));
  }, [searchQuery, activeTab, contacts, user?.email]);

  // Separate contacts by type (contacts vs spaces)
  const filteredContacts = contacts.filter((contact) => {
    const isSpace = contact.type === 'space';
    const matchesTab = activeTab === 'spaces' ? isSpace : !isSpace;

    if (!matchesTab) return false;

    return (
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;
    onAddCustomContact(newContactName.trim(), newContactEmail.trim());
    setNewContactName('');
    setNewContactEmail('');
    setShowAddContact(false);
  };

  const handleAddSpaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    onAddCustomSpace(newSpaceName.trim(), newSpaceDescription.trim(), selectedMemberIdsForNewSpace);
    setNewSpaceName('');
    setNewSpaceDescription('');
    setSelectedMemberIdsForNewSpace([]);
    setShowAddSpace(false);
  };

  return (
    <div id="sidebar" className="w-full md:w-1/3 md:min-w-[340px] md:max-w-[420px] border-r border-gray-200/80 flex flex-col bg-[#f8f9fa] h-full shrink-0 select-none">
      {/* Sidebar Header - Nok Style */}
      <header className="h-16 px-4 flex items-center justify-between border-b border-gray-200/50 shrink-0 bg-white">
        <div className="flex items-center space-x-2">
          {/* Mobile Nok Logo & Profile Trigger */}
          <div className="flex sm:hidden items-center gap-2 mr-1">
            <div onClick={onOpenSettings} className="cursor-pointer">
              <NokPearLogo size={32} showPinkBg={true} />
            </div>
          </div>
          <h2 className="text-base font-semibold text-gray-800 tracking-tight flex items-center gap-1.5">
            {activeTab === 'spaces' ? 'Xonalar' : 'Suhbatlar'}
          </h2>
          <span className="text-[11px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full border border-gray-200/20">
            {activeTab === 'spaces' ? contacts.filter(c => c.type === 'space').length : contacts.filter(c => c.type !== 'space').length}
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-1 text-gray-600">
          <button
            id="btn-add-item"
            title={activeTab === 'spaces' ? "Yangi guruh (space) yaratish" : "Yangi kontakt qo'shish"}
            onClick={() => {
              if (activeTab === 'spaces') {
                setShowAddSpace(!showAddSpace);
                setShowAddContact(false);
              } else {
                setShowAddContact(!showAddContact);
                setShowAddSpace(false);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition duration-150 cursor-pointer flex items-center justify-center text-blue-600"
          >
            {activeTab === 'spaces' ? (
              <Users size={19} className={showAddSpace ? 'text-blue-700 stroke-[2.5px]' : ''} />
            ) : (
              <UserPlus size={19} className={showAddContact ? 'text-blue-700 stroke-[2.5px]' : ''} />
            )}
          </button>

          <button
            title="Sozlamalar"
            onClick={onOpenSettings}
            className="p-2 hover:bg-gray-100 rounded-lg transition duration-150 cursor-pointer text-gray-600 hover:text-gray-900"
          >
            <Settings size={19} />
          </button>

          {user && (
            <button
              title="Akkountdan chiqish"
              onClick={onLogout}
              className="p-2 hover:bg-red-50 rounded-lg transition duration-150 cursor-pointer text-gray-500 hover:text-red-600"
            >
              <LogOut size={19} />
            </button>
          )}
        </div>
      </header>

      {/* Slide-down Form to Add Custom Contact */}
      <AnimatePresence>
        {showAddContact && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-gray-200/80 p-4 shadow-sm z-10 overflow-hidden"
          >
            <h3 className="text-xs font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <UserPlus size={14} className="text-blue-600" />
              Yangi kontakt qo'shish
            </h3>
            <form onSubmit={handleAddContactSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Ism va familiya *"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Elektron pochta (ixtiyoriy)"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition cursor-pointer shadow-xs"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-down Form to Add Custom Space */}
      <AnimatePresence>
        {showAddSpace && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-gray-200/80 p-4 shadow-sm z-10 overflow-hidden"
          >
            <h3 className="text-xs font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <Users size={14} className="text-blue-600" />
              Yangi xona (space) yaratish
            </h3>
            <form onSubmit={handleAddSpaceSubmit} className="space-y-2.5">
              <input
                type="text"
                placeholder="Xona nomi *"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Tavsif (ixtiyoriy)"
                value={newSpaceDescription}
                onChange={(e) => setNewSpaceDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddSpace(false)}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition cursor-pointer shadow-xs"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="p-3 bg-white border-b border-gray-200/50 flex items-center shrink-0">
        <div className="relative w-full">
          <input
            id="search-input"
            type="text"
            placeholder={activeTab === 'spaces' ? "Guruhlarni qidirish..." : "Ism yoki elektron pochta orqali qidirish..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f1f3f4] pl-11 pr-4 py-2 rounded-full text-xs border-transparent focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none placeholder-gray-500 text-gray-800 transition-all duration-200"
          />
          <Search size={15} className="absolute left-4 top-2.5 text-gray-500" />
        </div>
      </div>

      {/* Google Chat Connection Banner (Logged Out) */}
      {!user && (
        <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 text-xs text-blue-900 flex flex-col gap-2 shrink-0 m-3 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-950 flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Tezkor Ulanish
            </span>
            <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Xavfsiz</span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Hisobingiz orqali haqiqiy guruhlaringiz va muloqotlaringizni sinxronlashtiring.
          </p>
          <button
            onClick={onLoginClick}
            className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white py-2 rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            </svg>
            <span>Akkountga kirish</span>
          </button>
        </div>
      )}

      {/* Logged-In User Profile Status Banner */}
      {user && (
        <div className="mx-3 my-2 p-2.5 bg-white border border-gray-200/80 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={user.avatar || `https://placehold.co/40x40/1a73e8/fff?text=${encodeURIComponent(user.name[0])}`}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-2.5 h-2.5 rounded-full border-2 border-white"></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-gray-800 truncate">{user.name}</span>
                <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 font-semibold px-1.5 py-0.2 rounded-full shrink-0">
                  Akkount ✓
                </span>
              </div>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Akkountdan chiqish"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-150 cursor-pointer shrink-0 ml-1"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}

      {/* Contacts / Spaces List */}
      <div id="contacts-list" className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-white flex flex-col">
        {loadingContacts ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 h-40">
            <div className="w-8 h-8 border-3 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-gray-500">Serverdan yuklanmoqda...</span>
          </div>
        ) : filteredContacts.length === 0 && registeredUserResults.length === 0 ? (
          <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
            <Compass size={38} className="stroke-1 text-gray-300" />
            <span className="text-xs font-medium">
              {activeTab === 'spaces'
                ? "Hech qanday guruh topilmadi."
                : "Hech qanday shaxsiy chat topilmadi."}
            </span>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-blue-600 font-medium hover:underline cursor-pointer"
              >
                Qidiruvni tozalash
              </button>
            ) : activeTab === 'spaces' && !user ? (
              <p className="text-[11px] text-gray-400 px-8 text-center leading-relaxed">
                Guruhlarni ko'rish uchun yuqoridagi tugma orqali hisobingizga kiring.
              </p>
            ) : null}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="flex flex-col gap-0.5 p-2 bg-[#f8f9fa]">
              {filteredContacts.map((contact, idx) => {
                const isActive = activeContactId === contact.id;
                return (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.12, delay: Math.min(idx * 0.02, 0.3) }}
                    onClick={() => onSelectContact(contact.id)}
                    className={`flex items-center px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-150 relative group ${
                      isActive 
                        ? 'bg-[#d3e3fd] text-[#041e49]' 
                        : 'hover:bg-[#eaeef6] text-gray-700'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className={`rounded-full w-10 h-10 object-cover bg-white ${
                          isActive ? 'border-2 border-blue-500' : 'border border-gray-200'
                        }`}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const col = activeTab === 'spaces' ? '1a73e8' : '0b57d0';
                          (e.target as HTMLImageElement).src = `https://placehold.co/40x40/${col}/fff?text=${encodeURIComponent(contact.name[0])}`;
                        }}
                      />
                      {contact.isOnline && contact.type !== 'space' && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#0f9d58] border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs truncate block ${isActive ? 'font-bold text-[#041e49]' : 'font-medium text-gray-800'}`}>
                          {contact.name}
                        </span>
                        <p className="text-[11px] text-gray-500 truncate pr-2 mt-0.5">
                          {contact.isTyping ? (
                            <span className="text-blue-600 font-semibold animate-pulse">Yozmoqda...</span>
                          ) : (
                            contact.lastMessage || (contact.email ? contact.email : "Muloqotni boshlang 💬")
                          )}
                        </p>
                      </div>
                      {confirmingDeleteId === contact.id ? (
                        <div className="flex items-center space-x-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-red-500 font-bold">O'chirish?</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteContact(contact.id);
                              setConfirmingDeleteId(null);
                            }}
                            className="text-[10px] bg-red-500 hover:bg-red-600 text-white px-1.5 py-0.5 rounded font-medium transition cursor-pointer"
                          >
                            Ha
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmingDeleteId(null);
                            }}
                            className="text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded font-medium transition cursor-pointer"
                          >
                            Yo'q
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end shrink-0 ml-2 justify-between h-8">
                          <span className="text-[9px] text-gray-400 font-medium">
                            {contact.lastMessageTime || (contact.isOnline ? 'Onlayn' : '')}
                          </span>
                          <div className="flex items-center space-x-1.5 h-4">
                            {contact.unreadCount > 0 && (
                              <span className="text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shrink-0 bg-blue-600">
                                {contact.unreadCount}
                              </span>
                            )}
                            <button
                              title={contact.type === 'space' ? "Guruhni o'chirish" : "Kontaktni o'chirish"}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmingDeleteId(contact.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200 md:opacity-0 md:group-hover:opacity-100 transition-all duration-150 cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Registered Users Search Results */}
              {registeredUserResults.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="px-2 py-1 flex items-center justify-between text-gray-600 mb-1">
                    <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-blue-600" />
                      Ro'yxatdan o'tgan foydalanuvchilar ({registeredUserResults.length})
                    </span>
                  </div>
                  {registeredUserResults.map((u) => (
                    <motion.div
                      key={u.email}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => {
                        onAddCustomContact(u.name, u.email);
                        setSearchQuery('');
                      }}
                      className="flex items-center px-3 py-2.5 bg-white border border-blue-200/80 hover:bg-blue-50/70 rounded-xl cursor-pointer transition-all duration-150 shadow-2xs mb-1.5 group"
                    >
                      <img
                        src={u.avatar || `https://placehold.co/40x40/1a73e8/fff?text=${encodeURIComponent(u.name[0])}`}
                        alt={u.name}
                        className="w-9 h-9 rounded-full object-cover border border-blue-300 shrink-0"
                      />
                      <div className="ml-3 flex-1 min-w-0">
                        <span className="text-xs font-bold text-gray-900 truncate block group-hover:text-blue-700">
                          {u.name}
                        </span>
                        <span className="text-[10px] text-gray-500 truncate block">{u.email}</span>
                      </div>
                      <span className="text-[10px] bg-blue-600 group-hover:bg-blue-700 text-white font-semibold px-2 py-1 rounded-lg shrink-0 transition flex items-center gap-1 shadow-xs">
                        <UserCheck size={12} />
                        Chat boshlash
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Mobile-Only Bottom Navigation Rail */}
      <div className="flex sm:hidden h-14 bg-white border-t border-gray-200/50 justify-around items-center px-4 shrink-0">
        <button
          onClick={() => onTabChange('contacts')}
          className={`flex flex-col items-center gap-0.5 transition-colors duration-150 relative cursor-pointer ${
            activeTab === 'contacts' ? 'text-blue-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <MessageSquare size={18} className={activeTab === 'contacts' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
          <span className="text-[10px] tracking-tight">Suhbat</span>
        </button>
        <button
          onClick={() => onTabChange('spaces')}
          className={`flex flex-col items-center gap-0.5 transition-colors duration-150 relative cursor-pointer ${
            activeTab === 'spaces' ? 'text-blue-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Users size={18} className={activeTab === 'spaces' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
          <span className="text-[10px] tracking-tight">Xonalar</span>
        </button>
      </div>
    </div>
  );
}
