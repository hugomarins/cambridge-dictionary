/**
 * Rem Creator
 *
 * Creates RemNote Rem entries from Cambridge Dictionary word data.
 * Each entry gets the "Cambridge Dictionary" powerup with property slots.
 */

import { RNPlugin } from "@remnote/plugin-sdk";
import { CambridgeWordEntry } from "./models";
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
  SETTING_ROOT_REM,
  SETTING_PRONUNCIATION_UK,
  SETTING_PRONUNCIATION_US,
} from "./constants";
import { log } from "./logging";

/**
 * Create a Rem entry from a Cambridge word entry.
 *
 * Creates the Rem, adds the Cambridge Dictionary powerup,
 * sets all property slots, and parents it under the root Rem.
 */
export async function createWordRem(
  plugin: RNPlugin,
  entry: CambridgeWordEntry
): Promise<boolean> {
  // Get root Rem name from settings
  const rootRemName = (await plugin.settings.getSetting(SETTING_ROOT_REM)) as
    | string
    | undefined;
  if (!rootRemName) {
    log(
      plugin,
      'Please set the "Cambridge Dictionary Root Rem" in plugin settings first.',
      true
    );
    return false;
  }

  const rootRem = await plugin.rem.findByName([rootRemName], null);
  if (!rootRem) {
    log(
      plugin,
      `Could not find root Rem "${rootRemName}". Please check the settings.`,
      true
    );
    return false;
  }

  // Get pronunciation preferences
  const showUK =
    ((await plugin.settings.getSetting(SETTING_PRONUNCIATION_UK)) as boolean) ?? true;
  const showUS =
    ((await plugin.settings.getSetting(SETTING_PRONUNCIATION_US)) as boolean) ?? true;

  // Build pronunciation string
  let pronunciation = "";
  if (showUK && entry.wordProUk) {
    pronunciation += entry.wordProUk;
  }
  if (showUS && entry.wordProUs) {
    if (pronunciation) pronunciation += "  ";
    pronunciation += entry.wordProUs;
  }

  // Build audio info string
  let audioInfo = "";
  if (showUK && entry.wordUkMedia) {
    audioInfo += entry.wordUkMedia;
  }
  if (showUS && entry.wordUsMedia) {
    if (audioInfo) audioInfo += " | ";
    audioInfo += entry.wordUsMedia;
  }

  // Build examples string
  const examplesStr = entry.wordExamples.join("\n");

  // Create the main Rem
  const wordRem = await plugin.rem.createRem();
  if (!wordRem) {
    log(plugin, "Failed to create Rem.", true);
    return false;
  }

  // Set the Rem text as the word title
  await wordRem.setText([entry.wordTitle]);

  // Add the Cambridge Dictionary powerup
  await wordRem.addPowerup(CAMBRIDGE_POWERUP_CODE);

  // Set powerup property slots
  await wordRem.setPowerupProperty(CAMBRIDGE_POWERUP_CODE, SLOT_WORD, [
    entry.wordTitle,
  ]);
  await wordRem.setPowerupProperty(CAMBRIDGE_POWERUP_CODE, SLOT_GRAMMAR, [
    entry.wordPartOfSpeech,
  ]);
  await wordRem.setPowerupProperty(CAMBRIDGE_POWERUP_CODE, SLOT_PRONUNCIATION, [
    pronunciation,
  ]);
  await wordRem.setPowerupProperty(CAMBRIDGE_POWERUP_CODE, SLOT_DEFINITION, [
    entry.wordSpecific,
  ]);
  await wordRem.setPowerupProperty(CAMBRIDGE_POWERUP_CODE, SLOT_MEANING, [
    entry.wordGeneral,
  ]);
  await wordRem.setPowerupProperty(CAMBRIDGE_POWERUP_CODE, SLOT_EXAMPLES, [
    examplesStr,
  ]);

  if (audioInfo) {
    await wordRem.setPowerupProperty(CAMBRIDGE_POWERUP_CODE, SLOT_AUDIO, [
      audioInfo,
    ]);
  }

  if (entry.wordImage) {
    await wordRem.setPowerupProperty(CAMBRIDGE_POWERUP_CODE, SLOT_PICTURE, [
      entry.wordImage,
    ]);
  }

  // Set parent to root Rem
  await wordRem.setParent(rootRem._id);

  // Make it a flashcard with both directions
  await wordRem.setIsCardItem(true);

  return true;
}

/**
 * Create Rem entries for multiple Cambridge word entries.
 * Returns the count of successfully created entries.
 */
export async function createMultipleWordRems(
  plugin: RNPlugin,
  entries: CambridgeWordEntry[]
): Promise<number> {
  let count = 0;
  for (const entry of entries) {
    const success = await createWordRem(plugin, entry);
    if (success) count++;
  }
  return count;
}
