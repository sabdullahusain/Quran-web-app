import { useState, useRef, useEffect, useMemo } from 'react';
import allSurahsData from './data/quran_full.json'; 

// --- STATIC DATA ---
const PARAH_NAMES = [
    { id: 1, ar: "الم", en: "Alif Lam Meem" }, { id: 2, ar: "سَيَقُولُ", en: "Sayaqool" }, { id: 3, ar: "تِلْكَ ٱلْرُّسُلُ", en: "Tilkal Rusull" }, { id: 4, ar: "لَنْ تَنَالُوا", en: "Lan Tana Loo" }, { id: 5, ar: "وَٱلْمُحْصَنَاتُ", en: "Wal Mohsanat" }, { id: 6, ar: "لَا يُحِبُّ ٱللَّهُ", en: "La Yuhibbullah" }, { id: 7, ar: "وَإِذَا سَمِعُوا", en: "Wa Iza Samiu" }, { id: 8, ar: "وَلَوْ أَنَّنَا", en: "Wa Lau Annana" }, { id: 9, ar: "قَالَ ٱلْمَلَأُ", en: "Qalal Malao" }, { id: 10, ar: "وَٱعْلَمُوا", en: "Wa A'lamu" }, { id: 11, ar: "يَعْتَذِرُونَ", en: "Yatazeroon" }, { id: 12, ar: "وَمَا مِنْ دَآبَّةٍ", en: "Wa Mamin Da'abat" }, { id: 13, ar: "وَمَا أُبَرِّئُ", en: "Wa Ma Ubrioo" }, { id: 14, ar: "رُبَمَا", en: "Rubama" }, { id: 15, ar: "سُبْحَانَ ٱلَّذِى", en: "Subhanallazi" }, { id: 16, ar: "قَالَ أَلَمْ", en: "Qal Alam" }, { id: 17, ar: "ٱقْتَرَبَ لِلنَّاسِ", en: "Iqtaraba Linnas" }, { id: 18, ar: "قَدْ أَفْلَحَ", en: "Qadd Aflaha" }, { id: 19, ar: "وَقَالَ ٱلَّذِينَ", en: "Wa Qalallazina" }, { id: 20, ar: "أَمَّنْ خَلَقَ", en: "A'man Khalaqa" }, { id: 21, ar: "ٱتْلُ مَا أُوحِىَ", en: "Utlu Ma Oohi" }, { id: 22, ar: "وَمَنْ يَقْنُتْ", en: "Wa Manyaqnut" }, { id: 23, ar: "وَمَا لي", en: "Wa Mali" }, { id: 24, ar: "فَمَنْ أَظْلَمُ", en: "Faman Azlam" }, { id: 25, ar: "إِلَيْهِ يُرَدُّ", en: "Elahe Yuruddo" }, { id: 26, ar: "حم", en: "Ha Meem" }, { id: 27, ar: "قَالَ فَمَا خَطْبُكُم", en: "Qala Fama Khatbukum" }, { id: 28, ar: "قَدْ سَمِعَ ٱللَّهُ", en: "Qadd Sami Allah" }, { id: 29, ar: "تَبَارَكَ ٱلَّذِى", en: "Tabarakallazi" }, { id: 30, ar: "عَمَّ يَتَسَآءَلُونَ", en: "Amma Yatasa'aloon" }
];

const RUKOO_LIST = Array.from({ length: 556 }, (_, i) => i + 1);

const safeJSONParse = (key, fallback) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        return fallback;
    }
};

const HighlightedText = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) return text;
    const terms = highlight.trim().split(/\s+/).filter(t => t.length > 0).join('|');
    const regex = new RegExp(`(${terms})`, 'gi');
    const parts = text.toString().split(regex);
    return (
        <span>
            {parts.map((part, i) => 
                regex.test(part) ? (
                    <span key={i} className="text-amber-600 dark:text-amber-400 font-bold bg-amber-200 dark:bg-amber-900/30 rounded px-0.5">{part}</span>
                ) : part
            )}
        </span>
    );
};

