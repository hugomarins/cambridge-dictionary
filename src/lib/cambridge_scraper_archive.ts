/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                      ARCHIVED / DORMANT                        ║
 * ║                                                                ║
 * ║  This file contains the original Cambridge Dictionary scraping ║
 * ║  logic. It is NOT currently used — all active fetching goes    ║
 * ║  through dictionaryapi.dev in ../scraper.ts.                   ║
 * ║                                                                ║
 * ║  Kept for future investigation: the Anki add-on is able to    ║
 * ║  scrape Cambridge directly, possibly because it runs as a     ║
 * ║  native desktop app (no CORS). If RemNote re-enables native   ║
 * ║  mode, this code can be revived.                               ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { CambridgeWordEntry } from "./models";

export const CAMBRIDGE_BASE_URL =
  "https://dictionary.cambridge.org/dictionary/english/";

// ─── Approach 1: Direct Fetch (blocked by CORS in browser context) ────────────

/**
 * Attempt to fetch directly from Cambridge.
 * This WILL fail with a CORS error when running inside a browser-based plugin.
 * Only works in native/desktop contexts (like Anki).
 */
export async function fetchCambridgeDirect(
  word: string
): Promise<string | null> {
  const url = CAMBRIDGE_BASE_URL + encodeURIComponent(word.toLowerCase());
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    console.error("[cambridge_scraper_archive] Direct fetch failed (likely CORS):", e);
    return null;
  }
}

// ─── Approach 2: CORS Proxy (allorigins, etc.) ────────────────────────────────

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

/**
 * Attempt to fetch Cambridge page HTML via a CORS proxy.
 * Proxies are unreliable — they may block, rate-limit, or go offline.
 */
export async function fetchCambridgeViaProxy(
  word: string
): Promise<string | null> {
  const targetUrl = CAMBRIDGE_BASE_URL + encodeURIComponent(word.toLowerCase());

  for (const makeProxyUrl of CORS_PROXIES) {
    try {
      const res = await fetch(makeProxyUrl(targetUrl));
      if (res.ok) return await res.text();
    } catch {
      continue;
    }
  }

  console.warn("[cambridge_scraper_archive] All CORS proxies failed.");
  return null;
}

// ─── HTML Parsing (DOMParser-based) ───────────────────────────────────────────

/**
 * Parse Cambridge Dictionary HTML page into CambridgeWordEntry[].
 *
 * This mirrors the Anki add-on's parsing logic. The HTML selectors are:
 *   - .pos-header for word title, pronunciation, audio
 *   - .def-block for each definition
 *   - .dexamp for examples
 *   - .dimg for images
 *
 * NOTE: These selectors may break if Cambridge updates their HTML structure.
 */
export function parseCambridgeHtml(html: string): CambridgeWordEntry[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const entries: CambridgeWordEntry[] = [];

  const dictEntries = doc.querySelectorAll(".pr.entry-body__el");

  dictEntries.forEach((dictEntry) => {
    // Part of speech
    const posHeader = dictEntry.querySelector(".pos-header");
    const partOfSpeech = posHeader?.querySelector(".pos.dpos")?.textContent?.trim() || "";
    const gramCode = posHeader?.querySelector(".gram.dpos-g")?.textContent?.trim() || "";
    const wordTitle = posHeader?.querySelector(".hw.dhw")?.textContent?.trim() || "";

    // Pronunciation
    const ukPron = dictEntry.querySelector(".uk .pron .ipa.dipa")?.textContent?.trim() || "";
    const usPron = dictEntry.querySelector(".us .pron .ipa.dipa")?.textContent?.trim() || "";

    // Audio URLs
    const ukAudioSrc = dictEntry.querySelector(".uk source[type='audio/mpeg']")?.getAttribute("src") || "";
    const usAudioSrc = dictEntry.querySelector(".us source[type='audio/mpeg']")?.getAttribute("src") || "";
    const ukAudio = ukAudioSrc ? `https://dictionary.cambridge.org${ukAudioSrc}` : "";
    const usAudio = usAudioSrc ? `https://dictionary.cambridge.org${usAudioSrc}` : "";

    // Definitions
    const defBlocks = dictEntry.querySelectorAll(".def-block.ddef_block");

    defBlocks.forEach((defBlock) => {
      const definition = defBlock.querySelector(".def.ddef_d")?.textContent?.trim() || "";
      const senseId = defBlock.getAttribute("data-wl-senseid") || "";

      // Examples
      const exampleEls = defBlock.querySelectorAll(".examp.dexamp");
      const examples: string[] = [];
      exampleEls.forEach((el) => {
        const text = el.textContent?.trim();
        if (text) examples.push(text);
      });

      // Image
      const imgEl = defBlock.querySelector(".dimg img");
      const image = imgEl?.getAttribute("src") || "";
      const fullImage = image && !image.startsWith("http")
        ? `https://dictionary.cambridge.org${image}`
        : image;

      // Usage / level label
      const usageLabel = defBlock.querySelector(".def-info .epp-xref")?.textContent?.trim() || "";

      // General meaning heading (e.g. "TYPICAL")
      const generalEl = defBlock.closest(".dsense")?.querySelector(".dsense_h .guideword span");
      const general = generalEl?.textContent?.trim() || "";

      entries.push({
        wordDictionaryId: "dataset_cald4",
        wordDictionary: "Cambridge Advanced Learner's Dictionary",
        wordTitle,
        wordPartOfSpeech: gramCode ? `${partOfSpeech} ${gramCode}` : partOfSpeech,
        wordProUk: ukPron ? `UK /${ukPron}/` : "",
        wordProUs: usPron ? `US /${usPron}/` : "",
        wordUkMedia: ukAudio,
        wordUsMedia: usAudio,
        wordImage: fullImage,
        wordGeneral: general,
        wordSpecific: definition,
        wordSpecificGram: "",
        wordExamples: examples,
        usage: usageLabel,
        senseId,
      });
    });
  });

  return entries;
}

// ─── Combined Fetch + Parse ───────────────────────────────────────────────────

/**
 * Full Cambridge fetch pipeline:
 *   1. Try direct fetch (works only in native mode)
 *   2. Fall back to CORS proxy
 *   3. Parse the resulting HTML
 *
 * Returns empty array on failure.
 */
export async function fetchFromCambridge(
  word: string
): Promise<CambridgeWordEntry[]> {
  // Try direct first (for native mode)
  let html = await fetchCambridgeDirect(word);

  // Fall back to proxy
  if (!html) {
    html = await fetchCambridgeViaProxy(word);
  }

  if (!html) return [];

  try {
    return parseCambridgeHtml(html);
  } catch (e) {
    console.error("[cambridge_scraper_archive] HTML parse error:", e);
    return [];
  }
}
