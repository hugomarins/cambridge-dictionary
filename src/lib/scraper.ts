/**
 * Dictionary API Fetcher (via dictionaryapi.dev)
 *
 * Uses the free Dictionary API (https://dictionaryapi.dev/) which returns
 * CORS-safe JSON data. Maps the response to DictionaryEntry[].
 */

import { DictionaryEntry } from "./models";

export const API_BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

// ─── Raw API Types ────────────────────────────────────────────────────────────

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
  sourceUrl?: string;
}

interface ApiWord {
  word: string;
  phonetic?: string;
  phonetics: ApiPhonetic[];
  meanings: ApiMeaning[];
  sourceUrls?: string[];
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

/**
 * Map dictionaryapi.dev JSON response to DictionaryEntry[].
 * One entry per definition — each maps 1:1 to a Rem with 8 powerup slots.
 */
export function mapApiResponseToEntries(data: ApiWord[]): DictionaryEntry[] {
  const entries: DictionaryEntry[] = [];

  for (const wordData of data) {
    // Best available IPA
    const ipa =
      wordData.phonetic ||
      wordData.phonetics.find((p) => p.text)?.text ||
      "";

    // Audio: prefer US, then UK, then any
    const audioUrl =
      wordData.phonetics.find((p) => p.audio && p.audio.includes("-us"))
        ?.audio ||
      wordData.phonetics.find((p) => p.audio && p.audio.includes("-uk"))
        ?.audio ||
      wordData.phonetics.find((p) => p.audio && p.audio.length > 0)?.audio ||
      "";

    // Source URL
    const sourceUrl = wordData.sourceUrls?.[0] || "";

    for (const meaning of wordData.meanings) {
      // Merge meaning-level + definition-level synonyms/antonyms, deduplicated
      const allSynonyms = [
        ...new Set([
          ...meaning.synonyms,
          ...meaning.definitions.flatMap((d) => d.synonyms),
        ]),
      ].filter(Boolean);

      const allAntonyms = [
        ...new Set([
          ...meaning.antonyms,
          ...meaning.definitions.flatMap((d) => d.antonyms),
        ]),
      ].filter(Boolean);

      for (const def of meaning.definitions) {
        entries.push({
          word: wordData.word,
          partOfSpeech: meaning.partOfSpeech,
          pronunciation: ipa,
          audioUrl,
          definition: def.definition,
          example: def.example || "",
          synonyms: allSynonyms.join(", "),
          antonyms: allAntonyms.join(", "),
          sourceUrl,
        });
      }
    }
  }

  return entries;
}

// ─── Fetch Helpers ────────────────────────────────────────────────────────────

/**
 * Fetch definitions for a plain English word.
 * Returns an empty array if the word is not found.
 */
export async function fetchWordDefinitions(
  word: string
): Promise<DictionaryEntry[]> {
  const clean = word.trim().toLowerCase().replace(/\s+/g, "-");
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
 * Accept either a Cambridge Dictionary URL or a plain English word.
 *
 * Cambridge URL → extracts word slug → looks up via API.
 * Plain word → looks up directly.
 */
export async function fetchWord(
  input: string
): Promise<DictionaryEntry[]> {
  const trimmed = input.trim();

  // If it looks like a Cambridge URL, extract the word slug
  const urlMatch = trimmed.match(/\/dictionary\/english\/([^/?#]+)/);
  if (urlMatch) {
    return fetchWordDefinitions(urlMatch[1]);
  }

  // Otherwise treat the whole input as the word
  return fetchWordDefinitions(trimmed);
}
