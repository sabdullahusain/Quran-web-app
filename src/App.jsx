import { useState, useRef, useEffect, useMemo } from 'react';
import allSurahsData from './data/quran_full.json'; 

// --- STATIC DATA ---
const PARAH_NAMES = [
    { id: 1, ar: "الم", en: "Alif Lam Meem" },
    { id: 2, ar: "سَيَقُولُ", en: "Sayaqool" },
    { id: 3, ar: "تِلْكَ ٱلْرُّسُلُ", en: "Tilkal Rusull" },
    { id: 4, ar: "لَنْ تَنَالُوا", en: "Lan Tana Loo" },
    { id: 5, ar: "وَٱلْمُحْصَنَاتُ", en: "Wal Mohsanat" },
    { id: 6, ar: "لَا يُحِبُّ ٱللَّهُ", en: "La Yuhibbullah" },
    { id: 7, ar: "وَإِذَا سَمِعُوا", en: "Wa Iza Samiu" },
    { id: 8, ar: "وَلَوْ أَنَّنَا", en: "Wa Lau Annana" },
    { id: 9, ar: "قَالَ ٱلْمَلَأُ", en: "Qalal Malao" },
    { id: 10, ar: "وَٱعْلَمُوا", en: "Wa A'lamu" },
    { id: 11, ar: "يَعْتَذِرُونَ", en: "Yatazeroon" },
    { id: 12, ar: "وَمَا مِنْ دَآبَّةٍ", en: "Wa Mamin Da'abat" },
    { id: 13, ar: "وَمَا أُبَرِّئُ", en: "Wa Ma Ubrioo" },
    { id: 14, ar: "رُبَمَا", en: "Rubama" },
    { id: 15, ar: "سُبْحَانَ ٱلَّذِى", en: "Subhanallazi" },
    { id: 16, ar: "قَالَ أَلَمْ", en: "Qal Alam" },
    { id: 17, ar: "ٱقْتَرَبَ لِلنَّاسِ", en: "Iqtaraba Linnas" },
    { id: 18, ar: "قَدْ أَفْلَحَ", en: "Qadd Aflaha" },
    { id: 19, ar: "وَقَالَ ٱلَّذِينَ", en: "Wa Qalallazina" },
    { id: 20, ar: "أَمَّنْ خَلَقَ", en: "A'man Khalaqa" },
    { id: 21, ar: "ٱتْلُ مَا أُوحِىَ", en: "Utlu Ma Oohi" },
    { id: 22, ar: "وَمَنْ يَقْنُتْ", en: "Wa Manyaqnut" },
    { id: 23, ar: "وَمَا لي", en: "Wa Mali" },
    { id: 24, ar: "فَمَنْ أَظْلَمُ", en: "Faman Azlam" },
    { id: 25, ar: "إِلَيْهِ يُرَدُّ", en: "Elahe Yuruddo" },
    { id: 26, ar: "حم", en: "Ha Meem" },
    { id: 27, ar: "قَالَ فَمَا خَطْبُكُم", en: "Qala Fama Khatbukum" },
    { id: 28, ar: "قَدْ سَمِعَ ٱللَّهُ", en: "Qadd Sami Allah" },
    { id: 29, ar: "تَبَارَكَ ٱلَّذِى", en: "Tabarakallazi" },
    { id: 30, ar: "عَمَّ يَتَسَآءَلُونَ", en: "Amma Yatasa'aloon" }
];

const RUKOO_LIST = Array.from({ length: 556 }, (_, i) => i + 1);

const HighlightedText = ({ text, highlight }) => {
    if (!highlight.trim()) return text;
    const terms = highlight.trim().split(/\s+/).filter(t => t.length > 0).join('|');
    const regex = new RegExp(`(${terms})`, 'gi');
    const parts = text.toString().split(regex);
    return (
        <span>
            {parts.map((part, i) => 
                regex.test(part) ? (
                    <span key={i} className="text-amber-400 font-bold bg-amber-900/30 rounded px-0.5">{part}</span>
                ) : part
            )}
        </span>
    );
};

