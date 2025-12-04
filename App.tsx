import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Sparkles, AlertCircle, BookOpen } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Message, Role, ChatSession } from './types';
import { sendMessageStream, initializeChat } from './services/gemini';
import ChatBubble from './components/ChatBubble';
import TypingIndicator from './components/TypingIndicator';
import Sidebar from './components/Sidebar';

const INITIAL_GREETING = "Saudações! Eu sou o Foco Mentor IA. Para que eu possa te guiar na aplicação, me diga: **Qual é o tópico que você está lendo ou qual o desafio de aplicação que você está enfrentando agora?**";

const LOCAL_STORAGE_KEY = 'foco_mentor_sessions_v1';

const App: React.FC = () => {
  // State for sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Deriving current messages from sessions
  const currentMessages = currentSessionId 
    ? sessions.find(s => s.id === currentSessionId)?.messages || []
    : [];

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load from Local Storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsedSessions: ChatSession[] = JSON.parse(saved);
        setSessions(parsedSessions);
        if (parsedSessions.length > 0) {
          // Load most recent session
          const mostRecent = parsedSessions.sort((a, b) => b.createdAt - a.createdAt)[0];
          setCurrentSessionId(mostRecent.id);
        } else {
          createNewChat();
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  // Save to Local Storage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Initialize/Re-initialize Gemini when switching sessions
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        initializeChat(session.messages);
      }
    }
  }, [currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const createNewChat = () => {
    const newId = uuidv4();
    const newSession: ChatSession = {
      id: newId,
      title: 'Nova Leitura',
      createdAt: Date.now(),
      messages: [{
        id: uuidv4(),
        role: Role.MODEL,
        text: INITIAL_GREETING,
      }]
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setInputText('');
    setError(null);
    setIsLoading(false);
    initializeChat(newSession.messages);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta conversa?')) {
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSessions));

      if (currentSessionId === id) {
        if (newSessions.length > 0) {
          setCurrentSessionId(newSessions[0].id);
        } else {
          createNewChat();
        }
      }
    }
  };

  const updateCurrentSessionMessages = (newMessages: Message[]) => {
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return { ...session, messages: newMessages };
      }
      return session;
    }));
  };

  const updateCurrentSessionTitle = (text: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId && session.title === 'Nova Leitura') {
        const title = text.length > 25 ? text.substring(0, 25) + '...' : text;
        return { ...session, title };
      }
      return session;
    }));
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !currentSessionId) return;

    const userMessageText = inputText.trim();
    setInputText('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
    }

    const newUserMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      text: userMessageText,
    };

    const updatedMessages = [...currentMessages, newUserMessage];
    updateCurrentSessionMessages(updatedMessages);
    updateCurrentSessionTitle(userMessageText);

    setIsLoading(true);
    setError(null);

    const aiMessageId = uuidv4();
    const newAiMessage: Message = {
      id: aiMessageId,
      role: Role.MODEL,
      text: '',
      isStreaming: true,
    };

    const messagesWithPlaceholder = [...updatedMessages, newAiMessage];
    updateCurrentSessionMessages(messagesWithPlaceholder);

    try {
      let currentText = '';
      
      await sendMessageStream(userMessageText, (chunk) => {
        currentText += chunk;
        setSessions(prev => prev.map(session => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              messages: session.messages.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, text: currentText } 
                  : msg
              )
            };
          }
          return session;
        }));
      });

      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: session.messages.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, isStreaming: false } 
                : msg
            )
          };
        }
        return session;
      }));

    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao conectar com o mentor. Tente novamente.");
      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: session.messages.filter(msg => msg.id !== aiMessageId || msg.text.length > 0)
          };
        }
        return session;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFBF7] dark:bg-[#1c1917] overflow-hidden font-sans">
      
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewChat}
        onDeleteSession={deleteSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full relative">
        
        {/* Header - Minimal & Elegant */}
        <header className="flex-shrink-0 bg-[#FDFBF7]/90 dark:bg-[#1c1917]/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            
             <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-800 dark:text-stone-100 truncate flex items-center gap-3">
               <span className="text-amber-600 hidden md:block"><Sparkles size={20} /></span>
               {sessions.find(s => s.id === currentSessionId)?.title || "Foco Mentor IA"}
             </h1>
          </div>
          <div className="text-xs font-serif italic text-stone-400 hidden md:block">
            Modo Leitura & Aplicação
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8 scroll-smooth scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700">
          <div className="max-w-3xl mx-auto space-y-4">
            
            {currentMessages.length === 0 && (
               <div className="flex flex-col items-center justify-center mt-20 text-stone-400 opacity-60">
                  <BookOpen size={48} className="mb-4 text-stone-300" />
                  <p className="font-serif italic text-lg">Inicie sua jornada de conhecimento.</p>
               </div>
            )}

            {currentMessages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            
            {isLoading && currentMessages.length > 0 && currentMessages[currentMessages.length - 1].role !== Role.MODEL && (
              <TypingIndicator />
            )}

            {error && (
              <div className="flex justify-center my-6">
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30 px-5 py-3 rounded-lg text-sm shadow-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        {/* Input Area - Floating & Focused */}
        <div className="flex-shrink-0 p-4 md:p-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent dark:from-[#1c1917] dark:via-[#1c1917]">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] focus-within:ring-2 focus-within:ring-stone-200 dark:focus-within:ring-stone-600 focus-within:border-stone-400 transition-all">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Qual conceito você quer aplicar hoje?"
                className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-3 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 placeholder:font-serif placeholder:italic"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className={`flex-shrink-0 p-3 rounded-lg transition-all duration-300 mb-0.5
                  ${inputText.trim() && !isLoading 
                    ? 'bg-stone-800 text-amber-50 hover:bg-stone-700 shadow-md active:transform active:scale-95' 
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-300 dark:text-stone-500 cursor-not-allowed'
                  }`}
              >
                <Send size={20} className={inputText.trim() && !isLoading ? 'ml-0.5' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;