export default function App() {
  const [viewMode, setViewMode] = useState('surah'); 
  const [activeItem, setActiveItem] = useState(() => allSurahsData && allSurahsData.length > 0 ? allSurahsData[0] : null); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [currentAyahIndex, setCurrentAyahIndex] = useState(-99); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [theme, setTheme] = useState(() => localStorage.getItem('quran_theme') || 'dark');
  const [bookmarks, setBookmarks] = useState(() => safeJSONParse('quran_bookmarks', []));
  const [lastReadPrompt, setLastReadPrompt] = useState(null);
  const [arabicFontSize, setArabicFontSize] = useState(() => parseInt(localStorage.getItem('quran_font_size') || '3'));

  const shouldAutoAdvance = useRef(false); 
  const audioPlayer = useRef(new Audio());
  const ayahRefs = useRef({}); 
  const scrollContainerRef = useRef(null);

  // --- DATA GENERATORS (FIXED: Removed ViewMode Dependency) ---
  const generatedRukooList = useMemo(() => {
      // IMPORTANT FIX: We removed "if (viewMode !== 'ruku')"
      // This ensures the list is always ready when we click the button.
      const list = [];
      if (!allSurahsData) return [];

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
  }, []); // Empty dependency array = calculates once on mount


  useEffect(() => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('quran_theme', theme);
  }, [theme]);

  useEffect(() => {
      const savedState = safeJSONParse('quran_last_read', null);
      if (savedState) {
          setLastReadPrompt(savedState);
      }
  }, []);

  useEffect(() => {
      localStorage.setItem('quran_font_size', arabicFontSize);
      localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
  }, [arabicFontSize, bookmarks]);

  const saveLastRead = (index) => {
      if (!activeItem || index < 0 || viewMode === 'bookmarks') return;
      const stateToSave = {
          viewMode,
          activeItemId: typeof activeItem === 'object' ? activeItem.id : activeItem,
          ayahIndex: index,
          timestamp: new Date().getTime()
      };
      localStorage.setItem('quran_last_read', JSON.stringify(stateToSave));
  };

  const restoreLastRead = () => {
      if (!lastReadPrompt) return;
      setViewMode(lastReadPrompt.viewMode);
      if (lastReadPrompt.viewMode === 'surah') {
          const surah = allSurahsData.find(s => s.id === lastReadPrompt.activeItemId);
          setActiveItem(surah);
      } else if (lastReadPrompt.viewMode === 'ruku') {
          // Find the rukoo object
          const rukooObj = generatedRukooList.find(r => r.globalId === lastReadPrompt.activeItemId) || generatedRukooList[0];
          setActiveItem(rukooObj);
      } else {
          setActiveItem(lastReadPrompt.activeItemId);
      }

      setTimeout(() => {
          setCurrentAyahIndex(lastReadPrompt.ayahIndex);
          setLastReadPrompt(null);
          setIsSidebarOpen(false);
      }, 100);
  };

  const handleSidebarClick = (mode, item) => {
      stopAudio();
      setViewMode(mode);
      
      // Safety Fallback
      if (mode === 'ruku' && !item) {
          setActiveItem(generatedRukooList[0]);
      } else {
          setActiveItem(item);
      }
      
      setIsSidebarOpen(false);
      setSearchQuery("");
      if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo(0, 0);
      }
  };

  const toggleBookmark = (ayahGlobalId) => {
      if (bookmarks.includes(ayahGlobalId)) {
          setBookmarks(bookmarks.filter(id => id !== ayahGlobalId));
      } else {
          setBookmarks([...bookmarks, ayahGlobalId]);
      }
  };

  useEffect(() => {
      if (currentAyahIndex !== -99 && ayahRefs.current[currentAyahIndex] && scrollContainerRef.current) {
          const element = ayahRefs.current[currentAyahIndex];
          const targetPosition = element.offsetTop - 120; 
          scrollContainerRef.current.scrollTo({ top: targetPosition, behavior: 'smooth' });
          saveLastRead(currentAyahIndex);
      }
  }, [currentAyahIndex]);

  const filteredList = useMemo(() => {
      if (!searchQuery && viewMode !== 'bookmarks') {
          if(viewMode === 'surah') return allSurahsData;
          if(viewMode === 'parah') return PARAH_NAMES;
          if(viewMode === 'ruku') return generatedRukooList;
          return [];
      }
      
      if (viewMode === 'bookmarks') return []; 

      const q = searchQuery.toLowerCase().trim();
      if (viewMode === 'surah') {
          return allSurahsData.filter(surah => 
              surah.meta.surah_name_en.toLowerCase().includes(q) || 
              surah.meta.surah_name_ar.includes(q) ||              
              String(surah.surah_number).includes(q)                
          );
      } 
      else if (viewMode === 'parah') {
          return PARAH_NAMES.filter(p => 
              String(p.id).includes(q) || 
              p.en.toLowerCase().includes(q) || 
              p.ar.includes(q)
          );
      }
      else if (viewMode === 'ruku') {
          const parts = q.split(/\s+/);
          if (parts.length === 1 && /^\d+$/.test(parts[0])) {
              const num = parts[0];
              // Allow searching by Global ID OR Relative ID if just 1 number
              return generatedRukooList.filter(r => r.globalId.toString() === num || r.relativeNumber.toString() === num);
          }
          if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
               return generatedRukooList.filter(r => 
                   r.surahNumber.toString() === parts[0] && 
                   r.relativeNumber.toString() === parts[1]
               );
          }
          return generatedRukooList.filter(item => {
              const searchString = `${item.surahName} ${item.relativeNumber} ${item.surahNumber} ${item.surahArabic}`.toLowerCase();
              return parts.every(part => searchString.includes(part));
          });
      }
  }, [searchQuery, viewMode, generatedRukooList]);

  const displayAyahs = useMemo(() => {
    if (viewMode === 'bookmarks') {
        if (bookmarks.length === 0) return [];
        
        const bookmarkedAyahs = [];
        allSurahsData.forEach(surah => {
            const matching = surah.ayahs.filter(ayah => bookmarks.includes(ayah.id));
            if (matching.length > 0) {
                bookmarkedAyahs.push({ 
                    type: 'header', 
                    text: surah.meta.surah_name_ar, 
                    sub: surah.meta.surah_name_en, 
                    id: `head-${surah.id}`, 
                    surah_number: surah.surah_number 
                });
                bookmarkedAyahs.push(...matching);
            }
        });
        return bookmarkedAyahs;
    }

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
        // FIX: Ensure we have a valid rukoo object
        const targetGlobalId = activeItem.globalId || activeItem; 
        
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
  }, [activeItem, viewMode, bookmarks]);

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
  
  const getFontSizeClass = () => {
      switch (arabicFontSize) {
          case 1: return "text-2xl lg:text-3xl leading-loose";
          case 2: return "text-3xl lg:text-4xl leading-[2.2]";
          case 3: return "text-4xl lg:text-5xl leading-[2.5]";
          case 4: return "text-5xl lg:text-6xl leading-[2.8]";
          case 5: return "text-6xl lg:text-7xl leading-[3.0]";
          default: return "text-4xl lg:text-5xl leading-[2.5]";
      }
  };

  const getHeaderTitle = () => {
      if (viewMode === 'bookmarks') return "المفضلة";
      if (viewMode === 'surah') return activeItem?.meta?.surah_name_ar;
      if (viewMode === 'parah') return PARAH_NAMES.find(p => p.id === activeItem)?.ar || `Juz ${activeItem}`;
      if (viewMode === 'ruku') return `${activeItem?.surahArabic} - ركوع ${activeItem?.relativeNumber}`;
  }

  const getHeaderSubtitle = () => {
      if (viewMode === 'bookmarks') return "My Bookmarked Verses";
      if (viewMode === 'surah') return activeItem?.meta?.surah_name_en;
      if (viewMode === 'parah') return PARAH_NAMES.find(p => p.id === activeItem)?.en || `Recitation by Parah`;
      if (viewMode === 'ruku') return `${activeItem?.surahName} - Rukoo ${activeItem?.relativeNumber}`;
  }

  if (!allSurahsData || allSurahsData.length === 0) return <div className="h-screen flex items-center justify-center text-white bg-slate-950">Loading Data...</div>;
  
  // FIX: Handle initializing state better
  if (!activeItem && viewMode !== 'bookmarks') return <div className="h-screen flex items-center justify-center text-white bg-slate-950">Initializing...</div>;

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex overflow-hidden font-sans transition-colors duration-300">
      
      {lastReadPrompt && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
                  <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">Welcome Back</h2>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">Continue reading where you left off?</p>
                  <div className="flex gap-3">
                      <button onClick={() => setLastReadPrompt(null)} className="flex-1 py-3 rounded-xl font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">No</button>
                      <button onClick={restoreLastRead} className="flex-1 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg">Yes</button>
                  </div>
              </div>
          </div>
      )}

      {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Settings</h2>
                      <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-red-500">✕</button>
                  </div>
                  <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                      <label className="block text-slate-700 dark:text-slate-300 mb-4 font-medium">App Theme</label>
                      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          <button onClick={() => setTheme('light')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${theme === 'light' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`}>Light</button>
                          <button onClick={() => setTheme('dark')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${theme === 'dark' ? 'bg-slate-700 shadow text-white' : 'text-slate-500'}`}>Dark</button>
                      </div>
                  </div>
                  <div className="mb-4">
                      <label className="block text-slate-700 dark:text-slate-300 mb-4 font-medium">Font Size</label>
                      <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                          <button onClick={() => setArabicFontSize(Math.max(1, arabicFontSize - 1))} className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow font-bold">-</button>
                          <div className="flex-1 text-center"><span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{["Small", "Medium", "Large", "XL", "Huge"][arabicFontSize - 1]}</span></div>
                          <button onClick={() => setArabicFontSize(Math.min(5, arabicFontSize + 1))} className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow font-bold">+</button>
                      </div>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-emerald-600 py-3 rounded-xl font-bold text-white hover:bg-emerald-700 transition-colors">Done</button>
              </div>
          </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-out shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:shadow-none`}>
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-20 lg:pt-0">
            <div className="hidden lg:flex p-6 justify-between items-center border-b border-slate-200 dark:border-slate-800/50">
                 <h1 className="font-quran text-4xl font-bold text-emerald-600 dark:text-emerald-500 drop-shadow-sm">القرآن الكريم</h1>
                 <button onClick={() => setIsSettingsOpen(true)} className="text-slate-400 hover:text-emerald-500"><span className="text-2xl">⚙️</span></button>
            </div>
            <div className="lg:hidden p-4 border-b border-slate-200 dark:border-slate-800"><button onClick={() => setIsSidebarOpen(false)} className="w-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 rounded-lg font-bold">✕ Close Menu</button></div>
            <div className="p-4 pb-0">
                <button onClick={() => handleSidebarClick('bookmarks', null)} className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-colors mb-2 ${viewMode === 'bookmarks' ? 'bg-amber-500 text-white' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-900/50'}`}><span>★</span> Bookmarks {bookmarks.length > 0 && `(${bookmarks.length})`}</button>
            </div>
            <div className="p-4 pb-2">
                <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 gap-1">
                    {['surah', 'parah', 'ruku'].map(mode => (<button key={mode} onClick={() => handleSidebarClick(mode, mode === 'surah' ? allSurahsData[0] : mode === 'parah' ? 1 : generatedRukooList[0])} className={`flex-1 py-2 rounded-md text-xs font-bold capitalize transition-colors ${viewMode === mode ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>{mode}</button>))}
                </div>
            </div>
            {viewMode !== 'bookmarks' && (
                <div className="px-4 pb-4"><input type="text" placeholder={`Search ${viewMode}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            )}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 pb-20">
            {viewMode === 'surah' ? filteredList.map(surah => (
                <div key={surah.id} onClick={() => handleSidebarClick('surah', surah)} className={`p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex justify-between items-center ${activeItem?.id === surah.id ? 'bg-emerald-50 dark:bg-slate-800 border-l-4 border-l-emerald-500 pl-3' : 'pl-4'}`}>
                    <div className="flex items-center gap-3"><span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 w-8 h-8 flex items-center justify-center rounded-full"><HighlightedText text={surah.surah_number} highlight={searchQuery} /></span><div><p className={`font-medium ${activeItem?.id === surah.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}><HighlightedText text={surah.meta.surah_name_en} highlight={searchQuery} /></p><p className="text-xs text-slate-500">{surah.meta.surah_meaning}</p></div></div><span className="font-quran text-slate-500 dark:text-slate-600 text-lg"><HighlightedText text={surah.meta.surah_name_ar} highlight={searchQuery} /></span>
                </div>
            )) : viewMode === 'parah' ? filteredList.map(p => (
                <div key={p.id} onClick={() => handleSidebarClick('parah', p.id)} className={`p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex justify-between items-center ${activeItem === p.id ? 'bg-emerald-50 dark:bg-slate-800 border-l-4 border-l-emerald-500 pl-3' : 'pl-4'}`}>
                     <div className="flex items-center gap-3"><span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 w-8 h-8 flex items-center justify-center rounded-full"><HighlightedText text={p.id} highlight={searchQuery} /></span><span className={`font-bold ${activeItem === p.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}><HighlightedText text={p.en} highlight={searchQuery} /></span></div><span className="font-quran text-slate-500 dark:text-slate-600 text-lg"><HighlightedText text={p.ar} highlight={searchQuery} /></span>
                </div>
            )) : viewMode === 'ruku' ? filteredList.map((r, idx) => (
                <div key={idx} onClick={() => handleSidebarClick('ruku', r)} className={`p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex justify-between items-center ${activeItem?.globalId === r.globalId ? 'bg-emerald-50 dark:bg-slate-800 border-l-4 border-l-emerald-500 pl-3' : 'pl-4'}`}>
                     <div className="flex items-center gap-3"><span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 w-8 h-8 flex items-center justify-center rounded-full">{r.relativeNumber}</span><div><p className={`font-bold text-sm ${activeItem?.globalId === r.globalId ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}><HighlightedText text={r.surahName} highlight={searchQuery} /></p><p className="text-xs text-slate-500">Rukoo <HighlightedText text={r.relativeNumber} highlight={searchQuery} /></p></div></div><span className="font-quran text-slate-500 dark:text-slate-600 text-sm"><HighlightedText text={r.surahArabic} highlight={searchQuery} /></span>
                </div>
            )) : (
                <div className="p-8 text-center text-slate-500 text-sm">Bookmarks list is shown in the main view.</div>
            )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full pt-16 lg:pt-0 relative overflow-hidden">
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-30 shadow-sm">
             <button onClick={() => setIsSidebarOpen(true)} className="text-emerald-600 dark:text-emerald-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg></button>
             <span className="font-quran text-3xl font-bold text-emerald-600 dark:text-emerald-400">القرآن الكريم</span>
             <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-emerald-600 p-2"><span className="text-xl">⚙️</span></button>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth bg-white dark:bg-slate-950 transition-colors duration-300">
            <div className="max-w-5xl mx-auto w-full pb-32">
                <header className="text-center mb-10 mt-8 border-b border-slate-200 dark:border-slate-800 pb-10">
                    <h1 className="text-4xl lg:text-6xl font-bold text-emerald-600 dark:text-emerald-500 font-quran mb-4 leading-loose drop-shadow-sm">{getHeaderTitle()}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg mb-6">{getHeaderSubtitle()}</p>
                    {viewMode !== 'bookmarks' && (
                        <button onClick={toggleGlobalPlay} className={`px-10 py-3 rounded-full font-bold text-lg transition-all shadow-lg transform hover:scale-105 active:scale-95 min-w-[200px] ${isPlaying ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>{getMainButtonText()}</button>
                    )}
                    {viewMode === 'surah' && activeItem?.surah_number !== 9 && (<div className="mt-10 p-6 rounded-2xl inline-block transition-all duration-500"><p className={`text-3xl lg:text-5xl font-quran leading-relaxed ${currentAyahIndex === -1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-600/50 dark:text-emerald-200/50'}`}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p></div>)}
                </header>
                
                {viewMode === 'bookmarks' && displayAyahs.length === 0 && (
                    <div className="text-center py-20"><p className="text-6xl mb-4">★</p><h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Bookmarks Yet</h3><p className="text-slate-500">Click the star icon next to any verse to save it here.</p></div>
                )}

                <div className="flex flex-col gap-4">
                    {displayAyahs.map((item, realIndex) => {
                        if (item.type === 'header') {
                            return (
                                <div key={item.id} className="mt-16 mb-8 text-center border-b border-emerald-900/30 pb-6">
                                    {item.surah_number !== 9 && <p className="text-2xl font-quran text-emerald-600/60 dark:text-emerald-200/50 mb-4">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>}
                                    <h3 className="text-3xl font-quran text-emerald-600 dark:text-emerald-400">{item.text}</h3>
                                    <p className="text-sm text-slate-500">{item.sub}</p>
                                </div>
                            )
                        }
                        
                        const audioIndex = viewMode === 'bookmarks' ? -1 : displayAyahs.slice(0, realIndex + 1).filter(i => i.type !== 'header').length - 1;
                        const isActive = currentAyahIndex === audioIndex && viewMode !== 'bookmarks';
                        const isBookmarked = bookmarks.includes(item.id);

                        return (
                            <div key={item.id} ref={el => ayahRefs.current[audioIndex] = el} className={`w-full p-6 lg:p-8 rounded-3xl border transition-all duration-500 ${isActive ? 'bg-slate-50 dark:bg-slate-900 border-emerald-500 shadow-xl scale-[1.01]' : 'bg-white dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{item.surah_number}:{item.ayah_number}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => toggleBookmark(item.id)} className={`text-2xl transition-all hover:scale-110 ${isBookmarked ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`} title="Bookmark">{isBookmarked ? '★' : '☆'}</button>
                                        {viewMode !== 'bookmarks' && <button onClick={() => playSingleAyah(audioIndex)} className={`text-xs font-bold px-4 py-2 rounded transition-colors ${isActive && isPlaying ? 'bg-amber-100 dark:bg-amber-600/20 text-amber-600 dark:text-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{isActive && isPlaying ? "⏸ Pause" : "▶ Play"}</button>}
                                    </div>
                                </div>
                                <div className="mb-8 w-full"><p className={`text-right font-bold font-quran py-2 ${isActive ? 'text-emerald-700 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-300'} ${getFontSizeClass()}`}>{item.text_arabic}</p></div>
                                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/50 pt-4"><p className="text-right text-xl font-quran text-slate-600 dark:text-slate-300 leading-loose" dir="rtl">{item.text_urdu}</p><p className="text-slate-600 dark:text-slate-500 text-sm lg:text-base">{item.text_english}</p></div>
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