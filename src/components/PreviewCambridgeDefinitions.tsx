import React from "react";
import { CambridgeWordEntry } from "../lib/models";
import { usePlugin } from "@remnote/plugin-sdk";
import { groupBy, capitalize } from "../lib/utils";
import ReactTooltip from "react-tooltip";

interface CambridgePreviewProps {
  entries: CambridgeWordEntry[];
  onSaveEntry: (entry: CambridgeWordEntry) => void;
  onSaveAll?: () => void;
}

/**
 * Preview Cambridge Dictionary definitions with save buttons.
 * Groups by dictionary and part of speech.
 */
export const PreviewCambridgeDefinitions: React.FC<CambridgePreviewProps> = (props) => {
  const plugin = usePlugin();
  const { entries, onSaveEntry, onSaveAll } = props;

  if (!entries || entries.length === 0) {
    return <p className="rn-clr-content-secondary">No definitions found.</p>;
  }

  // Group entries by dictionary
  const byDictionary = groupBy(entries, (e) => e.wordDictionary || "Dictionary");

  return (
    <div>
      <ReactTooltip place="right" />

      {Object.entries(byDictionary).map(([dictName, dictEntries]) => {
        // Group within dictionary by part of speech
        const byPartOfSpeech = groupBy(dictEntries, (e) => e.wordPartOfSpeech || "");

        return (
          <div key={dictName} className="mb-4">
            {/* Dictionary name header */}
            <div className="text-xs rn-clr-content-tertiary uppercase tracking-wider mb-2">
              {dictName}
            </div>

            {Object.entries(byPartOfSpeech).map(([partOfSpeech, posEntries]) => {
              // All entries in this group share the same word title and pronunciation
              const first = posEntries[0];

              return (
                <div key={`${dictName}-${partOfSpeech}`} className="mb-4">
                  {/* Word title + pronunciation */}
                  <div className="flex flex-row items-center mb-2">
                    <div className="rn-clr-content-primary mr-3 text-lg font-semibold">
                      {capitalize(first.wordTitle)}
                    </div>

                    {/* UK Audio */}
                    {first.wordUkMedia && (
                      <div
                        className="flex items-center cursor-pointer mr-2"
                        onClick={() => new Audio(first.wordUkMedia).play()}
                        data-tip="Play UK pronunciation"
                      >
                        <img
                          className="w-4 h-4 rn-clr-content-tertiary"
                          src={`${plugin.rootURL}audio.svg`}
                        />
                        <span className="text-xs ml-1 rn-clr-content-tertiary">UK</span>
                      </div>
                    )}

                    {/* US Audio */}
                    {first.wordUsMedia && (
                      <div
                        className="flex items-center cursor-pointer mr-2"
                        onClick={() => new Audio(first.wordUsMedia).play()}
                        data-tip="Play US pronunciation"
                      >
                        <img
                          className="w-4 h-4 rn-clr-content-tertiary"
                          src={`${plugin.rootURL}audio.svg`}
                        />
                        <span className="text-xs ml-1 rn-clr-content-tertiary">US</span>
                      </div>
                    )}
                  </div>

                  {/* IPA */}
                  <div className="mb-2 text-sm rn-clr-content-secondary">
                    {first.wordProUk && <span className="mr-3">{first.wordProUk}</span>}
                    {first.wordProUs && <span>{first.wordProUs}</span>}
                  </div>

                  {/* Part of speech */}
                  {partOfSpeech && (
                    <div className="flex flex-row items-center mb-2">
                      <div className="rn-clr-content-primary text-base font-medium italic mr-3">
                        {partOfSpeech}
                      </div>
                    </div>
                  )}

                  {/* Definitions */}
                  {posEntries.map((entry, idx) => (
                    <div
                      key={`${entry.senseId || idx}`}
                      className="mb-3 pl-3 border-l-2 border-gray-200 dark:border-gray-600"
                    >
                      {/* General meaning heading */}
                      {entry.wordGeneral && (
                        <div className="text-xs font-semibold uppercase tracking-wider rn-clr-content-tertiary mb-1">
                          {entry.wordGeneral}
                        </div>
                      )}

                      {/* Definition + save button */}
                      <div className="flex flex-row items-start">
                        <div className="flex-1">
                          {/* Usage label */}
                          {entry.usage && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1 rounded mr-1">
                              {entry.usage}
                            </span>
                          )}
                          {/* Specific grammar */}
                          {entry.wordSpecificGram && (
                            <span className="text-xs rn-clr-content-tertiary mr-1">
                              [{entry.wordSpecificGram}]
                            </span>
                          )}
                          {/* Definition text */}
                          <span className="font-medium rn-clr-content-primary">
                            {entry.wordSpecific}
                          </span>
                        </div>
                        {/* Save button */}
                        <img
                          data-tip="Save to knowledge base"
                          className="w-4 h-4 cursor-pointer ml-2 mt-1 flex-shrink-0"
                          src={`${plugin.rootURL}save.svg`}
                          onClick={() => onSaveEntry(entry)}
                        />
                      </div>

                      {/* Examples */}
                      {entry.wordExamples.length > 0 && (
                        <div className="mt-1 ml-2">
                          {entry.wordExamples.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="text-sm italic rn-clr-content-secondary"
                            >
                              • {ex}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Image */}
                      {entry.wordImage && (
                        <div className="mt-2">
                          <img
                            src={entry.wordImage}
                            className="max-w-[150px] rounded"
                            alt={entry.wordTitle}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Save All button */}
      {onSaveAll && entries.length > 1 && (
        <div className="mt-2 mb-2">
          <button
            onClick={onSaveAll}
            className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Save All ({entries.length} definitions)
          </button>
        </div>
      )}
    </div>
  );
};
