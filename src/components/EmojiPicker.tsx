import React from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    title: "Yuzlar va Hissiyotlar",
    emojis: ["😊", "😂", "🤣", "😍", "🥰", "😎", "🤔", "😅", "😒", "😜", "🤩", "😭", "😤", "😡", "😱", "😴", "😇", "😷", "🤠", "🤫"]
  },
  {
    title: "Sinf va Imo-ishoralar",
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤝", "👏", "🙌", "👋", "🔥", "✨", "💖", "❤️", "💔", "🎉", "🌟", "💡", "💯", "🎈", "💪"]
  },
  {
    title: "Faoliyat va Atrof-muhit",
    emojis: ["☕", "🍕", "🎂", "🍎", "🍔", "🍿", "🚗", "🚲", "✈️", "🏠", "💻", "📱", "📈", "📚", "🖊️", "🔒", "🔑", "✉️", "🎁", "🔔"]
  }
];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <div id="emoji-picker-container" className="absolute bottom-16 left-4 bg-white border border-gray-200 rounded-lg shadow-xl w-72 max-h-64 overflow-y-auto z-50 p-3 flex flex-col gap-2">
      <div className="flex justify-between items-center border-b pb-1">
        <span className="text-xs font-semibold text-gray-500">Emojilar</span>
        <button id="close-emojis" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">yopish</button>
      </div>
      <div className="flex flex-col gap-3">
        {EMOJI_CATEGORIES.map((category, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">{category.title}</span>
            <div className="grid grid-cols-6 gap-1">
              {category.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSelect(emoji)}
                  className="text-xl p-1 hover:bg-gray-100 rounded transition duration-150 flex items-center justify-center cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
