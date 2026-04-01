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
  SLOT_DEFINITION,
  SLOT_EXAMPLES,
  SLOT_AUDIO,
  SETTING_ROOT_REM,
} from "../lib/constants";
import { log } from "../lib/logging";

async function onActivate(plugin: ReactRNPlugin) {
  // ─── Register the Cambridge Dictionary Powerup ───
  // The Rem name IS the word — no separate "Word" slot needed.
  await plugin.app.registerPowerup({
    name: "Eng Dictionary",
    code: powerupCode,
    description: "A word entry from the dictionary",
    options: {
      slots: [
        { code: SLOT_GRAMMAR, name: "Grammar" },
        { code: SLOT_PRONUNCIATION, name: "Pronunciation" },
        { code: SLOT_DEFINITION, name: "Definition" },
        { code: SLOT_EXAMPLES, name: "Examples" },
        { code: SLOT_AUDIO, name: "Audio" },
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

  // ─── Register Popup Widgets (for command input) ───
  await plugin.app.registerWidget(
    "cambridge_search_input",
    WidgetLocation.Popup,
    { dimensions: { width: 400, height: "auto" } }
  );

  await plugin.app.registerWidget(
    "cambridge_url_input",
    WidgetLocation.Popup,
    { dimensions: { width: 520, height: "auto" } }
  );

  // ─── Register Settings ───
  await plugin.settings.registerStringSetting({
    id: SETTING_ROOT_REM,
    title: "Cambridge Dictionary Root Rem",
    description:
      "Name of the Rem under which imported words will be created. Create a Rem with this exact name first.",
    defaultValue: "Cambridge Dictionary",
  });

  // ─── Register Commands ───

  // Search Word — opens popup
  await plugin.app.registerCommand({
    id: "cambridge-search",
    name: "Cambridge: Search Word",
    description: "Look up a word and import its definitions",
    action: async () => {
      await plugin.widget.openPopup("cambridge_search_input");
    },
  });

  // Import from URL — opens popup
  await plugin.app.registerCommand({
    id: "cambridge-from-url",
    name: "Cambridge: Import from URL",
    description: "Import a word from a Cambridge Dictionary URL",
    action: async () => {
      await plugin.widget.openPopup("cambridge_url_input");
    },
  });

  // Debug: nuke all Cambridge Dictionary tagged Rems (strip powerup + delete Rem)
  await plugin.app.registerCommand({
    id: "cambridge-cleanup-slots",
    name: "Cambridge: Remove All Tagged Rems (Debug)",
    description:
      "Strips the Cambridge Dictionary powerup from all tagged Rems and deletes them. Use after a schema change when old entries are no longer needed.",
    action: async () => {
      const confirmed = confirm(
        "⚠️ Remove Cambridge Dictionary Powerup Tags\n\n" +
        "This will remove the Cambridge Dictionary powerup tag from all tagged Rems (the Rems themselves are kept).\n\n" +
        "Afterwards, manually delete the [[Cambridge Dictionary]] Rem from RemNote to clear the old slot columns.\n\n" +
        "Continue?"
      );
      if (!confirmed) return;

      // Find by name — getPowerupByCode won't work since the plugin no longer
      // owns "cambridge_dictionary". findByName works on any Rem, including
      // orphaned legacy powerup Rems.
      const LEGACY_CODE = "cambridge_dictionary";
      const legacyRem = await plugin.rem.findByName(["Cambridge Dictionary"], null);
      if (!legacyRem) {
        await plugin.app.toast("Legacy 'Cambridge Dictionary' Rem not found — already deleted?");
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

      // Delete the legacy powerup Rem itself.
      // RemNote prevents removing powerup Rems — try setType(DEFAULT_TYPE) first
      // to strip the powerup designation, then remove.
      try {
        await legacyRem.setType(SetRemType.DEFAULT_TYPE);
        await legacyRem.remove();
        await plugin.app.toast(
          `✅ Stripped tag from ${removed} Rem(s) and deleted the old Cambridge Dictionary powerup.`
        );
      } catch (e) {
        console.error("Failed to delete legacy powerup Rem:", e);
        await plugin.app.toast(`Stripped ${removed} tag(s) but could not delete the powerup Rem: ${e}`);
      }
      log(plugin, `Legacy cleanup done: ${removed} Rems untagged.`);
    },
  });


  log(plugin, "Cambridge Dictionary plugin activated.");
}

async function onDeactivate(_: ReactRNPlugin) { }

declareIndexPlugin(onActivate, onDeactivate);
