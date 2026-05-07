/**
 * A single dictionary word entry.
 *
 * Each field maps 1:1 to a powerup slot in RemNote.
 * Currently sourced from dictionaryapi.dev (Free Dictionary API).
 */
export interface DictionaryEntry {
  /** The headword, e.g. "example" */
  word: string;
  /** Part of speech, e.g. "noun", "verb" */
  partOfSpeech: string;
  /** IPA pronunciation text, e.g. "/ɪɡˈzɑːm.pəl/" */
  pronunciation: string;
  /** URL to pronunciation audio MP3 */
  audioUrl: string;
  /** The definition text */
  definition: string;
  /** Example sentence for this definition */
  example: string;
  /** Comma-separated synonyms */
  synonyms: string;
  /** Comma-separated antonyms */
  antonyms: string;
  /** Source URL (e.g. Wiktionary) */
  sourceUrl: string;
}

// ─── Legacy types (kept for future Cambridge scraper investigation) ───────────

/**
 * @deprecated Use DictionaryEntry instead.
 * A single word entry parsed from Cambridge Dictionary.
 * Mirrors the Anki add-on's word_entry class.
 */
export interface CambridgeWordEntry {
  wordDictionaryId: string;
  wordDictionary: string;
  wordTitle: string;
  wordPartOfSpeech: string;
  wordProUk: string;
  wordProUs: string;
  wordUkMedia: string;
  wordUsMedia: string;
  wordImage: string;
  wordGeneral: string;
  wordSpecific: string;
  wordSpecificGram: string;
  wordExamples: string[];
  usage: string;
  senseId: string;
}

/**
 * @deprecated Kept for future Cambridge Plus investigation.
 */
export interface WordlistEntry {
  wordlistId: string;
  wordId: number;
  senseId: string;
  wordUrl: string;
  definition: string;
  soundUKMp3: string;
  soundUSMp3: string;
  dictCode: string;
  headword: string;
}
