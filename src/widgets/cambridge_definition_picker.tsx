/**
 * Cambridge Definition Picker
 *
 * Popup widget that displays all fetched definitions grouped by part of speech.
 * The user selects one and clicks "Import" to save it as a Rem.
 *
 * Data is passed via session storage key "cambridge_picker_entries".
 */
import React, { useState, useEffect } from "react";
import { renderWidget, usePlugin } from "@remnote/plugin-sdk";
import { CambridgeWordEntry } from "../lib/models";
import { createWordRem } from "../lib/rem-creator";
import { log } from "../lib/logging";
import { PICKER_KEY } from "../lib/constants";

function CambridgeDefinitionPicker() {
  const plugin = usePlugin();
  const [entries, setEntries] = useState<CambridgeWordEntry[]>([]);
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
      log(plugin, `Added "${entry.wordTitle}" to your knowledge base!`, true);
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
      className="flex flex-col p-4 gap-3 rn-clr-background"
      style={{ maxHeight: 520, overflowY: "auto" }}
    >
      {/* Header */}
      <div className="text-xl font-bold rn-clr-content-primary">
        {entries[0].wordTitle}
        {entries[0].wordProUk && (
          <span className="ml-3 text-sm font-normal rn-clr-content-secondary">
            {entries[0].wordProUk}
          </span>
        )}
      </div>

      <div className="text-xs rn-clr-content-tertiary mb-1">
        Select a definition to import:
      </div>

      {/* Definition list */}
      <div className="flex flex-col gap-2">
        {entries.map((e, idx) => (
          <label
            key={idx}
            className="flex items-start gap-2 cursor-pointer p-2 rounded"
            style={{
              background:
                selected === idx
                  ? "rgba(59,130,246,0.12)"
                  : "transparent",
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
              {/* Part of speech */}
              <span className="text-xs italic rn-clr-content-tertiary">
                {e.wordPartOfSpeech}
              </span>
              {/* Definition */}
              <span className="text-sm font-medium rn-clr-content-primary">
                {e.wordSpecific}
              </span>
              {/* First example */}
              {e.wordExamples[0] && (
                <span className="text-xs italic rn-clr-content-secondary">
                  "{e.wordExamples[0]}"
                </span>
              )}
              {/* Extra (synonyms/antonyms) */}
              {e.usage && (
                <span className="text-xs rn-clr-content-tertiary">
                  {e.usage}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>

      {status && (
        <div className="text-sm rn-clr-content-secondary">{status}</div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--rn-clr-border-opaque)" }}>
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
  );
}

renderWidget(CambridgeDefinitionPicker);
