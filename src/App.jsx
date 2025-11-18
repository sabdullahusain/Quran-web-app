import { useState, useRef, useEffect } from 'react';
import allSurahsData from './data/quran_data.json';

export default function App() {
  // STATE
  const [activeSurah, setActiveSurah] = useState(allSurahsData[0]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(-99);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // REFS
  const shouldAutoAdvance = useRef(false); 
  const audioPlayer = useRef(new Audio());

  // --- ACTIONS ---
  const handleSurahSelect = (surah) => {
    stopAudio();
    setActiveSurah(surah);
    setIsSidebarOpen(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const playFullSurah = () => {
    shouldAutoAdvance.current = true;
    playTrack(-1);
  };

  const playSingleAyah = (index) => {
    shouldAutoAdvance.current = false;
    if (currentAyahIndex === index && isPlaying) {
        audioPlayer.current.pause();
        setIsPlaying(false);
    } else {
        playTrack(index);
    }
  };

  const playTrack = (index) => {
    let url = "";
    if (index === -1) url = activeSurah.meta.audio_bismillah;
    else if (index >= 0 && index < activeSurah.ayahs.length) url = activeSurah.ayahs[index].audio_url;
    else {
        stopAudio();
        return;
    }

    audioPlayer.current.src = url;
    audioPlayer.current.play();
    setCurrentAyahIndex(index);
    setIsPlaying(true);
  };

  const stopAudio = () => {
    audioPlayer.current.pause();
    setIsPlaying(false);
    setCurrentAyahIndex(-99);
  }

  useEffect(() => {
    const handleEnded = () => {
        if (shouldAutoAdvance.current) playTrack(currentAyahIndex + 1);
        else stopAudio();
    };
    audioPlayer.current.addEventListener('ended', handleEnded);
    return () => audioPlayer.current.removeEventListener('ended', handleEnded);
  }, [currentAyahIndex, activeSurah]);

  return (
    <div className="h-screen w-full bg-slate-950 text-white flex overflow-hidden font-sans">
      
      {/* --- MOBILE TOP BAR --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-30 shadow-lg">
        <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="text-emerald-400 p-2 hover:bg-slate-800 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>
            <span className="font-bold text-xl">Noble Quran</span>
        </div>
      </div>

      {/* --- MOBILE OVERLAY --- */}
      {isSidebarOpen && (
        <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-out shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none
      `}>
        <div className="p-6 border-b border-slate-800 shrink-0 bg-slate-900">
            <h2 className="text-2xl font-bold text-emerald-400">Surahs</h2>
            <p className="text-xs text-slate-500 mt-1">Select to Read</p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
            {allSurahsData.map((surah) => (
                <div 
                    key={surah.id}
                    onClick={() => handleSurahSelect(surah)}
                    className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-all ${
                        activeSurah.id === surah.id ? 'bg-slate-800 border-l-4 border-l-emerald-500 pl-3' : 'pl-4'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${
                                activeSurah.id === surah.id ? 'bg-emerald-900 text-emerald-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                                {surah.surah_number}
                            </span>
                            <p className={`font-medium ${activeSurah.id === surah.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                                {surah.meta.surah_name_en}
                            </p>
                        </div>
                        <p className="text-lg font-serif text-slate-600">{surah.meta.surah_name_ar}</p>
                    </div>
                </div>
            ))}
        </div>
      </aside>

      {/* --- MAIN READING AREA --- */}
      <main className="flex-1 flex flex-col h-full pt-16 lg:pt-0 relative overflow-hidden bg-slate-950">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
            
            {/* CONTAINER: max-w-5xl ensures lines aren't too long on wide screens, but keeps it single column */}
            <div className="max-w-5xl mx-auto w-full">
                
                {/* SURAH HEADER */}
                <header className="text-center mb-10 mt-4 lg:mt-8 border-b border-slate-800 pb-10">
                    <h1 className="text-5xl lg:text-7xl font-bold text-emerald-500 font-serif mb-4 drop-shadow-lg">
                        {activeSurah.meta.surah_name_ar}
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-lg mb-8">
                        <span className="font-semibold text-slate-300">{activeSurah.meta.surah_name_en}</span>
                        <span>•</span>
                        <span>{activeSurah.meta.surah_meaning}</span>
                    </div>
                    
                    <button 
                        onClick={playFullSurah}
                        className={`px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg transform hover:scale-105 active:scale-95 mx-auto block ${
                            shouldAutoAdvance.current && isPlaying
                            ? 'bg-emerald-600 text-white shadow-emerald-900/50'
                            : 'bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:bg-slate-700'
                        }`}
                    >
                       {shouldAutoAdvance.current && isPlaying ? "🔊 Reciting..." : "▶ Play Full Surah"}
                    </button>

                    <div className={`mt-10 p-6 rounded-2xl inline-block transition-all duration-500 border ${
                        currentAyahIndex === -1 ? 'bg-emerald-900/20 border-emerald-500/50 shadow-xl' : 'border-transparent'
                    }`}>
                        <p className={`text-3xl lg:text-5xl font-serif leading-relaxed ${currentAyahIndex === -1 ? 'text-emerald-400' : 'text-emerald-200/50'}`}>
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </p>
                    </div>
                </header>

                {/* LIST OF AYAHS (Vertical Column) */}
                <div className="flex flex-col gap-6 pb-32">
                    {activeSurah.ayahs.map((ayah, index) => {
                        const isActive = currentAyahIndex === index;
                        return (
                          <div 
                            key={ayah.id}
                            className={`w-full p-6 lg:p-8 rounded-3xl border transition-all duration-300 ${
                                isActive 
                                ? 'bg-slate-900 border-emerald-500 shadow-2xl shadow-emerald-900/20 scale-[1.01] z-10' 
                                : 'bg-slate-900/20 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                            }`}
                          >
                            {/* Ayah Header */}
                            <div className="flex justify-between items-center mb-6">
                              <span className={`text-sm font-bold px-4 py-1 rounded-full border ${
                                  isActive ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                              }`}>
                                {ayah.ayah_number}
                              </span>
                              
                              <button 
                                onClick={() => playSingleAyah(index)}
                                className={`text-xs uppercase font-bold px-5 py-2 rounded-lg transition-colors ${
                                    isActive ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                              >
                                {isActive && isPlaying ? "Pause" : "Play"}
                              </button>
                            </div>

                            {/* Arabic Text - LARGE & CLEAR */}
                            <div className="mb-8 w-full">
                                <p className={`text-right text-4xl lg:text-5xl font-bold leading-[2.3] font-serif ${isActive ? 'text-emerald-100' : 'text-slate-300'}`}>
                                {ayah.text_arabic}
                                </p>
                            </div>

                            {/* Translations - Separated by line */}
                            <div className="space-y-4 border-t border-slate-800/50 pt-6">
                              <p className="text-slate-300 text-right text-xl font-serif leading-relaxed" dir="rtl">
                                {ayah.text_urdu}
                              </p>
                              <p className="text-slate-500 text-base lg:text-lg leading-relaxed">
                                {ayah.text_english}
                              </p>
                            </div>
                          </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}