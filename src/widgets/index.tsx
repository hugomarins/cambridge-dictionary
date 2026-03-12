import {
  WidgetLocation,
  declareIndexPlugin,
  ReactRNPlugin,
} from "@remnote/plugin-sdk";
import "../style.css";
import {
  CAMBRIDGE_POWERUP_CODE,
  SLOT_WORD,
  SLOT_GRAMMAR,
  SLOT_PRONUNCIATION,
  SLOT_DEFINITION,
  SLOT_MEANING,
  SLOT_EXAMPLES,
  SLOT_AUDIO,
  SLOT_PICTURE,
  SETTING_COOKIE,
  SETTING_PRONUNCIATION_UK,
  SETTING_PRONUNCIATION_US,
  SETTING_WORDLIST_IDS,
  SETTING_ROOT_REM,
} from "../lib/constants";
import { fetchWordDefinitions, fetchWordFromUrl, findWordBySenseId } from "../lib/scraper";
import { fetchWordlistEntries } from "../lib/wordlist";
import { createWordRem, createMultipleWordRems } from "../lib/rem-creator";
import { log } from "../lib/logging";

async function onActivate(plugin: ReactRNPlugin) {
  // ─── Register the Cambridge Dictionary Powerup ───
  await plugin.app.registerPowerup({
    name: "Cambridge Dictionary",
    code: CAMBRIDGE_POWERUP_CODE,
    description: "A word entry imported from Cambridge Dictionary",
    options: {
      slots: [
        { code: SLOT_WORD, name: "Word" },
        { code: SLOT_GRAMMAR, name: "Grammar" },
        { code: SLOT_PRONUNCIATION, name: "Pronunciation" },
        { code: SLOT_DEFINITION, name: "Definition" },
        { code: SLOT_MEANING, name: "Meaning" },
        { code: SLOT_EXAMPLES, name: "Examples" },
        { code: SLOT_AUDIO, name: "Audio" },
        { code: SLOT_PICTURE, name: "Picture" },
      ],
    },
  });

  // ─── Register the Selected Text Widget ───
  await plugin.app.registerWidget(
    "selected_text_cambridge",
    WidgetLocation.SelectedTextMenu,
    {
      dimensions: { height: "auto", width: "100%" },
      widgetTabIcon: `${plugin.rootURL}cambridge.svg`,
      widgetTabTitle: "Cambridge Dictionary",
    }
  );

  // ─── Register Settings ───
  await plugin.settings.registerStringSetting({
    id: SETTING_ROOT_REM,
    title: "Cambridge Dictionary Root Rem",
    description:
      "Name of the Rem under which imported words will be created. Create a Rem with this exact name first.",
    defaultValue: "Cambridge Dictionary",
  });

  await plugin.settings.registerStringSetting({
    id: SETTING_COOKIE,
    title: "Cambridge Cookie",
    description:
      'Session cookie for Cambridge Plus (needed for wordlist import). To get it:\n1. Open dictionary.cambridge.org and sign in\n2. Open DevTools (F12) → Application → Cookies → dictionary.cambridge.org\n3. Copy all cookie values as a single string (name1=value1; name2=value2; ...)',
  });

  await plugin.settings.registerBooleanSetting({
    id: SETTING_PRONUNCIATION_UK,
    title: "Show UK Pronunciation",
    description: "Include UK IPA pronunciation when importing words",
    defaultValue: true,
  });

  await plugin.settings.registerBooleanSetting({
    id: SETTING_PRONUNCIATION_US,
    title: "Show US Pronunciation",
    description: "Include US IPA pronunciation when importing words",
    defaultValue: true,
  });

  await plugin.settings.registerStringSetting({
    id: SETTING_WORDLIST_IDS,
    title: "Wordlist IDs",
    description:
      "Comma-separated Cambridge Plus wordlist IDs for batch import. Example: 21215803,21215804",
  });

  // ─── Register Commands ───

  // Search Word command
  await plugin.app.registerCommand({
    id: "cambridge-search",
    name: "Cambridge: Search Word",
    description: "Look up a word on Cambridge Dictionary and import definitions",
    action: async () => {
      const word = window.prompt(
        "Enter a word to look up on Cambridge Dictionary:"
      );
      if (!word) return;

      log(plugin, `Searching for "${word}"...`, true);

      const entries = await fetchWordDefinitions(word);
      if (entries.length === 0) {
        log(plugin, `No definitions found for "${word}" on Cambridge Dictionary.`, true);
        return;
      }

      // For now, import all definitions. The user can also use the
      // selected-text widget for single definitions.
      const count = await createMultipleWordRems(plugin, entries);
      log(plugin, `Imported ${count} definition(s) for "${word}".`, true);
    },
  });

  // Import from URL command
  await plugin.app.registerCommand({
    id: "cambridge-from-url",
    name: "Cambridge: Import from URL",
    description:
      "Import word definitions from a Cambridge Dictionary URL",
    action: async () => {
      const url = window.prompt(
        "Enter a Cambridge Dictionary URL (e.g. https://dictionary.cambridge.org/dictionary/english/example):"
      );
      if (!url) return;

      if (!url.includes("dictionary.cambridge.org")) {
        log(
          plugin,
          "Please provide a valid Cambridge Dictionary URL.",
          true
        );
        return;
      }

      log(plugin, "Fetching definitions from URL...", true);

      const entries = await fetchWordFromUrl(url);
      if (entries.length === 0) {
        log(plugin, "No definitions found at that URL.", true);
        return;
      }

      const count = await createMultipleWordRems(plugin, entries);
      log(plugin, `Imported ${count} definition(s) from URL.`, true);
    },
  });

  // Import Wordlist command
  await plugin.app.registerCommand({
    id: "cambridge-import-wordlist",
    name: "Cambridge: Import Wordlist",
    description:
      "Import all words from your Cambridge Plus wordlists (requires cookie and wordlist IDs in settings)",
    action: async () => {
      const cookie = (await plugin.settings.getSetting(SETTING_COOKIE)) as
        | string
        | undefined;
      if (!cookie) {
        log(
          plugin,
          "Please set your Cambridge cookie in the plugin settings first.",
          true
        );
        return;
      }

      const wordlistIdsStr = (await plugin.settings.getSetting(
        SETTING_WORDLIST_IDS
      )) as string | undefined;
      if (!wordlistIdsStr) {
        log(
          plugin,
          "Please set your wordlist IDs in the plugin settings first.",
          true
        );
        return;
      }

      const wordlistIds = wordlistIdsStr
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      if (wordlistIds.length === 0) {
        log(plugin, "No valid wordlist IDs found in settings.", true);
        return;
      }

      let totalImported = 0;
      for (const wlId of wordlistIds) {
        log(plugin, `Fetching wordlist ${wlId}...`, true);

        const wordlistEntries = await fetchWordlistEntries(wlId, cookie);
        log(
          plugin,
          `Found ${wordlistEntries.length} words in wordlist ${wlId}. Fetching definitions...`,
          true
        );

        for (const wlEntry of wordlistEntries) {
          // Fetch the full page for this word
          const wordEntries = await fetchWordFromUrl(wlEntry.wordUrl);

          if (wordEntries.length > 0) {
            // Try to match by sense ID first
            const matched = findWordBySenseId(wordEntries, wlEntry.senseId);
            if (matched) {
              const success = await createWordRem(plugin, matched);
              if (success) totalImported++;
            } else if (wordEntries.length > 0) {
              // Fall back to importing the first definition
              const success = await createWordRem(plugin, wordEntries[0]);
              if (success) totalImported++;
            }
          }
        }
      }

      log(
        plugin,
        `Wordlist import complete! Imported ${totalImported} definitions.`,
        true
      );
    },
  });

  log(plugin, "Cambridge Dictionary plugin activated.");
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
