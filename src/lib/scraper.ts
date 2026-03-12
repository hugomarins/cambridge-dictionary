/**
 * Cambridge Dictionary Scraper
 *
 * TypeScript port of the Anki add-on's Cambridge.py.
 * Scrapes Cambridge Dictionary HTML pages for word definitions,
 * pronunciation (IPA), audio, images, examples, and usage.
 */

import { CambridgeWordEntry } from "./models";
import { CAMBRIDGE_BASE_URL, CAMBRIDGE_DICT_URL, USER_AGENT } from "./constants";
import { prettifyString } from "./utils";

/**
 * Dictionary name mapping (same as Anki add-on)
 */
function getDictName(dictId: string): string {
  const dicts: Record<string, string> = {
    dataset_cald4: "Cambridge Advanced Learner's Dictionary & Thesaurus",
    dataset_cbed: "Cambridge Business English Dictionary",
    dataset_cacd: "Cambridge American English Dictionary",
  };
  return dicts[dictId] || "";
}

/**
 * Parse a Cambridge Dictionary HTML page and extract word entries.
 *
 * This closely mirrors the get_word_defs() method from the Anki add-on.
 */
function parseWordPage(html: string): CambridgeWordEntry[] {
  const wordData: CambridgeWordEntry[] = [];
  const wordMedia: Record<string, string> = {};

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Find all dictionary blocks (CALD4, CBED, CACD, CALD4-US)
  const dictBlocks = doc.querySelectorAll(
    'div.pr.dictionary[data-id="cald4"], ' +
      'div.pr.dictionary[data-id="cbed"], ' +
      'div.pr.dictionary[data-id="cacd"], ' +
      'div.pr.dictionary[data-id="cald4-us"]'
  );

  for (const dictBlock of Array.from(dictBlocks)) {
    // Find entries within each dictionary block
    const entries = dictBlock.querySelectorAll(
      "div.pr.entry-body__el, div.pr.idiom-block, div.entry-body__el.clrd.js-share-holder"
    );

    for (const entry of Array.from(entries)) {
      // Base entry data shared across all definitions of same entry
      const dictIdEl = dictBlock.querySelector("div.cid");
      const dictionaryId = dictIdEl?.getAttribute("id") || "";
      const dictionaryName = getDictName(dictionaryId);

      // Word title
      const titleEl = entry.querySelector("div.di-title");
      if (!titleEl) continue;
      const wordTitle = prettifyString(titleEl.textContent || "");

      // Part of speech
      const gramEl = entry.querySelector("div.posgram.dpos-g.hdib.lmr-5");
      const partOfSpeech = gramEl ? prettifyString(gramEl.textContent || "") : "";

      // UK IPA pronunciation
      let proUk = "";
      let ukMediaUrl = "";
      let ukPronEl = entry.querySelector("span.uk.dpron-i") ||
        entry.querySelector('span[class*="uk dpron-i"]');
      if (ukPronEl) {
        const ipaEl = ukPronEl.querySelector("span.ipa.dipa.lpr-2.lpl-1");
        if (ipaEl) {
          proUk = "UK " + prettifyString(ipaEl.textContent || "");
        }
        const audioEl = ukPronEl.querySelector('source[type="audio/mpeg"]');
        if (audioEl) {
          const src = audioEl.getAttribute("src") || "";
          ukMediaUrl = src.startsWith("http") ? src : CAMBRIDGE_BASE_URL + src;
        }
      }

      // US IPA pronunciation
      let proUs = "";
      let usMediaUrl = "";
      let usPronEl = entry.querySelector("span.us.dpron-i") ||
        entry.querySelector('span[class*="us dpron-i"]');
      if (usPronEl) {
        const ipaEl = usPronEl.querySelector("span.ipa.dipa.lpr-2.lpl-1");
        if (ipaEl) {
          proUs = "US " + prettifyString(ipaEl.textContent || "");
        }
        const audioEl = usPronEl.querySelector('source[type="audio/mpeg"]');
        if (audioEl) {
          const src = audioEl.getAttribute("src") || "";
          usMediaUrl = src.startsWith("http") ? src : CAMBRIDGE_BASE_URL + src;
        }
      }

      // Loop through meaning bodies
      const posBodies = entry.querySelectorAll(
        "div.pos-body, span.idiom-body.didiom-body, span.pv-body.dpv-body"
      );

      for (const posBody of Array.from(posBodies)) {
        // Sense blocks with headers (e.g. "PICTURE", "ACT")
        const senseBlocks = posBody.querySelectorAll("div.pr.dsense, div.pr.dsense ");

        for (const senseBlock of Array.from(senseBlocks)) {
          const senseHeader = senseBlock.querySelector("div.dsense_h");
          if (!senseHeader) continue;
          const generalMeaning = prettifyString(senseHeader.textContent || "");

          // Each definition block within the sense
          const defBlocks = senseBlock.querySelectorAll(
            "div.def-block.ddef_block, div.def-block.ddef_block "
          );

          for (const defBlock of Array.from(defBlocks)) {
            const defHeader = defBlock.querySelector("div.ddef_h");
            if (!defHeader) continue;

            // Image
            let imageUrl = "";
            const picEl = defBlock.querySelector("amp-img.dimg_i");
            if (picEl) {
              const imgSrc = picEl.getAttribute("src") || "";
              imageUrl = imgSrc.startsWith("http") ? imgSrc : CAMBRIDGE_BASE_URL + imgSrc;
            }

            // Sense ID
            const senseId = defBlock.getAttribute("data-wl-senseid") || "";

            // Specific grammar
            const specificGramEl = defHeader.querySelector("span.gram.dgram");
            const specificGram = specificGramEl
              ? prettifyString(specificGramEl.textContent || "")
              : "";

            // Usage label
            const usageEl = defHeader.querySelector("span.usage.dusage");
            const usage = usageEl ? prettifyString(usageEl.textContent || "") : "";

            // Definition text
            const defTextEl = defHeader.querySelector("div.def.ddef_d.db");
            const specific = defTextEl
              ? prettifyString(defTextEl.textContent || "")
              : "";

            // Examples
            const examples: string[] = [];
            const exampleEls = defBlock.querySelectorAll("div.examp.dexamp");
            for (const ex of Array.from(exampleEls)) {
              examples.push(prettifyString(ex.textContent || ""));
            }

            wordData.push({
              wordDictionaryId: dictionaryId,
              wordDictionary: dictionaryName,
              wordTitle,
              wordPartOfSpeech: partOfSpeech,
              wordProUk: proUk,
              wordProUs: proUs,
              wordUkMedia: ukMediaUrl,
              wordUsMedia: usMediaUrl,
              wordImage: imageUrl,
              wordGeneral: generalMeaning,
              wordSpecific: specific,
              wordSpecificGram: specificGram,
              wordExamples: examples,
              usage,
              senseId,
            });
          }
        }

        // Sense blocks without headers (dsense-noh)
        const noHeaderBlocks = posBody.querySelectorAll("div.pr.dsense.dsense-noh");
        for (const nhBlock of Array.from(noHeaderBlocks)) {
          const defBlocks = nhBlock.querySelectorAll(
            "div.def-block.ddef_block"
          );

          for (const defBlock of Array.from(defBlocks)) {
            const defHeader = defBlock.querySelector("div.ddef_h");
            if (!defHeader) continue;

            let imageUrl = "";
            const picEl = defBlock.querySelector("amp-img.dimg_i");
            if (picEl) {
              const imgSrc = picEl.getAttribute("src") || "";
              imageUrl = imgSrc.startsWith("http") ? imgSrc : CAMBRIDGE_BASE_URL + imgSrc;
            }

            const senseId = defBlock.getAttribute("data-wl-senseid") || "";

            const specificGramEl = defHeader.querySelector("span.gram.dgram");
            const specificGram = specificGramEl
              ? prettifyString(specificGramEl.textContent || "")
              : "";

            const usageEl = defHeader.querySelector("span.usage.dusage");
            const usage = usageEl ? prettifyString(usageEl.textContent || "") : "";

            const defTextEl = defHeader.querySelector("div.def.ddef_d.db");
            const specific = defTextEl
              ? prettifyString(defTextEl.textContent || "")
              : "";

            const examples: string[] = [];
            const exampleEls = defBlock.querySelectorAll("div.examp.dexamp");
            for (const ex of Array.from(exampleEls)) {
              examples.push(prettifyString(ex.textContent || ""));
            }

            wordData.push({
              wordDictionaryId: dictionaryId,
              wordDictionary: dictionaryName,
              wordTitle,
              wordPartOfSpeech: partOfSpeech,
              wordProUk: proUk,
              wordProUs: proUs,
              wordUkMedia: ukMediaUrl,
              wordUsMedia: usMediaUrl,
              wordImage: imageUrl,
              wordGeneral: "",
              wordSpecific: specific,
              wordSpecificGram: specificGram,
              wordExamples: examples,
              usage,
              senseId,
            });
          }
        }
      }
    }
  }

  // Sort by dictionary ID (same as Anki add-on)
  wordData.sort((a, b) => a.wordDictionaryId.localeCompare(b.wordDictionaryId));

  return wordData;
}

