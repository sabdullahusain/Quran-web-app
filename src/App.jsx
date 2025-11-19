import { useState, useRef, useEffect, useMemo } from 'react';
import allSurahsData from './data/quran_full.json'; 

export default function App() {
  // --- STATE ---
  const [viewMode, setViewMode] = useState('surah'); 
  const [activeItem, setActiveItem] = useState(null); 
  const [currentAyahIndex, setCurrentAyahIndex] = useState(-99); // -99 = Stopped
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const shouldAutoAdvance = useRef(false); 
  const audioPlayer = useRef(new Audio());

  // --- SAFETY CHECK ---
  if (!allSurahsData || allSurahsData.length === 0) {
    return <div className="h-screen flex items-center justify-center text-white bg-slate-950">Data Loading...</div>;
  }

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!activeItem && allSurahsData.length > 0) {
        setActiveItem(allSurahsData[0]);
    }
  }, []);

  // --- HELPERS ---
  const removeBismillah = (text) => {
     if (!text) return "";
     const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
     if (text.startsWith(bismillah) && text.length > bismillah.length + 5) {
         return text.replace(bismillah, "").trim();
     }
     return text;
  };

  // --- DATA PREP ---
  const displayAyahs = useMemo(() => {
    if (!activeItem) return [];

    if (viewMode === 'surah') {
        return activeItem.ayahs || [];
    } 
    else if (viewMode === 'parah') {
        const parahNumber = activeItem;
        const ayahsInParah = [];
        
        allSurahsData.forEach(surah => {
            if (!surah.ayahs) return;
            const matchingAyahs = surah.ayahs.filter(ayah => ayah.juz === parahNumber);
            
            if (matchingAyahs.length > 0) {
                ayahsInParah.push({ 
                    type: 'header', 
                    text: surah.meta.surah_name_ar, 
                    sub: surah.meta.surah_name_en,
                    id: `header-${surah.id}`,
                    surah_number: surah.surah_number 
                });
                ayahsInParah.push(...matchingAyahs);
            }
        });
        return ayahsInParah;
    }
    return [];
  }, [activeItem, viewMode]);

  // --- MAIN PLAY/PAUSE CONTROLLER ---
  const toggleGlobalPlay = () => {
      shouldAutoAdvance.current = true; // Ensure we are in "Sequence Mode"

      if (isPlaying) {
          // 1. If currently playing, just PAUSE.
          audioPlayer.current.pause();
          setIsPlaying(false);
      } else {
          // 2. If paused...
          if (currentAyahIndex !== -99) {
              // Resume from where we left off
              audioPlayer.current.play();
              setIsPlaying(true);
          } else {
              // Start from the beginning
              playTrack(viewMode === 'surah' ? -1 : 0);
          }
      }
  };

  // --- AUDIO LOGIC ---
  const playTrack = (index) => {
    let url = "";
    const items = displayAyahs.filter(item => item.type !== 'header'); 
    
    if (index === -1) {
        url = "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3"; 
    } else if (index >= 0 && index < items.length) {
        url = items[index].audio_url;
    } else {
        stopAudio();
        return;
    }

    audioPlayer.current.src = url;
    audioPlayer.current.play().catch(e => console.log("Audio Error:", e));
    setCurrentAyahIndex(index);
    setIsPlaying(true);
  };

  const playSingleAyah = (index) => {
    // Playing a single specific Ayah forces "One-Off" mode
    shouldAutoAdvance.current = false; 

    if (currentAyahIndex === index && isPlaying) {
        audioPlayer.current.pause();
        setIsPlaying(false);
    } else if (currentAyahIndex === index && !isPlaying) {
        audioPlayer.current.play();
        setIsPlaying(true);
    } else {
        playTrack(index);
    }
  };

  const stopAudio = () => {
    audioPlayer.current.pause();
    setIsPlaying(false);
    setCurrentAyahIndex(-99);
  };

  useEffect(() => {
    const handleEnded = () => {
        if (shouldAutoAdvance.current) {
            playTrack(currentAyahIndex + 1);
        } else {
            // If in single mode, stop after one
            stopAudio();
        }
    };
    audioPlayer.current.addEventListener('ended', handleEnded);
    return () => audioPlayer.current.removeEventListener('ended', handleEnded);
  }, [currentAyahIndex, displayAyahs]);

  // --- UI HELPERS ---
  // Determine what text to show on the main button
  const getMainButtonText = () => {
      if (currentAyahIndex === -99) return "▶ Play All"; // Stopped
      if (isPlaying) return "⏸ Pause"; // Playing
      return "▶ Resume"; // Paused mid-way
  };

  if (!activeItem && viewMode === 'surah') return null;

  return (
    <div className="h-screen w-full bg-slate-950 text-white flex overflow-hidden font-sans">
      
      {/* MOBILE NAV */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-30 shadow-lg">
         <button onClick={() => setIsSidebarOpen(true)} className="text-emerald-400 p-2 hover:bg-slate-800 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
         </button>
         <span className="font-bold text-xl">Noble Quran</span>
      </div>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-out shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none
      `}>
        <div className="p-4 bg-slate-900 border-b border-slate-800 pt-20 lg:pt-4">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 px-2">Browse By</h2>
            <div className="flex bg-slate-800 rounded-lg p-1">
                <button 
                    onClick={() => { setViewMode('surah'); setActiveItem(allSurahsData[0]); stopAudio(); }}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === 'surah' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Surah
                </button>
                <button 
                    onClick={() => { setViewMode('parah'); setActiveItem(1); stopAudio(); }}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === 'parah' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Parah
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pb-20">
            {viewMode === 'surah' ? (
                allSurahsData.map((surah) => (
                    <div 
                        key={surah.id}
                        onClick={() => { setActiveItem(surah); setIsSidebarOpen(false); stopAudio(); window.scrollTo({top:0, behavior:'smooth'}); }}
                        className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-all flex justify-between items-center ${activeItem?.id === surah.id ? 'bg-slate-800 border-l-4 border-l-emerald-500 pl-3' : 'pl-4'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold bg-slate-800 text-slate-400 w-8 h-8 flex items-center justify-center rounded-full">{surah.surah_number}</span>
                            <div>
                                <p className={`font-medium ${activeItem?.id === surah.id ? 'text-emerald-400' : 'text-slate-300'}`}>{surah.meta.surah_name_en}</p>
                                <p className="text-xs text-slate-500">{surah.meta.surah_meaning}</p>
                            </div>
                        </div>
                        <span className="font-serif text-slate-600">{surah.meta.surah_name_ar}</span>
                    </div>
                ))
            ) : (
                Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                    <div 
                        key={num}
                        onClick={() => { setActiveItem(num); setIsSidebarOpen(false); stopAudio(); window.scrollTo({top:0, behavior:'smooth'}); }}
                        className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-all flex items-center gap-4 ${activeItem === num ? 'bg-slate-800 border-l-4 border-l-emerald-500 pl-3' : 'pl-4'}`}
                    >
                         <span className="text-xs font-bold bg-slate-800 text-slate-400 w-8 h-8 flex items-center justify-center rounded-full">{num}</span>
                         <span className={`font-bold ${activeItem === num ? 'text-emerald-400' : 'text-slate-300'}`}>Juz (Parah) {num}</span>
                    </div>
                ))
            )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full pt-16 lg:pt-0 relative overflow-hidden bg-slate-950">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
            <div className="max-w-5xl mx-auto w-full pb-32">
                
                {/* HEADER */}
                <header className="text-center mb-10 mt-8 border-b border-slate-800 pb-10">
                    <h1 className="text-4xl lg:text-6xl font-bold text-emerald-500 font-serif mb-2">
                        {viewMode === 'surah' ? activeItem?.meta?.surah_name_ar : `Juz ${activeItem}`}
                    </h1>
                    <p className="text-slate-400 text-lg mb-6">
                        {viewMode === 'surah' ? activeItem?.meta?.surah_name_en : 'Recitation by Parah'}
                    </p>
                    
                    {/* TOGGLE BUTTON */}
                    <button 
                        onClick={toggleGlobalPlay} 
                        className={`px-10 py-3 rounded-full font-bold text-lg transition-all shadow-lg transform hover:scale-105 active:scale-95 min-w-[200px] 
                        ${isPlaying 
                            ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                    >
                        {getMainButtonText()}
                    </button>

                    {viewMode === 'surah' && activeItem?.surah_number !== 9 && (
                        <div className="mt-10 p-6 rounded-2xl inline-block transition-all duration-500 border border-transparent">
                            <p className={`text-3xl lg:text-5xl font-serif leading-relaxed ${currentAyahIndex === -1 ? 'text-emerald-400' : 'text-emerald-200/50'}`}>
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </p>
                        </div>
                    )}
                </header>

                {/* AYAHS */}
                <div className="flex flex-col gap-4">
                    {displayAyahs.map((item, realIndex) => {
                        if (item.type === 'header') {
                            return (
                                <div key={item.id} className="mt-12 mb-6 text-center border-b border-emerald-900/30 pb-4">
                                    {item.surah_number !== 9 && (
                                         <p className="text-2xl font-serif text-emerald-200/50 mb-4">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                                    )}
                                    <h3 className="text-3xl font-serif text-emerald-400">{item.text}</h3>
                                    <p className="text-sm text-slate-500">{item.sub}</p>
                                </div>
                            )
                        }

                        const audioIndex = displayAyahs.slice(0, realIndex + 1).filter(i => i.type !== 'header').length - 1;
                        const isActive = currentAyahIndex === audioIndex;

                        let displayText = item.text_arabic;
                        if (displayText && item.surah_number !== 1) {
                             displayText = removeBismillah(displayText);
                        }

                        return (
                            <div key={item.id} className={`w-full p-6 lg:p-8 rounded-3xl border transition-all duration-300 ${isActive ? 'bg-slate-900 border-emerald-500 shadow-2xl' : 'bg-slate-900/20 border-slate-800 hover:border-slate-700'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-500">
                                        {item.surah_number}:{item.ayah_number}
                                    </span>
                                    
                                    {/* INDIVIDUAL BUTTON (Also works as toggle) */}
                                    <button 
                                        onClick={() => playSingleAyah(audioIndex)} 
                                        className={`text-xs font-bold px-4 py-2 rounded transition-colors ${isActive && isPlaying ? 'bg-amber-600/20 text-amber-500' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {isActive && isPlaying ? "⏸ Pause" : "▶ Play"}
                                    </button>
                                </div>
                                
                                <div className="mb-8 w-full">
                                    <p className={`text-right text-4xl lg:text-5xl font-bold leading-[2.3] font-serif ${isActive ? 'text-emerald-100' : 'text-slate-300'}`}>
                                        {displayText}
                                    </p>
                                </div>

                                <div className="space-y-2 border-t border-slate-800/50 pt-4">
                                    <p className="text-right text-xl font-serif text-slate-300" dir="rtl">{item.text_urdu}</p>
                                    <p className="text-slate-500 text-sm lg:text-base">{item.text_english}</p>
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