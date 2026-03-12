/**
 * A single word entry parsed from Cambridge Dictionary.
 * Mirrors the Anki add-on's word_entry class.
 */
export interface CambridgeWordEntry {
  /** Dictionary identifier, e.g. "dataset_cald4" */
  wordDictionaryId: string;
  /** Human-readable dictionary name */
  wordDictionary: string;
  /** The headword, e.g. "example" */
  wordTitle: string;
  /** Part of speech, e.g. "noun [C]" */
  wordPartOfSpeech: string;
  /** UK IPA pronunciation, e.g. "UK /ɪɡˈzɑːm.pəl/" */
  wordProUk: string;
  /** US IPA pronunciation */
  wordProUs: string;
  /** URL to UK pronunciation audio MP3 */
  wordUkMedia: string;
  /** URL to US pronunciation audio MP3 */
  wordUsMedia: string;
  /** URL to illustration image */
  wordImage: string;
  /** General meaning heading, e.g. "TYPICAL" */
  wordGeneral: string;
  /** Specific definition text */
  wordSpecific: string;
  /** Specific grammar info for the definition */
  wordSpecificGram: string;
  /** Example sentences */
  wordExamples: string[];
  /** Usage label, e.g. "formal", "informal" */
  usage: string;
  /** Cambridge sense ID for matching with wordlist entries */
  senseId: string;
}

/**
 * An entry from a Cambridge Plus wordlist.
 * Mirrors the Anki add-on's wordlist_entry class.
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
