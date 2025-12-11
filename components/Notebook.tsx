import React, { useState } from 'react';
import { NotebookItem, Language } from '../types';
import { generateStory } from '../services/geminiService';

interface NotebookProps {
  items: NotebookItem[];
  nativeLang: Language;
  targetLang: Language;
  onBack: () => void;
}

type Tab = 'list' | 'flashcards' | 'story';

const Notebook: React.FC<NotebookProps> = ({ items, nativeLang, targetLang, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [story, setStory] = useState<string | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  
  // Flashcard State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerateStory = async () => {
    if (items.length < 3) return; // Need at least a few words
    setIsGeneratingStory(true);
    setStory(null);
    try {
      const words = items.map(i => i.word);
      const result = await generateStory(words, nativeLang.name, targetLang.name);
      setStory(result);
    } catch (e) {
      setStory("Failed to weave a tale. Try again!");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % items.length);
    }, 200);
  };

  const prevCard = () => {
     setIsFlipped(false);
     setTimeout(() => {
       setCurrentCardIndex((prev) => (prev - 1 + items.length) % items.length);
     }, 200);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-6xl mb-4">📓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Notebook is Empty</h2>
        <p className="text-gray-500 mb-6">Search words and save them to see them here.</p>
        <button onClick={onBack} className="text-brand-purple font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center gap-4 z-10">
        <button onClick={onBack} className="text-2xl text-gray-600 hover:text-brand-dark">←</button>
        <h2 className="text-xl font-display font-bold">My Notebook ({items.length})</h2>
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-2 bg-white border-b border-gray-100 overflow-x-auto no-scrollbar">
        {[
          { id: 'list', label: 'List', icon: '📝' },
          { id: 'flashcards', label: 'Flashcards', icon: '🃏' },
          { id: 'story', label: 'Story Mode', icon: '✨' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex-1 py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm whitespace-nowrap transition-colors
              ${activeTab === tab.id ? 'bg-brand-dark text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        
        {/* LIST VIEW */}
        {activeTab === 'list' && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-xl font-bold text-brand-purple">{item.word}</h3>
                   <span className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">{item.definition}</p>
              </div>
            ))}
          </div>
        )}

        {/* FLASHCARDS VIEW */}
        {activeTab === 'flashcards' && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="perspective-1000 w-full max-w-sm h-96 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-2xl border-2 border-brand-purple/10 flex flex-col items-center justify-center p-6">
                  {items[currentCardIndex].imageUrl && (
                    <img src={items[currentCardIndex].imageUrl} alt="hint" className="w-32 h-32 object-cover rounded-full mb-6 border-4 border-brand-yellow" />
                  )}
                  <h3 className="text-4xl font-display font-bold text-brand-dark">{items[currentCardIndex].word}</h3>
                  <p className="text-gray-400 mt-4 text-sm font-bold uppercase tracking-widest">Tap to flip</p>
                </div>

                {/* Back */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-brand-purple text-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8">
                  <h3 className="text-xl font-bold mb-4">{items[currentCardIndex].definition}</h3>
                  <div className="bg-white/10 p-4 rounded-xl w-full">
                    <p className="italic text-sm">"{items[currentCardIndex].examples[0].text}"</p>
                    <p className="text-white/60 text-xs mt-2">{items[currentCardIndex].examples[0].translation}</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex gap-8 mt-8">
              <button onClick={(e) => { e.stopPropagation(); prevCard(); }} className="p-4 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">⬅️</button>
              <span className="self-center font-bold text-gray-400">{currentCardIndex + 1} / {items.length}</span>
              <button onClick={(e) => { e.stopPropagation(); nextCard(); }} className="p-4 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">➡️</button>
            </div>
          </div>
        )}

        {/* STORY VIEW */}
        {activeTab === 'story' && (
          <div className="max-w-2xl mx-auto">
             {items.length < 3 ? (
               <div className="text-center p-8 text-gray-500">
                 Save at least 3 words to generate a story!
               </div>
             ) : (
               <>
                 {!story && !isGeneratingStory && (
                   <button 
                     onClick={handleGenerateStory}
                     className="w-full py-4 bg-brand-pink text-white rounded-2xl font-bold shadow-lg shadow-brand-pink/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                   >
                     <span>✨</span> Create a Story from {items.length} words
                   </button>
                 )}

                 {isGeneratingStory && (
                   <div className="text-center p-12">
                     <div className="inline-block animate-bounce text-4xl mb-4">✍️</div>
                     <p className="text-gray-500 font-medium">Weaving magic with your words...</p>
                   </div>
                 )}

                 {story && (
                   <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-fade-in-up space-y-6">
                      <div className="prose prose-lg text-gray-700 whitespace-pre-line leading-relaxed">
                        {story}
                      </div>
                      <button 
                        onClick={handleGenerateStory} 
                        className="w-full py-3 border-2 border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Try Another Story
                      </button>
                   </div>
                 )}
               </>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notebook;
