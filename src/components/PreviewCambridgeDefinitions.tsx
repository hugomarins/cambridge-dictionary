import React from "react";
import { DictionaryEntry } from "../lib/models";
import { usePlugin } from "@remnote/plugin-sdk";
import { groupBy, capitalize } from "../lib/utils";

interface DefinitionsPreviewProps {
  entries: DictionaryEntry[];
  onSaveEntry: (entry: DictionaryEntry) => void;
}

/**
 * Preview dictionary definitions in the selected-text widget.
 * Groups by part of speech, shows definition + example + save button.
 */
export const PreviewCambridgeDefinitions: React.FC<DefinitionsPreviewProps> = (props) => {
  const plugin = usePlugin();
  const { entries, onSaveEntry } = props;

  if (!entries || entries.length === 0) {
    return <p className="rn-clr-content-secondary">No definitions found.</p>;
  }

  const first = entries[0];

  // Group entries by part of speech
  const byPartOfSpeech = groupBy(entries, (e) => e.partOfSpeech || "");

  return (
    <div>
      {/* Word title + pronunciation + audio */}
      <div className="flex flex-row items-center mb-2">
        <div className="rn-clr-content-primary mr-3 text-lg font-semibold">
          {capitalize(first.word)}
        </div>

        {/* Audio playback */}
        {first.audioUrl && (
          <div
            className="flex items-center cursor-pointer mr-2"
            onClick={() => new Audio(first.audioUrl).play()}
            title="Play pronunciation"
          >
            <img
              className="w-4 h-4 rn-clr-content-tertiary"
              src={`${plugin.rootURL}audio.svg`}
            />
            <span className="text-xs ml-1 rn-clr-content-tertiary">🔊</span>
          </div>
        )}
      </div>

      {/* IPA */}
      {first.pronunciation && (
        <div className="mb-2 text-sm rn-clr-content-secondary">
          {first.pronunciation}
        </div>
      )}

      {Object.entries(byPartOfSpeech).map(([partOfSpeech, posEntries]) => (
        <div key={partOfSpeech} className="mb-4">
          {/* Part of speech */}
          {partOfSpeech && (
            <div className="rn-clr-content-primary text-base font-medium italic mb-2">
              {partOfSpeech}
            </div>
          )}

          {/* Definitions */}
          {posEntries.map((entry, idx) => (
            <div
              key={idx}
              className="mb-3 pl-3 border-l-2 border-gray-200 dark:border-gray-600"
            >
              {/* Definition + save button */}
              <div className="flex flex-row items-start">
                <div className="flex-1">
                  <span className="font-medium rn-clr-content-primary">
                    {entry.definition}
                  </span>
                </div>
                <img
                  title="Save to knowledge base"
                  className="w-4 h-4 cursor-pointer ml-2 mt-1 flex-shrink-0"
                  src={`${plugin.rootURL}save.svg`}
                  onClick={() => onSaveEntry(entry)}
                />
              </div>

              {/* Example */}
              {entry.example && (
                <div className="mt-1 ml-2 text-sm italic rn-clr-content-secondary">
                  • {entry.example}
                </div>
              )}

              {/* Synonyms */}
              {entry.synonyms && (
                <div className="mt-1 ml-2 text-xs rn-clr-content-tertiary">
                  <strong>Syn:</strong> {entry.synonyms}
                </div>
              )}

              {/* Antonyms */}
              {entry.antonyms && (
                <div className="mt-1 ml-2 text-xs rn-clr-content-tertiary">
                  <strong>Ant:</strong> {entry.antonyms}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