export default function App() {
  const [viewMode, setViewMode] = useState('surah'); 
  const [activeItem, setActiveItem] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [currentAyahIndex, setCurrentAyahIndex] = useState(-99); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const shouldAutoAdvance = useRef(false); 
  const audioPlayer = useRef(new Audio());
  const ayahRefs = useRef({}); 
  const scrollContainerRef = useRef(null);

  if (!allSurahsData || allSurahsData.length === 0) {
    return <div className="h-screen flex items-center justify-center text-white bg-slate-950">Data Loading...</div>;
  }

  useEffect(() => {
    if (!activeItem && allSurahsData.length > 0) {
        setActiveItem(allSurahsData[0]); 
    }
  }, []);

  useEffect(() => {
      if (currentAyahIndex !== -99 && ayahRefs.current[currentAyahIndex] && scrollContainerRef.current) {
          const element = ayahRefs.current[currentAyahIndex];
          const container = scrollContainerRef.current;
          const targetPosition = element.offsetTop - 120; 

          container.scrollTo({
              top: targetPosition,
              behavior: 'smooth',
          });
      }
  }, [currentAyahIndex]);

  const generatedRukooList = useMemo(() => {
      if (viewMode !== 'ruku') return [];
      const list = [];
      allSurahsData.forEach(surah => {
          if(!surah.ayahs) return;
          const uniqueRukoos = [...new Set(surah.ayahs.map(a => a.ruku))];
          uniqueRukoos.forEach((globalId, index) => {
              list.push({
                  globalId: globalId, 
                  relativeNumber: index + 1, 
                  surahName: surah.meta.surah_name_en,
                  surahNumber: surah.surah_number,
                  surahArabic: surah.meta.surah_name_ar
              });
          });
      });
      return list;
  }, [viewMode]);

  const filteredList = useMemo(() => {
      const lowerQuery = searchQuery.toLowerCase();
      if (viewMode === 'surah') {
          if (!searchQuery) return allSurahsData;
          return allSurahsData.filter(surah => 
              surah.meta.surah_name_en.toLowerCase().includes(lowerQuery) || 
              surah.meta.surah_name_ar.includes(searchQuery) ||              
              String(surah.surah_number).includes(lowerQuery)                
          );
      } 
      else if (viewMode === 'parah') {
          if (!searchQuery) return PARAH_NAMES;
          return PARAH_NAMES.filter(p => 
              String(p.id).includes(lowerQuery) || 
              p.en.toLowerCase().includes(lowerQuery) ||
              p.ar.includes(searchQuery)
          );
      }
      else if (viewMode === 'ruku') {
          if (!searchQuery) return generatedRukooList;
          return generatedRukooList.filter(item => {
              const searchString = `${item.surahName} ${item.relativeNumber} ${item.surahNumber} ${item.surahArabic}`.toLowerCase();
              const queryParts = lowerQuery.split(" ");
              return queryParts.every(part => searchString.includes(part));
          });
      }
  }, [searchQuery, viewMode, generatedRukooList]);

  const displayAyahs = useMemo(() => {
    if (!activeItem) return [];
    ayahRefs.current = {}; 

    if (viewMode === 'surah') return activeItem.ayahs || [];
    
    if (viewMode === 'parah') {
        const parahNumber = activeItem;
        const ayahsInParah = [];
        allSurahsData.forEach(surah => {
            if (!surah.ayahs) return;
            const matchingAyahs = surah.ayahs.filter(ayah => ayah.juz === parahNumber);
            if (matchingAyahs.length > 0) {
                ayahsInParah.push({ type: 'header', text: surah.meta.surah_name_ar, sub: surah.meta.surah_name_en, id: `head-${surah.id}`, surah_number: surah.surah_number });
                ayahsInParah.push(...matchingAyahs);
            }
        });
        return ayahsInParah;
    }
    
    if (viewMode === 'ruku') {
        const targetGlobalId = activeItem.globalId; 
        const ayahsInRukoo = [];
        allSurahsData.forEach(surah => {
            if (!surah.ayahs) return;
            const matchingAyahs = surah.ayahs.filter(ayah => ayah.ruku === targetGlobalId);
            if (matchingAyahs.length > 0) {
                ayahsInRukoo.push({ type: 'header', text: surah.meta.surah_name_ar, sub: surah.meta.surah_name_en, id: `head-${surah.id}`, surah_number: surah.surah_number });
                ayahsInRukoo.push(...matchingAyahs);
            }
        });
        return ayahsInRukoo;
    }
    return [];
  }, [activeItem, viewMode]);

  const toggleGlobalPlay = () => {
      shouldAutoAdvance.current = true; 
      if (isPlaying) {
          audioPlayer.current.pause();
          setIsPlaying(false);
      } else {
          if (currentAyahIndex !== -99) {
              audioPlayer.current.play();
              setIsPlaying(true);
          } else {
              playTrack(viewMode === 'surah' ? -1 : 0);
          }
      }
  };

  const playTrack = (index) => {
    let url = "";
    const items = displayAyahs.filter(item => item.type !== 'header'); 
    if (index === -1) url = "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3"; 
    else if (index >= 0 && index < items.length) url = items[index].audio_url;
    else { stopAudio(); return; }

    audioPlayer.current.src = url;
    audioPlayer.current.play().catch(e => console.log("Audio Error:", e));
    setCurrentAyahIndex(index);
    setIsPlaying(true);
  };

  const playSingleAyah = (index) => {
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
        if (shouldAutoAdvance.current) playTrack(currentAyahIndex + 1);
        else stopAudio();
    };
    audioPlayer.current.addEventListener('ended', handleEnded);
    return () => audioPlayer.current.removeEventListener('ended', handleEnded);
  }, [currentAyahIndex, displayAyahs]);

  const getMainButtonText = () => {
      if (currentAyahIndex === -99) return "▶ Play All"; 
      if (isPlaying) return "⏸ Pause"; 
      return "▶ Resume"; 
  };
  
  const getHeaderTitle = () => {
      if (viewMode === 'surah') return activeItem?.meta?.surah_name_ar;
      if (viewMode === 'parah') {
          const p = PARAH_NAMES.find(p => p.id === activeItem);
          return p ? p.ar : `Juz ${activeItem}`;
      }
      if (viewMode === 'ruku') return `${activeItem?.surahArabic} - ركوع ${activeItem?.relativeNumber}`;
  }

  const getHeaderSubtitle = () => {
      if (viewMode === 'surah') return activeItem?.meta?.surah_name_en;
      if (viewMode === 'parah') {
          const p = PARAH_NAMES.find(p => p.id === activeItem);
          return p ? `Juz ${p.id} - ${p.en}` : `Recitation by Parah`;
      }
      if (viewMode === 'ruku') return `${activeItem?.surahName} - Rukoo ${activeItem?.relativeNumber}`;
  }

  if (!activeItem && viewMode === 'surah') return null;

  return (
    <div className="h-screen w-full bg-slate-950 text-white flex overflow-hidden font-sans">
      
      {/* MOBILE NAV BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-30 shadow-lg">
         <button onClick={() => setIsSidebarOpen(true)} className="text-emerald-400 p-2 hover:bg-slate-800 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
         </button>
         <span className="font-quran text-3xl font-bold text-emerald-400 drop-shadow-md">
            القرآن الكريم
         </span>
      </div>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-out shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none
      `}>
        
        {/* 1. MOBILE HEADER (Close Button) - Visible only on LG hidden */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 lg:hidden">
             <span className="text-xl font-bold text-emerald-400 font-quran">القائمة</span>
             <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-bold transition-colors"
             >
                ✕ Close
             </button>
        </div>

        {/* 2. DESKTOP LOGO - Hidden on mobile */}
        <div className="hidden lg:flex p-6 justify-center items-center border-b border-slate-800/50 bg-slate-900/50">
             <h1 className="font-quran text-4xl font-bold text-emerald-500 drop-shadow-lg">
                القرآن الكريم
             </h1>
        </div>

        {/* 3. TOGGLES & SEARCH */}
        <div className="bg-slate-900 border-b border-slate-800 p-4">
            <div className="flex bg-slate-800 rounded-lg p-1 gap-1 mb-4">
                <button 
                    onClick={() => { setViewMode('surah'); setSearchQuery(""); setActiveItem(allSurahsData[0]); stopAudio(); }}
                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors ${viewMode === 'surah' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Surah
                </button>
                <button 
                    onClick={() => { setViewMode('parah'); setSearchQuery(""); setActiveItem(1); stopAudio(); }}
                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors ${viewMode === 'parah' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Parah
                </button>
                <button 
                    onClick={() => { setViewMode('ruku'); setSearchQuery(""); setActiveItem(generatedRukooList[0]); stopAudio(); }}
                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors ${viewMode === 'ruku' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Rukoo
                </button>
            </div>
            
            <div className="relative">
                <input 
                    type="text" 
                    placeholder={viewMode === 'surah' ? "Search Surah..." : viewMode === 'parah' ? "Search Juz..." : "Search: 'Baqarah 5'"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
            </div>
        </div>

        {/* 4. LIST */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pb-20">
            {viewMode === 'surah' ? (
                filteredList.map((surah) => (
                    <div 
                        key={surah.id}
                        onClick={() => { setActiveItem(surah); setIsSidebarOpen(false); stopAudio(); window.scrollTo({top:0, behavior:'smooth'}); }}
                        className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-all flex justify-between items-center ${activeItem?.id === surah.id ? 'bg-slate-800 border-l-4 border-l-emerald-500 pl-3' : 'pl-4'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold bg-slate-800 text-slate-400 w-8 h-8 flex items-center justify-center rounded-full">
                                <HighlightedText text={surah.surah_number} highlight={searchQuery} />
                            </span>
                            <div>
                                <p className={`font-medium ${activeItem?.id === surah.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                                    <HighlightedText text={surah.meta.surah_name_en} highlight={searchQuery} />
                                </p>
                                <p className="text-xs text-slate-500">{surah.meta.surah_meaning}</p>
                            </div>
                        </div>
                        <span className="font-quran text-slate-600 text-lg">
                            <HighlightedText text={surah.meta.surah_name_ar} highlight={searchQuery} />
                        </span>
                    </div>
                ))
            ) : viewMode === 'parah' ? (
                filteredList.map((p) => (
                    <div 
                        key={p.id}
                        onClick={() => { setActiveItem(p.id); setIsSidebarOpen(false); stopAudio(); window.scrollTo({top:0, behavior:'smooth'}); }}
                        className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-all flex justify-between items-center ${activeItem === p.id ? 'bg-slate-800 border-l-4 border-l-emerald-500 pl-3' : 'pl-4'}`}
                    >
                         <div className="flex items-center gap-3">
                            <span className="text-xs font-bold bg-slate-800 text-slate-400 w-8 h-8 flex items-center justify-center rounded-full">
                                <HighlightedText text={p.id} highlight={searchQuery} />
                            </span>
                            <span className={`font-bold ${activeItem === p.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                                <HighlightedText text={p.en} highlight={searchQuery} />
                            </span>
                         </div>
                         <span className="font-quran text-slate-600 text-lg">
                             <HighlightedText text={p.ar} highlight={searchQuery} />
                         </span>
                    </div>
                ))
            ) : (
                filteredList.map((r, idx) => (
                    <div 
                        key={idx}
                        onClick={() => { setActiveItem(r); setIsSidebarOpen(false); stopAudio(); window.scrollTo({top:0, behavior:'smooth'}); }}
                        className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-all flex justify-between items-center ${activeItem?.globalId === r.globalId ? 'bg-slate-800 border-l-4 border-l-emerald-500 pl-3' : 'pl-4'}`}
                    >
                         <div className="flex items-center gap-3">
                            <span className="text-xs font-bold bg-slate-800 text-slate-400 w-8 h-8 flex items-center justify-center rounded-full">
                                {r.relativeNumber}
                            </span>
                            <div>
                                <p className={`font-bold text-sm ${activeItem?.globalId === r.globalId ? 'text-emerald-400' : 'text-slate-300'}`}>
                                    <HighlightedText text={r.surahName} highlight={searchQuery} />
                                </p>
                                <p className="text-xs text-slate-500">
                                    Rukoo <HighlightedText text={r.relativeNumber} highlight={searchQuery} />
                                </p>
                            </div>
                         </div>
                         <span className="font-quran text-slate-600 text-lg">
                             <HighlightedText text={r.surahArabic} highlight={searchQuery} />
                         </span>
                    </div>
                ))
            )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full pt-16 lg:pt-0 relative overflow-hidden bg-slate-950">
        {/* SCROLL CONTAINER */}
        <div 
            ref={scrollContainerRef} 
            className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth"
        >
            <div className="max-w-5xl mx-auto w-full pb-32">
                
                <header className="text-center mb-10 mt-8 border-b border-slate-800 pb-10">
                    <h1 className="text-4xl lg:text-6xl font-bold text-emerald-500 font-quran mb-4 leading-loose">
                        {getHeaderTitle()}
                    </h1>
                    <p className="text-slate-400 text-lg mb-6">
                        {getHeaderSubtitle()}
                    </p>
                    
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
                            <p className={`text-3xl lg:text-5xl font-quran leading-relaxed ${currentAyahIndex === -1 ? 'text-emerald-400' : 'text-emerald-200/50'}`}>
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </p>
                        </div>
                    )}
                </header>

                <div className="flex flex-col gap-4">
                    {displayAyahs.map((item, realIndex) => {
                        if (item.type === 'header') {
                            return (
                                <div key={item.id} className="mt-16 mb-8 text-center border-b border-emerald-900/30 pb-6">
                                    {item.surah_number !== 9 && (
                                         <p className="text-2xl font-quran text-emerald-200/50 mb-4">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                                    )}
                                    <h3 className="text-3xl font-quran text-emerald-400">{item.text}</h3>
                                    <p className="text-sm text-slate-500">{item.sub}</p>
                                </div>
                            )
                        }

                        const audioIndex = displayAyahs.slice(0, realIndex + 1).filter(i => i.type !== 'header').length - 1;
                        const isActive = currentAyahIndex === audioIndex;

                        return (
                            <div 
                                key={item.id} 
                                ref={el => ayahRefs.current[audioIndex] = el}
                                className={`w-full p-6 lg:p-8 rounded-3xl border transition-all duration-500 ${isActive ? 'bg-slate-900 border-emerald-500 shadow-2xl shadow-emerald-900/20 scale-[1.01]' : 'bg-slate-900/20 border-slate-800 hover:border-slate-700'}`}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-500">
                                        {item.surah_number}:{item.ayah_number}
                                    </span>
                                    <button 
                                        onClick={() => playSingleAyah(audioIndex)} 
                                        className={`text-xs font-bold px-4 py-2 rounded transition-colors ${isActive && isPlaying ? 'bg-amber-600/20 text-amber-500' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {isActive && isPlaying ? "⏸ Pause" : "▶ Play"}
                                    </button>
                                </div>
                                
                                <div className="mb-8 w-full">
                                    <p className={`text-right text-4xl lg:text-6xl font-bold leading-[2.5] font-quran py-2 ${isActive ? 'text-emerald-100' : 'text-slate-300'}`}>
                                        {item.text_arabic}
                                    </p>
                                </div>

                                <div className="space-y-2 border-t border-slate-800/50 pt-4">
                                    <p className="text-right text-xl font-quran text-slate-300 leading-loose" dir="rtl">{item.text_urdu}</p>
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