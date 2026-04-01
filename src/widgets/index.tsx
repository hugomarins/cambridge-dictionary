import {
  WidgetLocation,
  declareIndexPlugin,
  ReactRNPlugin,
} from "@remnote/plugin-sdk";
import "../style.css";
import {
  CAMBRIDGE_POWERUP_CODE,
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
    name: "Cambridge Dictionary",
    code: CAMBRIDGE_POWERUP_CODE,
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
      widgetTabTitle: "Cambridge Dictionary",
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
        "⚠️ Remove All Cambridge Dictionary Rems\n\n" +
          "This will permanently DELETE all Rems tagged with the Cambridge Dictionary powerup.\n\n" +
          "Use this to clean up test entries after a schema change.\n\n" +
          "This cannot be undone. Continue?"
      );
      if (!confirmed) return;

      const powerup = await plugin.powerup.getPowerupByCode(
        CAMBRIDGE_POWERUP_CODE
      );
      if (!powerup) {
        await plugin.app.toast("Cambridge Dictionary powerup not found.");
        return;
      }

      const taggedRems = (await powerup.taggedRem()) || [];
      if (taggedRems.length === 0) {
        await plugin.app.toast("No Cambridge Dictionary tagged Rems found.");
        return;
      }

      await plugin.app.toast(
        `Found ${taggedRems.length} Rem(s). Removing...`
      );

      let removed = 0;
      for (const rem of taggedRems) {
        try {
          // Strip the powerup first (required before deleting)
          await rem.removePowerup(CAMBRIDGE_POWERUP_CODE);
          // Then delete the Rem itself
          await rem.remove();
          removed++;
        } catch (e) {
          console.error(`Failed to remove Rem ${rem._id}:`, e);
        }
      }

      await plugin.app.toast(
        `✅ Deleted ${removed} / ${taggedRems.length} Rem(s).\n\n` +
        `Note: To remove the old slot columns (Word, Meaning, Picture) from the powerup itself, ` +
        `manually delete the "Cambridge Dictionary" Rem in RemNote (find it via [[Cambridge Dictionary]]).`
      );
      log(plugin, `Cleanup: deleted ${removed} tagged Rems.`);
    },
  });


  log(plugin, "Cambridge Dictionary plugin activated.");
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
