/**
 * Cambridge Dictionary Scraper (via dictionaryapi.dev)
 *
 * Uses the free Dictionary API (https://dictionaryapi.dev/) which returns
 * CORS-safe JSON data. Maps the response to CambridgeWordEntry for
 * compatibility with the rest of the plugin.
 */

import { CambridgeWordEntry } from "./models";

export const API_BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

// Raw API response types
interface ApiDefinition {
  definition: string;
  synonyms: string[];
  antonyms: string[];
  example?: string;
}

interface ApiMeaning {
  partOfSpeech: string;
  definitions: ApiDefinition[];
  synonyms: string[];
  antonyms: string[];
}

interface ApiPhonetic {
  text?: string;
  audio?: string;
}

interface ApiWord {
  word: string;
  phonetic?: string;
  phonetics: ApiPhonetic[];
  meanings: ApiMeaning[];
}

/**
 * Map dictionaryapi.dev response to CambridgeWordEntry[]
 * Each definition becomes its own entry (one Rem per definition).
 */
export function mapApiResponseToEntries(data: ApiWord[]): CambridgeWordEntry[] {
  const entries: CambridgeWordEntry[] = [];

  for (const wordData of data) {
    // Pick the best IPA text
    const ipa =
      wordData.phonetic ||
      wordData.phonetics.find((p) => p.text)?.text ||
      "";

    // Pick audio URL (prefer US mp3)
    const audioUrl =
      wordData.phonetics.find((p) => p.audio && p.audio.includes("-us"))?.audio ||
      wordData.phonetics.find((p) => p.audio && p.audio.length > 0)?.audio ||
      "";

    for (const meaning of wordData.meanings) {
      for (const def of meaning.definitions) {
        entries.push({
          wordTitle: wordData.word,
          wordDictionary: "Free Dictionary API",
          wordDictionaryId: "freedictionary",
          wordPartOfSpeech: meaning.partOfSpeech,
          wordProUk: ipa,
          wordProUs: ipa,
          wordUkMedia: audioUrl,
          wordUsMedia: audioUrl,
          wordGeneral: meaning.partOfSpeech,
          wordSpecific: def.definition,
          wordSpecificGram: "",
          wordExamples: def.example ? [def.example] : [],
          wordImage: "",
          usage: "",
          senseId: "",
        });
      }
    }
  }

  return entries;
}

/**
 * Fetch definitions for a word from the API.
 * Returns an empty array if the word is not found.
 */
export async function fetchWordDefinitions(
  word: string
): Promise<CambridgeWordEntry[]> {
  const clean = word.trim().toLowerCase().replace(/'/g, "-");
  const url = API_BASE_URL + encodeURIComponent(clean);
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: ApiWord[] = await res.json();
    return mapApiResponseToEntries(data);
  } catch {
    return [];
  }
}

/**
 * Extract a word from a Cambridge Dictionary URL and look it up via the API.
 * e.g. https://dictionary.cambridge.org/dictionary/english/cranky → "cranky"
 */
export async function fetchWordFromUrl(
  url: string
): Promise<CambridgeWordEntry[]> {
  // Extract the word slug from the URL path
  const match = url.match(/\/dictionary\/english\/([^/?#]+)/);
  const word = match ? match[1] : null;
  if (!word) return [];
  return fetchWordDefinitions(word);
}

/**
 * Find a word entry matching a specific sense ID (stub — not used when API-backed).
 */
export function findWordBySenseId(
  entries: CambridgeWordEntry[],
  _senseId: string
): CambridgeWordEntry | undefined {
  return entries[0];
}
