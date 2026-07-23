import React from 'react';
import { Shield, Sparkles, MessageSquare, Users, Lock, Zap, ArrowRight, Globe, CheckCircle2 } from 'lucide-react';
import NokPearLogo from './NokPearLogo';

interface LandingPageProps {
  onGoogleSignIn: () => void;
  onOpenAuthModal: () => void;
  isLoggingIn: boolean;
}

export default function LandingPage({ onGoogleSignIn, onOpenAuthModal, isLoggingIn }: LandingPageProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex flex-col justify-between select-none relative overflow-y-auto">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <NokPearLogo size={42} showPinkBg={true} />
          <div className="flex flex-col">
            <span className="font-bold text-xl text-gray-900 tracking-tight leading-none">Nok Chat</span>
            <span className="text-[11px] font-medium text-pink-600 mt-0.5">Nok Chat Ecosystem</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenAuthModal}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-200/60 rounded-xl transition cursor-pointer"
          >
            Email orqali
          </button>
          <button
            onClick={onGoogleSignIn}
            disabled={isLoggingIn}
            className="px-5 py-2.5 bg-[#f15c8d] hover:bg-[#e04b7c] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Tizimga Kirish
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-pink-100/80 border border-pink-200 rounded-full text-pink-700 text-xs font-semibold mb-6 shadow-2xs animate-fade-in">
          <Sparkles size={14} className="text-pink-600" />
          <span>Nok Chat Muloqot Platformasi</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-3xl mb-6">
          Xavfsiz, Tezkor va Mukammal Nok Chat Muloqoti
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed mb-8">
          <strong>Nok Chat</strong> – xavfsiz va zamonaviy muloqot vositasi. Barcha shaxsiy xabarlar, jamoaviy xonalar (Spaces) va muhokamalar Nok xavfsizlik standartlari asosida sinxronlanadi.
        </p>

        {/* Primary Call To Action */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto">
          <button
            onClick={onGoogleSignIn}
            disabled={isLoggingIn}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#f15c8d] to-[#d83569] hover:from-[#e04b7c] hover:to-[#c22b5c] text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google / Nok Hisobingiz Bilan Kirish</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onOpenAuthModal}
            className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm rounded-2xl border border-gray-300 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Email Bilan Boshlash</span>
          </button>
        </div>

        {/* Informative Cards / Application Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-4">
          <div className="bg-white/80 backdrop-blur-xs p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#f15c8d] flex items-center justify-center mb-4">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Nok Chat Sinxronlash</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Nok Chat-dagi barcha Direct Message va xabarlar real vaqt rejimida ushbu ilovada aks etadi.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#f15c8d] flex items-center justify-center mb-4">
              <Users size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Jamoaviy Xonalar (Spaces)</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Loyiha va guruhlaringiz bo'yicha maxsus Nok Chat xonalarini shakllantiring va hamkasblaringiz bilan uzluksiz muloqot qiling.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Lock size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Xavfsizlik va Maxfiylik</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Kirish faqat xavfsiz OAuth 2.0 protokoli orqali amalga oshiriladi. Ma'lumotlaringiz shaffof va xavfsiz saqlanadi.
            </p>
          </div>
        </div>

        {/* How It Works Flow */}
        <div className="w-full mt-16 bg-white/60 border border-gray-200 rounded-3xl p-8 backdrop-blur-xs shadow-xs text-left">
          <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
            <Zap size={20} className="text-amber-500" />
            Ilovadan foydalanish tartibi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-[#f15c8d] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h4 className="font-bold text-xs text-gray-900 mb-1">Tizimga Kirish</h4>
                <p className="text-[11px] text-gray-600">
                  Hisobingiz orqali tizimga xavfsiz kiring.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-[#f15c8d] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h4 className="font-bold text-xs text-gray-900 mb-1">Xabar va Xonalar Sync</h4>
                <p className="text-[11px] text-gray-600">
                  Nok Chat-dagi kontakt va xonalaringiz avtomatik yuklanadi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-[#f15c8d] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h4 className="font-bold text-xs text-gray-900 mb-1">Uzluksiz Muloqot</h4>
                <p className="text-[11px] text-gray-600">
                  Har qanday qurilmadan va brauzerdan tezkor xabarlashing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200/80 bg-white/50 py-6 px-6 text-center text-xs text-gray-500 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <NokPearLogo size={24} showPinkBg={true} />
            <span className="font-semibold text-gray-700">Nok Chat</span>
            <span>&copy; 2026. Barcha huquqlar himoyalangan.</span>
          </div>
          <span className="text-[11px] text-gray-400">Nok Chat Platformasi</span>
        </div>
      </footer>
    </div>
  );
}
