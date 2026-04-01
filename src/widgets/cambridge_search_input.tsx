import { renderWidget, usePlugin } from "@remnote/plugin-sdk";
import React, { useState, useRef, useEffect } from "react";
import { fetchWordDefinitions } from "../lib/scraper";
import { createMultipleWordRems } from "../lib/rem-creator";
import { log } from "../lib/logging";

function CambridgeSearchInput() {
  const plugin = usePlugin();
  const [word, setWord] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    setIsLoading(true);
    setStatus(`Searching for "${word.trim()}"...`);

    const entries = await fetchWordDefinitions(word.trim());
    if (entries.length === 0) {
      setStatus(`No definitions found for "${word.trim()}".`);
      setIsLoading(false);
      return;
    }

    setStatus(`Found ${entries.length} definition(s). Importing...`);
    const count = await createMultipleWordRems(plugin, entries);
    log(plugin, `Imported ${count} definition(s) for "${word.trim()}".`, true);
    await plugin.widget.closePopup();
  };

  return (
    <div className="flex flex-col p-4 gap-4 rn-clr-background">
      <div className="text-2xl font-bold rn-clr-content-primary">
        Cambridge: Search Word
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="search-word-input" className="font-semibold rn-clr-content-primary">
            Enter a word:
          </label>
          <input
            ref={inputRef}
            id="search-word-input"
            type="text"
            value={word}
            onChange={(e) => {
              setWord(e.target.value);
              setStatus("");
            }}
            placeholder="e.g., cranky"
            disabled={isLoading}
            className="px-3 py-2 rounded rn-clr-content-primary rn-clr-background-main border-solid border rn-clr-border-opaque"
            style={{ outline: "none" }}
          />
          {status && (
            <div className="text-sm rn-clr-content-secondary">{status}</div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => plugin.widget.closePopup()}
            disabled={isLoading}
            className="px-4 py-2 rounded rn-clr-content-secondary border-solid border rn-clr-border-opaque"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !word.trim()}
            className="px-4 py-2 font-semibold rounded"
            style={{
              backgroundColor: isLoading || !word.trim() ? "#93C5FD" : "#3B82F6",
              color: "white",
              border: "none",
              cursor: isLoading || !word.trim() ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Searching..." : "Search & Import"}
          </button>
        </div>
      </form>
    </div>
  );
}

renderWidget(CambridgeSearchInput);
