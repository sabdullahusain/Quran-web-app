import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILE_PATH = path.join(__dirname, '../src/data/quran_full.json');

console.log("🤖 Starting Auto-Detect Bismillah Removal...");

try {
    const rawData = fs.readFileSync(FILE_PATH, 'utf-8');
    const quranData = JSON.parse(rawData);
    
    // 1. AUTO-DETECT STRATEGY
    // We grab Surah 111 (Masad) and Surah 112 (Ikhlas).
    // Both start with Bismillah, but end differently.
    // The part that is IDENTICAL at the start is the Bismillah.
    
    // Note: Array index 110 is Surah 111, Index 111 is Surah 112
    const textA = quranData[110].ayahs[0].text_arabic; 
    const textB = quranData[111].ayahs[0].text_arabic;

    let detectedBismillah = "";
    
    // Loop to find the common prefix
    for (let i = 0; i < textA.length; i++) {
        if (textA[i] === textB[i]) {
            detectedBismillah += textA[i];
        } else {
            break; // Stop as soon as they differ
        }
    }

    // Trim ensures we don't leave a trailing space on the verse
    detectedBismillah = detectedBismillah.trim();

    console.log("🔍 DETECTED SYSTEM BISMILLAH:");
    console.log(`"${detectedBismillah}"`);
    
    if (detectedBismillah.length < 10) {
        throw new Error("Detection failed. The Bismillah string is too short.");
    }

    // 2. CLEANUP PROCESS
    let fixedCount = 0;

    quranData.forEach(surah => {
        // Skip Fatiha (1) and Tawbah (9)
        if (surah.surah_number === 1 || surah.surah_number === 9) return;

        if (surah.ayahs && surah.ayahs.length > 0) {
            const firstAyah = surah.ayahs[0];
            const text = firstAyah.text_arabic;

            // Check if it starts with the Detected String
            if (text.startsWith(detectedBismillah)) {
                // Remove it
                const newText = text.substring(detectedBismillah.length).trim();
                
                // Update Data
                firstAyah.text_arabic = newText;
                fixedCount++;
            }
        }
    });

    // 3. SAVE
    fs.writeFileSync(FILE_PATH, JSON.stringify(quranData, null, 2));

    console.log("------------------------------------------------");
    console.log(`✅ SUCCESS: Cleaned ${fixedCount} Surahs.`);
    
    // Verify Surah 2 (Baqarah)
    const baqarah = quranData.find(s => s.surah_number === 2).ayahs[0].text_arabic;
    console.log(`🚀 Verification (Surah 2): "${baqarah}"`); 
    console.log("------------------------------------------------");

} catch (error) {
    console.error("❌ Error:", error.message);
}