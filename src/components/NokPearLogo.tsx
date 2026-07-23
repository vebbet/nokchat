import React from 'react';

interface NokPearLogoProps {
  className?: string;
  size?: number | string;
  showPinkBg?: boolean;
}

export default function NokPearLogo({ className = '', size = 36, showPinkBg = true }: NokPearLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 transition-transform duration-200 active:scale-95 ${
        showPinkBg ? 'bg-[#f15c8d] rounded-2xl shadow-sm' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full p-0.5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pink Background if explicitly requested inside SVG */}
        {showPinkBg && (
          <rect width="100" height="100" rx="26" fill="#f15c8d" />
        )}

        {/* Stem */}
        <path
          d="M 50 25 Q 45 16 42 12 C 41 11 39 12 40 14 C 42 17 47 24 48 26 Z"
          fill="#4a2c1d"
        />

        {/* Leaf */}
        <path
          d="M 48 18 C 55 12 65 9 67 14 C 69 19 59 23 48 20 Z"
          fill="#86cc29"
        />

        {/* Pear Body Shadow / Base Layer */}
        <path
          d="M 50 22 C 38 22 34 38 32 50 C 29 62 20 68 20 80 C 20 92 33 98 50 98 C 67 98 80 92 80 80 C 80 68 71 62 68 50 C 66 38 62 22 50 22 Z"
          fill="#93d629"
        />

        {/* Pear Body Main Light Green Overlay */}
        <path
          d="M 50 23 C 39 23 35 39 33 50 C 30 62 22 68 22 79 C 22 90 34 96 50 96 C 66 96 78 90 78 79 C 78 68 70 62 67 50 C 65 39 61 23 50 23 Z"
          fill="#a2e035"
        />

        {/* Pear Highlight (Right/Top) */}
        <path
          d="M 50 24 C 58 24 62 36 64 48 C 67 60 75 66 75 77 C 75 87 66 93 52 95 C 64 94 74 87 74 77 C 74 66 66 60 63 48 C 61 36 57 24 50 24 Z"
          fill="#b5ed47"
          opacity="0.6"
        />

        {/* Freckles / Texture dots */}
        <circle cx="35" cy="82" r="0.8" fill="#7ebf1d" opacity="0.6" />
        <circle cx="42" cy="87" r="0.8" fill="#7ebf1d" opacity="0.6" />
        <circle cx="58" cy="85" r="0.8" fill="#7ebf1d" opacity="0.6" />
        <circle cx="65" cy="80" r="0.8" fill="#7ebf1d" opacity="0.6" />
        <circle cx="30" cy="73" r="0.8" fill="#7ebf1d" opacity="0.6" />

        {/* Round White Glasses - Left Lens */}
        <circle cx="38" cy="55" r="13" stroke="#ffffff" strokeWidth="4" fill="none" />
        
        {/* Round White Glasses - Right Lens */}
        <circle cx="62" cy="55" r="13" stroke="#ffffff" strokeWidth="4" fill="none" />

        {/* Glasses Bridge */}
        <line x1="48" y1="55" x2="52" y2="55" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />

        {/* Eyes (Black Dots inside Glasses) */}
        <circle cx="38" cy="55" r="2.8" fill="#121820" />
        <circle cx="62" cy="55" r="2.8" fill="#121820" />

        {/* Small White Eye Reflections */}
        <circle cx="37" cy="54" r="0.8" fill="#ffffff" />
        <circle cx="61" cy="54" r="0.8" fill="#ffffff" />

        {/* Cute Smile */}
        <path
          d="M 46 64 C 48 67 52 67 54 64"
          stroke="#2f1c13"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