/**
 * Fetch HTML through a CORS proxy to bypass same-origin restrictions
 * in the RemNote plugin iframe.
 */
async function fetchWithCorsProxy(targetUrl: string): Promise<string> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Proxy fetch failed: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

/**
 * Fetch and parse word definitions from Cambridge Dictionary.
 *
 * @param word - The word to look up
 * @returns Array of word entries, or empty array if not found
 */
export async function fetchWordDefinitions(
  word: string
): Promise<CambridgeWordEntry[]> {
  const cleanWord = word.replace(/'/g, "-");
  const url = CAMBRIDGE_DICT_URL + encodeURIComponent(cleanWord);
  return fetchWordFromUrl(url);
}

/**
 * Fetch and parse word definitions from a specific Cambridge Dictionary URL.
 *
 * @param url - Full Cambridge Dictionary URL
 * @returns Array of word entries, or empty array if not found
 */
export async function fetchWordFromUrl(
  url: string
): Promise<CambridgeWordEntry[]> {
  try {
    const html = await fetchWithCorsProxy(url);
    return parseWordPage(html);
  } catch (error) {
    console.error("Failed to fetch from Cambridge Dictionary:", error);
    return [];
  }
}

/**
 * Find a word entry matching a specific sense ID (for wordlist matching).
 */
export function findWordBySenseId(
  entries: CambridgeWordEntry[],
  senseId: string
): CambridgeWordEntry | undefined {
  return entries.find((e) => e.senseId === senseId);
}
