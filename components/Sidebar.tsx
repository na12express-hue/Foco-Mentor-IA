import React from 'react';
import { MessageSquare, Plus, Trash2, X, Library } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-30
        w-72 bg-[#1c1917] text-stone-300 flex flex-col
        transform transition-transform duration-300 ease-in-out border-r border-stone-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header / Brand */}
        <div className="p-6 pb-2">
            <div className="flex items-center gap-2 mb-6 text-stone-100">
                <Library className="text-amber-600" size={24} />
                <h2 className="font-serif text-xl font-bold tracking-tight">Biblioteca</h2>
            </div>

          <button 
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-100 px-4 py-3 rounded-lg transition-all border border-stone-700 hover:border-stone-600 font-medium text-sm shadow-sm group"
          >
            <Plus size={16} className="text-amber-500 group-hover:text-amber-400 transition-colors" />
            Nova Leitura
          </button>
        </div>

        <div className="flex justify-between items-center px-6 mt-2 mb-2">
             <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Histórico</span>
             <button onClick={onClose} className="md:hidden text-stone-500">
                 <X size={16} />
             </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-stone-800">
          
          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-sm text-stone-600 text-center italic font-serif">
              "O conhecimento começa com uma pergunta."
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`
                    group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all text-sm border border-transparent
                    ${session.id === currentSessionId 
                      ? 'bg-stone-800 text-stone-100 border-stone-700 shadow-sm' 
                      : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
                    }
                  `}
                >
                  <MessageSquare size={16} className={`flex-shrink-0 ${session.id === currentSessionId ? 'text-amber-600' : 'text-stone-600'}`} />
                  <span className="flex-1 truncate font-medium">{session.title}</span>
                  
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-500 hover:text-red-400 rounded transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-800">
          <p className="text-xs text-stone-600 text-center leading-relaxed">
            Mega Biblioteca 700+ <br/>
            <span className="font-serif italic text-stone-500">Coach de Leitura</span>
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;