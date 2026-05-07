import {
  WidgetLocation,
  declareIndexPlugin,
  ReactRNPlugin,
  SetRemType,
} from "@remnote/plugin-sdk";
import "../style.css";
import {
  powerupCode,
  SLOT_GRAMMAR,
  SLOT_PRONUNCIATION,
  SLOT_AUDIO,
  SLOT_DEFINITION,
  SLOT_EXAMPLE,
  SLOT_SYNONYMS,
  SLOT_ANTONYMS,
  SLOT_SOURCE,
  SETTING_ROOT_REM,
} from "../lib/constants";
import { log } from "../lib/logging";

async function onActivate(plugin: ReactRNPlugin) {
  // ─── Register the Dictionary Powerup (8 slots) ───
  await plugin.app.registerPowerup({
    name: "Eng Dictionary",
    code: powerupCode,
    description: "A word entry from the dictionary",
    options: {
      slots: [
        { code: SLOT_GRAMMAR, name: "Grammar" },
        { code: SLOT_PRONUNCIATION, name: "Pronunciation" },
        { code: SLOT_AUDIO, name: "Audio" },
        { code: SLOT_DEFINITION, name: "Definition" },
        { code: SLOT_EXAMPLE, name: "Example" },
        { code: SLOT_SYNONYMS, name: "Synonyms" },
        { code: SLOT_ANTONYMS, name: "Antonyms" },
        { code: SLOT_SOURCE, name: "Source" },
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
      widgetTabTitle: "English Dictionary",
    }
  );

  // ─── Register Popup Widgets ───

  // Word input (user types a word → fetches → opens picker)
  await plugin.app.registerWidget(
    "dictionary_word_input",
    WidgetLocation.Popup,
    { dimensions: { width: 440, height: "auto" } }
  );

  // Definition picker (user selects which definition to import)
  await plugin.app.registerWidget(
    "cambridge_definition_picker",
    WidgetLocation.Popup,
    { dimensions: { width: 560, height: "auto" } }
  );

  // ─── Register Settings ───
  await plugin.settings.registerStringSetting({
    id: SETTING_ROOT_REM,
    title: "Dictionary Root Rem",
    description:
      "Name of the Rem under which imported words will be created. Create a Rem with this exact name first.",
    defaultValue: "English Dictionary",
  });

  // ─── Register Commands ───

  // Look up a word — opens the word input popup
  await plugin.app.registerCommand({
    id: "cambridge-search",
    name: "Dictionary: Look Up Word",
    description: "Look up an English word and choose a definition to import",
    action: async () => {
      await plugin.widget.openPopup("dictionary_word_input");
    },
  });

  // Debug: remove legacy "Cambridge Dictionary" powerup Rem
  await plugin.app.registerCommand({
    id: "cambridge-cleanup-slots",
    name: "Dictionary: Remove Legacy Powerup (Debug)",
    description:
      "Strips the old Cambridge Dictionary powerup from all tagged Rems and attempts to delete the legacy powerup Rem.",
    action: async () => {
      const confirmed = confirm(
        "⚠️ Remove Legacy Powerup\n\n" +
        "This will remove the old Cambridge Dictionary powerup tag from all tagged Rems, " +
        "then attempt to delete the legacy powerup Rem.\n\n" +
        "Continue?"
      );
      if (!confirmed) return;

      console.group("[Dict Cleanup] Starting cleanup");

      // ── Phase 1: strip legacy "Cambridge Dictionary" powerup ─────────────────
      const LEGACY_CODE = "cambridge_dictionary";
      console.log("[Dict Cleanup] Phase 1: looking for legacy 'Cambridge Dictionary' powerup Rem...");
      const legacyRem = await plugin.rem.findByName(["Cambridge Dictionary"], null);
      if (!legacyRem) {
        console.log("[Dict Cleanup] Phase 1: not found — already cleaned up. Skipping phase 1.");
        await plugin.app.toast("Legacy 'Cambridge Dictionary' Rem not found — already cleaned up.");
      } else {
        console.log(`[Dict Cleanup] Phase 1: found legacy powerup Rem (id=${legacyRem._id})`);

        const taggedRems = (await legacyRem.taggedRem()) || [];
        console.log(`[Dict Cleanup] Phase 1: ${taggedRems.length} Rem(s) still tagged with legacy powerup`);
        await plugin.app.toast(`Found ${taggedRems.length} tagged Rem(s). Cleaning...`);

        let removed = 0;
        for (const rem of taggedRems) {
          try {
            await rem.removePowerup(LEGACY_CODE);
            removed++;
            console.log(`[Dict Cleanup] Phase 1: removed legacy tag from Rem ${rem._id}`);
          } catch (e) {
            console.error(`[Dict Cleanup] Phase 1: failed to remove legacy tag from Rem ${rem._id}:`, e);
          }
        }

        try {
          await legacyRem.setType(SetRemType.DEFAULT_TYPE);
          await legacyRem.remove();
          console.log("[Dict Cleanup] Phase 1: deleted legacy powerup Rem");
          await plugin.app.toast(`✅ Stripped ${removed} tag(s) and deleted the legacy powerup Rem.`);
        } catch (e) {
          console.error("[Dict Cleanup] Phase 1: could not delete legacy powerup Rem:", e);
          await plugin.app.toast(
            `Stripped ${removed} tag(s). Could not delete the powerup Rem — you may need to delete it manually.`
          );
        }
        console.log(`[Dict Cleanup] Phase 1 done: ${removed}/${taggedRems.length} Rems untagged`);
        log(plugin, `Legacy cleanup done: ${removed} Rems untagged.`);
      }

      // ── Phase 2: remove orphaned slots from "Eng Dictionary" words ───────────
      const CURRENT_SLOT_NAMES = new Set([
        "Grammar", "Pronunciation", "Audio", "Definition",
        "Example", "Synonyms", "Antonyms", "Source",
      ]);
      console.log("[Dict Cleanup] Phase 2: looking for 'Eng Dictionary' powerup Rem...");
      const engDictPowerupRem = await plugin.rem.findByName(["Eng Dictionary"], null);
      if (!engDictPowerupRem) {
        console.warn("[Dict Cleanup] Phase 2: 'Eng Dictionary' powerup Rem not found — skipping.");
      } else {
        console.log(`[Dict Cleanup] Phase 2: found powerup Rem (id=${engDictPowerupRem._id})`);
        const wordRems = (await engDictPowerupRem.taggedRem()) || [];
        console.log(`[Dict Cleanup] Phase 2: ${wordRems.length} word Rem(s) to inspect`);

        let removedSlots = 0;
        for (const wordRem of wordRems) {
          const wordText = wordRem.text
            ? await plugin.richText.toString(wordRem.text)
            : wordRem._id;
          const children = await wordRem.getChildrenRem();
          console.group(`[Dict Cleanup] Phase 2: word "${wordText}" — ${children.length} child(ren)`);
          for (const child of children) {
            const text = child.text
              ? await plugin.richText.toString(child.text)
              : "";
            if (!text) {
              console.log(`  skip (empty text) id=${child._id}`);
            } else if (CURRENT_SLOT_NAMES.has(text)) {
              console.log(`  keep "${text}" (current slot)`);
            } else {
              console.warn(`  remove "${text}" (legacy slot, id=${child._id})`);
              await child.remove();
              removedSlots++;
            }
          }
          console.groupEnd();
        }

        console.log(`[Dict Cleanup] Phase 2 done: ${removedSlots} legacy slot(s) removed across ${wordRems.length} word(s)`);
        if (removedSlots > 0) {
          await plugin.app.toast(`✅ Removed ${removedSlots} legacy slot(s) from Eng Dictionary words.`);
        }
      }

      console.log("[Dict Cleanup] All phases complete");
      console.groupEnd();
    },
  });

  log(plugin, "English Dictionary plugin activated.");
}

async function onDeactivate(_: ReactRNPlugin) { }

declareIndexPlugin(onActivate, onDeactivate);
