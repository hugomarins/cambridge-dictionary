/**
 * Definition Picker Widget
 *
 * Popup that displays all fetched definitions.
 * The user selects one and clicks "Import" to create a Rem.
 *
 * Data is passed via session storage key PICKER_KEY.
 */
import React, { useState, useEffect } from "react";
import { renderWidget, usePlugin } from "@remnote/plugin-sdk";
import { DictionaryEntry } from "../lib/models";
import { createWordRem } from "../lib/rem-creator";
import { log } from "../lib/logging";
import { PICKER_KEY } from "../lib/constants";

function CambridgeDefinitionPicker() {
  const plugin = usePlugin();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [selected, setSelected] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    plugin.storage.getSession<string>(PICKER_KEY).then((raw) => {
      if (!raw) return;
      try {
        setEntries(JSON.parse(raw));
      } catch {
        /* ignore parse errors */
      }
    });
  }, []);

  const entry = entries[selected];

  const handleImport = async () => {
    if (!entry) return;
    setIsSaving(true);
    setStatus("Importing...");
    const success = await createWordRem(plugin, entry);
    if (success) {
      log(plugin, `Added "${entry.word}" to your knowledge base!`, true);
      await plugin.widget.closePopup();
    } else {
      setStatus("Import failed — check your Root Rem setting.");
      setIsSaving(false);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="p-4 rn-clr-content-secondary">
        Loading definitions…
      </div>
    );
  }

  return (
    <div
      className="flex flex-col rn-clr-background"
      style={{ height: 620 }}
    >
      {/* Fixed header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="text-xl font-bold rn-clr-content-primary">
          {entries[0].word}
          {entries[0].pronunciation && (
            <span className="ml-3 text-sm font-normal rn-clr-content-secondary">
              {entries[0].pronunciation}
            </span>
          )}
        </div>
        <div className="text-xs rn-clr-content-tertiary mt-1">
          Select a definition to import ({entries.length} found):
        </div>
      </div>

      {/* Scrollable definition list */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-2">
        {entries.map((e, idx) => (
          <label
            key={idx}
            className="flex items-start gap-2 cursor-pointer p-2 rounded"
            style={{
              background:
                selected === idx ? "rgba(59,130,246,0.12)" : "transparent",
              border:
                selected === idx
                  ? "1px solid rgba(59,130,246,0.5)"
                  : "1px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <input
              type="radio"
              name="definition"
              checked={selected === idx}
              onChange={() => setSelected(idx)}
              className="mt-1 flex-shrink-0"
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs italic rn-clr-content-tertiary">
                {e.partOfSpeech}
              </span>
              <span className="text-sm font-medium rn-clr-content-primary">
                {e.definition}
              </span>
              {e.example && (
                <span className="text-xs italic rn-clr-content-secondary">
                  "{e.example}"
                </span>
              )}
              {e.synonyms && (
                <span className="text-xs rn-clr-content-tertiary">
                  <strong>Syn:</strong> {e.synonyms}
                </span>
              )}
              {e.antonyms && (
                <span className="text-xs rn-clr-content-tertiary">
                  <strong>Ant:</strong> {e.antonyms}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Fixed footer */}
      <div
        className="px-4 py-3 flex-shrink-0 border-t"
        style={{ borderColor: "var(--rn-clr-border-opaque)" }}
      >
        {status && (
          <div className="text-sm rn-clr-content-secondary mb-2">{status}</div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => plugin.widget.closePopup()}
            disabled={isSaving}
            className="px-4 py-2 rounded text-sm rn-clr-content-secondary"
            style={{ border: "1px solid var(--rn-clr-border-opaque)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isSaving || !entry}
            className="px-4 py-2 rounded text-sm font-semibold"
            style={{
              background: isSaving ? "#93C5FD" : "#3B82F6",
              color: "white",
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

renderWidget(CambridgeDefinitionPicker);
