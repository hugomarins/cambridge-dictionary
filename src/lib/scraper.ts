/**
 * Cambridge Dictionary Plugin — API Fetcher (via dictionaryapi.dev)
 *
 * Uses the free Dictionary API (https://dictionaryapi.dev/) which returns
 * CORS-safe JSON data. Maps the response to CambridgeWordEntry for
 * compatibility with the rest of the plugin.
 */

import { CambridgeWordEntry } from "./models";

export const API_BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
export const CAMBRIDGE_DICT_URL =
  "https://dictionary.cambridge.org/dictionary/english/";

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
  /** Top-level synonyms for the whole part of speech */
  synonyms: string[];
  /** Top-level antonyms for the whole part of speech */
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
 * Map dictionaryapi.dev response to CambridgeWordEntry[].
 * One entry per definition. Examples are collected from ALL definitions
 * in the same part-of-speech group and included on each entry for richness.
 */
export function mapApiResponseToEntries(data: ApiWord[]): CambridgeWordEntry[] {
  const entries: CambridgeWordEntry[] = [];

  for (const wordData of data) {
    // Best available IPA
    const ipa =
      wordData.phonetic ||
      wordData.phonetics.find((p) => p.text)?.text ||
      "";

    // Prefer UK audio (no region tag), then US, then any audio
    const ukAudio =
      wordData.phonetics.find(
        (p) => p.audio && p.audio.includes("-uk")
      )?.audio ||
      wordData.phonetics.find(
        (p) => p.audio && !p.audio.includes("-us") && !p.audio.includes("-au")
      )?.audio ||
      "";

    const usAudio =
      wordData.phonetics.find((p) => p.audio && p.audio.includes("-us"))
        ?.audio ||
      wordData.phonetics.find((p) => p.audio && p.audio.length > 0)?.audio ||
      "";

    for (const meaning of wordData.meanings) {
      // Collect ALL examples across all definitions for this part of speech
      const allExamples = meaning.definitions
        .flatMap((d) => (d.example ? [d.example] : []));

      // Synonyms / antonyms — merge meaning-level and definition-level
      const allSynonyms = [
        ...meaning.synonyms,
        ...meaning.definitions.flatMap((d) => d.synonyms),
      ].filter(Boolean);
      const allAntonyms = [
        ...meaning.antonyms,
        ...meaning.definitions.flatMap((d) => d.antonyms),
      ].filter(Boolean);

      // Build extra info string (stored in usage field — maps to SLOT_EXTRA)
      const extraParts: string[] = [];
      if (allSynonyms.length)
        extraParts.push(`Synonyms: ${allSynonyms.slice(0, 5).join(", ")}`);
      if (allAntonyms.length)
        extraParts.push(`Antonyms: ${allAntonyms.slice(0, 5).join(", ")}`);
      const extra = extraParts.join(" | ");

      for (const def of meaning.definitions) {
        // Include this definition's own example first, then others from the group
        const examples = [
          ...(def.example ? [def.example] : []),
          ...allExamples.filter((e) => e !== def.example),
        ];

        entries.push({
          wordTitle: wordData.word,
          wordDictionary: "Free Dictionary API",
          wordDictionaryId: "freedictionary",
          wordPartOfSpeech: meaning.partOfSpeech,
          wordProUk: ipa,
          wordProUs: ipa,
          wordUkMedia: ukAudio || usAudio,
          wordUsMedia: usAudio || ukAudio,
          wordGeneral: meaning.partOfSpeech,
          wordSpecific: def.definition,
          wordSpecificGram: "",
          wordExamples: examples,
          // wordImage is not available in dictionaryapi.dev
          wordImage: "",
          // usage field carries extra data (synonyms/antonyms) → SLOT_EXTRA
          usage: extra,
          senseId: "",
        });
      }
    }
  }

  return entries;
}

// ─── Fetch Helpers ────────────────────────────────────────────────────────────

/**
 * Fetch definitions for a word from the API.
 * Accepts a plain English word.
 * Returns an empty array if the word is not found.
 */
export async function fetchWordDefinitions(
  word: string
): Promise<CambridgeWordEntry[]> {
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
 * If the input is a Cambridge URL:
 *   https://dictionary.cambridge.org/dictionary/english/cranky → word "cranky"
 * If the input is NOT a URL, treat it directly as the word to look up.
 */
export async function fetchWordFromUrl(
  input: string
): Promise<CambridgeWordEntry[]> {
  const trimmed = input.trim();

  // If it looks like a Cambridge URL, extract the word slug
  const urlMatch = trimmed.match(/\/dictionary\/english\/([^/?#]+)/);
  if (urlMatch) {
    return fetchWordDefinitions(urlMatch[1]);
  }

  // Otherwise, treat the whole input as the word itself
  return fetchWordDefinitions(trimmed);
}

/**
 * Find a word entry matching a specific sense ID (stub).
 */
export function findWordBySenseId(
  entries: CambridgeWordEntry[],
  _senseId: string
): CambridgeWordEntry | undefined {
  return entries[0];
}
