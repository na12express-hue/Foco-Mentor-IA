import React from 'react';
import { BookOpen } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start mb-8">
       <div className="flex gap-4 max-w-[85%]">
         <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100/50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-sm">
             <BookOpen size={16} className="animate-pulse" />
         </div>
         {/* Updated bg to stone-800 (dark) to match new bubble style */}
         <div className="bg-stone-800 border border-stone-700 px-5 py-4 rounded-xl rounded-tl-sm flex items-center gap-1.5 h-12 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)]">
            <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></div>
         </div>
       </div>
    </div>
  );
};

export default TypingIndicator;