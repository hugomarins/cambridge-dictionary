/**
 * Cambridge Plus Wordlist API Client
 *
 * Port of the Anki add-on's wordlist fetching functionality.
 * Requires a valid Cambridge session cookie for authentication.
 */

import { WordlistEntry } from "./models";
import { CAMBRIDGE_BASE_URL, USER_AGENT } from "./constants";

/**
 * Fetch all entries from a Cambridge Plus wordlist.
 *
 * Paginates through the API until no more entries are returned.
 *
 * @param wordlistId - The numeric wordlist ID
 * @param cookie - Session cookie string for Cambridge Plus authentication
 * @returns Array of wordlist entries
 */
export async function fetchWordlistEntries(
  wordlistId: string,
  cookie: string
): Promise<WordlistEntry[]> {
  const entries: WordlistEntry[] = [];

  for (let page = 1; page < 100; page++) {
    const url = `${CAMBRIDGE_BASE_URL}/plus/wordlist/${wordlistId}/entries/${page}/`;

    try {
      const response = await fetch(url, {
        headers: {
          Host: "dictionary.cambridge.org",
          "Accept-Language": "en-US",
          Accept: "application/json",
          "User-Agent": USER_AGENT,
          Cookie: cookie,
        },
      });

      if (!response.ok) {
        console.error(`Wordlist fetch error: ${response.status}`);
        break;
      }

      const data = await response.json();

      if (!data || !Array.isArray(data) || data.length === 0) {
        break;
      }

      for (const item of data) {
        entries.push({
          wordlistId: item.wordlistId?.toString() || wordlistId,
          wordId: item.id,
          senseId: item.senseId || "",
          wordUrl: item.entryUrl || "",
          definition: item.definition || "",
          soundUKMp3: item.soundUKMp3 || "",
          soundUSMp3: item.soundUSMp3 || "",
          dictCode: item.dictCode || "",
          headword: item.headword || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch wordlist page:", error);
      break;
    }
  }

  return entries;
}
