import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, '../src/data/quran_wbw.json');

// This is the CORRECT direct link to the single 25MB database file
const DATA_URL = "https://cdn.jsdelivr.net/npm/@kmaslesa/holy-quran-word-by-word-full-data@1.0.6/index.min.js";

console.log("🚀 STARTING DOWNLOAD: Full Word-by-Word Database...");

async function downloadAndTransform() {
    try {
        console.log("⏳ Downloading 25MB Data file... (This may take a moment)");
        
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`Download Failed: ${response.status}`);
        
        // This data is an Array of 604 Pages
        const pagesData = await response.json();
        console.log("✅ Download Complete. Transforming Data...");

        // 1. Initialize 114 Surah Buckets
        const surahsMap = new Array(114).fill(null).map((_, i) => ({
            id: i + 1,
            ayahs: []
        }));

        // 2. Flatten the Pages into Surahs
        pagesData.forEach(page => {
            if (!page.ayahs) return;

            page.ayahs.forEach(ayahItem => {
                // We need to find which Surah/Ayah this belongs to.
                // The package provides 'parentAyahVerseKey' inside the first word, e.g., "2:255"
                const firstWord = ayahItem.words && ayahItem.words[0];
                if (!firstWord || !firstWord.parentAyahVerseKey) return;

                const [surahNumStr, ayahNumStr] = firstWord.parentAyahVerseKey.split(':');
                const surahId = parseInt(surahNumStr);
                const ayahId = parseInt(ayahNumStr);

                // Construct the word list
                const cleanWords = ayahItem.words.map(w => {
                    if (w.char_type_name === "end") return null; // Skip end markers

                    // Fix Audio URL: "wbw/001_001_001.mp3" -> "https://everyayah.com/.../001001001.mp3"
                    // We strip "wbw/" and underscores to match standard format
                    let audioUrl = null;
                    if (w.audio_url) {
                        const filename = w.audio_url.replace('wbw/', '').replace(/_/g, '');
                        audioUrl = `https://everyayah.com/data/Quran_Word_by_Word/${filename}`;
                    }

                    return {
                        text: w.text,
                        translation: w.translation ? w.translation.text : "",
                        audio: audioUrl
                    };
                }).filter(Boolean);

                // Place into the correct Surah bucket
                // (surahId - 1 because array is 0-indexed)
                surahsMap[surahId - 1].ayahs.push({
                    id: ayahId,
                    words: cleanWords
                });
            });
        });

        // 3. Sort Ayahs inside each Surah (just in case pages mixed them up)
        surahsMap.forEach(surah => {
            surah.ayahs.sort((a, b) => a.id - b.id);
        });

        // 4. Save
        console.log("⚙️  Saving reorganized database...");
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(surahsMap, null, 0)); // Minimal spacing to save size

        const stats = fs.statSync(OUTPUT_FILE);
        console.log("------------------------------------------------");
        console.log(`🎉 SUCCESS! Created src/data/quran_wbw.json`);
        console.log(`📦 Final Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log("------------------------------------------------");

    } catch (error) {
        console.error("\n❌ Error:", error.message);
    }
}

downloadAndTransform();