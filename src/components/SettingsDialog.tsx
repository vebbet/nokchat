import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  X, 
  ShieldCheck, 
  Database, 
  Trash2, 
  User, 
  Bell, 
  Palette, 
  HardDrive, 
  Check, 
  Volume2, 
  Moon, 
  Sun, 
  Laptop,
  LogOut
} from 'lucide-react';

interface SettingsDialogProps {
  user: UserProfile | null;
  onClearHistory: () => void;
  onClose: () => void;
  onLogout?: () => void;
}

type TabType = 'account' | 'notifications' | 'appearance' | 'storage';

export default function SettingsDialog({
  user,
  onClearHistory,
  onClose,
  onLogout,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('account');

  // Settings preferences stored in localStorage
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('pref_notifications') !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('pref_sound') !== 'false';
  });
  const [readReceipts, setReadReceipts] = useState(() => {
    return localStorage.getItem('pref_read_receipts') !== 'false';
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('pref_theme') as any) || 'light';
  });
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('pref_compact') === 'true';
  });
  const [statusMsg, setStatusMsg] = useState(() => {
    return localStorage.getItem('pref_status_msg') || 'Bugun masofadan ishlayapman 💻';
  });
  const [onlineStatus, setOnlineStatus] = useState<'online' | 'busy' | 'away'>(() => {
    return (localStorage.getItem('pref_online_status') as any) || 'online';
  });

  const [savedToast, setSavedToast] = useState(false);

  const savePref = (key: string, value: string) => {
    localStorage.setItem(key, value);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleClear = () => {
    if (window.confirm("Haqiqatan ham barcha chatlar va xabarlar tarixini to'liq o'chirmoqchimisiz? Ushbu amalni ortga qaytarib bo'lmaydi.")) {
      onClearHistory();
      alert("Yozishmalar tarixi va kesh muvaffaqiyatli tozalandi!");
    }
  };

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs select-none">
      <div 
        id="settings-dialog" 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] max-h-[620px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-200"
      >
        {/* Top Bar Header */}
        <div className="bg-[#0b57d0] text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <Database size={20} className="text-blue-200" />
            <h3 className="font-semibold text-base sm:text-lg tracking-tight">Nok Sozlamalari</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            title="Yopish"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Body: Tabs Sidebar + Settings Content */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 bg-gray-50/50">
          {/* Navigation Sidebar */}
          <div className="w-full sm:w-56 bg-white border-b sm:border-b-0 sm:border-r border-gray-200/80 p-2 sm:p-3 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-y-auto shrink-0">
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
                activeTab === 'account' 
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User size={16} className={activeTab === 'account' ? 'text-blue-600' : 'text-gray-500'} />
              <span>Hisob va Profil</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
                activeTab === 'notifications' 
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bell size={16} className={activeTab === 'notifications' ? 'text-blue-600' : 'text-gray-500'} />
              <span>Bildirishnomalar</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
                activeTab === 'appearance' 
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Palette size={16} className={activeTab === 'appearance' ? 'text-blue-600' : 'text-gray-500'} />
              <span>Tashqi Ko'rinish</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
                activeTab === 'storage' 
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <HardDrive size={16} className={activeTab === 'storage' ? 'text-blue-600' : 'text-gray-500'} />
              <span>Xotira va Kesh</span>
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white flex flex-col justify-between">
            {/* Tab 1: Account & Profile */}
            {activeTab === 'account' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  <span>Foydalanuvchi Profili va Ma'lumotlar</span>
                </h4>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  {user ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-16 h-16 rounded-full border-2 border-blue-500 shadow-md object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      M
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-900 text-base truncate">
                      {user ? user.name : "Mehmon Foydalanuvchi"}
                    </h5>
                    <p className="text-xs text-gray-500 truncate">
                      {user ? user.email : "Ulanilmagan"}
                    </p>
                    <span className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      user ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {user ? "Akkount tasdiqlangan" : "Sinov (Mehmon) rejimi"}
                    </span>
                  </div>
                </div>

                {/* Status selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 block">Muloqot holati (Status)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'online', label: 'Onlayn', color: 'bg-green-500' },
                      { id: 'busy', label: 'Band', color: 'bg-red-500' },
                      { id: 'away', label: "Joyida yo'q", color: 'bg-amber-500' }
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          setOnlineStatus(st.id as any);
                          savePref('pref_online_status', st.id);
                        }}
                        className={`flex items-center justify-center space-x-2 p-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                          onlineStatus === st.id
                            ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold shadow-2xs'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Message input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">Shaxsiy matnli holat</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={statusMsg}
                      onChange={(e) => setStatusMsg(e.target.value)}
                      placeholder="Statusingizni kiriting..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      onClick={() => savePref('pref_status_msg', statusMsg)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                    >
                      Saqlash
                    </button>
                  </div>
                </div>

                {/* Logout Button inside Settings */}
                {user && onLogout && (
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={handleLogoutAction}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-semibold text-xs transition cursor-pointer shadow-xs"
                    >
                      <LogOut size={16} />
                      <span>Akkountdan chiqish</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                  <Bell size={18} className="text-blue-600" />
                  <span>Bildirishnomalar va Ovoz Sozlamalari</span>
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-xs font-semibold text-gray-800 block">Push bildirishnomalari</span>
                      <p className="text-[11px] text-gray-500">Yangi xabar kelganda bildirishnoma ko'rsatish</p>
                    </div>
                    <button
                      onClick={() => {
                        const val = !notificationsEnabled;
                        setNotificationsEnabled(val);
                        savePref('pref_notifications', String(val));
                      }}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative ${
                        notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`w-5 h-5 bg-white rounded-full block shadow-md transform transition-transform ${
                        notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-gray-500" />
                      <div>
                        <span className="text-xs font-semibold text-gray-800 block">Xabar kelish ovozi</span>
                        <p className="text-[11px] text-gray-500">Yangi kelgan bildirishnomalar uchun ovoz chiqarish</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const val = !soundEnabled;
                        setSoundEnabled(val);
                        savePref('pref_sound', String(val));
                      }}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative ${
                        soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`w-5 h-5 bg-white rounded-full block shadow-md transform transition-transform ${
                        soundEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-xs font-semibold text-gray-800 block">O'qilganlik belgisi (Read Receipts)</span>
                      <p className="text-[11px] text-gray-500">Xabar o'qilganda ikkita ko'k belgini (✓✓) ko'rsatish</p>
                    </div>
                    <button
                      onClick={() => {
                        const val = !readReceipts;
                        setReadReceipts(val);
                        savePref('pref_read_receipts', String(val));
                      }}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative ${
                        readReceipts ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`w-5 h-5 bg-white rounded-full block shadow-md transform transition-transform ${
                        readReceipts ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                  <Palette size={18} className="text-blue-600" />
                  <span>Mavzu va Interfeys Ko'rinishi</span>
                </h4>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 block">Ilova Mavzusi (Theme)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Yorug\'', icon: Sun },
                      { id: 'dark', label: 'Tungi', icon: Moon },
                      { id: 'system', label: 'Tizim (Avto)', icon: Laptop }
                    ].map((th) => {
                      const IconComp = th.icon;
                      return (
                        <button
                          key={th.id}
                          onClick={() => {
                            setTheme(th.id as any);
                            savePref('pref_theme', th.id);
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium gap-1.5 transition cursor-pointer ${
                            theme === th.id
                              ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold shadow-2xs'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <IconComp size={18} className={theme === th.id ? 'text-blue-600' : 'text-gray-500'} />
                          <span>{th.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-800 block">Ixcham ko'rinish (Compact Mode)</span>
                    <p className="text-[11px] text-gray-500">Suhbat ro'yxatida ixchamlashtirilgan qatorlardan foydalanish</p>
                  </div>
                  <button
                    onClick={() => {
                      const val = !compactMode;
                      setCompactMode(val);
                      savePref('pref_compact', String(val));
                    }}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative ${
                      compactMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`w-5 h-5 bg-white rounded-full block shadow-md transform transition-transform ${
                      compactMode ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Storage & Data */}
            {activeTab === 'storage' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                  <HardDrive size={18} className="text-blue-600" />
                  <span>Xotira, Kesh va Ma'lumotlarni Boshqarish</span>
                </h4>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">Saqlash turi:</span>
                    <span className="font-semibold text-gray-800">Browser LocalStorage</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">Kesh holati:</span>
                    <span className="font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-[10px]">Optimallashgan</span>
                  </div>
                </div>

                <div className="p-4 bg-red-50/60 border border-red-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-red-900 font-semibold text-xs">
                    <Trash2 size={16} className="text-red-600" />
                    <span>Xabarlar va keshni tozalash</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Barcha shaxsiy yozishmalar, xabarlar tarixi va kesh xotirasi to'liq tozalanadi. Chat xonalari qayta tiklanadi.
                  </p>
                  <button
                    onClick={handleClear}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    <Trash2 size={15} />
                    <span>Barcha kesh va xabarlar tarixini tozalash</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom notification indicator / Save Toast */}
            {savedToast && (
              <div className="mt-3 p-2 bg-green-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 animate-in fade-in duration-150 shadow-md">
                <Check size={14} />
                <span>Sozlamalar saqlandi</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-3 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>Nok Enterprise Xavfsiz ulanishi</span>
          </div>
          <span className="font-mono text-gray-400">v1.2.0</span>
        </div>
      </div>
    </div>
  );
}

