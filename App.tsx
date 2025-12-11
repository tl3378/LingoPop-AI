import React, { useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, MODEL_TEXT } from './constants';
import { Language, DictionaryResult, NotebookItem, AppView } from './types';
import { lookupWord, generateConceptImage } from './services/geminiService';
import ResultCard from './components/ResultCard';
import ChatWidget from './components/ChatWidget';
import Notebook from './components/Notebook';

function App() {
  // State
  const [nativeLang, setNativeLang] = useState<Language | null>(null);
  const [targetLang, setTargetLang] = useState<Language | null>(null);
  const [view, setView] = useState<AppView>('onboarding');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [notebook, setNotebook] = useState<NotebookItem[]>([]);
  const [showChat, setShowChat] = useState(false);

  // Load Notebook from storage
  useEffect(() => {
    const saved = localStorage.getItem('lingopop_notebook');
    if (saved) {
      setNotebook(JSON.parse(saved));
    }
  }, []);

  // Save Notebook
  useEffect(() => {
    localStorage.setItem('lingopop_notebook', JSON.stringify(notebook));
  }, [notebook]);

  // Handlers
  const handleLanguageSelect = (n: Language, t: Language) => {
    setNativeLang(n);
    setTargetLang(t);
    setView('search');
  };

  const handleSearch = async () => {
    if (!searchTerm.trim() || !nativeLang || !targetLang) return;
    setLoading(true);
    setResult(null); // Clear previous result
    setView('result');

    try {
      // Parallel execution for speed, but text is critical so we await it first ideally to show something ASAP.
      // Or parallel and wait for all.
      const textPromise = lookupWord(searchTerm, nativeLang.name, targetLang.name);
      
      // We start image gen but don't block text UI if possible, 
      // but simplistic React state usually waits.
      // Let's await text first to show data, then image.
      const data = await textPromise;
      
      setResult(data); 

      // Fetch image in background and update
      generateConceptImage(data.word).then(imgUrl => {
         setResult(prev => prev ? { ...prev, imageUrl: imgUrl } : null);
      });

    } catch (e) {
      alert("Failed to fetch data. Please check your connection or try again.");
      setView('search');
    } finally {
      setLoading(false);
    }
  };

  const saveToNotebook = (item: DictionaryResult) => {
    if (notebook.some(n => n.word === item.word)) return;
    const newItem: NotebookItem = { ...item, id: Date.now().toString(), timestamp: Date.now() };
    setNotebook([newItem, ...notebook]);
  };

  // --- VIEWS ---

  // 1. Onboarding
  if (view === 'onboarding') {
    return (
      <div className="min-h-screen bg-brand-yellow flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center">
          <h1 className="text-4xl font-display font-bold text-brand-dark mb-2">LingoPop <span className="text-brand-pink">AI</span></h1>
          <p className="text-gray-500 mb-8">Choose your journey</p>
          
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">I speak</label>
              <select 
                className="w-full bg-gray-100 p-4 rounded-xl appearance-none font-bold text-lg outline-none focus:ring-2 focus:ring-brand-purple"
                onChange={(e) => setNativeLang(SUPPORTED_LANGUAGES.find(l => l.code === e.target.value) || null)}
              >
                <option value="">Select Language</option>
                {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>

            <div className="flex justify-center text-gray-300 text-xl">↓</div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">I want to learn</label>
              <select 
                className="w-full bg-gray-100 p-4 rounded-xl appearance-none font-bold text-lg outline-none focus:ring-2 focus:ring-brand-orange"
                onChange={(e) => setTargetLang(SUPPORTED_LANGUAGES.find(l => l.code === e.target.value) || null)}
              >
                <option value="">Select Language</option>
                {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>
          </div>

          <button 
            disabled={!nativeLang || !targetLang}
            onClick={() => nativeLang && targetLang && handleLanguageSelect(nativeLang, targetLang)}
            className="w-full mt-8 bg-brand-dark text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            Start Adventure 🚀
          </button>
        </div>
      </div>
    );
  }

  // 4. Notebook View (Full Screen)
  if (view === 'notebook') {
    return (
      <Notebook 
        items={notebook} 
        nativeLang={nativeLang!} 
        targetLang={targetLang!} 
        onBack={() => setView('search')} 
      />
    );
  }

  // Main Layout for Search & Result
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 font-sans relative">
      
      {/* Top Bar */}
      <div className="w-full p-4 flex justify-between items-center max-w-2xl">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('search')}>
           <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center font-bold">L</div>
           <span className="font-display font-bold text-xl">LingoPop</span>
        </div>
        <button onClick={() => setView('notebook')} className="relative">
           <span className="text-3xl">📓</span>
           {notebook.length > 0 && (
             <span className="absolute -top-1 -right-1 bg-brand-pink text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
               {notebook.length}
             </span>
           )}
        </button>
      </div>

      <div className="w-full max-w-2xl px-4 flex-1 flex flex-col">
        
        {/* Search Bar - Stickyish */}
        <div className={`transition-all duration-500 ${view === 'result' ? 'mt-2 mb-6' : 'mt-[20vh] mb-8'}`}>
          <h2 className={`font-display font-bold text-center mb-6 transition-all ${view === 'result' ? 'hidden' : 'text-3xl sm:text-4xl text-brand-dark'}`}>
            What do you want to say in <span className="text-brand-purple underline decoration-brand-yellow decoration-4">{targetLang?.name}</span>?
          </h2>
          
          <div className="relative group">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Type a word, phrase, or sentence..."
              className="w-full p-5 pl-6 pr-14 rounded-full border-2 border-gray-100 shadow-lg text-lg outline-none focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 transition-all"
            />
            <button 
              onClick={handleSearch}
              className="absolute right-2 top-2 bottom-2 bg-brand-purple text-white aspect-square rounded-full flex items-center justify-center hover:bg-brand-dark transition-colors"
            >
              ➝
            </button>
          </div>
          
          {/* Quick Suggestions if in search mode */}
          {view === 'search' && (
            <div className="flex flex-wrap justify-center gap-2 mt-4 opacity-60">
               {['Hello', 'Delicious food', 'Where is the subway?', 'I love you'].map(s => (
                 <button key={s} onClick={() => { setSearchTerm(s); handleSearch(); }} className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full hover:bg-gray-100">
                   {s}
                 </button>
               ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
           <div className="flex-1 flex flex-col items-center justify-center">
             <div className="w-16 h-16 border-4 border-brand-yellow border-t-brand-pink rounded-full animate-spin mb-4"></div>
             <p className="text-gray-400 font-bold animate-pulse">Asking the universe...</p>
           </div>
        )}

        {/* Result View */}
        {!loading && view === 'result' && result && targetLang && (
          <div className="pb-20">
            <ResultCard 
              data={result} 
              targetLang={targetLang}
              isSaved={notebook.some(n => n.word === result.word)}
              onSave={saveToNotebook}
              onChat={() => setShowChat(true)}
            />
          </div>
        )}
      </div>

      {/* Chat Widget Modal */}
      {showChat && result && nativeLang && (
        <ChatWidget 
          word={result.word} 
          nativeLang={nativeLang} 
          onClose={() => setShowChat(false)} 
        />
      )}

    </div>
  );
}

export default App;
