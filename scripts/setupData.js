import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup for file paths in Node.js module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("⏳ Starting Quran Data Download... This may take a minute.");

// URLs for the data we need
const ARABIC_URL = "http://api.alquran.cloud/v1/quran/quran-uthmani"; // Includes Juz/Rukoo info
const URDU_URL = "http://api.alquran.cloud/v1/quran/ur.jalandhry";
const ENGLISH_URL = "http://api.alquran.cloud/v1/quran/en.sahih";

async function fetchAndMerge() {
    try {
        // 1. Fetch all 3 versions in parallel
        const [arabicRes, urduRes, englishRes] = await Promise.all([
            fetch(ARABIC_URL),
            fetch(URDU_URL),
            fetch(ENGLISH_URL)
        ]);

        const arabicData = await arabicRes.json();
        const urduData = await urduRes.json();
        const englishData = await englishRes.json();

        console.log("✅ Download Complete. Merging Data...");

        // 2. Process and Merge Data
        // We will create a clean array of 114 Surahs
        const fullQuran = arabicData.data.surahs.map((surah, sIndex) => {
            return {
                id: surah.number,
                surah_number: surah.number,
                meta: {
                    surah_name_ar: surah.name,
                    surah_name_en: surah.englishName,
                    surah_meaning: surah.englishNameTranslation,
                    type: surah.revelationType, // Meccan/Medinan
                    ayah_count: surah.ayahs.length,
                    // Standard Audio Links
                    audio_bismillah: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3"
                },
                ayahs: surah.ayahs.map((ayah, aIndex) => {
                    return {
                        id: ayah.number, // Global Ayah ID (1 to 6236)
                        ayah_number: ayah.numberInSurah,
                        text_arabic: ayah.text,
                        // Match translations by index
                        text_urdu: urduData.data.surahs[sIndex].ayahs[aIndex].text,
                        text_english: englishData.data.surahs[sIndex].ayahs[aIndex].text,
                        // Metadata for Filtering
                        juz: ayah.juz,
                        manzil: ayah.manzil,
                        page: ayah.page,
                        ruku: ayah.ruku,
                        hizbQuarter: ayah.hizbQuarter,
                        // Audio URL Construction (Alafasy 128kbps)
                        audio_url: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`
                    };
                })
            };
        });

        // 3. Save to File
        const outputPath = path.join(__dirname, '../src/data/quran_full.json');
        fs.writeFileSync(outputPath, JSON.stringify(fullQuran, null, 2));

        console.log(`🎉 SUCCESS! Full Quran saved to: src/data/quran_full.json`);
        console.log(`Total Surahs: ${fullQuran.length}`);

    } catch (error) {
        console.error("❌ Error downloading data:", error);
    }
}

fetchAndMerge();