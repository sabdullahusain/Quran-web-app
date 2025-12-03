import { useState, useRef, useEffect, useMemo } from 'react';
import allSurahsData from './data/quran_full.json'; 

// --- STATIC DATA: NAMES OF THE 30 PARAHS ---
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

// --- FONT OPTIONS ---
const FONT_OPTIONS = [
    { id: 'Amiri', name: 'Amiri (Default)', family: "'Amiri', serif" },
    { id: 'Scheherazade New', name: 'Scheherazade New', family: "'Scheherazade New', serif" },
    { id: 'Lateef', name: 'Lateef', family: "'Lateef', serif" },
    { id: 'Noto Naskh Arabic', name: 'Noto Naskh Arabic', family: "'Noto Naskh Arabic', serif" },
];

// --- HELPER COMPONENT: HIGHLIGHT TEXT ---
const HighlightedText = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) return text;
    // Regex to find the match (case insensitive)
    try {
        const regex = new RegExp(`(${highlight})`, 'gi');
        // Split text by match
        const parts = text.toString().split(regex);

        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        // THE HIGHLIGHT STYLE (Amber Text)
                        <span key={i} className="text-amber-400 font-bold bg-amber-900/30 rounded px-0.5">{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    } catch (e) {
        return text;
    }
};

export default function App() {
  // --- STATE ---
  const [viewMode, setViewMode] = useState('surah'); // surah | parah | ayah
  const [activeItem, setActiveItem] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [currentAyahIndex, setCurrentAyahIndex] = useState(-99); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // New States
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [showStickyPlay, setShowStickyPlay] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const shouldAutoAdvance = useRef(false); 
  const audioPlayer = useRef(new Audio());
  const stickyTriggerRef = useRef(null);

  // --- SAFETY CHECK ---
  if (!allSurahsData || allSurahsData.length === 0) {
    return <div className="h-screen flex items-center justify-center text-white bg-slate-950">Data Loading...</div>;
  }

  // Update CSS Variable for Font
  useEffect(() => {
    document.documentElement.style.setProperty('--font-quran', selectedFont.family);
  }, [selectedFont]);

  useEffect(() => {
    if (!activeItem && allSurahsData.length > 0) {
        setActiveItem(allSurahsData[0]); 
    }
  }, []);

  // Sticky Play Button Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
            setShowStickyPlay(!entry.isIntersecting);
        },
        { threshold: 0 }
    );

    if (stickyTriggerRef.current) {
        observer.observe(stickyTriggerRef.current);
    }

    return () => {
        if (stickyTriggerRef.current) {
            observer.unobserve(stickyTriggerRef.current);
        }
    };
  }, [activeItem, viewMode]); // Re-observe when view changes potentially

  const removeBismillah = (text) => {
     if (!text) return "";
     const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
     if (text.startsWith(bismillah) && text.length > bismillah.length + 5) {
         return text.replace(bismillah, "").trim();
     }
     return text;
  };

  const filteredList = useMemo(() => {
      if (!searchQuery) {
          if (viewMode === 'surah') return allSurahsData;
          if (viewMode === 'parah') return PARAH_NAMES;
          return []; // No default list for Ayah mode without search
      }
      const lowerQuery = searchQuery.toLowerCase();

      if (viewMode === 'surah') {
          return allSurahsData.filter(surah => 
              surah.meta.surah_name_en.toLowerCase().includes(lowerQuery) || 
              surah.meta.surah_name_ar.includes(searchQuery) ||              
              String(surah.surah_number).includes(lowerQuery)                
          );
      } else if (viewMode === 'parah') {
          return PARAH_NAMES.filter(p => 
              String(p.id).includes(lowerQuery) || 
              p.en.toLowerCase().includes(lowerQuery) ||
              p.ar.includes(searchQuery)
          );
      } else if (viewMode === 'ayah') {
          const results = [];
          // Search limit to prevent freezing
          let count = 0;
          for (const surah of allSurahsData) {
              if (count > 50) break;
              if (surah.ayahs) {
                  for (const ayah of surah.ayahs) {
                      if (count > 50) break;
                      if (
                          ayah.text_english.toLowerCase().includes(lowerQuery) ||
                          ayah.text_arabic.includes(searchQuery) ||
                          ayah.text_urdu.includes(searchQuery) ||
                          String(ayah.ayah_number).includes(lowerQuery)
                      ) {
                          results.push({
                              ...ayah,
                              surah_name_en: surah.meta.surah_name_en,
                              surah_name_ar: surah.meta.surah_name_ar,
                              surah_id: surah.id
                          });
                          count++;
                      }
                  }
              }
          }
          return results;
      }
      return [];
  }, [searchQuery, viewMode]);

  const displayAyahs = useMemo(() => {
    if (!activeItem) return [];
    if (viewMode === 'surah') return activeItem.ayahs || [];
    
    // Parah Logic
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
      if (viewMode === 'ayah') return activeItem?.meta?.surah_name_ar || "Quran";
      const p = PARAH_NAMES.find(p => p.id === activeItem);
      return p ? p.ar : `Juz ${activeItem}`;
  }

  const getHeaderSubtitle = () => {
      if (viewMode === 'surah') return activeItem?.meta?.surah_name_en;
      if (viewMode === 'ayah') return activeItem?.meta?.surah_name_en || "Search Results";
      const p = PARAH_NAMES.find(p => p.id === activeItem);
      return p ? `Juz ${p.id} - ${p.en}` : `Recitation by Parah`;
  }

  // Handle navigating to Ayah from search
  const handleAyahClick = (ayahResult) => {
      // Find surah
      const surah = allSurahsData.find(s => s.id === ayahResult.surah_id);
      if (surah) {
          setViewMode('surah');
          setActiveItem(surah);
          setIsSidebarOpen(false);
          stopAudio();
          // Scroll to ayah logic (basic implementation)
          setTimeout(() => {
             const element = document.getElementById(`ayah-${ayahResult.id}`);
             if (element) {
                 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 // Highlight effect
                 element.classList.add('bg-emerald-900/30');
                 setTimeout(() => element.classList.remove('bg-emerald-900/30'), 2000);
             } else {
                 window.scrollTo({top:0, behavior:'smooth'});
             }
          }, 300);
      }
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
         <button onClick={() => setIsSettingsOpen(true)} className="text-slate-400 p-2 hover:bg-slate-800 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
         </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-out shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none
      `}>
        <div className="bg-slate-900 border-b border-slate-800 pt-20 lg:pt-0">
            {/* Toggle */}
            <div className="p-4 pb-2">
                <div className="flex bg-slate-800 rounded-lg p-1">
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
                        onClick={() => { setViewMode('ayah'); setSearchQuery(""); stopAudio(); }}
                        className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors ${viewMode === 'ayah' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Ayah
                    </button>
                </div>
            </div>
            {/* Search */}
            <div className="px-4 pb-4">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder={viewMode === 'ayah' ? "Search text (e.g. mercy)..." : (viewMode === 'surah' ? "Search Surah..." : "Search Juz...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="px-4 pb-2 lg:block hidden">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-400 transition-colors w-full p-2 rounded hover:bg-slate-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings & Fonts
                </button>
            </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pb-20">
            {viewMode === 'surah' && (
                filteredList.length > 0 ? (
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
                            <span className="font-serif font-quran text-slate-300">
                                <HighlightedText text={surah.meta.surah_name_ar} highlight={searchQuery} />
                            </span>
                        </div>
                    ))
                ) : <div className="p-8 text-center text-slate-500 text-sm">No Surah found.</div>
            )}

            {viewMode === 'parah' && (
                filteredList.length > 0 ? (
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
                             <span className="font-serif font-quran text-slate-300">
                                 <HighlightedText text={p.ar} highlight={searchQuery} />
                             </span>
                        </div>
                    ))
                ) : <div className="p-8 text-center text-slate-500 text-sm">No Juz found.</div>
            )}

            {viewMode === 'ayah' && (
                filteredList.length > 0 ? (
                    filteredList.map((ayah) => (
                        <div
                            key={ayah.id}
                            onClick={() => handleAyahClick(ayah)}
                            className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-all`}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span>{ayah.surah_name_en} {ayah.surah_number}:{ayah.ayah_number}</span>
                                    <span className="font-serif font-quran">{ayah.surah_name_ar}</span>
                                </div>
                                <p className="font-serif font-quran text-lg text-emerald-100 text-right truncate">
                                    <HighlightedText text={ayah.text_arabic} highlight={searchQuery} />
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    <HighlightedText text={ayah.text_english} highlight={searchQuery} />
                                </p>
                            </div>
                        </div>
                    ))
                ) : <div className="p-8 text-center text-slate-500 text-sm">
                    {searchQuery ? "No Ayah found." : "Search for an ayah text..."}
                </div>
            )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full pt-16 lg:pt-0 relative overflow-hidden bg-slate-950">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
            <div className="max-w-5xl mx-auto w-full pb-32">
                
                <header className="text-center mb-10 mt-8 border-b border-slate-800 pb-10">
                    <h1 className="text-4xl lg:text-6xl font-bold text-emerald-500 font-serif font-quran mb-2">
                        {getHeaderTitle()}
                    </h1>
                    <p className="text-slate-400 text-lg mb-6">
                        {getHeaderSubtitle()}
                    </p>
                    
                    <button 
                        ref={stickyTriggerRef}
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
                            <p className={`text-3xl lg:text-5xl font-serif font-quran leading-relaxed ${currentAyahIndex === -1 ? 'text-emerald-400' : 'text-emerald-200/50'}`}>
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </p>
                        </div>
                    )}
                </header>

                <div className="flex flex-col gap-4">
                    {displayAyahs.map((item, realIndex) => {
                        if (item.type === 'header') {
                            return (
                                <div key={item.id} className="mt-12 mb-6 text-center border-b border-emerald-900/30 pb-4">
                                    {item.surah_number !== 9 && (
                                         <p className="text-2xl font-serif font-quran text-emerald-200/50 mb-4">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                                    )}
                                    <h3 className="text-3xl font-serif font-quran text-emerald-400">{item.text}</h3>
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
                            <div
                                id={`ayah-${item.id}`}
                                key={item.id}
                                className={`w-full p-6 lg:p-8 rounded-3xl border transition-all duration-300 ${isActive ? 'bg-slate-900 border-emerald-500 shadow-2xl' : 'bg-slate-900/20 border-slate-800 hover:border-slate-700'}`}
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
                                    <p
                                        className={`text-right text-4xl lg:text-5xl font-bold leading-[2.3] font-serif font-quran ${isActive ? 'text-emerald-100' : 'text-slate-300'}`}
                                    >
                                        {displayText}
                                    </p>
                                </div>

                                <div className="space-y-2 border-t border-slate-800/50 pt-4">
                                    <p className="text-right text-xl font-serif font-quran text-slate-300" dir="rtl">{item.text_urdu}</p>
                                    <p className="text-slate-500 text-sm lg:text-base">{item.text_english}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* STICKY PLAYER */}
        <div className={`fixed bottom-0 left-0 right-0 lg:left-80 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 p-4 transition-transform duration-300 z-40 flex items-center justify-between ${showStickyPlay ? 'translate-y-0' : 'translate-y-full'}`}>
             <div className="flex flex-col">
                 <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Now Playing</span>
                 <span className="font-serif font-quran text-emerald-400 text-lg truncate max-w-[200px] lg:max-w-md">
                    {getHeaderTitle()} {currentAyahIndex > -1 ? `- Ayah ${currentAyahIndex + 1}` : ''}
                 </span>
             </div>
             <div className="flex items-center gap-4">
                <button
                    onClick={() => playTrack(currentAyahIndex - 1)}
                    disabled={currentAyahIndex <= 0}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <button
                    onClick={toggleGlobalPlay}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition-colors"
                >
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                    )}
                </button>
                <button
                    onClick={() => playTrack(currentAyahIndex + 1)}
                    className="p-2 text-slate-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
             </div>
        </div>

        {/* SETTINGS MODAL */}
        {isSettingsOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Settings</h3>
                        <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Arabic Font Style</h4>
                        <div className="space-y-3">
                            {FONT_OPTIONS.map((font) => (
                                <label key={font.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors">
                                    <input
                                        type="radio"
                                        name="font"
                                        value={font.id}
                                        checked={selectedFont.id === font.id}
                                        onChange={() => setSelectedFont(font)}
                                        className="w-5 h-5 text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                                    />
                                    <div className="flex-1">
                                        <span className="block text-sm font-medium text-white">{font.name}</span>
                                        <span className="block text-2xl mt-1 text-slate-400" style={{ fontFamily: font.family }}>
                                            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                        <button
                            onClick={() => setIsSettingsOpen(false)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}