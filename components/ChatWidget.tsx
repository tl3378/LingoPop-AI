import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Language } from '../types';
import { sendChatMessage } from '../services/geminiService';

interface ChatWidgetProps {
  word: string;
  nativeLang: Language;
  onClose: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ word, nativeLang, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hi! I'm here to help you with "${word}". Ask me anything about it!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Transform internal message format to Gemini history format if needed
      // Gemini SDK `sendMessage` handles history internally on the chat object, 
      // but here we are re-instantiating for statelessness or we can keep a chat instance.
      // For simplicity in this demo, we pass history to the service to init new chat or just send latest.
      // The service implementation creates a new chat with history.
      
      const historyForApi = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const reply = await sendChatMessage(historyForApi, userMsg, word, nativeLang.name);
      
      if (reply) {
        setMessages(prev => [...prev, { role: 'model', text: reply }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Oops, I had a brain freeze. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-brand-purple p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">Chat about "{word}"</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">✕</button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                m.role === 'user' 
                  ? 'bg-brand-purple text-white rounded-br-none' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
               <div className="bg-gray-200 p-3 rounded-2xl rounded-bl-none animate-pulse">Thinking...</div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-brand-orange text-white p-3 rounded-xl hover:bg-brand-orange/90 transition-colors"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
