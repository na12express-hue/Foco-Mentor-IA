import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, BookOpen } from 'lucide-react';
import { Message, Role } from '../types';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 group`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] lg:max-w-[70%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border
          ${isUser 
            ? 'bg-stone-600 border-stone-500 text-stone-100' 
            : 'bg-amber-100/50 border-amber-200 text-amber-700 dark:bg-stone-800 dark:border-stone-700 dark:text-amber-500'
          }`}
        >
          {isUser ? <User size={16} /> : <BookOpen size={16} />}
        </div>

        {/* Bubble Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`relative px-6 py-4 rounded-xl shadow-sm text-[15px] md:text-base leading-relaxed
            ${isUser 
              ? 'bg-stone-600 text-stone-50 rounded-tr-sm' 
              : 'bg-stone-800 text-stone-50 border border-stone-700 rounded-tl-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)]'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap font-medium">{message.text}</p>
            ) : (
              <div className={`markdown-body font-light ${message.isStreaming ? 'animate-pulse' : ''}`}>
                 <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            )}
          </div>
          <span className="text-[10px] text-stone-400 mt-1.5 px-1 uppercase tracking-widest font-serif opacity-0 group-hover:opacity-100 transition-opacity">
            {isUser ? 'Você' : 'Mentor'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;