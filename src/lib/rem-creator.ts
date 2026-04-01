/**
 * Rem Creator
 *
 * Creates RemNote Rem entries from dictionary word data.
 * Each entry gets the "Cambridge Dictionary" powerup with property slots.
 */

import { RNPlugin } from "@remnote/plugin-sdk";
import { CambridgeWordEntry } from "./models";
import {
  powerupCode,
  SLOT_GRAMMAR,
  SLOT_PRONUNCIATION,
  SLOT_DEFINITION,
  SLOT_EXAMPLES,
  SLOT_AUDIO,
  SLOT_EXTRA,
  SETTING_ROOT_REM,
} from "./constants";
import { log } from "./logging";

/**
 * Create a Rem entry from a word entry.
 * The Rem's name (text) is the word itself.
 * Properties: Grammar, Pronunciation, Definition, Examples, Audio.
 */
export async function createWordRem(
  plugin: RNPlugin,
  entry: CambridgeWordEntry
): Promise<boolean> {
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
      `Could not find root Rem "${rootRemName}". Please create it first.`,
      true
    );
    return false;
  }

  const wordRem = await plugin.rem.createRem();
  if (!wordRem) {
    log(plugin, "Failed to create Rem.", true);
    return false;
  }

  // The Rem name is the word (omit SLOT_WORD — it's redundant)
  await wordRem.setText([entry.wordTitle]);

  // Add the Cambridge Dictionary powerup
  await wordRem.addPowerup(powerupCode);

  // Grammar (part of speech)
  if (entry.wordPartOfSpeech) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_GRAMMAR, [
      entry.wordPartOfSpeech,
    ]);
  }

  // Pronunciation (IPA)
  if (entry.wordProUk) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_PRONUNCIATION, [
      entry.wordProUk,
    ]);
  }

  // Definition
  if (entry.wordSpecific) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_DEFINITION, [
      entry.wordSpecific,
    ]);
  }

  // Examples
  const examplesStr = entry.wordExamples.join("\n");
  if (examplesStr) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_EXAMPLES, [
      examplesStr,
    ]);
  }

  // Audio — use RichTextAudioInterface so RemNote renders a native audio player
  if (entry.wordUkMedia) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_AUDIO, [
      { i: "a", url: entry.wordUkMedia, onlyAudio: true } as any,
    ]);
  }

  // Extra (synonyms, antonyms, general meaning context)
  if (entry.usage) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_EXTRA, [
      entry.usage,
    ]);
  }

  // Parent under root Rem
  await wordRem.setParent(rootRem._id);

  // Enable flashcard
  await wordRem.setIsCardItem(true);

  return true;
}

/**
 * Create Rem entries for multiple word entries.
 * Returns count of successes.
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
