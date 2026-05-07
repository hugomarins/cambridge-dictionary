/**
 * Rem Creator
 *
 * Creates RemNote Rem entries from DictionaryEntry data.
 * Each entry gets the powerup with 8 property slots.
 */

import { RNPlugin, SetRemType } from "@remnote/plugin-sdk";
import { DictionaryEntry } from "./models";
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
} from "./constants";
import { log } from "./logging";

/**
 * Create a single Rem entry from a DictionaryEntry.
 * The Rem's name (text) is the word itself.
 */
export async function createWordRem(
  plugin: RNPlugin,
  entry: DictionaryEntry
): Promise<string | null> {
  const rootRemName = (await plugin.settings.getSetting(SETTING_ROOT_REM)) as
    | string
    | undefined;
  if (!rootRemName) {
    log(
      plugin,
      'Please set the "Root Rem" in plugin settings first.',
      true
    );
    return null;
  }

  let rootRem = await plugin.rem.findByName([rootRemName], null);
  if (!rootRem) {
    rootRem = await plugin.rem.createRem();
    if (!rootRem) {
      log(plugin, `Failed to create root Rem "${rootRemName}".`, true);
      return null;
    }
    await rootRem.setText([rootRemName]);
    log(plugin, `Created root Rem "${rootRemName}".`);
  }

  const wordRem = await plugin.rem.createRem();
  if (!wordRem) {
    log(plugin, "Failed to create Rem.", true);
    return null;
  }

  // The Rem name is the word
  await wordRem.setText([entry.word]);
  await wordRem.setType(SetRemType.CONCEPT);

  // Add the powerup
  await wordRem.addPowerup(powerupCode);

  // Grammar (part of speech)
  if (entry.partOfSpeech) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_GRAMMAR, [
      entry.partOfSpeech,
    ]);
  }

  // Pronunciation (IPA)
  if (entry.pronunciation) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_PRONUNCIATION, [
      entry.pronunciation,
    ]);
  }

  // Audio — RichTextAudioInterface for native playback
  if (entry.audioUrl) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_AUDIO, [
      { i: "a", url: entry.audioUrl, onlyAudio: true } as any,
    ]);
  }

  // Definition
  if (entry.definition) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_DEFINITION, [
      entry.definition,
    ]);
  }

  // Example
  if (entry.example) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_EXAMPLE, [
      entry.example,
    ]);
  }

  // Synonyms
  if (entry.synonyms) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_SYNONYMS, [
      entry.synonyms,
    ]);
  }

  // Antonyms
  if (entry.antonyms) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_ANTONYMS, [
      entry.antonyms,
    ]);
  }

  // Source URL
  if (entry.sourceUrl) {
    await wordRem.setPowerupProperty(powerupCode, SLOT_SOURCE, [
      entry.sourceUrl,
    ]);
  }

  // Parent under root Rem
  await wordRem.setParent(rootRem._id);

  // Make the definition slot a backward card (see definition → recall word)
  const definitionSlotRem = await wordRem.getPowerupPropertyAsRem(powerupCode, SLOT_DEFINITION);
  if (definitionSlotRem) {
    await definitionSlotRem.setEnablePractice(true);
    await definitionSlotRem.setPracticeDirection("backward");
  }

  return wordRem._id;
}
