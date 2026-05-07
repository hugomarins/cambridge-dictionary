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

      const LEGACY_CODE = "cambridge_dictionary";
      const legacyRem = await plugin.rem.findByName(["Cambridge Dictionary"], null);
      if (!legacyRem) {
        await plugin.app.toast("Legacy 'Cambridge Dictionary' Rem not found — already cleaned up.");
        return;
      }

      // Strip the tag from any still-tagged Rems
      const taggedRems = (await legacyRem.taggedRem()) || [];
      await plugin.app.toast(`Found ${taggedRems.length} tagged Rem(s). Cleaning...`);

      let removed = 0;
      for (const rem of taggedRems) {
        try {
          await rem.removePowerup(LEGACY_CODE);
          removed++;
        } catch (e) {
          console.error(`Failed to remove powerup from Rem ${rem._id}:`, e);
        }
      }

      // Attempt to delete the legacy powerup Rem
      try {
        await legacyRem.setType(SetRemType.DEFAULT_TYPE);
        await legacyRem.remove();
        await plugin.app.toast(
          `✅ Stripped ${removed} tag(s) and deleted the legacy powerup Rem.`
        );
      } catch (e) {
        console.error("Failed to delete legacy powerup Rem:", e);
        await plugin.app.toast(
          `Stripped ${removed} tag(s). Could not delete the powerup Rem — you may need to delete it manually.`
        );
      }
      log(plugin, `Legacy cleanup done: ${removed} Rems untagged.`);
    },
  });

  log(plugin, "English Dictionary plugin activated.");
}

async function onDeactivate(_: ReactRNPlugin) { }

declareIndexPlugin(onActivate, onDeactivate);
