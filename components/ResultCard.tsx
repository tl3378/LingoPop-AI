import React, { useState } from 'react';
import { DictionaryResult, Language } from '../types';
import { playTTS } from '../services/geminiService';

interface ResultCardProps {
  data: DictionaryResult;
  targetLang: Language;
  onSave: (item: DictionaryResult) => void;
  isSaved: boolean;
  onChat: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, targetLang, onSave, isSaved, onChat }) => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const handlePlay = async (text: string, id: string) => {
    setIsPlaying(id);
    await playTTS(text, targetLang.voiceName);
    setIsPlaying(null);
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in-up">
      {/* Header Image & Title */}
      <div className="relative h-48 bg-brand-purple flex items-center justify-center overflow-hidden">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.word} className="w-full h-full object-cover opacity-90" />
        ) : (
          <div className="text-white text-6xl opacity-20 font-display font-bold">{data.word[0]}</div>
        )}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-6 pt-12">
          <div className="flex justify-between items-end">
             <div>
                <h2 className="text-4xl font-display font-bold text-white mb-1">{data.word}</h2>
             </div>
             <button 
               onClick={() => handlePlay(data.word, 'head')}
               disabled={isPlaying !== null}
               className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-all"
             >
               {isPlaying === 'head' ? '🔊' : '🔈'}
             </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Definition */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Definition</h3>
          <p className="text-xl font-medium text-gray-800">{data.definition}</p>
        </div>

        {/* Friendly Chat - Glassmorphism Style */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-brand-yellow/20 via-white/60 to-brand-orange/10 border border-white shadow-lg backdrop-blur-sm group hover:shadow-xl transition-all duration-300">
           {/* Decorative shine/glow */}
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/40 rounded-full blur-2xl group-hover:bg-white/60 transition-colors"></div>
           
           <div className="relative z-10 flex gap-4 items-start">
             <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-yellow to-brand-orange flex items-center justify-center text-2xl shadow-md border-2 border-white transform group-hover:scale-110 transition-transform duration-300">
               😎
             </div>
             <div className="flex-1">
               <h3 className="text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1">Lingo Pal Says</h3>
               <p className="text-brand-dark italic font-medium leading-relaxed text-lg">
                 "{data.friendlyExplanation}"
               </p>
             </div>
           </div>
        </div>

        {/* Examples */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Examples</h3>
          <div className="space-y-4">
            {data.examples.map((ex, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-xl flex gap-3 group">
                 <button 
                   onClick={() => handlePlay(ex.text, `ex-${idx}`)}
                   className="mt-1 text-gray-400 hover:text-brand-purple transition-colors"
                 >
                   {isPlaying === `ex-${idx}` ? '🔊' : '▶️'}
                 </button>
                 <div>
                   <p className="text-lg text-brand-dark font-medium leading-relaxed">{ex.text}</p>
                   <p className="text-gray-500 text-sm mt-1">{ex.translation}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button 
            onClick={() => onSave(data)}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all transform active:scale-95 ${isSaved ? 'bg-gray-200 text-gray-500 cursor-default' : 'bg-brand-pink text-white hover:bg-brand-pink/90 shadow-lg shadow-brand-pink/30'}`}
          >
            {isSaved ? 'Saved to Notebook' : '❤️ Save Word'}
          </button>
          
          <button 
            onClick={onChat}
            className="flex-1 bg-brand-purple text-white py-3 px-4 rounded-xl font-bold hover:bg-brand-purple/90 shadow-lg shadow-brand-purple/30 transition-all transform active:scale-95 flex justify-center items-center gap-2"
          >
             💬 Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;